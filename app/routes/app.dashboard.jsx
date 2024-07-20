// app.dashboard.jsx

import { useEffect, useState } from "react";
import { Page, Card, Text, Box, Grid, Button } from "@shopify/polaris";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { json, useLoaderData, useNavigate } from "@remix-run/react";
import { isFeatureEnabled } from "../utils/isFeatureEnabled";
import {
  authenticate,
  BASIC_PLAN,
  PREMIUM_PLAN,
  STANDARD_PLAN,
} from "../shopify.server";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
);

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

    console.log("pricing shop name:", shop);

    return json({ plan: subscription });
  } catch (error) {
    if (error.message === "No active plan") {
      // Update to Free Plan if no active plan

      return json({ plan: { name: "Free Plan" } });
    }
    throw error;
  }
}

export default function HomeDashboard() {
  const [stats, setStats] = useState(null);

  const { plan } = useLoaderData();

  console.log("plan", plan);

  // const plan = useplan();
  const navigate = useNavigate();

  const isAdvancedAnalyticsEnabled = isFeatureEnabled(
    plan.name,
    "Advanced Analytics",
  );

  // Now you can use plan in your component logic
  console.log("Settings,Current billing plan:", plan);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch("/api/stats-dashboard");
      const data = await response.json();
      console.log("stats", data);
      setStats(data);
    };

    fetchStats();
  }, []);

  if (!stats) {
    return (
      <Page title="Home Dashboard">
        <Text>Loading...</Text>
      </Page>
    );
  }

  const {
    totalReviews,
    averageRating,
    reviewsOverTime,
    ratingsDistribution,
    sentimentCounts,
    recentReviews,
  } = stats;

  // console.log("reviewsOverTime ==>", reviewsOverTime);

  const reviewsOverTimeData = {
    labels: reviewsOverTime.map((review) => review.date),
    datasets: [
      {
        label: "Reviews Over Time",
        data: reviewsOverTime.map((review) => review.count),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
    ],
  };

  const ratingsDistributionData = {
    labels: ratingsDistribution.map((rating) => `Rating ${rating.rating}`),
    datasets: [
      {
        label: "Ratings Distribution",
        data: ratingsDistribution.map((rating) => rating._count.id),
        backgroundColor: ["rgba(75, 192, 192, 1)"],
        borderColor: ["rgba(75, 192, 192, 1)"],
        borderWidth: 2,
      },
    ],
  };

  const sentimentCountsData = {
    labels: sentimentCounts.map((sentiment) =>
      sentiment.sentiment ? sentiment.sentiment.toUpperCase() : "NULL",
    ),
    datasets: [
      {
        label: "Sentiment Counts",
        data: sentimentCounts.map((sentiment) => sentiment._count.id),
        backgroundColor: ["rgba(75, 192, 192, 1)"],
        borderColor: ["rgba(75, 192, 192, 1)"],
        borderWidth: 2,
      },
    ],
  };

  const UpgradePlanCard = ({ header }) => (
    <Card roundedAbove="sm">
      <Text as="h2" variant="headingSm">
        {header}
      </Text>
      <Box paddingBlockStart="200">
        <Text as="p" variant="bodyMd">
          Upgrade for Advanced Analytics: Unlock detailed analytics and more
          features by upgrading your plan.
        </Text>
        <Button onClick={() => navigate("/app/pricing")}>Upgrade Now</Button>
      </Box>
    </Card>
  );

  return (
    <Page title="Home Dashboard">
      {stats.totalReviews == 0 ? (
        <Text>There is no reviews</Text>
      ) : (
        <Grid gap="400">
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
            <Card roundedAbove="sm">
              <Text as="h2" variant="headingSm">
                Total Reviews
              </Text>
              <Box paddingBlockStart="200">
                <Text as="p" variant="bodyMd">
                  {totalReviews}
                </Text>
              </Box>
            </Card>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
            <Card roundedAbove="sm">
              <Text as="h2" variant="headingSm">
                Average Rating
              </Text>
              <Box paddingBlockStart="200">
                <Text as="p" variant="bodyMd">
                  {averageRating.toFixed(2)}
                </Text>
              </Box>
            </Card>
          </Grid.Cell>

          {/* Reviews over time for premium plan */}
          <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
            {!isAdvancedAnalyticsEnabled ? (
              <UpgradePlanCard header="Reviews Over Time" />
            ) : (
              <Card roundedAbove="sm">
                <Text as="h2" variant="headingSm">
                  Reviews Over Time
                </Text>
                <Box paddingBlockStart="200">
                  <Line data={reviewsOverTimeData} />
                </Box>
              </Card>
            )}
          </Grid.Cell>

          {/* Ratings distribution for premium plan */}
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
            {!isAdvancedAnalyticsEnabled ? (
              <UpgradePlanCard header="Ratings Distribution" />
            ) : (
              <Card roundedAbove="sm">
                <Text as="h2" variant="headingSm">
                  Ratings Distribution
                </Text>
                <Box paddingBlockStart="200">
                  <Line data={ratingsDistributionData} />
                </Box>
              </Card>
            )}
          </Grid.Cell>

          {/* Sentiment counts for premium plan */}
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
            {!isAdvancedAnalyticsEnabled ? (
              <UpgradePlanCard header="Sentiment Analysis" />
            ) : (
              <Card roundedAbove="sm">
                <Text as="h2" variant="headingSm">
                  Sentiment Analysis
                </Text>
                <Box paddingBlockStart="200">
                  <Line data={sentimentCountsData} />
                </Box>
              </Card>
            )}
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
            <Card roundedAbove="sm">
              <Text as="h2" variant="headingSm">
                Recent Reviews
              </Text>
              <Box paddingBlockStart="200">
                {recentReviews.map((review) => (
                  <Text key={review.id}>
                    {review.comment} -{" "}
                    {new Date(review.createdAt).toLocaleString()}
                  </Text>
                ))}
              </Box>
            </Card>
          </Grid.Cell>
        </Grid>
      )}
    </Page>
  );
}
