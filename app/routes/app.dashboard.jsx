// app.dashboard.jsx

import { useCallback, useEffect, useState } from "react";
import {
  Page,
  Card,
  Text,
  Box,
  Grid,
  Button,
  ResourceList,
  ResourceItem,
  Avatar,
  Banner,
  Select,
  SkeletonDisplayText,
  SkeletonBodyText,
} from "@shopify/polaris";
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
import { authenticate, BASIC_PLAN, PREMIUM_PLAN } from "../shopify.server";
// import { updateSubscriptionPlan } from "../utils/subscriptionPlan";
import RatingStars from "../components/Home/RatingStars";

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
      plans: [BASIC_PLAN, PREMIUM_PLAN],
      isTest: true,
      onFailure: () => {
        throw new Error("No active plan");
      },
    });

    const subscription = billingCheck.appSubscriptions[0];
    console.log(`Shop is on ${subscription.name} (id ${subscription.id})`);

    console.log("pricing shop name:", shop);

    // await updateSubscriptionPlan(shop, subscription.name);

    return json({ plan: subscription });
  } catch (error) {
    if (error.message === "No active plan") {
      // Update to Free Plan if no active plan
      // await updateSubscriptionPlan(shop, "Free Plan");

      return json({ plan: { name: "Free Plan" } });
    }
    throw error;
  }
}

export default function HomeDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState("allTime");

  const { plan } = useLoaderData();
  const navigate = useNavigate();

  const isAdvancedAnalyticsEnabled = isFeatureEnabled(
    plan.name,
    "Advanced Analytics",
  );

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/stats-dashboard?range=${selectedDateRange}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDateRangeChange = useCallback((value) => {
    setSelectedDateRange(value);
  }, []);

  if (isLoading) {
    return (
      <Page title="Home Dashboard">
        <Card>
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText lines={3} />
        </Card>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Home Dashboard">
        <Banner status="critical">{error}</Banner>
      </Page>
    );
  }

  // Now you can use plan in your component logic
  console.log("Settings,Current billing plan:", plan);

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
    labels: ratingsDistribution.map((rating) =>
      rating.rating == 1 ? `${rating.rating} Star` : `${rating.rating} Stars`,
    ),
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
        <>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
              <Card>
                <Select
                  label="Date Range"
                  options={[
                    { label: "All Time", value: "allTime" },
                    { label: "Last 7 Days", value: "last7Days" },
                    { label: "Last 30 Days", value: "last30Days" },
                    { label: "Last 90 Days", value: "last90Days" },
                  ]}
                  onChange={handleDateRangeChange}
                  value={selectedDateRange}
                />
              </Card>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
              <Card>
                <Text variant="headingMd" as="h2">
                  Average Rating
                </Text>
                <Text variant="headingLg" as="p">
                  {averageRating.toFixed(2)}
                </Text>
                <RatingStars value={Math.round(averageRating)} />
              </Card>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
              <Card>
                <Text variant="headingMd" as="h2">
                  Total Reviews
                </Text>
                <Text variant="headingLg" as="p">
                  {totalReviews}
                </Text>
              </Card>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}>
              {!isAdvancedAnalyticsEnabled ? (
                <UpgradePlanCard header="Reviews Over Time" />
              ) : (
                <Card>
                  <Text variant="headingMd" as="h2">
                    Reviews Over Time
                  </Text>
                  <Box paddingBlockStart="400">
                    <Line data={reviewsOverTimeData} />
                  </Box>
                </Card>
              )}
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
              {!isAdvancedAnalyticsEnabled ? (
                <UpgradePlanCard header="Ratings Distribution" />
              ) : (
                <Card>
                  <Text variant="headingMd" as="h2">
                    Ratings Distribution
                  </Text>
                  <Box paddingBlockStart="400">
                    <Line data={ratingsDistributionData} />
                  </Box>
                </Card>
              )}
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
              {!isAdvancedAnalyticsEnabled ? (
                <UpgradePlanCard header="Sentiment Analysis" />
              ) : (
                <Card>
                  <Text variant="headingMd" as="h2">
                    Sentiment Analysis
                  </Text>
                  <Box paddingBlockStart="400">
                    <Line data={sentimentCountsData} />
                  </Box>
                </Card>
              )}
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
              <Card>
                <Text variant="headingMd" as="h2">
                  Recent Reviews
                </Text>
                <Box paddingBlockStart="400">
                  <ResourceList
                    resourceName={{ singular: "review", plural: "reviews" }}
                    items={recentReviews}
                    renderItem={(review) => (
                      <ResourceItem
                        id={review.id}
                        media={
                          <Avatar
                            customer
                            size="medium"
                            name={`${review.firstName} ${review.lastName}`}
                          />
                        }
                        accessibilityLabel={`Review by ${review.firstName} ${review.lastName}`}
                      >
                        <Text variant="bodyMd" fontWeight="bold" as="h3">
                          {review.firstName} {review.lastName}
                        </Text>
                        <Box paddingBlockStart="100">
                          <RatingStars value={review.rating} />
                        </Box>
                        <Box paddingBlockStart="100">
                          <Text variant="bodyMd" as="p">
                            {review.comment}
                          </Text>
                        </Box>
                        <Box paddingBlockStart="100">
                          <Text variant="bodySm" color="subdued">
                            {new Date(review.createdAt).toLocaleString()}
                          </Text>
                        </Box>
                      </ResourceItem>
                    )}
                  />
                </Box>
              </Card>
            </Grid.Cell>
          </Grid>
        </>
      )}
    </Page>
  );
}
