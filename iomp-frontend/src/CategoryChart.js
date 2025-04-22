import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const CategoryChart = () => {
  const [budgetData, setBudgetData] = useState([0, 0, 0]);
  const [spendingData, setSpendingData] = useState([0, 0, 0]);

  const fetchBudgetData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/budget-breakdown');
      if (res.ok) {
        const data = await res.json();
        setBudgetData([
          data.essentialsLimit || 0,
          data.nonEssentialsLimit || 0,
          data.investmentsLimit || 0
        ]);
        setSpendingData([
          data.spending.essentials || 0,
          data.spending.nonEssentials || 0,
          data.spending.investments || 0
        ]);
      }
    } catch (err) {
      console.error('Error fetching budget breakdown:', err);
    }
  };

  useEffect(() => {
    fetchBudgetData();
    const interval = setInterval(fetchBudgetData, 5000);
    return () => clearInterval(interval);
  }, []);

  const labels = ['Essentials', 'Non-Essentials', 'Investments'];

  const barData = {
    labels,
    datasets: [
      {
        label: 'Predefined Budget',
        backgroundColor: 'rgba(0,123,255,0.6)',
        borderColor: 'rgba(0,123,255,1)',
        borderWidth: 1,
        data: budgetData
      },
      {
        label: 'Actual Spending',
        backgroundColor: 'rgba(220,53,69,0.6)',
        borderColor: 'rgba(220,53,69,1)',
        borderWidth: 1,
        data: spendingData
      }
    ]
  };

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Predefined Budget',
        data: budgetData,
        borderColor: 'rgba(0,123,255,1)',
        backgroundColor: 'rgba(0,123,255,0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      },
      {
        label: 'Actual Spending',
        data: spendingData,
        borderColor: 'rgba(220,53,69,1)',
        backgroundColor: 'rgba(220,53,69,0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: ''
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₹)'
        }
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto' }}>
      <h3 style={{ textAlign: 'center' }}>Bar Chart: Budget vs Spending</h3>
      <Bar data={barData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Budget vs Spending (Bar)' } } }} />
      
      <div style={{ height: '40px' }} /> {/* spacing */}

      <h3 style={{ textAlign: 'center' }}>Line Chart: Budget vs Spending</h3>
      <Line data={lineData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Budget vs Spending (Line)' } } }} />
    </div>
  );
};

export default CategoryChart;
