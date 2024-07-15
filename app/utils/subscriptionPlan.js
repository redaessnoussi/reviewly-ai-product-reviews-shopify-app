import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function getSubscriptionPlan(shop) {
  const subscription = await prisma.shopSubscription.findUnique({
    where: { shopId: shop },
  });
  return subscription ? subscription.subscription : "Free Plan";
}

export async function updateSubscriptionPlan(shop, subscription) {
  await prisma.shopSubscription.upsert({
    where: { shopId: shop },
    update: { subscription },
    create: { shopId: shop, subscription },
  });
}

export async function seedSubscriptionPlans(defaultPlan) {
  try {
    for (const plan of defaultPlan) {
      const { shop, subscription } = plan;
      await ensureShopRecord(shop);
      await updateSubscriptionPlan(shop, subscription);
    }
  } catch (e) {
    console.log("subscriptionPlan.js", e);
  }
}

// Function to ensure the shop record exists
export async function ensureShopRecord(shop) {
  let shopName = shop.replace(".myshopify.com", "");
  return await prisma.shop.upsert({
    where: { id: shop },
    update: {},
    create: {
      id: shop,
      name: shopName,
      shopifyDomain: shop,
    },
  });
}
