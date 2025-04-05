import { useState, useEffect } from "react";
import "../styles/InputForm.css";
import { validateInput } from "../utils/validateInput";

function InputForm({ onAnalyze, isLoading }) {
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    assets: "",
    liabilities: "",
    net_income: "",
    cash_flow: "",
    debt_equity: "",
    current_ratio: "",
    revenue: "",
  });
  const [errors, setErrors] = useState({});
  const [insights, setInsights] = useState({}); // Added for AI insights
  const [animate, setAnimate] = useState(false);

  const suggestInsights = (data) => {
    const insights = {};
    if (data.debt_equity && parseFloat(data.debt_equity) > 2) insights.debt_equity = "High debt-to-equity may indicate risk.";
    if (data.current_ratio && parseFloat(data.current_ratio) < 1) insights.current_ratio = "Low liquidity could be a concern.";
    if (data.net_income && parseFloat(data.net_income) < 0) insights.net_income = "Negative profitability detected.";
    return insights;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    let error = '';
    if (value === '') error = 'This field is required';
    else if (name !== 'company_name' && name !== 'email' && isNaN(value)) error = 'Must be a number';
    setErrors({ ...errors, [name]: error });
    setInsights(suggestInsights({ ...formData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateInput(formData)) {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      onAnalyze(data);
    } else {
      alert("Please fill all fields with valid numbers (except company name and email).");
    }
  };

  const handleReset = () => {
    setFormData({
      company_name: "",
      email: "",
      assets: "",
      liabilities: "",
      net_income: "",
      cash_flow: "",
      debt_equity: "",
      current_ratio: "",
      revenue: "",
    });
    setErrors({});
    setInsights({});
  };

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className={`input-form-container ${animate ? 'fade-in' : ''}`}>
      <div className="input-form-card">
        <h2>Analyze Bankruptcy Risk</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="company_name">Company Name:</label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={errors.company_name ? 'input-error' : ''}
              title="Enter the name of the company"
            />
            {errors.company_name && <span className="error-text">{errors.company_name}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="email">Email for Alerts:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@domain.com"
              disabled={isLoading}
              className={errors.email ? 'input-error' : ''}
              title="Email to receive prediction alerts"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="assets">Total Assets:</label>
            <input
              type="number"
              id="assets"
              name="assets"
              value={formData.assets}
              onChange={handleChange}
              step="any"
              required
              disabled={isLoading}
              className={errors.assets ? 'input-error' : ''}
              title="Company's total asset value"
            />
            {errors.assets && <span className="error-text">{errors.assets}</span>}
            {insights.assets && <span className="insight-text">{insights.assets}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="liabilities">Total Liabilities:</label>
            <input
              type="number"
              id="liabilities"
              name="liabilities"
              value={formData.liabilities}
              onChange={handleChange}
              step="any"
              required
              disabled={isLoading}
              className={errors.liabilities ? 'input-error' : ''}
              title="Company's total liabilities"
            />
            {errors.liabilities && <span className="error-text">{errors.liabilities}</span>}
            {insights.liabilities && <span className="insight-text">{insights.liabilities}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="net_income">Net Income:</label>
            <input
              type="number"
              id="net_income"
              name="net_income"
              value={formData.net_income}
              onChange={handleChange}
              step="any"
              required
              disabled={isLoading}
              className={errors.net_income ? 'input-error' : ''}
              title="Company's net income"
            />
            {errors.net_income && <span className="error-text">{errors.net_income}</span>}
            {insights.net_income && <span className="insight-text">{insights.net_income}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="cash_flow">Cash Flow:</label>
            <input
              type="number"
              id="cash_flow"
              name="cash_flow"
              value={formData.cash_flow}
              onChange={handleChange}
              step="any"
              required
              disabled={isLoading}
              className={errors.cash_flow ? 'input-error' : ''}
              title="Company's cash flow"
            />
            {errors.cash_flow && <span className="error-text">{errors.cash_flow}</span>}
            {insights.cash_flow && <span className="insight-text">{insights.cash_flow}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="debt_equity">Debt-to-Equity Ratio:</label>
            <input
              type="number"
              id="debt_equity"
              name="debt_equity"
              value={formData.debt_equity}
              onChange={handleChange}
              step="any"
              required
              disabled={isLoading}
              className={errors.debt_equity ? 'input-error' : ''}
              title="Debt-to-equity ratio"
            />
            {errors.debt_equity && <span className="error-text">{errors.debt_equity}</span>}
            {insights.debt_equity && <span className="insight-text">{insights.debt_equity}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="current_ratio">Current Ratio:</label>
            <input
              type="number"
              id="current_ratio"
              name="current_ratio"
              value={formData.current_ratio}
              onChange={handleChange}
              step="any"
              required
              disabled={isLoading}
              className={errors.current_ratio ? 'input-error' : ''}
              title="Current assets to current liabilities ratio"
            />
            {errors.current_ratio && <span className="error-text">{errors.current_ratio}</span>}
            {insights.current_ratio && <span className="insight-text">{insights.current_ratio}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="revenue">Revenue:</label>
            <input
              type="number"
              id="revenue"
              name="revenue"
              value={formData.revenue}
              onChange={handleChange}
              step="any"
              required
              disabled={isLoading}
              className={errors.revenue ? 'input-error' : ''}
              title="Company's total revenue"
            />
            {errors.revenue && <span className="error-text">{errors.revenue}</span>}
            {insights.revenue && <span className="insight-text">{insights.revenue}</span>}
          </div>
          <div className="button-group">
            <button type="submit" disabled={isLoading} className={isLoading ? 'analyzing' : ''}>
              {isLoading ? (
                <span className="loader">Analyzing...</span>
              ) : (
                "Analyze Now"
              )}
            </button>
            <button type="button" onClick={handleReset} disabled={isLoading}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputForm;