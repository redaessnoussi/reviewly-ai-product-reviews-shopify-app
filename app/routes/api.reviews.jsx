// api.reviews.jsx

import { json } from "@remix-run/node";
import prisma from "../db.server";
import sendEmail from "../utils/sendEmails";
import { getSubscriptionPlan } from "../utils/subscriptionPlan";
import { isFeatureEnabled } from "../utils/isFeatureEnabled";
import { handleMedia } from "../utils/handleMedia";
import { storage } from "../firebase/firebaseConfig";
import { handleSentimentAnalysis } from "../utils/handleSentimentAnalysis";
import { handleAIResponse } from "../utils/handleAIResponse";
import { handleReviewModeration } from "../utils/handleReviewModeration";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return json({ error: "Product ID is required" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId, approved: true },
    orderBy: { createdAt: "desc" }, // Order by createdAt in descending order
    include: {
      adminReplies: true, // Include admin replies in the fetched reviews
    },
  });

  return json(reviews);
};

export const action = async ({ request }) => {
  const formData = await request.formData();

  const data = Object.fromEntries(formData);
  const { productId, comment, firstName, lastName, rating, shopName } = data;

  if (!productId || !comment || !firstName || rating == null) {
    return json(
      { error: "Product ID, comment, first name, and rating are required" },
      { status: 400 },
    );
  }

  // Fetch settings
  const settings = await prisma.settings.findFirst({ where: { id: 1 } });

  let subscriptionPlan = await getSubscriptionPlan(shopName);

  console.log("Current Subscription plan: ", subscriptionPlan);

  if (!settings.allowMedia) {
    formData.delete("image");
    formData.delete("video");
  }

  // Handle media
  const { imageUrl, videoUrl } = await handleMedia(formData, settings, storage);

  // Handle sentiment analysis
  const sentiment = await handleSentimentAnalysis(
    comment,
    rating,
    settings,
    subscriptionPlan,
  );

  // Handle AI response
  const aiResponse = await handleAIResponse(
    comment,
    settings,
    subscriptionPlan,
  );

  // Handle review moderation
  const approved = handleReviewModeration(
    settings,
    sentiment,
    subscriptionPlan,
  );

  try {
    const review = await prisma.review.create({
      data: {
        productId,
        comment,
        createdAt: new Date(),
        firstName,
        lastName,
        rating: parseFloat(rating),
        sentiment,
        AiResponse: aiResponse,
        imageUrl,
        videoUrl,
        approved,
      },
    });

    // Send email notification to admin
    const isEmailNotificationEnabled = isFeatureEnabled(
      subscriptionPlan,
      "Email Notifications",
    );

    if (isEmailNotificationEnabled) {
      await sendEmail({
        to: "redavan95@gmail.com", // Replace with the admin's email address
        subject: "New Product Review Submitted",
        productId: productId,
        firstName: firstName,
        lastName: lastName,
        rating: rating,
        comment: comment,
      });
    }

    console.log("ha howa:", review);

    return json(review);
  } catch (error) {
    console.error("Error processing review:", error);
    return json(
      { error: "An error occurred while processing the review" },
      { status: 500 },
    );
  }
};
