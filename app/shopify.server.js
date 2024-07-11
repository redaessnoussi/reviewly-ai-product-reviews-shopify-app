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
import { seedSubscriptionPlans } from "./utils/subscriptionPlan";

export const BASIC_PLAN = "Basic Plan";
export const STANDARD_PLAN = "Standard Plan";
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
  // billing for free and paid plans: https://shopify.dev/docs/api/shopify-app-remix/v2/apis/billing
  billing: {
    [BASIC_PLAN]: {
      amount: 10,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days,
    },
    [STANDARD_PLAN]: {
      amount: 20,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days,
    },
    [PREMIUM_PLAN]: {
      amount: 30,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days,
    },
  },
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },

  hooks: {
    afterAuth: async ({ session }) => {
      console.log("App installed, initializing settings...");
      const shop = session.shop;

      console.log("Seeding initial subscription plans...");

      // Check if a subscription plan already exists for the shop
      // const existingSubscription = await prisma.shopSubscription.findUnique({
      //   where: { shop },
      // });

      // Seed initial subscription plans if not exist
      // if (!existingSubscription) {
      //   console.log("no subscription exists");
      //   const initialPlans = [{ shop, subscription: "Free Plan" }];
      //   await seedSubscriptionPlans(initialPlans);
      // } else {
      //   console.log(
      //     "subscription already exists:",
      //     existingSubscription.subscription,
      //   );
      // }

      // Check if settings already exist
      const existingSettings = await prisma.settings.findUnique({
        where: { shop },
      });

      // If settings do not exist, create them with default values
      if (!existingSettings) {
        await prisma.settings.create({
          data: {
            shop,
            enableSentimentAnalysis: false,
            enableAutomatedResponses: false,
            allowMedia: true,
          },
        });
        console.log(`Default settings created for shop: ${shop}`);
      } else {
        console.log(`Settings already exist for shop: ${shop}`);
      }

      // Register webhooks
      await registerWebhooks({ session });
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
