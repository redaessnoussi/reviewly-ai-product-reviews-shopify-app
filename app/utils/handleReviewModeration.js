import { isFeatureEnabled } from "./isFeatureEnabled";

export function handleReviewModeration(settings, sentiment, subscriptionPlan) {
  const reviewModerationEnabled = isFeatureEnabled(
    subscriptionPlan,
    "Review Moderation",
  );

  if (!reviewModerationEnabled || settings.reviewModeration === "none") {
    return true; // All reviews approved for Free Plan and if moderation is disabled
  } else if (
    reviewModerationEnabled &&
    settings.reviewModeration === "negative"
  ) {
    return sentiment !== "NEGATIVE"; // Approve all except negative
  } else if (reviewModerationEnabled && settings.reviewModeration === "all") {
    return false; // Require approval for all
  }
}
