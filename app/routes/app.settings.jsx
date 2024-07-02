// app.settings.jsx

import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
// import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import SettingsForm from "../components/Settings/SettingsForm";
import { useBillingPlan } from "../context/BillingPlanContext";

export const loader = async ({ request }) => {
  const settings = await prisma.settings.findFirst({ where: { id: 1 } });

  return json({ settings });
};

export const action = async ({ request }) => {
  const data = await request.formData();

  const prevSettings = await prisma.settings.findFirst({
    where: { id: 1 },
  });

  const enableSentimentAnalysis = data.get("enableSentimentAnalysis") === "on";
  const enableAutomatedResponses =
    data.get("enableAutomatedResponses") === "on";
  const allowMedia = data.get("allowMedia") === "on";
  const reviewModeration =
    data.get("reviewModeration") || prevSettings.reviewModeration;

  await prisma.settings.update({
    where: { id: 1 },
    data: {
      enableSentimentAnalysis,
      enableAutomatedResponses,
      allowMedia,
      reviewModeration,
    },
  });

  return redirect("/app/settings");
};

export default function Settings() {
  const { settings } = useLoaderData();

  const billingPlan = useBillingPlan();

  // Now you can use billingPlan in your component logic
  console.log("Settings,Current billing plan:", billingPlan);

  const initialSettings = {
    enableSentimentAnalysis: settings.enableSentimentAnalysis,
    enableAutomatedResponses: settings.enableAutomatedResponses,
    allowMedia: settings.allowMedia,
    reviewModeration: settings.reviewModeration,
  };

  return (
    <SettingsForm initialSettings={initialSettings} billingPlan={billingPlan} />
  );
}
