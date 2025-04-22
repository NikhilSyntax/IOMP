import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css'; // Regular CSS import

const Navbar = () => {
  const location = useLocation();

  // Helper function to check if path is active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li className="navbar-item">
          <Link 
            to="/dashboard" 
            className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
        </li>
        <li className="navbar-item">
          <Link 
            to="/transactions" 
            className={`navbar-link ${isActive('/transactions') ? 'active' : ''}`}
          >
            Transactions
          </Link>
        </li>
        <li className="navbar-item">
          <Link 
            to="/risk" 
            className={`navbar-link ${isActive('/risk') ? 'active' : ''}`}
          >
            Risk Assessment
          </Link>
        </li>
        <li className="navbar-item">
          <Link 
            to="/market-trends" 
            className={`navbar-link ${isActive('/market-trends') ? 'active' : ''}`}
          >
            Stocks & Investments
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;