import { json } from "@remix-run/node";
import prisma from "../db.server";
// import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  //   await authenticate.admin(request);

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return json({ error: "Product ID is required" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId, approved: true },
    select: { rating: true },
  });

  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return json({ error: "No reviews found for this product" });
  }

  const ratingsCount = [0, 0, 0, 0, 0];

  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingsCount[5 - review.rating]++;
    }
  });

  const ratingsDistribution = ratingsCount.map((count) => ({
    count,
    percentage: ((count / totalReviews) * 100).toFixed(0),
  }));

  return json({ totalReviews, ratingsDistribution });
};
