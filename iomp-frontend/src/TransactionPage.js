import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TransactionPage.css';
import { CATEGORY_MAP, SUBCATEGORIES } from './categories';

const TransactionPage = () => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch monthly summary and balance on mount
    fetch('http://localhost:5000/api/monthly-summary')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.remaining === 'number') {
          setRemainingBalance(data.remaining);
        }
      })
      .catch(err => console.error('Error fetching monthly summary:', err));

    fetch('http://localhost:5000/api/get-balance')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.balance === 'number') {
          setCurrentBalance(data.balance);
        }
      })
      .catch(err => console.error('Error fetching balance:', err));
  }, []);

  const handleSave = () => {
    if (!amount || !category) {
      setMessage('Please fill in all fields.');
      return;
    }

    const parentCategory = CATEGORY_MAP[category] || 'Miscellaneous';
    const isIncome = parentCategory === 'Income';

    const transaction = {
      amount: Number(amount),
      subcategory: category,
      category: parentCategory,
      type: isIncome ? 'income' : 'expense',
    };

    // 1. Save to Node.js backend
    fetch('http://localhost:5000/api/add-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success || data.message) {
          setMessage('Transaction saved successfully.');

          // 2. Check K-Means alert from Python backend
          fetch('http://localhost:5001/check-budget-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
          })
            .then(res => res.json())
            .then(alertData => {
              if (alertData.notify) {
                alert(alertData.message || "You're close to your budget limit!");
              }
            })
            .catch(err => console.error("KMeans alert check failed", err));

          // 3. Refresh data
          return Promise.all([
            fetch('http://localhost:5000/api/monthly-summary'),
            fetch('http://localhost:5000/api/get-balance')
          ]);
        } else {
          throw new Error('Save failed');
        }
      })
      .then(async ([summaryRes, balanceRes]) => {
        const summaryData = await summaryRes.json();
        const balanceData = await balanceRes.json();

        if (summaryData && typeof summaryData.remaining === 'number') {
          setRemainingBalance(summaryData.remaining);
        }

        if (balanceData && typeof balanceData.balance === 'number') {
          setCurrentBalance(balanceData.balance);
        }

        setAmount('');
        setCategory('');
      })
      .catch(err => {
        console.error('Error:', err);
        setMessage('Something went wrong');
      });
  };

  return (
    <div className="transaction-container">
      <div className="top-bar">
        <div className="remaining-balance">Remaining: ₹{currentBalance.toLocaleString('en-IN')}</div>
      </div>

      <div className="amount-display">
        <div>₹{amount || '0'}</div>
        <small className="balance-info">Balance: ₹{currentBalance.toLocaleString('en-IN')}</small>
      </div>

      <div className="keypad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num, i) => (
          <button key={i} onClick={() => setAmount(prev => prev + num.toString())} className="key">
            {num}
          </button>
        ))}
        <button onClick={() => setAmount('')} className="key clear">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <select
        className="category-dropdown"
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        <option value="">Select Category</option>
        {SUBCATEGORIES.map((cat, idx) => (
          <option key={idx} value={cat}>{cat}</option>
        ))}
      </select>

      <button onClick={handleSave} className="pay-button">Save</button>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default TransactionPage;
