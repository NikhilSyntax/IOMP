import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SpendingAlert.css'; // We'll create this CSS file

const SpendingAlertComponent = ({ userId, userEmail }) => {
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check spending patterns periodically
  useEffect(() => {
    const checkSpending = async () => {
      setIsLoading(true);
      try {
        // 1. Get current spending data
        const spendingRes = await axios.get(`/api/monthly-summary?userId=${userId}`);
        const { essentials, nonEssentials } = spendingRes.data;

        // 2. Send to K-means analysis endpoint
        const analysisRes = await axios.post('/api/check-spending', {
          userId,
          email: userEmail,
          essentialsSpending: essentials,
          nonEssentialsSpending: nonEssentials
        });

        // 3. Show alert if needed
        if (analysisRes.data.alertTriggered) {
          setAlertData({
            essentials,
            nonEssentials,
            usualPattern: analysisRes.data.usualPattern
          });
          setShowAlert(true);
        }
      } catch (err) {
        console.error('Spending analysis error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Run immediately and then every 24 hours
    checkSpending();
    const interval = setInterval(checkSpending, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userId, userEmail]);

  const handleDismiss = () => {
    setShowAlert(false);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="spending-alert-container">
      {isLoading && (
        <div className="loading-indicator">
          Analyzing your spending patterns...
        </div>
      )}

      {showAlert && alertData && (
        <div className="alert-box">
          <div className="alert-header">
            <h3>🚨 Unusual Spending Detected</h3>
            <button onClick={handleDismiss} className="close-btn">
              ×
            </button>
          </div>
          
          <div className="alert-body">
            <p>Your recent spending differs from your usual pattern:</p>
            
            <div className="spending-comparison">
              <div className="spending-category">
                <h4>Essentials</h4>
                <p className="current">
                  Current: {formatMoney(alertData.essentials)}
                </p>
                <p className="usual">
                  Usual: {formatMoney(alertData.usualPattern[0])}
                </p>
              </div>
              
              <div className="spending-category">
                <h4>Non-Essentials</h4>
                <p className="current">
                  Current: {formatMoney(alertData.nonEssentials)}
                </p>
                <p className="usual">
                  Usual: {formatMoney(alertData.usualPattern[1])}
                </p>
              </div>
            </div>
            
            <div className="alert-actions">
              <button 
                className="view-details-btn"
                onClick={() => window.location.href = '/transactions'}
              >
                View Transactions
              </button>
              <button 
                className="snooze-btn"
                onClick={() => setShowAlert(false)}
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingAlertComponent;