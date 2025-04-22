import React, { useState } from 'react';
import axios from 'axios';
import './RiskResult.css';
const RiskResult = () => {
  const questions = [
    { key: "q1", question: "What is your current age?", options: ["Under 35", "35-44", "45-54", "55-64", "65+"], scores: [5, 4, 3, 2, 1] },
    { key: "q2", question: "When do you expect to start withdrawing from this investment?", options: ["Not for 20+ years", "In 10-20 years", "In 5-10 years", "Within 5 years", "Immediately"], scores: [5, 4, 3, 2, 1] },
    { key: "q3", question: "How long do you plan to keep this money invested?", options: ["Less than 3 years", "3-5 years", "5-10 years", "10-15 years", "15+ years"], scores: [1, 2, 3, 4, 5] },
    { key: "q4", question: "How would you describe your current life stage?", options: ["Early career", "Mid-career", "Pre-retirement", "Retired", "Late retirement"], scores: [5, 4, 3, 2, 1] },
    { key: "q5", question: "How stable is your current income?", options: ["Very unstable", "Somewhat unstable", "Moderately stable", "Very stable", "Extremely stable"], scores: [1, 2, 3, 4, 5] },
    { key: "q6", question: "How many years of expenses do you have in emergency savings?", options: ["Less than 3 months", "3-6 months", "6-12 months", "1-2 years", "2+ years"], scores: [1, 2, 3, 4, 5] },
    { key: "q7", question: "How would unexpected medical expenses affect you?", options: ["Financial catastrophe", "Significant hardship", "Manageable with adjustments", "Minor inconvenience", "No impact"], scores: [1, 2, 3, 4, 5] },
    { key: "q8", question: "How much do you depend on investment income?", options: ["100% dependent", "Primary source", "Important supplement", "Nice-to-have supplement", "Not at all dependent"], scores: [1, 2, 3, 4, 5] },
    { key: "q9", question: "Do you have guaranteed income sources (pension, annuity)?", options: ["None", "Covers <25% of needs", "Covers 25-50%", "Covers 50-75%", "Covers 75%+"], scores: [1, 2, 3, 4, 5] },
    { key: "q10", question: "How might you adjust if investments underperform?", options: ["Would need to make drastic cuts", "Significant lifestyle changes", "Moderate adjustments", "Minor spending changes", "No changes needed"], scores: [1, 2, 3, 4, 5] },
    { key: "q11", question: "How do you feel about taking on debt for investments?", options: ["Would never consider it", "Avoid if possible", "Neutral", "Comfortable with some debt", "Open to significant debt"], scores: [1, 2, 3, 4, 5] },
    { key: "q12", question: "How would you describe your overall investment knowledge?", options: ["No knowledge", "Beginner", "Intermediate", "Advanced", "Expert"], scores: [1, 2, 3, 4, 5] },
    { key: "q13", question: "How comfortable are you with risk in your investments?", options: ["Extremely risk-averse", "Somewhat risk-averse", "Neutral", "Somewhat risk-tolerant", "Very risk-tolerant"], scores: [1, 2, 3, 4, 5] },
    { key: "q14", question: "What is your current asset allocation?", options: ["100% cash", "Mostly cash", "Balanced (stocks and bonds)", "Mostly stocks", "100% stocks"], scores: [1, 2, 3, 4, 5] },
    { key: "q15", question: "How would you handle a major market downturn?", options: ["Sell all investments", "Sell most investments", "Hold investments", "Buy more investments", "Invest aggressively"], scores: [1, 2, 3, 4, 5] },
    { key: "q16", question: "How likely are you to take on a new investment strategy?", options: ["Not likely", "Somewhat unlikely", "Neutral", "Somewhat likely", "Very likely"], scores: [1, 2, 3, 4, 5] },
    { key: "q17", question: "What is your primary investment goal?", options: ["Preserving capital", "Growing wealth", "Generating income", "Maximizing returns", "Speculating"], scores: [1, 2, 3, 4, 5] },
    { key: "q18", question: "How diversified are your investments?", options: ["Not diversified", "Somewhat diversified", "Moderately diversified", "Highly diversified", "Fully diversified"], scores: [1, 2, 3, 4, 5] },
    { key: "q19", question: "How often do you review your investment portfolio?", options: ["Rarely", "Annually", "Every 6 months", "Quarterly", "Monthly"], scores: [1, 2, 3, 4, 5] },
    { key: "q20", question: "How would you rate your financial discipline?", options: ["Poor", "Fair", "Good", "Very good", "Excellent"], scores: [1, 2, 3, 4, 5] },
    { key: "q21", question: "How much financial debt do you currently have?", options: ["None", "Less than 10% of income", "10-30% of income", "30-50% of income", "More than 50% of income"], scores: [5, 4, 3, 2, 1] },
    { key: "q22", question: "Do you have a financial advisor or planner?", options: ["No", "Yes, but not actively engaged", "Yes, actively engaged"], scores: [1, 3, 5] },
    { key: "q23", question: "Do you have any planned large financial events in the next 5 years?", options: ["No", "Yes, but not major", "Yes, significant"], scores: [1, 3, 5] },
    { key: "q24", question: "How do you feel about losing a portion of your investment value?", options: ["Would panic", "Would be concerned", "Would be okay", "Would be indifferent", "Would see it as an opportunity"], scores: [1, 2, 3, 4, 5] },
    { key: "q25", question: "How often do you make changes to your investment strategy?", options: ["Never", "Rarely", "Occasionally", "Frequently", "Constantly"], scores: [1, 2, 3, 4, 5] },
    { key: "q26", question: "How much of your portfolio is allocated to high-risk assets?", options: ["None", "Less than 10%", "10-30%", "30-50%", "More than 50%"], scores: [1, 2, 3, 4, 5] },
    { key: "q27", question: "How often do you research your investments?", options: ["Never", "Occasionally", "Regularly", "Often", "Constantly"], scores: [1, 2, 3, 4, 5] },
    { key: "q28", question: "How long have you been investing?", options: ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"], scores: [1, 2, 3, 4, 5] },
    { key: "q29", question: "How important is it for you to know the risk level of your investments?", options: ["Not important", "Somewhat important", "Neutral", "Very important", "Extremely important"], scores: [1, 2, 3, 4, 5] },
    { key: "q30", question: "Would you consider rebalancing your portfolio based on risk levels?", options: ["Not at all", "Maybe", "Neutral", "Yes", "Definitely"], scores: [1, 2, 3, 4, 5] }
  ];

  const [responses, setResponses] = useState(questions.map(q => 1)); // Default to first option
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (index, value) => {
    const newResponses = [...responses];
    newResponses[index] = parseInt(value);
    setResponses(newResponses);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Calculate total score based on question scores
      const totalScore = questions.reduce((sum, question, index) => {
        return sum + question.scores[responses[index] - 1];
      }, 0);
      
      // Fetch risk mapping data
      const res = await axios.get('http://localhost:5000/api/risk-mapping');
      const mapping = res.data;
      
      // Determine risk profile
      let riskLabel;
      if (totalScore <= 60) riskLabel = 'Conservative';
      else if (totalScore <= 90) riskLabel = 'Moderate';
      else if (totalScore <= 120) riskLabel = 'Growth';
      else riskLabel = 'Aggressive';
      
      // Set results
      setResult({
        label: riskLabel,
        score: totalScore,
        suggestions: mapping[riskLabel]?.suggestions || []
      });
      
    } catch (err) {
      console.error('Failed to fetch risk mapping:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="risk-container">
      <h2>Risk Assessment Survey</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((question, index) => (
          <div key={question.key} className="question">
            <label>{question.question}</label>
            <select 
              value={responses[index]}
              onChange={(e) => handleChange(index, e.target.value)}
            >
              {question.options.map((option, optionIndex) => (
                <option 
                  key={`${question.key}-${optionIndex}`} 
                  value={optionIndex + 1}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Calculating...' : 'Get Risk Profile'}
        </button>
      </form>

      {result && (
        <div className="result">
          <h3>Your Risk Profile: {result.label}</h3>
          <p>Score: {result.score}/150</p>
          
          <h4>Suggested Investments:</h4>
          <ul>
            {result.suggestions?.map((item, i) => (
              <li key={i}>
                <strong>{item.name}</strong> ({item.ticker}) - {item.api}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RiskResult;