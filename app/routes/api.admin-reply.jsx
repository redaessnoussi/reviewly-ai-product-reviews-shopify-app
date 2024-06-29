// api.admin-reply.jsx

import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { reviewId, reply } = await request.json();

  if (!reviewId || !reply) {
    return json({ error: "Review ID and reply are required" }, { status: 400 });
  }

  try {
    const newReply = await prisma.adminReply.create({
      data: {
        reviewId: parseInt(reviewId, 10),
        reply,
      },
    });

    return json(newReply);
  } catch (error) {
    console.error("Error creating admin reply:", error);
    return json({ error: "Failed to create admin reply" }, { status: 500 });
  }
};
