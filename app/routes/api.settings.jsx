import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const settings = await prisma.settings.findFirst({ where: { id: 1 } });

  if (!settings) {
    return json({ error: "Settings not found" }, { status: 404 });
  }

  return json(settings);
};
