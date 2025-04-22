import React, { useEffect, useState } from 'react';

const OverspendingAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/overspending-alerts')
      .then(res => res.json())
      .then(data => setAlerts(data.alerts));
  }, []);

  return (
    <div>
      <h3>🔔 Alerts</h3>
      {alerts.length === 0 ? (
        <p>You're within limits! 🎉</p>
      ) : (
        alerts.map(alert => (
          <p key={alert.category} style={{ color: 'red' }}>
            Overspent on {alert.category}: ₹{alert.total}
          </p>
        ))
      )}
    </div>
  );
};

export default OverspendingAlerts;
