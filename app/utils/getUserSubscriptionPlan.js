// utils/getUserSubscriptionPlan.js
import {
  BASIC_PLAN,
  PREMIUM_PLAN,
  STANDARD_PLAN,
  authenticate,
} from "../shopify.server";

export async function getUserSubscriptionPlan(request) {
  try {
    const { billing } = await authenticate.admin(request);
    const billingCheck = await billing.check({
      plans: [BASIC_PLAN, STANDARD_PLAN, PREMIUM_PLAN],
      isTest: true,
    });

    if (billingCheck.hasActivePayment) {
      return billingCheck.appSubscriptions[0].name;
    }

    return "Free Plan";
  } catch (error) {
    console.error("2 Error in getUserSubscriptionPlan:", error);
    throw error;
  }
}
