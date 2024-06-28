import { redirect } from "@remix-run/node";
import {
  authenticate,
  BASIC_PLAN,
  STANDARD_PLAN,
  PREMIUM_PLAN,
} from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  let { shop } = session;
  let myShop = shop.replace(".myshopify.com", "");

  const url = new URL(request.url);
  const plan = url.searchParams.get("plan");

  let selectedPlan;

  console.log("selectedPlan : ", selectedPlan);

  switch (plan) {
    case "Basic Plan":
      selectedPlan = BASIC_PLAN;
      break;
    case "Standard Plan":
      selectedPlan = STANDARD_PLAN;
      break;
    case "Premium Plan":
      selectedPlan = PREMIUM_PLAN;
      break;
    default:
      throw new Error("Invalid plan selected");
  }

  await billing.require({
    plans: [selectedPlan],
    onFailure: async () =>
      billing.request({
        plan: selectedPlan,
        isTest: true,
        returnUrl: `https://admin.shopify.com/store/${myShop}/apps/${process.env.APP_NAME}/app/pricing`,
      }),
  });

  // App logic
  return null;
};
