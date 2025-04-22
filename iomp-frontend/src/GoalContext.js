import React, { createContext, useState } from 'react';

export const GoalContext = createContext();

export const GoalProvider = ({ children }) => {
  const [income, setIncome] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState(0);

  return (
    <GoalContext.Provider value={{ income, setIncome, savingsGoal, setSavingsGoal }}>
      {children}
    </GoalContext.Provider>
  );
};
