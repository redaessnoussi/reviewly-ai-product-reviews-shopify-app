import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const url = new URL(request.url);
  const id = parseInt(url.searchParams.get("id"));

  if (!id) {
    return json({ error: "Review ID is required" }, { status: 400 });
  }

  await prisma.review.delete({
    where: { id },
  });

  return json({ success: true });
};
