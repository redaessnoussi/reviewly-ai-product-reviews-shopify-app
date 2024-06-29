// app.jsx

import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { BillingPlanProvider } from "../context/BillingPlanContext";
import { getUserSubscriptionPlan } from "../utils/getUserSubscriptionPlan";
import { isFeatureEnabled } from "../utils/isFeatureEnabled";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const userPlan = await getUserSubscriptionPlan(request);

  return json({ apiKey: process.env.SHOPIFY_API_KEY || "", userPlan });
};

export default function App() {
  const { apiKey, userPlan } = useLoaderData();

  console.log("12 userPlan", userPlan);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <BillingPlanProvider value={userPlan}>
        <NavMenu>
          <Link to="/app" rel="home">
            Home
          </Link>
          <Link to="/app/dashboard">Dashbaord</Link>
          <Link to="/app/manage-reviews">Manage Reviews</Link>
          <Link to="/app/import-export-reviews">Import/Export Reviews</Link>
          <Link to="/app/settings">Settings</Link>
          <Link to="/app/pricing">Pricing</Link>
        </NavMenu>
        <Outlet />
      </BillingPlanProvider>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
