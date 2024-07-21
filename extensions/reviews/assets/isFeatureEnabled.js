export const isFeatureEnabled = (userPlan, feature) => {
  const features = {
    "Free Plan": [
      "Basic Sentiment Analysis",
      "Manual Responses",
      "No Review Moderation",
      "Basic Analytics",
    ],
    "Basic Plan": [
      "Basic Sentiment Analysis",
      "Manual Responses",
      "No Review Moderation",
      "Basic Analytics",
      "Images or Video",
      "Email Notifications",
    ],
    "Standard Plan": [
      "Advanced Sentiment Analysis",
      "Manual Responses",
      "Review Moderation",
      "Basic Analytics",
      "Images or Video",
      "Email Notifications",
      "Automated Responses",
    ],
    "Premium Plan": [
      "Advanced Sentiment Analysis",
      "Manual Responses",
      "Review Moderation",
      "Advanced Analytics",
      "Images or Video",
      "Email Notifications",
      "Automated Responses",
      "Bulk Actions (Approve/Reject Reviews)",
      "Review Export/Import",
    ],
  };

  return features[userPlan].includes(feature);
};