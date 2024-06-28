export const isFeatureEnabled = (userPlan, feature) => {
  const features = {
    "Free Plan": [
      "Basic Sentiment Analysis",
      "Manual Responses",
      "Basic Review Moderation",
      "Basic Analytics",
    ],
    "Basic Plan": [
      "Advanced Sentiment Analysis",
      "Manual Responses",
      "Basic Analytics",
      "Email Notifications",
    ],
    "Standard Plan": [
      "Advanced Sentiment Analysis",
      "Manual Responses",
      "Basic Analytics",
      "Email Notifications",
      "Automated Responses",
      "Images or Video",
      "Review Moderation",
    ],
    "Premium Plan": [
      "Advanced Sentiment Analysis",
      "Manual Responses",
      "Basic Analytics",
      "Email Notifications",
      "Automated Responses",
      "Images or Video",
      "Review Moderation",
      "Bulk Actions",
      "Advanced Analytics",
      "Review Export/Import",
    ],
  };

  return features[userPlan].includes(feature);
};
