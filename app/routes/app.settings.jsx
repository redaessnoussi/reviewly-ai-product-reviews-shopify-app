// app.settings.jsx

import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import prisma from "../db.server";
import SettingsForm from "../components/Settings/SettingsForm";
import {
  authenticate,
  BASIC_PLAN,
  PREMIUM_PLAN,
  STANDARD_PLAN,
} from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const billingCheck = await billing.require({
      plans: [BASIC_PLAN, STANDARD_PLAN, PREMIUM_PLAN],
      isTest: true,
      onFailure: () => {
        throw new Error("No active plan");
      },
    });

    const subscription = billingCheck.appSubscriptions[0];
    console.log(`Shop is on ${subscription.name} (id ${subscription.id})`);

    console.log("\n\n pricing shop name:", shop);

    console.log("loader,shop:", shop);

    if (!shop) {
      return json({ error: "Shop parameter is missing" }, { status: 400 });
    }

    const settings = await prisma.settings.findUnique({
      where: { shopId: shop },
    });

    if (!settings) {
      return json({ error: "Settings not found" }, { status: 404 });
    }

    return json({ settings, plan: subscription });
  } catch (error) {
    if (error.message === "No active plan") {
      // Update to Free Plan if no active plan

      const settings = await prisma.settings.findUnique({
        where: { shopId: shop },
      });

      if (!settings) {
        return json({ error: "Settings not found" }, { status: 404 });
      }

      return json({ settings, plan: { name: "Free Plan" } });
    }
    throw error;
  }
};

export const action = async ({ request }) => {
  const auth = await authenticate.admin(request);
  const shop = auth.session.shop;

  if (!shop) {
    return json({ error: "Shop parameter is missing" }, { status: 400 });
  }

  const data = await request.formData();

  const prevSettings = await prisma.settings.findUnique({
    where: { shopId: shop },
  });

  if (!prevSettings) {
    return json({ error: "Settings not found" }, { status: 404 });
  }

  const enableSentimentAnalysis = data.get("enableSentimentAnalysis") === "on";
  const enableAutomatedResponses =
    data.get("enableAutomatedResponses") === "on";
  const allowMedia = data.get("allowMedia") === "on";
  const reviewModeration =
    data.get("reviewModeration") || prevSettings.reviewModeration;

  await prisma.settings.update({
    where: { shopId: shop },
    data: {
      enableSentimentAnalysis,
      enableAutomatedResponses,
      allowMedia,
      reviewModeration,
    },
  });

  return redirect(`/app/settings?shop=${shop}`);
};

export default function Settings() {
  const { settings } = useLoaderData();

  const { plan } = useLoaderData();

  console.log("settings", settings);

  const initialSettings = {
    enableSentimentAnalysis: settings.enableSentimentAnalysis,
    enableAutomatedResponses: settings.enableAutomatedResponses,
    allowMedia: settings.allowMedia,
    reviewModeration: settings.reviewModeration,
  };

  return (
    <SettingsForm initialSettings={initialSettings} billingPlan={plan.name} />
  );
}
