// import { json } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function getSubscriptionPlan(shop) {
  const subscription = await prisma.shopSubscription.findUnique({
    where: { shop },
  });
  return subscription ? subscription.subscription : "Free Plan";
}

export async function updateSubscriptionPlan(shop, subscription) {
  const existingSubscription = await prisma.shopSubscription.findUnique({
    where: { shop },
  });

  if (existingSubscription) {
    await prisma.shopSubscription.update({
      where: { shop },
      data: { subscription },
    });
  } else {
    await prisma.shopSubscription.create({
      data: {
        shop,
        subscription,
      },
    });
  }
}

// Function to seed subscription plans for a list of shops
export async function seedSubscriptionPlans(defaultPlan) {
  try {
    for (const plan of defaultPlan) {
      const { shop, subscription } = plan;
      let shopName = shop.replace(".myshopify.com", "");

      // Ensure the shop record exists
      const shopRecord = await prisma.shop.upsert({
        where: { id: shop },
        update: {},
        create: {
          id: shop,
          name: shopName, // You should replace this with the actual shop name
          shopifyDomain: `${shop}`, // Adjust this if needed
        },
      });

      // Upsert the subscription plan for the shop
      await prisma.shopSubscription.upsert({
        where: { shopId: shopRecord.id },
        update: { subscription },
        create: { shopId: shopRecord.id, subscription },
      });
    }
  } catch (e) {
    console.log("subscriptionPlan.js", e);
  }
}
