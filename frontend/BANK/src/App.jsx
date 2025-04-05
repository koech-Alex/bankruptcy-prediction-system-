import { useState, useEffect, useCallback } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import InputForm from './components/InputForm.jsx';
import PredictionResult from './components/PredictionResult.jsx';
import HistoryList from './components/HistoryList.jsx';
import { analyzeCompany, getHistory } from './services/api';
import jsPDF from 'jspdf'; // For PDF export
import './styles/App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function App() {
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [analytics, setAnalytics] = useState({ total_predictions: 0, avg_risk: 0, high_risk_count: 0, monthly_trends: [] });
  const [showPrediction, setShowPrediction] = useState(false);
  const [showProfile, setShowProfile] = useState(false); // For profile view
  const [profileData, setProfileData] = useState(null); // User profile data
  const [themePreference, setThemePreference] = useState('light'); // User theme preference

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getHistory({ user_email: user.email });
      setHistory(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching history:', error);
      setError({ message: 'Failed to fetch history', details: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/analytics?user_email=${user.email}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, [user]);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/profile?email=${user.email}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfileData(data);
      setThemePreference(data.theme || 'light'); // Default to light if no theme set
      setIsDarkMode(data.theme === 'dark');
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [user]);

  const handleAnalyze = async (formData) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const response = await analyzeCompany(formData);
      setPrediction(response.data);
      await fetchHistory();
      await fetchAnalytics();
    } catch (error) {
      console.error('Error:', error);
      setError({
        message: 'Prediction failed',
        details: error.response?.data?.error || error.message,
        status: error.response?.status,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPrediction(null);
    setError(null);
    setLastUpdated(new Date());
  };

  const handleLogin = async (email, password, first_name) => {
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, first_name }),
      });
      if (!response.ok) throw new Error('Login failed');
      const data = await response.json();
      setUser({ email: data.email, first_name: data.first_name });
      await fetchHistory();
      await fetchAnalytics();
      await fetchProfile();
    } catch (error) {
      setError({ message: 'Login Failed', details: error.message });
    }
  };

  const handleSignup = async (email, password, first_name) => {
    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, first_name }),
      });
      if (!response.ok) throw new Error('Signup failed');
      const data = await response.json();
      setUser({ email: data.email, first_name: data.first_name });
      await fetchHistory();
      await fetchAnalytics();
      await fetchProfile();
    } catch (error) {
      setError({ message: 'Signup Failed', details: error.message });
    }
  };

  const handlePrintReport = () => {
    if (!prediction) return;
    const riskColor = prediction.risk_score > 60 ? '#d32f2f' : 
                     prediction.risk_score < 20 ? '#2e7d32' : '#f9a825';
    const printWindow = window.open('', '_blank');
    const reportHtml = `
      <html>
        <head>
          <title>Bankruptcy Prediction Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1a3c34; }
            .report-container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
            h1 { color: #2e7d32; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background: #e8f5e9; color: #2e7d32; }
            .risk-score { font-size: 1.5em; font-weight: bold; color: ${riskColor}; }
            .footer { text-align: center; font-size: 0.9em; margin-top: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <h1>Bankruptcy Prediction Report</h1>
            <table>
              <tr><th>Field</th><th>Value</th></tr>
              <tr><td>Company Name</td><td>${prediction.company_name}</td></tr>
              <tr><td>Risk Score</td><td class="risk-score">${prediction.risk_score}%</td></tr>
              <tr><td>Confidence</td><td>${prediction.confidence}%</td></tr>
              <tr><td>Summary</td><td>${prediction.summary}</td></tr>
              <tr><td>Risk Factors</td><td>${Object.entries(prediction.risk_factors).map(([k, v]) => `${k}: ${v}`).join(', ')}</td></tr>
              <tr><td>Input Data</td><td>${Object.entries(prediction.input_data || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}</td></tr>
            </table>
            <div class="footer">Generated on: ${formatDate(lastUpdated)}</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = () => {
    if (!prediction) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Bankruptcy Prediction Report', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Company: ${prediction.company_name}`, 20, 40);
    doc.text(`Risk Score: ${prediction.risk_score}%`, 20, 50);
    doc.text(`Confidence: ${prediction.confidence}%`, 20, 60);
    doc.text(`Summary: ${prediction.summary}`, 20, 70);
    doc.text(`Risk Factors: ${Object.entries(prediction.risk_factors).map(([k, v]) => `${k}: ${v}`).join(', ')}`, 20, 80, { maxWidth: 160 });
    doc.text(`Input Data: ${Object.entries(prediction.input_data || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}`, 20, 100, { maxWidth: 160 });
    doc.text(`Generated on: ${formatDate(lastUpdated)}`, 20, 120);
    doc.save('prediction_report.pdf');
  };

  const handleExportCSV = () => {
    fetch(`http://localhost:5000/export?user_email=${user.email}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to export CSV');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prediction_history.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error exporting CSV:', error);
        setError({ message: 'CSV Export Failed', details: error.message });
      });
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchAnalytics();
      fetchProfile();
    }
  }, [user, fetchHistory, fetchAnalytics, fetchProfile]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const chartData = {
    labels: history.map(h => h.company_name),
    datasets: [{
      label: 'Risk Score Trend',
      data: history.map(h => h.risk_score),
      borderColor: '#2e7d32',
      backgroundColor: 'rgba(46, 125, 50, 0.2)',
      fill: true,
    }]
  };

  // Risk Factors Bar Chart Data
  const riskFactorsData = {
    labels: Object.keys(prediction?.risk_factors || {}),
    datasets: [{
      label: 'Risk Factor Impact',
      data: Object.values(prediction?.risk_factors || {}),
      backgroundColor: 'rgba(46, 125, 50, 0.5)',
    }]
  };

  // Monthly Trends Line Chart Data
  const trendsData = {
    labels: analytics.monthly_trends?.map(t => t._id) || [],
    datasets: [{
      label: 'Average Risk Trend',
      data: analytics.monthly_trends?.map(t => t.avg_risk) || [],
      borderColor: '#0288d1',
      fill: false,
    }]
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <h1>Bankruptcy Prediction Dashboard</h1>
        <div className="header-actions">
          {user && (
            <span>
              Welcome, {user.first_name} | 
              <button onClick={() => setShowProfile(true)}>Profile</button> | 
              <button onClick={() => setUser(null)}>Logout</button>
            </span>
          )}
          <button className="theme-toggle" onClick={() => {
            setIsDarkMode(!isDarkMode);
            setThemePreference(isDarkMode ? 'light' : 'dark');
          }}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>
      <div className="dashboard">
        {!user ? (
          <div className="welcome-container">
            <h2>Welcome to Your Financial Dashboard</h2>
            <div className="auth-form">
              <input type="email" placeholder="Email" id="auth-email" />
              <input type="text" placeholder="First Name" id="auth-first-name" />
              <input type="password" placeholder="Password" id="auth-password" />
              <div className="auth-buttons">
                <button onClick={() => handleLogin(
                  document.getElementById('auth-email').value,
                  document.getElementById('auth-password').value,
                  document.getElementById('auth-first-name').value
                )}>Login</button>
                <button onClick={() => handleSignup(
                  document.getElementById('auth-email').value,
                  document.getElementById('auth-password').value,
                  document.getElementById('auth-first-name').value
                )}>Signup</button>
              </div>
            </div>
          </div>
        ) : showProfile ? (
          <div className="profile-container">
            <h2>User Profile</h2>
            {profileData && (
              <>
                <p>Email: {profileData.email}</p>
                <p>First Name: {profileData.first_name}</p>
                <p>Theme Preference: {themePreference}</p>
                <button onClick={() => setShowProfile(false)}>Back to Dashboard</button>
              </>
            )}
          </div>
        ) : !showPrediction ? (
          <div className="welcome-container">
            <h2>Hello, {user.first_name}!</h2>
            <p>Welcome back to your Bankruptcy Prediction Dashboard. Ready to analyze financial risks?</p>
            <button className="start-btn" onClick={() => setShowPrediction(true)}>Start Predicting</button>
          </div>
        ) : (
          <>
            <div className="dashboard-widgets">
              <div className="widget">
                <h3>Total Predictions</h3>
                <p>{analytics.total_predictions}</p>
              </div>
              <div className="widget">
                <h3>Average Risk</h3>
                <p>{analytics.avg_risk.toFixed(2)}%</p>
              </div>
              <div className="widget">
                <h3>High Risk ({'>'}60%)</h3>
                <p>{analytics.high_risk_count}</p>
              </div>
            </div>
            <div className="chart-container">
              <Line data={chartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Risk Score Trend' } } }} />
            </div>
            <div className="chart-container">
              {prediction && (
                <Bar data={riskFactorsData} options={{ responsive: true, plugins: { title: { display: true, text: 'Risk Factors Impact' } } }} />
              )}
            </div>
            <div className="chart-container">
              <Line data={trendsData} options={{ responsive: true, plugins: { title: { display: true, text: 'Monthly Risk Trends' } } }} />
            </div>
            <div className="form-wrapper">
              <InputForm onAnalyze={handleAnalyze} isLoading={isLoading} />
            </div>
            <div className="main">
              {isLoading && <div className="loading">Processing...</div>}
              {error && (
                <div className="error-box">
                  <h3>Error: {error.message}</h3>
                  <p>Details: {error.details}</p>
                  {error.status && <p>Status Code: {error.status}</p>}
                  <button className="error-clear-btn" onClick={handleReset}>Clear Error</button>
                </div>
              )}
              <PredictionResult prediction={prediction} />
              <HistoryList history={history} />
              <div className="action-buttons">
                {prediction && (
                  <button className="reset-btn" onClick={handleReset}>Reset Prediction</button>
                )}
                {prediction && (
                  <button className="print-btn" onClick={handlePrintReport}>Print Report</button>
                )}
                {prediction && (
                  <button className="export-pdf-btn" onClick={handleExportPDF}>Export PDF</button>
                )}
                <button className="export-btn" onClick={handleExportCSV}>Export to CSV</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;