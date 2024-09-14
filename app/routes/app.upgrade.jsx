// app/routes/app.upgrade.jsx

import { authenticate, BASIC_PLAN, PREMIUM_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const url = new URL(request.url);

  // Get the selected plan from the query parameter
  const selectedPlan = url.searchParams.get("plan"); // either "basic" or "premium"

  // Determine which plan to request based on the query parameter
  const plan = selectedPlan === "Premium Plan" ? PREMIUM_PLAN : BASIC_PLAN; // default to BASIC_PLAN if not "premium"

  let { shop } = session;
  let myShop = shop.replace(".myshopify.com", "");

  // Check for active subscription or request the selected plan if none is active
  await billing.require({
    plans: [BASIC_PLAN, PREMIUM_PLAN],
    onFailure: async () =>
      billing.request({
        plan,
        isTest: true,
        returnUrl: `https://admin.shopify.com/store/${myShop}/apps/${process.env.APP_NAME}/app/pricing`,
      }),
  });

  return null; // After the upgrade, the user will be redirected back to the pricing page
};
