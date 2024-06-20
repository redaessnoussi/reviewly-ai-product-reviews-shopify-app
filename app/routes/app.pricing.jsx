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
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";
import { NoteIcon } from "@shopify/polaris-icons";

export async function loader({ request }) {
  const { billing } = await authenticate.admin(request);

  try {
    const billingCheck = await billing.require({
      plans: [MONTHLY_PLAN, ANNUAL_PLAN],
      isTest: true,
      onFailure: () => {
        throw new Error("No active plan");
      },
    });

    const subscription = billingCheck.appSubscriptions[0];
    console.log(`Shop is on ${subscription.name} (id ${subscription.id})`);

    return json({ billing, plan: subscription });
  } catch (error) {
    if (error.message === "No active plan") {
      return json({ billing, plan: { name: "Free" } });
    }
    throw error;
  }
}

const planData = [
  {
    title: "Free",
    description: "Free plan with basic features",
    price: "0",
    action: "Upgrade to Pro",
    name: "Free",
    url: "/app/upgrade",
    features: ["Feature 1", "Feature 2", "Feature 3"],
  },
  {
    title: "Pro",
    description: "Pro plan with advanced features",
    price: "20",
    name: "Monthly subscription",
    action: "Upgrade to Pro",
    url: "/app/upgrade",
    features: ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  },
];

export default function PricingPage() {
  const { plan } = useLoaderData();

  console.log("plan :", plan);

  return (
    <Page>
      <CalloutCard
        title="Change your plan"
        illustration="https://cdn.shopify.com/s/files/1/0583/6465/7734/files/tag.png?v=1705280535"
        primaryAction={{
          content: "Cancel Plan",
          url: "/app/cancel",
        }}
      >
        {plan.name === "Monthly subscription" ? (
          <Text>
            You're currently on the Pro plan. All features are unlocked.
          </Text>
        ) : (
          <Text>
            You're currently on the Free plan. Upgrade to Pro to unlock more
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
                <Box as="p" variant="bodyMd">
                  {plan_item.description}
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
                {plan_item.name === "Monthly subscription" &&
                plan.name !== "Monthly subscription" ? (
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
