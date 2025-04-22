const { analyzeSpending } = require('../services/KMeansService');
const { sendAlert } = require('./emailController');

exports.checkSpending = async (req, res) => {
  const { userId, essentials, nonEssentials } = req.body;
  
  const { isUnusual, usualPattern } = await analyzeSpending(
    userId, 
    [essentials, nonEssentials]
  );
  
  if (isUnusual) {
    await sendAlert(userId, { essentials, nonEssentials, usualPattern });
  }
  
  res.json({ alertTriggered: isUnusual });
};