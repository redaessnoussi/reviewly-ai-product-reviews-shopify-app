// api.approve-review.jsx

import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const url = new URL(request.url);
  const id = parseInt(url.searchParams.get("id"));

  if (!id) {
    return json({ error: "Review ID is required" }, { status: 400 });
  }

  await prisma.review.update({
    where: { id },
    data: { approved: true },
  });

  return json({ success: true });
};
