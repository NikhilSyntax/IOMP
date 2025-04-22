import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GoalPage = () => {
  const [goal, setGoal] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!goal) {
      setMessage('Please enter a valid goal.');
      return;
    }

    fetch('http://localhost:5000/api/save-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: Number(goal) }),
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        if (data.message === 'Goal saved successfully') {
          navigate('/transactions');
        }
      })
      .catch(err => {
        console.error('Save goal error:', err);
        setMessage('Something went wrong');
      });
  };

  return (
    <div>
      <h2>Goal Page</h2>
      <input
        type="number"
        placeholder="Enter your savings goal"
        value={goal}
        onChange={e => setGoal(e.target.value)}
      />
      <button onClick={handleSubmit}>Save Goal</button>
      <p>{message}</p>
      <button onClick={() => navigate('/transactions')}>Next</button>
    </div>
  );
};

export default GoalPage;
