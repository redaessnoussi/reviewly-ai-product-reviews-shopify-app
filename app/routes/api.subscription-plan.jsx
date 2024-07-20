import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shopName = url.searchParams.get("shopName");

  if (!shopName) {
    return json({ error: "Shop name ID is required" }, { status: 400 });
  }

  const subscriptionPlan = await prisma.shopSubscription.findFirst({
    where: { shopId: shopName },
  });

  if (!subscriptionPlan) {
    return json({ error: "Subscription plan not found" }, { status: 404 });
  }

  return json(subscriptionPlan.subscription);
};
