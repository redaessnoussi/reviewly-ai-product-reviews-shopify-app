// api.dashboard-stats.jsx

import { json } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "allTime";

  // Function to get the start date based on the range
  const getStartDate = (range) => {
    const now = new Date();
    switch (range) {
      case "last7Days":
        return new Date(now.setDate(now.getDate() - 7));
      case "last30Days":
        return new Date(now.setDate(now.getDate() - 30));
      case "last90Days":
        return new Date(now.setDate(now.getDate() - 90));
      default:
        return null; // All time
    }
  };

  const startDate = getStartDate(range);

  const whereClause = {
    shopId: shop,
    ...(startDate && { createdAt: { gte: startDate } }),
  };

  const totalReviews = await prisma.review.count({ where: whereClause });
  const averageRating = await prisma.review.aggregate({
    _avg: {
      rating: true,
    },
    where: whereClause,
  });

  const reviewsOverTime = await prisma.review.groupBy({
    by: ["createdAt"],
    _count: { _all: true },
    where: whereClause,
    orderBy: { createdAt: "asc" },
  });

  const ratingsDistribution = await prisma.review.groupBy({
    by: ["rating"],
    _count: { id: true },
    where: whereClause,
  });

  const sentimentCounts = await prisma.review.groupBy({
    by: ["sentiment"],
    _count: { id: true },
    where: whereClause,
  });

  const recentReviews = await prisma.review.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Process reviewsOverTime to aggregate by date
  const aggregatedReviews = reviewsOverTime.reduce((acc, review) => {
    const date = new Date(review.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + review._count._all;
    return acc;
  }, {});

  const processedReviewsOverTime = Object.entries(aggregatedReviews).map(
    ([date, count]) => ({ date, count }),
  );

  return json({
    totalReviews,
    averageRating: averageRating._avg.rating,
    reviewsOverTime: processedReviewsOverTime,
    ratingsDistribution,
    sentimentCounts,
    recentReviews,
  });
};
