import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './MarketTrends.css'; // Add this import at the top
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SYMBOL_OPTIONS = [
  { value: '^GSPC', name: 'S&P 500' },
  { value: '^DJI', name: 'Dow Jones' },
  { value: '^IXIC', name: 'NASDAQ' },
  { value: 'BTC-USD', name: 'Bitcoin' },
  { value: 'MSFT', name: 'Microsoft' },
  { value: 'AAPL', name: 'Apple' }
];

const MarketTrends = () => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('^GSPC');
  const [error, setError] = useState(null);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get(`http://localhost:5000/api/alpha-vantage`, {
        params: {
          symbol: symbol.includes('^') ? symbol.replace('^', '%5E') : symbol,
          function: 'TIME_SERIES_DAILY'
        }
      });
      
      setTrends(res.data);
    } catch (err) {
      console.error("Failed to fetch market data:", err);
      setError(err.response?.data?.error || 'Failed to load market data');
      // Fallback to mock data if real API fails
      try {
        const mockRes = await axios.get(`http://localhost:5000/api/live-market`);
        setTrends(mockRes.data[0]);
      } catch (mockErr) {
        console.error("Mock data also failed:", mockErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [symbol]);

  const chartData = {
    labels: trends?.data?.map(item => item.time) || [],
    datasets: [{
      label: `${symbol} Closing Price`,
      data: trends?.data?.map(item => item.value) || [],
      borderColor: trends?.change >= 0 ? 'rgb(40, 167, 69)' : 'rgb(220, 53, 69)',
      backgroundColor: trends?.change >= 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
      tension: 0.1,
      fill: true
    }]
  };

  return (
    <div className="market-trends">
      <h2>Market Trends</h2>
      
      <div className="controls">
        <select 
          value={symbol} 
          onChange={(e) => setSymbol(e.target.value)}
          disabled={loading}
        >
          {SYMBOL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.name}</option>
          ))}
        </select>
        
        <button 
          onClick={fetchMarketData} 
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>


      {loading && !trends ? (
        <div className="loading-spinner">Loading market data...</div>
      ) : (
        <div className="chart-container">
          <Line 
            data={chartData} 
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: `${symbol} - 30 Day Trend`
                }
              }
            }}
          />
          
          {trends && (
            <div className="market-summary">
              <h3>{SYMBOL_OPTIONS.find(opt => opt.value === symbol)?.name} Summary</h3>
              <div className="price-display">
                <span className="current-price">${trends.price?.toFixed(2)}</span>
                <span className={`change ${trends.change >= 0 ? 'positive' : 'negative'}`}>
                  {trends.change >= 0 ? '↑' : '↓'} {Math.abs(trends.change)?.toFixed(2)} (
                  {Math.abs(trends.changePercent)?.toFixed(2)}%)
                </span>
              </div>
              <div className="additional-info">
                <p>30-day range: 
                  ${Math.min(...trends.data.map(d => d.value))?.toFixed(2)} - 
                  ${Math.max(...trends.data.map(d => d.value))?.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketTrends;