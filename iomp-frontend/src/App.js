import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoalProvider } from './GoalContext';
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import TransactionPage from './TransactionPage';
import RiskResult from './RiskResult'; // Changed from RiskAssessment to match your existing file
import MarketTrends from './MarketTrends';
import SpendingAlertComponent from './SpendingAlertComponent'; // Fixed import name
import './App.css';

const App = () => {
  // Since you haven't defined UserProvider, we'll remove it for now
  const currentUser = {
    id: '123',
    email: 'user@example.com'
  };

  return (
    // Removed UserProvider since it's not defined
    <GoalProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          
          {/* Main content area */}
          <main className="main-content">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<TransactionPage />} />
              <Route path="/risk" element={<RiskResult />} /> {/* Changed path to match your existing route */}
              <Route path="/market-trends" element={<MarketTrends />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Global components */}
          <SpendingAlertComponent 
            userId={currentUser.id} 
            email={currentUser.email} 
          />
        </div>
      </Router>
    </GoalProvider>
  );
};

export default App;