// app/context/BillingPlanContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";

const BillingPlanContext = createContext();

export const BillingPlanProvider = ({ children }) => {
  const [billingPlan, setBillingPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillingPlan = async () => {
      try {
        const response = await fetch("/api/get-subscription-plan");
        const data = await response.json();
        setBillingPlan(data.userPlan);
      } catch (error) {
        console.error("Error fetching billing plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingPlan();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BillingPlanContext.Provider value={billingPlan}>
      {children}
    </BillingPlanContext.Provider>
  );
};

export const useBillingPlan = () => {
  const context = useContext(BillingPlanContext);
  if (context === undefined) {
    throw new Error("useBillingPlan must be used within a BillingPlanProvider");
  }
  return context;
};
