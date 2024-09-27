// app/models/settings.server.js

import prisma from "../db.server";

export async function ensureDefaultSettings(shop) {
  const existingSettings = await prisma.settings.findUnique({
    where: { shopId: shop },
  });

  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        shopId: shop,
        enableSentimentAnalysis: false,
        enableAutomatedResponses: false,
        allowMedia: true,
        reviewModeration: "none",
        notificationEmail: null,
      },
    });
    console.log(`Default settings created for shop: ${shop}`);
  } else {
    console.log(`Settings already exist for shop: ${shop}`);
  }
}
