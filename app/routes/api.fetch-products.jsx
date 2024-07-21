// app/routes/app._index.server.jsx

import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// GraphQL query to fetch product data
const PRODUCTS_QUERY = `
  query getProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        featuredImage {
          url(transform: { maxWidth: 300, maxHeight: 300, crop: CENTER })
        }
      }
    }
  }
`;

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  // Fetch products with their review counts from Prisma
  const reviews = await prisma.review.groupBy({
    by: ["productId"],
    _count: {
      id: true,
    },
    _avg: {
      rating: true,
    },
    _max: {
      createdAt: true,
    },
    where: { shopId: shop },
  });

  const productIds = reviews.map((review) => review.productId);

  // Fetch product details from Shopify
  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: { ids: productIds.map((id) => `gid://shopify/Product/${id}`) },
  });

  const {
    data: { nodes: products },
  } = await response.json();

  // Fetch sentiment counts
  const sentimentCounts = await prisma.review.groupBy({
    by: ["productId", "sentiment"],
    _count: {
      id: true,
    },
    where: { shopId: shop },
  });

  // Process sentiment counts
  const sentimentData = sentimentCounts.reduce((acc, cur) => {
    const sentiment = cur.sentiment ? cur.sentiment.toLowerCase() : "null";
    if (!acc[cur.productId]) {
      acc[cur.productId] = { positive: 0, negative: 0, neutral: 0 };
    }
    acc[cur.productId][sentiment] += cur._count.id;
    return acc;
  }, {});

  // Add review counts, average rating, last reviewed date, and sentiment distribution to products
  const productsWithReviewData = products.map((product) => {
    const productId = product.id.split("/").pop();
    const reviewData = reviews.find((review) => review.productId === productId);
    const sentiment = sentimentData[productId] || {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    const totalSentiments =
      sentiment.positive + sentiment.negative + sentiment.neutral;

    // console.log("totalSentiments", totalSentiments);

    const sentimentPercentages = {
      positive: (sentiment.positive / totalSentiments) * 100 || 0,
      negative: (sentiment.negative / totalSentiments) * 100 || 0,
      neutral: (sentiment.neutral / totalSentiments) * 100 || 0,
    };

    // console.log("sentimentPercentages", sentimentPercentages);

    const dominantSentiment =
      sentimentPercentages.positive >= 50
        ? "Positive"
        : sentimentPercentages.negative >= 50
          ? "Negative"
          : "Neutral";

    // console.log("dominantSentiment", dominantSentiment);

    return {
      ...product,
      productId,
      reviewCount: reviewData ? reviewData._count.id : 0,
      averageRating: reviewData ? reviewData._avg.rating.toFixed(2) : "N/A",
      lastReviewedDate: reviewData ? reviewData._max.createdAt : "N/A",
      sentimentPercentages,
      dominantSentiment,
    };
  });

  return json({ products: productsWithReviewData });
};
