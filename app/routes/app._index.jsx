// app._index.jsx

import { useEffect, useState } from "react";
import { Page, Card, Text, Box, Grid } from "@shopify/polaris";
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
import { MONTHLY_PLAN, authenticate } from "../shopify.server";

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

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: [MONTHLY_PLAN],
    isTest: true,
  });
  console.log("hasActivePayment", hasActivePayment);
  console.log("appSubscriptions", appSubscriptions);

  return null;
};

export default function Index() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch("/api/stats-dashboard");
      const data = await response.json();
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

  return (
    <Page title="Home Dashboard">
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

        <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
          <Card roundedAbove="sm">
            <Text as="h2" variant="headingSm">
              Reviews Over Time
            </Text>
            <Box paddingBlockStart="200">
              <Line data={reviewsOverTimeData} />
            </Box>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
          <Card roundedAbove="sm">
            <Text as="h2" variant="headingSm">
              Ratings Distribution
            </Text>
            <Box paddingBlockStart="200">
              <Line data={ratingsDistributionData} />
            </Box>
          </Card>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
          <Card roundedAbove="sm">
            <Text as="h2" variant="headingSm">
              Sentiment Analysis
            </Text>
            <Box paddingBlockStart="200">
              <Line data={sentimentCountsData} />
            </Box>
          </Card>
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
    </Page>
  );
}
