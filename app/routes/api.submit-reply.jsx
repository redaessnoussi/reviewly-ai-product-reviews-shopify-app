// api.submit-reply.jsx

import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  // const { session } = await authenticate.admin(request);
  const { reviewId, content, parentId, type } = await request.json();

  if (!reviewId || !content || !type) {
    return json(
      { error: "Review ID, content, and type are required" },
      { status: 400 },
    );
  }

  try {
    const newReply = await prisma.reply.create({
      data: {
        reviewId: parseInt(reviewId, 10),
        content,
        type,
        parentId: parentId ? parseInt(parentId, 10) : null,
      },
    });

    // Fetch the updated review with all replies
    const updatedReview = await prisma.review.findUnique({
      where: { id: parseInt(reviewId, 10) },
      include: {
        replies: {
          include: {
            children: true,
          },
        },
      },
    });

    return json({ newReply, updatedReview });
  } catch (error) {
    console.error("Error creating reply:", error);
    return json({ error: "Failed to create reply" }, { status: 500 });
  }
};

// Helper function to nest replies
function nestReplies(replies) {
  const replyMap = new Map();
  const rootReplies = [];

  replies.forEach((reply) => {
    replyMap.set(reply.id, { ...reply, children: [] });
  });

  replyMap.forEach((reply) => {
    if (reply.parentId) {
      const parent = replyMap.get(reply.parentId);
      if (parent) {
        parent.children.push(reply);
      }
    } else {
      rootReplies.push(reply);
    }
  });

  return rootReplies;
}

// Optionally, you can add a loader function to fetch replies for a specific review
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const reviewId = url.searchParams.get("reviewId");

  if (!reviewId) {
    return json({ error: "Review ID is required" }, { status: 400 });
  }

  try {
    const replies = await prisma.reply.findMany({
      where: { reviewId: parseInt(reviewId, 10) },
      orderBy: { createdAt: "asc" },
    });

    const nestedReplies = nestReplies(replies);

    return json({ replies: nestedReplies });
  } catch (error) {
    console.error("Error fetching replies:", error);
    return json({ error: "Failed to fetch replies" }, { status: 500 });
  }
};
