import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shopName = url.searchParams.get("shopName");

  if (!shopName) {
    return json({ error: "Shop name ID is required" }, { status: 400 });
  }

  const settings = await prisma.settings.findFirst({
    where: { shopId: shopName },
  });

  console.log("settings", settings);

  if (!settings) {
    return json({ error: "Settings not found" }, { status: 404 });
  }

  return json(settings);
};
