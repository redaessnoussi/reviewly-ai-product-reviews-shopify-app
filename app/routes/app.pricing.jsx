import {
  Page,
  Box,
  Button,
  Card,
  CalloutCard,
  Text,
  Grid,
  Divider,
  BlockStack,
  ExceptionList,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NoteIcon } from "@shopify/polaris-icons";
import {
  authenticate,
  BASIC_PLAN,
  PREMIUM_PLAN,
  STANDARD_PLAN,
} from "../shopify.server";

export async function loader({ request }) {
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

    return json({ plan: subscription });
  } catch (error) {
    if (error.message === "No active plan") {
      // Update to Free Plan if no active plan

      return json({ plan: { name: "Free Plan" } });
    }
    throw error;
  }
}

const planData = [
  {
    title: "Free Plan",
    description: "Free plan with basic features",
    price: "0",
    action: "Upgrade to Pro",
    name: "Free Plan",
    url: "/app/upgrade",
    features: [
      "Basic Sentiment Analysis",
      "Manual Responses",
      "No Review Moderation",
      "Basic Analytics",
    ],
  },
  {
    title: "Basic",
    description: "Basic plan with advanced features",
    price: "10",
    name: "Basic Plan",
    action: "Upgrade to Basic",
    url: "/app/upgrade?plan=Basic Plan",
    features: [
      "Advanced Sentiment Analysis",
      "Manual Responses",
      "Basic Analytics",
      "Email Notifications",
    ],
  },
  {
    title: "Standard",
    description: "Standard plan with more features",
    price: "20",
    name: "Standard Plan",
    action: "Upgrade to Standard",
    url: "/app/upgrade?plan=Standard Plan",
    features: [
      "Advanced Sentiment Analysis",
      "Manual Responses",
      "Basic Analytics",
      "Email Notifications",
      "Automated Responses",
      "Images or Video",
      "Review Moderation",
    ],
  },
  {
    title: "Premium",
    description: "Premium plan with all features",
    price: "30",
    name: "Premium Plan",
    action: "Upgrade to Premium",
    url: "/app/upgrade?plan=Premium Plan",
    features: [
      "Advanced Sentiment Analysis",
      "Manual Responses",
      "Basic Analytics",
      "Email Notifications",
      "Automated Responses",
      "Images or Video",
      "Review Moderation",
      "Bulk Actions",
      "Advanced Analytics",
      "Review Export/Import",
    ],
  },
];

export default function PricingPage() {
  const { plan } = useLoaderData();

  console.log("plan : ", plan);

  return (
    <Page title="Pricing">
      <CalloutCard
        title="Change your plan"
        illustration="https://cdn.shopify.com/s/files/1/0583/6465/7734/files/tag.png?v=1705280535"
        primaryAction={{
          content: "Cancel Plan",
          url: "/app/cancel",
        }}
      >
        {plan.name === "Premium Plan" ? (
          <Text>
            You're currently on the Premium plan. All features are unlocked.
          </Text>
        ) : (
          <Text>
            You're currently on the {plan.name}. Upgrade to unlock more
            features.
          </Text>
        )}
      </CalloutCard>

      <Divider />

      <Grid>
        {planData.map((plan_item, index) => (
          <Grid.Cell
            key={index}
            columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
          >
            <Card
              background={
                plan_item.name === plan.name
                  ? "bg-surface-success"
                  : "bg-surface"
              }
              sectioned
            >
              <Box padding="400">
                <Text as="h3" variant="headingMd">
                  {plan_item.title}
                </Text>
                <Box as="div" variant="bodyMd">
                  <Text as="p">{plan_item.description}</Text>
                  <br />
                  <Text as="p" variant="headingLg" fontWeight="bold">
                    {plan_item.price === "0" ? "" : "$" + plan_item.price}
                  </Text>
                </Box>
                <Divider />
                <BlockStack gap={100}>
                  {plan_item.features.map((feature, index) => (
                    <ExceptionList
                      key={index}
                      items={[{ icon: NoteIcon, description: feature }]}
                    />
                  ))}
                </BlockStack>
                <Divider />
                {plan_item.name !== plan.name ? (
                  <Button primary url={plan_item.url}>
                    {plan_item.action}
                  </Button>
                ) : (
                  <Text as="p" variant="bodyMd">
                    You're currently on this plan
                  </Text>
                )}
              </Box>
            </Card>
          </Grid.Cell>
        ))}
      </Grid>
    </Page>
  );
}
