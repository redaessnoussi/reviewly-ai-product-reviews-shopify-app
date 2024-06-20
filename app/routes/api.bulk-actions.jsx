// api.bulk-actions.jsx

import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { actionType, reviewIds } = await request.json();

  if (!actionType || !reviewIds || !Array.isArray(reviewIds)) {
    return json({ error: "Invalid request" }, { status: 400 });
  }

  if (actionType === "approve") {
    await prisma.review.updateMany({
      where: { id: { in: reviewIds } },
      data: { approved: true },
    });
  } else if (actionType === "reject") {
    await prisma.review.updateMany({
      where: { id: { in: reviewIds } },
      data: { approved: false },
    });
  } else if (actionType === "delete") {
    await prisma.review.deleteMany({
      where: { id: { in: reviewIds } },
    });
  } else {
    return json({ error: "Unknown action type" }, { status: 400 });
  }

  return json({ success: true });
};
