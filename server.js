// server.js
const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');
const { PythonShell } = require('python-shell');
const nodemailer = require('nodemailer');
const app  = express();
const port = 5000
const ALPHA_VANTAGE_KEY = 'ZOWEIXKNV38XSERH';
const { exec } = require('child_process');

app.use(cors());
app.use(bodyParser.json());

const DATA_DIR     = __dirname;
const GOAL_FILE    = path.join(DATA_DIR, 'goal.json');
const TX_FILE      = path.join(DATA_DIR, 'transactions.json');
const BALANCE_FILE = path.join(DATA_DIR, 'balance.json');

// ────────────────────────────────
// In‑memory state
// ────────────────────────────────
let goal         = 0;
let transactions = [];
let balance      = 0;
let income       = 0;

// Your categories
const EXPENSE_CATEGORIES = {
  Essentials:     ['Rent', 'Needy Shopping', 'Food'],
  NonEssentials:  ['Dinning', 'Casual Shopping', 'Entertainment'],
  Investments:    ['Savings', 'Bank Deposit', 'Stock Investment', 'Crypto Investment', 'Investment Funds'],
  Miscellaneous:  ['Others']
};
const INCOME_CATEGORIES = ['Salary'];

// Utility: load or init a JSON file
function loadData(filePath, defaultValue) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  return defaultValue;
}
function saveData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Map a subcategory → main category
function categorizeTransaction(sub) {
  for (const [main, subs] of Object.entries(EXPENSE_CATEGORIES)) {
    if (subs.includes(sub)) return main;
  }
  if (INCOME_CATEGORIES.includes(sub)) return 'Income';
  return 'Miscellaneous';
}

// Recompute total `income` from all Salary transactions
function recalcIncome() {
  income = transactions
    .filter(tx => tx.category === 'Income' && tx.subcategory === 'Salary')
    .reduce((sum, tx) => sum + tx.amount, 0);
}

// On startup, load from disk
function init() {
  const defaultBudgetLimits = {
    essentialsLimit: income * 0.5,
    nonEssentialsLimit: income * 0.3,
    investmentsLimit: income * 0.2
  };

  const savedData = loadData(GOAL_FILE, { 
    goal: 0,
    budgetLimits: defaultBudgetLimits 
  });

  goal = savedData.goal;
  transactions = loadData(TX_FILE, []);
  balance = loadData(BALANCE_FILE, { balance: 0 }).balance;
  recalcIncome();
}
init();

// 50/30/20 breakdown
function calculateBudgetBreakdown() {
  // Load saved budget limits
  const savedData = loadData(GOAL_FILE, {
    budgetLimits: {
      essentialsLimit: income * 0.5,
      nonEssentialsLimit: income * 0.3,
      investmentsLimit: income * 0.2
    }
  });

  const {
    essentialsLimit = income * 0.5,
    nonEssentialsLimit = income * 0.3,
    investmentsLimit = income * 0.2
  } = savedData.budgetLimits || {};

  // Calculate current spending
  const spending = { essentials: 0, nonEssentials: 0, investments: 0 };
  for (const tx of transactions) {
    if (tx.category === 'Essentials') spending.essentials += tx.amount;
    else if (tx.category === 'NonEssentials') spending.nonEssentials += tx.amount;
    else if (tx.category === 'Investments') spending.investments += tx.amount;
  }

  return {
    essentialsLimit,
    nonEssentialsLimit,
    investmentsLimit,
    spending,
    budgetStatus: {
      essentialsStatus: spending.essentials <= essentialsLimit,
      nonEssentialsStatus: spending.nonEssentials <= nonEssentialsLimit,
      investmentsStatus: spending.investments <= investmentsLimit
    }
  };
}

// ────────────────────────────────
// RISK‑MAPPING & ASSET‑DATA mocks
// ────────────────────────────────
const RISK_MAPPING = {
  Conservative: {
    description: "Prefers capital preservation over growth",
    suggestions: [
      { ticker: "BND", name: "Total Bond Market ETF", api: "bond" },
      { ticker: "GOVT", name: "US Treasury Bond ETF", api: "bond" }
    ]
  },
  Moderate: {
    description: "Balanced approach between growth and safety",
    suggestions: [
      { ticker: "SPY", name: "S&P 500 ETF", api: "stock" },
      { ticker: "AGG", name: "Core US Aggregate Bond ETF", api: "bond" }
    ]
  },
  Growth: {
    description: "Focuses on long‑term growth potential",
    suggestions: [
      { ticker: "VTI", name: "Total Stock Market ETF", api: "stock" },
      { ticker: "QQQ", name: "Nasdaq‑100 ETF", api: "stock" }
    ]
  },
  Aggressive: {
    description: "Seeks maximum returns with high risk tolerance",
    suggestions: [
      { ticker: "ARKK", name: "Innovation ETF", api: "stock" },
      { ticker: "BTC-USD", name: "Bitcoin", api: "crypto" }
    ]
  }
};

// Simple time‑series generator
function generateMockAssetData(ticker) {
  const base = {
    BND: 80, GOVT: 85,
    SPY: 450, AGG:110,
    VTI:220, QQQ:350,
    ARKK:50, "BTC-USD":40000
  }[ticker] || 100;
  const labels = Array.from({ length: 12 }, (_, i) =>
    new Date(Date.now() - (11 - i)*30*86400000)
      .toLocaleDateString('en-US',{month:'short'})
  );
  const values = labels.map((_,i) =>
    base * (1 + ((Math.random()*0.2 - 0.1))*(1 + i*0.02))
  );
  return { labels, values };
}

// ────────────────────────────────
// 1) Goals
// ────────────────────────────────

app.post('/api/update-goal', (req, res) => {
  const { newGoal } = req.body;
  
  if (typeof newGoal !== 'number' || newGoal <= 0) {
    return res.status(400).json({ message: 'Invalid goal value' });
  }

  // Recalculate the budget limits based on the updated goal
  const updatedBudgetLimits = {
    essentialsLimit: newGoal * 0.5,  // 50% of the goal for essentials
    nonEssentialsLimit: newGoal * 0.3,  // 30% of the goal for non-essentials
    investmentsLimit: newGoal * 1  // 20% of the goal for investments (this will change)
  };

  // Save the new goal and updated budget limits to goal.json
  const updatedGoalData = {
    goal: newGoal,
    budgetLimits: updatedBudgetLimits
  };

  // Save data to the goal.json file
  saveData(GOAL_FILE, updatedGoalData);

  // Send the updated goal and budget limits in the response
  res.json({
    message: 'Goal updated successfully',
    goal: newGoal,
    budgetLimits: updatedBudgetLimits
  });
});

app.get('/api/get-goal',   (req,res) => res.json({ goal }));
app.post('/api/save-goal', (req,res) => {
  const { goal: g } = req.body;
  if (isNaN(g)) return res.status(400).json({ message:'Invalid goal' });
  goal = g;
  saveData(GOAL_FILE, { goal });
  res.json({ message:'Goal saved', goal });
});

// ────────────────────────────────
// 2) Transactions
// ────────────────────────────────
app.post('/api/add-transaction', (req,res) => {
  const { amount, subcategory } = req.body;
  if (typeof amount !== 'number' || !subcategory) {
    return res.status(400).json({ message:'Missing amount or subcategory' });
  }
  const mainCat = categorizeTransaction(subcategory);
  const type    = mainCat==='Income' ? 'income' : 'expense';
  const tx = { amount, subcategory, category:mainCat, type, date:new Date().toISOString() };
  transactions.push(tx);
  saveData(TX_FILE, transactions);

  if (type==='income') {
    income  += amount;
    balance += amount;
    goal    += amount;
    
    // Recalculate the budget limits based on the updated income
    const updatedBudgetLimits = {
      essentialsLimit: income * 0.5,
      nonEssentialsLimit: income * 0.3,
      investmentsLimit: income * 0.2
    };

    // Save the updated goal and budget limits
    saveData(GOAL_FILE, { goal, budgetLimits: updatedBudgetLimits });
  } else {
    balance -= amount;
  }
  saveData(BALANCE_FILE, { balance });
  recalcIncome();

  res.json({ message:'Transaction added', balance, transactions });
});

app.get('/api/get-transactions', (req,res) => res.json({ transactions }));
app.get('/api/get-balance',      (req,res) => res.json({ balance }));

// Improved checkBudgetRisk function
app.get("/api/check-budget-risk", (req, res) => {
  checkBudgetRisk(req, res).catch(error => {
      console.error('Unhandled error in checkBudgetRisk:', error);
      res.status(500).json({
          status: 'error',
          message: 'Internal server error during risk assessment'
      });
  });
});

async function checkBudgetRisk(req, res) {
  try {
      // Load and validate data
      const transactions = loadData(TX_FILE, []);
      const { budgetLimits } = loadData(GOAL_FILE, {
          budgetLimits: {
              essentialsLimit: 1,  // Avoid division by zero
              nonEssentialsLimit: 1,
              investmentsLimit: 1
          }
      });

      // Calculate spending totals
      const spending = transactions.reduce((acc, tx) => {
          if (tx.type === 'expense' && acc[tx.category] !== undefined) {
              acc[tx.category] += tx.amount;
          }
          return acc;
      }, {
          Essentials: 0,
          NonEssentials: 0,
          Investments: 0
      });

      // Calculate usage percentages
      const usage = {
          essentials: (spending.Essentials / budgetLimits.essentialsLimit) * 100,
          nonEssentials: (spending.NonEssentials / budgetLimits.nonEssentialsLimit) * 100,
          investments: (spending.Investments / budgetLimits.investmentsLimit) * 100
      };

      // Execute Python script
      const { stdout, stderr } = await promisify(exec)(
          `python ${path.join(__dirname, 'risk_cluster.py')} '${JSON.stringify(usage)}'`
      );

      const result = JSON.parse(stdout);
      if (result.status !== 'success') {
          throw new Error(result.message);
      }

      // Generate recommendations
      const recommendations = [];
      const { risk_levels } = result;

      if (risk_levels.essentials === 'high') {
          recommendations.push("Urgent: Reduce essential spending immediately");
      }

      if (risk_levels.nonEssentials === 'high') {
          recommendations.push("Warning: Cut discretionary spending");
      }

      if (risk_levels.investments === 'low' && usage.investments < 50) {
          recommendations.push("Consider increasing investments");
      }

      // Prepare response
      res.json({
          status: 'success',
          riskLevels: risk_levels,
          spending: {
              essentials: {
                  spent: spending.Essentials,
                  limit: budgetLimits.essentialsLimit,
                  percentage: usage.essentials
              },
              nonEssentials: {
                  spent: spending.NonEssentials,
                  limit: budgetLimits.nonEssentialsLimit,
                  percentage: usage.nonEssentials
              },
              investments: {
                  spent: spending.Investments,
                  limit: budgetLimits.investmentsLimit,
                  percentage: usage.investments
              }
          },
          recommendations: recommendations.length ? recommendations : ["All categories within safe limits"],
          lastUpdated: new Date().toISOString()
      });

  } catch (error) {
      console.error('Risk assessment failed:', error);
      res.status(500).json({
          status: 'error',
          message: 'Failed to assess budget risk',
          details: error.message
      });
  }
}

// Helper to promisify exec
const promisify = require('util').promisify;

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
// ────────────────────────────────
// 3) Summaries & breakdowns
// ────────────────────────────────
app.get('/api/get-category-summary', (req,res) => {
  const summary = { Essentials:0, NonEssentials:0, Investments:0, Miscellaneous:0, Income:0 };
  for (const tx of transactions) {
    if (summary.hasOwnProperty(tx.category)) summary[tx.category] += tx.amount;
  }
  res.json({ summary });
});

app.get('/api/monthly-summary', (req,res) => {
  let inc = 0, exp = 0;
  for (const tx of transactions) {
    tx.type==='income' ? inc+=tx.amount : exp+=tx.amount;
  }
  const remaining = inc - exp;
  res.json({ income:inc, expenses:exp, remaining, goal, goalReached: remaining>=goal });
});

app.get('/api/budget-breakdown', (req,res) => {
  res.json(calculateBudgetBreakdown());
});

app.post('/api/budget-breakdown', (req, res) => {
  const { newLimit } = req.body;
  
  if (typeof newLimit !== 'number' || newLimit < 0) {
    return res.status(400).json({ error: 'Invalid investments limit' });
  }

  // Load current data
  const currentData = loadData(GOAL_FILE, {
    goal: 0,
    budgetLimits: {
      essentialsLimit: income * 0.5,
      nonEssentialsLimit: income * 0.3,
      investmentsLimit: income * 0.2
    }
  });

  // Update only the investments limit
  currentData.budgetLimits.investmentsLimit = newLim;

  // Save back to file
  saveData(GOAL_FILE, currentData);

  // Return the updated budget breakdown using the new limit
  const breakdown = calculateBudgetBreakdown();
  breakdown.investmentsLimit = investmentsLimit; // Ensure immediate update
  
  res.json(breakdown);
});

// ────────────────────────────────
// 4) Risk assessment
// ────────────────────────────────
// In server.js - update the assess-risk endpoint
app.post('/api/assess-risk', (req, res) => {
  const { responses } = req.body;
  if (!responses || Object.keys(responses).length !== 30) {
    return res.status(400).json({ error: 'Invalid survey responses' });
  }

  PythonShell.run(
    'random_forest_predict.py', 
    {
      scriptPath: path.join(__dirname, 'model'),
      args: [JSON.stringify(responses)]
    },
    (err, output) => {
      if (err) {
        console.error('PythonShell error:', err);
        return res.status(500).json({ error: 'Risk assessment failed' });
      }
      if (!output || output.length === 0) {
        return res.status(500).json({ error: 'No output from Python script' });
      }
      
      const risk_label = output[0].trim();
      const risk_score = Object.values(responses).reduce((a, b) => a + b, 0);
      
      res.json({ 
        risk_label, 
        risk_score,
        suggestions: RISK_MAPPING[risk_label]?.suggestions || []
      });
    }
  );
});

// ────────────────────────────────
// 5) Risk‑mapping & Asset data
// ────────────────────────────────
app.get('/api/risk-mapping', (req,res) => {
  res.json(RISK_MAPPING);
});

app.get('/api/asset-data', (req,res) => {
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error:'ticker is required' });
  // ignore req.query.api for now
  const data = generateMockAssetData(ticker);
  res.json(data);
});

// ────────────────────────────────
// 6) Mock live‑market
// ────────────────────────────────
app.get('/api/live-market', (req,res) => {
  const mock = [{
    symbol: '^GSPC',
    price: 4500.32,
    change: 12.45,
    changePercent: 0.28,
    data: Array.from({length:30},(_,i)=>({
      time:  new Date(Date.now() - (29-i)*86400000).toISOString().split('T')[0],
      value: 4500 + Math.sin(i/3)*100 + Math.random()*50
    }))
  }];
  res.json(mock);
});

app.get('/api/alpha-vantage', async (req, res) => {
  const { symbol, function: func } = req.query;
  
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    
    // Transform Alpha Vantage data to match your frontend format
    if (func === 'TIME_SERIES_DAILY') {
      const timeSeries = response.data['Time Series (Daily)'];
      const dataPoints = Object.entries(timeSeries).map(([date, values]) => ({
        time: date,
        value: parseFloat(values['4. close'])
      })).slice(0, 30).reverse(); // Last 30 days
      
      res.json({
        symbol,
        price: dataPoints[dataPoints.length - 1].value,
        change: dataPoints[dataPoints.length - 1].value - dataPoints[0].value,
        changePercent: ((dataPoints[dataPoints.length - 1].value - dataPoints[0].value) / dataPoints[0].value) * 100,
        data: dataPoints
      });
    } else {
      res.json(response.data);
    }
    
  } catch (err) {
    console.error('Alpha Vantage error:', err);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});
// ────────────────────────────────
// Start
// ────────────────────────────────
app.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});
