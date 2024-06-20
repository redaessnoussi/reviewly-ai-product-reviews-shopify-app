import { redirect } from "@remix-run/node";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  let { shop } = session;
  let myShop = shop.replace(".myshopify.com", "");

  console.log("process.env.APP_NAME ==>", process.env.APP_NAME);

  await billing.require({
    plans: [MONTHLY_PLAN],
    onFailure: async () =>
      billing.request({
        plan: MONTHLY_PLAN,
        isTest: true,
        returnUrl: `https://admin.shopify.com/store/${myShop}/apps/${process.env.APP_NAME}/app/pricing`,
      }),
  });
  console.log("hna 4");

  // App logic
  return null;
};
