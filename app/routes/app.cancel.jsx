import { redirect } from "@remix-run/node";
import {
  authenticate,
  BASIC_PLAN,
  STANDARD_PLAN,
  PREMIUM_PLAN,
} from "../shopify.server";
// import { updateSubscriptionPlan } from "../utils/subscriptionPlan";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);

  const billingCheck = await billing.require({
    plans: [BASIC_PLAN, STANDARD_PLAN, PREMIUM_PLAN],
    isTest: true,
    onFailure: async () => billing.request({ plan: BASIC_PLAN }), // Default to a basic plan request if not subscribed
  });

  const subscription = billingCheck.appSubscriptions[0];
  await billing.cancel({
    subscriptionId: subscription.id,
    isTest: true,
    prorate: true,
  });

  return redirect("/app/pricing");
};
