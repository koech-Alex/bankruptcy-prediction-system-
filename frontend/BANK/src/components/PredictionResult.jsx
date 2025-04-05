import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "../styles/PredictionResult.css";

ChartJS.register(ArcElement, Tooltip, Legend);

function PredictionResult({ prediction }) {
  const chartData = prediction
    ? {
        labels: Object.keys(prediction.risk_factors),
        datasets: [
          {
            data: Object.values(prediction.risk_factors),
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
          },
        ],
      }
    : null;

  return (
    <div>
      <h2>Prediction Results</h2>
      {prediction ? (
        <div className="results">
          <h3>Risk Score: {prediction.risk_score}%</h3>
          <p>{prediction.summary}</p>
          <p>Confidence: {prediction.Confidence}%</p>
          {chartData && (
            <Pie
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: "Risk Contributors" },
                },
              }}
            />
          )}
        </div>
      ) : (
        <p>Enter data to see results.</p>
      )}
    </div>
  );
}

export default PredictionResult;
