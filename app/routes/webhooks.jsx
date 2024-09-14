import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  getSubscriptionStatus,
  updateSubscriptionMetafield,
} from "../models/subscription.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } =
    await authenticate.webhook(request);

  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    throw new Response();
  }

  console.log(`Received webhook for topic: ${topic} from shop: ${shop}`);

  console.log("payload", payload);

  switch (topic) {
    case "APP_UNINSTALLED":
      console.log("app uninstall in progress");
      if (session) {
        await prisma.session.deleteMany({ where: { shop } });
        await prisma.settings.deleteMany({ where: { shopId: shop } });
        await prisma.shopSubscription.deleteMany({ where: { shopId: shop } });
        await prisma.shop.deleteMany({ where: { id: shop } });
        // await prisma.settings.deleteMany({ where: { shop } });
        console.log(`Deleted sessions and settings for shop: ${shop}`);
      }
      console.log("app uninstall complete");
      break;
    case "APP_SUBSCRIPTIONS_UPDATE":
      console.log("\n APP_SUBSCRIPTIONS_UPDATE \n");
      await handleSubscriptionChange(admin, shop, payload);
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};

// Function to handle subscription changes using payload
async function handleSubscriptionChange(admin, shop, payload) {
  try {
    const currentPlan = await getSubscriptionStatus(admin.graphql);

    // Update the subscription plan in your database
    await prisma.shopSubscription.upsert({
      where: { shopId: shop },
      update: { subscription: currentPlan.name },
      create: { shopId: shop, subscription: currentPlan.name },
    });

    // Update the metafield to store the subscription plan
    await updateSubscriptionMetafield(admin.graphql, shop, currentPlan.name);

    console.log(
      `\n\nUpdated subscription and metafield for shop: ${shop} to plan: ${currentPlan}`,
    );
  } catch (error) {
    console.error(
      `\n\nFailed to handle subscription change for shop: ${shop}`,
      error,
    );
    throw new Response("\n\nFailed to handle subscription change", {
      status: 500,
    });
  }
}
