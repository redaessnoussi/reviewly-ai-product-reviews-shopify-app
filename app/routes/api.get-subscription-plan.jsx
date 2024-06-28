// app/routes/api.get-subscription-plan.jsx
import { json } from "@remix-run/node";
import { getUserSubscriptionPlan } from "../utils/getUserSubscriptionPlan";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const userPlan = await getUserSubscriptionPlan(request);

  console.log("userPlan from api.get-subscription-plan.jsx ------>" + userPlan);

  return json({ userPlan });
};
