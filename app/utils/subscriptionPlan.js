import prisma from "../db.server";

export async function getSubscriptionPlan(shop) {
  const subscription = await prisma.shopSubscription.findUnique({
    where: { shop },
  });
  return subscription ? subscription.subscription : "Free Plan";
}

export async function setSubscriptionPlan(shop, subscription) {
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
export async function seedSubscriptionPlans(shopList) {
  // Check if any shop subscriptions exist
  const subscriptionsCount = await prisma.shopSubscription.count();
  if (subscriptionsCount === 0) {
    // Seed with initial data if none exist
    await prisma.shopSubscription.createMany({
      data: shopList,
    });
  }
}
