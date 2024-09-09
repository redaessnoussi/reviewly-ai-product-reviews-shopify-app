// app/routes/api.delete-ai-reply.jsx

import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { reviewId } = await request.json();

  if (!reviewId) {
    return json({ error: "Review ID is required" }, { status: 400 });
  }

  try {
    const updatedReview = await prisma.review.update({
      where: { id: parseInt(reviewId, 10) },
      data: { AiResponse: null },
    });

    return json({
      success: true,
      message: "AI response deleted successfully",
      reviewId: updatedReview.id,
      aiResponseDeleted: true,
    });
  } catch (error) {
    console.error("Error deleting AI response:", error);
    return json({ error: "Failed to delete AI response" }, { status: 500 });
  }
};
