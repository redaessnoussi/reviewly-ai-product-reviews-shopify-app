export function getSubscriptionPlan() {
  return "{{ shop.metafields.app_subscription.current_plan }}"; // Liquid injection of subscription plan
}
