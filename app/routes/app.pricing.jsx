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
  Layout,
  InlineStack,
  Badge,
  Icon,
  List,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { CheckIcon, NoteIcon } from "@shopify/polaris-icons";
import {
  authenticate,
  BASIC_PLAN,
  PREMIUM_PLAN,
  STANDARD_PLAN,
} from "../shopify.server";
import { updateSubscriptionPlan } from "../utils/subscriptionPlan";

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

    await updateSubscriptionPlan(shop, subscription.name);

    return json({ plan: subscription });
  } catch (error) {
    if (error.message === "No active plan") {
      // Update to Free Plan if no active plan

      await updateSubscriptionPlan(shop, "Free Plan");

      return json({ plan: { name: "Free Plan" } });
    }
    throw error;
  }
}

const planData = [
  {
    title: "Free",
    description: "For small stores just getting started",
    price: "0",
    action: "Cancel Plan",
    name: "Free Plan",
    url: "/app/cancel",
    features: [
      "Basic Sentiment Analysis",
      "Manual Responses",
      "No Review Moderation",
      "Basic Analytics",
    ],
  },
  {
    title: "Basic",
    description: "For growing businesses",
    price: "10",
    name: "Basic Plan",
    action: "Upgrade to Basic",
    url: "/app/upgrade?plan=Basic Plan",
    features: [
      "Basic Sentiment Analysis",
      "Manual Responses",
      "No Review Moderation",
      "Basic Analytics",
      "Images or Video",
      "Email Notifications",
    ],
  },
  {
    title: "Standard",
    description: "For established businesses",
    price: "20",
    name: "Standard Plan",
    action: "Upgrade to Standard",
    url: "/app/upgrade?plan=Standard Plan",
    features: [
      "Advanced Sentiment Analysis",
      "Manual Responses",
      "Review Moderation",
      "Basic Analytics",
      "Images or Video",
      "Email Notifications",
      "Automated Responses",
    ],
  },
  {
    title: "Premium",
    description: "For large-scale operations",
    price: "30",
    name: "Premium Plan",
    action: "Upgrade to Premium",
    url: "/app/upgrade?plan=Premium Plan",
    features: [
      "Advanced Sentiment Analysis",
      "Manual Responses",
      "Review Moderation",
      "Advanced Analytics",
      "Images or Video",
      "Email Notifications",
      "Automated Responses",
      "Bulk Actions (Approve/Reject Reviews)",
      "Review Export/Import",
    ],
    popular: true,
  },
];

export default function PricingPage() {
  const { plan } = useLoaderData();

  return (
    <Page
      title="Choose Your Plan"
      subtitle="Select the plan that best fits your business needs"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Your current plan:{" "}
                <Badge tone="success" size="large">
                  {plan.name}
                </Badge>
              </Text>
              <Text>
                {plan.name === "Premium Plan"
                  ? "You're on our top-tier plan. Enjoy all premium features!"
                  : "Upgrade your plan to unlock more powerful features and grow your business."}
              </Text>
              {plan.name !== "Premium Plan" && (
                <Button url="/app/upgrade" primary>
                  Upgrade Now
                </Button>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Grid>
            {planData.map((planItem, index) => (
              <Grid.Cell
                key={index}
                columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}
              >
                <Card
                  background={
                    planItem.name === plan.name
                      ? "bg-surface-secondary"
                      : undefined
                  }
                >
                  <BlockStack gap="400">
                    {planItem.popular && (
                      <Badge tone="attention" size="large">
                        Most Popular
                      </Badge>
                    )}
                    <Text variant="headingLg" as="h3">
                      {planItem.title}
                    </Text>
                    <Text variant="bodySm" color="subdued">
                      {planItem.description}
                    </Text>
                    <Text variant="heading2xl" as="p">
                      ${planItem.price}
                      <Text variant="bodyMd" as="span">
                        /month
                      </Text>
                    </Text>
                    <Button
                      primary={planItem.name !== plan.name}
                      disabled={planItem.name === plan.name}
                      url={planItem.url}
                      fullWidth
                    >
                      {planItem.name === plan.name
                        ? "Current Plan"
                        : planItem.action}
                    </Button>
                    <Box padding="400">
                      {planItem.features.map((feature, featureIndex) => (
                        <ExceptionList
                          key={featureIndex}
                          items={[{ icon: CheckIcon, description: feature }]}
                        />
                      ))}
                    </Box>
                  </BlockStack>
                </Card>
              </Grid.Cell>
            ))}
          </Grid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Need to change your plan?
              </Text>
              <Text>
                If you're considering downgrading or have questions about your
                current plan, our support team is here to help. We can discuss
                your needs and find the best solution.
              </Text>
              <Button url="/app/contact-support" outline>
                Contact Support
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
