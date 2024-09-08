// api.bulk-actions.jsx

import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { actionType, reviewIds } = await request.json();
  const { shop } = session;

  console.log("api.bulk-actions.jsx shopName", shop);

  if (!actionType || !reviewIds || !Array.isArray(reviewIds) || !shop) {
    return json({ error: "Invalid request" }, { status: 400 });
  }

  const conditions = { id: { in: reviewIds }, shopId: shop };

  let updatedReviews = [];
  let message = "";

  try {
    if (actionType === "approve") {
      await prisma.review.updateMany({
        where: conditions,
        data: { approved: true },
      });
      updatedReviews = await prisma.review.findMany({
        where: conditions,
        select: { id: true, approved: true },
      });
      message = "Reviews approved successfully";
    } else if (actionType === "reject") {
      await prisma.review.updateMany({
        where: conditions,
        data: { approved: false },
      });
      updatedReviews = await prisma.review.findMany({
        where: conditions,
        select: { id: true, approved: true },
      });
      message = "Reviews rejected successfully";
    } else if (actionType === "delete") {
      await prisma.review.deleteMany({
        where: conditions,
      });
      updatedReviews = reviewIds.map((id) => ({ id, deleted: true }));
      message = "Reviews deleted successfully";
    } else {
      return json({ error: "Unknown action type" }, { status: 400 });
    }

    return json({
      success: true,
      message,
      actionType,
      updatedReviews,
    });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return json({ error: "Failed to perform action" }, { status: 500 });
  }
};
