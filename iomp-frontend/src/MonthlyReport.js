import React, { useEffect, useState } from 'react';

const MonthlyReport = () => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/monthly-summary')
      .then(res => res.json())
      .then(data => setReport(data));
  }, []);

  if (!report) return <p>Loading report...</p>;

  return (
    <div>
      <h3>📅 Monthly Report</h3>
      <p>Income: ₹{report.income}</p>
      <p>Expenses: ₹{report.expenses}</p>
      <p>Savings: ₹{report.remaining}</p>
      <p style={{ color: report.goalReached ? 'green' : 'red' }}>
        {report.goalReached ? '🎯 Goal Achieved!' : '⏳ Keep Going!'}
      </p>
    </div>
  );
};

export default MonthlyReport;
