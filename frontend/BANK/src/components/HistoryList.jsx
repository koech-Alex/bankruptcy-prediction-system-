import "../styles/HistoryList.css";

function HistoryList({ history }) {
  return (
    <div>
      <h2>Prediction History</h2>
      <ul className="history-list">
        {history.map((record, index) => (
          <li key={index}>
            {record.company_name} - Risk: {record.risk_score}% -{" "}
            {new Date(record.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HistoryList;
