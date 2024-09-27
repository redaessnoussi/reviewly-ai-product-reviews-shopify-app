import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-04";
import prisma from "./db.server";
import {
  ensureShopRecord,
  updateSubscriptionPlan,
} from "./models/subscription.server";
import { ensureDefaultSettings } from "./models/settings.server";

export const BASIC_PLAN = "Basic Plan";
export const PREMIUM_PLAN = "Premium Plan";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.April24,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: true,
  restResources,
  billing: {
    [BASIC_PLAN]: {
      amount: 19,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days,
    },
    [PREMIUM_PLAN]: {
      amount: 29,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days,
    },
  },
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    APP_SUBSCRIPTIONS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      // Register webhooks
      shopify.registerWebhooks({ session });

      // Seeding logic
      const shop = session.shop;
      console.log("Seeding app with default settings for shop:", shop);

      try {
        // Ensure the shop record exists
        await ensureShopRecord(shop);

        // Seed default subscription plan
        const defaultSubscription = "Free Plan";
        await updateSubscriptionPlan(shop, defaultSubscription);

        // Seed default settings
        await ensureDefaultSettings(shop); // Add this line

        console.log("Seeding completed successfully.");
      } catch (error) {
        console.error("Error during data seeding:", error);
      }
    },
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
    v3_lineItemBilling: true,
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.April24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
