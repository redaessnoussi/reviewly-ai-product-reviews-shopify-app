// api.dashboard-stats.jsx

import { json } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const totalReviews = await prisma.review.count({ where: { shopId: shop } });
  const averageRating = await prisma.review.aggregate({
    _avg: {
      rating: true,
    },
    where: { shopId: shop },
  });
  const reviewsByTime = await prisma.review.groupBy({
    by: ["createdAt"],
    _count: {
      _all: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    where: { shopId: shop },
  });

  const aggregatedReviews = reviewsByTime.reduce((acc, review) => {
    const date = new Date(review.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += review._count._all;
    return acc;
  }, {});

  const reviewsOverTime = Object.keys(aggregatedReviews).map((date) => ({
    date,
    count: aggregatedReviews[date],
  }));

  const ratingsDistribution = await prisma.review.groupBy({
    by: ["rating"],
    _count: {
      id: true,
    },
    where: { shopId: shop },
  });
  const sentimentCounts = await prisma.review.groupBy({
    by: ["sentiment"],
    _count: {
      id: true,
    },
    where: { shopId: shop },
  });
  const recentReviews = await prisma.review.findMany({
    where: { shopId: shop },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return json({
    totalReviews,
    averageRating: averageRating._avg.rating,
    reviewsOverTime,
    ratingsDistribution,
    sentimentCounts,
    recentReviews,
  });
};
