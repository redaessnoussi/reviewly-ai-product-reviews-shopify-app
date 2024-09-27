import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function getSubscriptionPlan(shop) {
  const subscription = await prisma.shopSubscription.findUnique({
    where: { shopId: shop },
  });
  return subscription ? subscription.subscription : "Free Plan";
}
