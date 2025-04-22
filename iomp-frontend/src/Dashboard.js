import React, { useState, useEffect } from 'react';
import CategoryChart from './CategoryChart';
import './Dashboard.css';

const Dashboard = () => {
  const [categoryData, setCategoryData] = useState({
    Essentials: 0,
    NonEssentials: 0,
    Investments: 0,
    Miscellaneous: 0
  });

  const [budgetLimits, setBudgetLimits] = useState({
    Essentials: 0,
    NonEssentials: 0,
    Investments: 0
  });

  const [balance, setBalance] = useState(0);
  const [newInvestmentLimit, setNewInvestmentLimit] = useState('');
  const [message, setMessage] = useState('');
  const [updatedGoal, setUpdatedGoal] = useState(null); // State to store updated goal

  useEffect(() => {
    fetch('http://localhost:5000/api/get-category-summary')
      .then(res => res.json())
      .then(data => {
        setCategoryData(data.summary || {});
      });

    fetch('http://localhost:5000/api/get-balance')
      .then(res => res.json())
      .then(data => {
        setBalance(data.balance || 0);
      });

    fetch('http://localhost:5000/api/budget-breakdown')
      .then(res => res.json())
      .then(data => {
        setBudgetLimits({
          Essentials: data.essentialsLimit || 0,
          NonEssentials: data.nonEssentialsLimit || 0,
          Investments: data.investmentsLimit || 0
        });
      });
  }, []);

  const formatMoney = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString('en-IN');
  };

  const getStatus = (category, value, limit) => {
    if (category === 'Investments') {
      return value >= limit
        ? <span style={{ color: 'green', fontWeight: 'bold' }}> — On Track</span>
        : <span style={{ color: 'red', fontWeight: 'bold' }}> — Save More</span>;
    }
    return value > limit
      ? <span style={{ color: 'red', fontWeight: 'bold' }}> — Overspending!</span>
      : <span style={{ color: 'green', fontWeight: 'bold' }}> — On Track</span>;
  };

  const updateInvestmentGoal = async () => {
    const newGoal = Number(newInvestmentLimit);
  
    if (isNaN(newGoal) || newGoal <= 0) {
      setMessage('❌ Enter a valid positive number.');
      return;
    }
  
    try {
      // Send the request to update the goal
      const updateRes = await fetch('http://localhost:5000/api/update-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newGoal })
      });
  
      if (!updateRes.ok) {
        throw new Error('Failed to update goal');
      }
  
      // Get the updated budget breakdown
      const breakdownRes = await fetch('http://localhost:5000/api/budget-breakdown');
      const data = await breakdownRes.json();
  
      // Update state with the new goal and breakdown
      setBudgetLimits({
        Essentials: data.essentialsLimit,
        NonEssentials: data.nonEssentialsLimit,
        Investments: data.investmentsLimit
      });
  
      setUpdatedGoal(newGoal); // Store the new goal value
      setMessage('✅ Investment goal updated!');
      setNewInvestmentLimit('');
    } catch (err) {
      console.error('Error:', err);
      setMessage(`❌ ${err.message}`);
    }
  
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="dashboard-container">
      <h2>Financial Dashboard</h2>

      <div className="balance-container">
        <h3>Current Balance: ₹{formatMoney(balance)}</h3>
      </div>

      <div className="chart-container">
        <CategoryChart expenses={categoryData} />
      </div>

      <div className="budget-status-container">
        <h3>Category Summary:</h3>
        {Object.keys(budgetLimits).map(cat => (
          <div key={cat} style={{ marginBottom: '16px' }}>
            <strong>{cat}:</strong> ₹{formatMoney(categoryData[cat] || 0)} / ₹{formatMoney(budgetLimits[cat])}
            {getStatus(cat, categoryData[cat] || 0, budgetLimits[cat])}

            {cat === 'Investments' && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="number"
                  placeholder="Edit Savings Goal"
                  value={newInvestmentLimit}
                  onChange={e => setNewInvestmentLimit(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    marginRight: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
                <button
                  onClick={updateInvestmentGoal}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                {message && (
                  <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>{message}</span>
                )}

                {updatedGoal !== null && (
                  <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
                    Updated Investment Goal: ₹{formatMoney(updatedGoal)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
