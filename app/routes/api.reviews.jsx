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
  const shopName = url.searchParams.get("shopName");

  if (!productId || !shopName) {
    return json(
      { error: "Product ID and Shop ID is required" },
      { status: 400 },
    );
  }

  const reviews = await prisma.review.findMany({
    where: { productId, shopId: shopName, approved: true },
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
  const {
    productId,
    comment,
    firstName,
    lastName,
    customerEmail,
    rating,
    shopName,
    productTitle,
  } = data;

  if (
    !productId ||
    !comment ||
    !firstName ||
    !customerEmail ||
    rating == null ||
    !shopName
  ) {
    return json(
      {
        error:
          "Shop name, Product ID, comment, first name, email, and rating are required",
      },
      { status: 400 },
    );
  }

  // Check if the product exists
  let product = await prisma.product.findUnique({ where: { productId } });

  // If the product does not exist, create it
  if (!product) {
    product = await prisma.product.create({
      data: {
        productId,
        title: productTitle || "Default Product Title",
        shopId: shopName, // Assuming shopName is used as shopId
      },
    });
  }

  // Fetch settings
  const settings = await prisma.settings.findFirst({
    where: { shopId: shopName },
  });
  if (!settings) {
    return json({ error: "Settings not found for the shop" }, { status: 404 });
  }

  let subscriptionPlan = await getSubscriptionPlan(shopName);

  console.log("Current Subscription plan: ", subscriptionPlan);
  if (
    !settings.allowMedia ||
    !isFeatureEnabled(subscriptionPlan, "Images or Video")
  ) {
    formData.delete("image");
    formData.delete("video");
  }

  // Handle media
  const { imageUrl, videoUrl } = await handleMedia(
    formData,
    settings,
    storage,
    subscriptionPlan,
  );

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
        shopId: shopName, // Ensure shopId is set
        comment,
        createdAt: new Date(),
        firstName,
        lastName,
        email: customerEmail,
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

    if (isEmailNotificationEnabled && settings.notificationEmail) {
      await sendEmail({
        to: settings.notificationEmail, // Replace with the admin's email address
        subject: "New Product Review Submitted",
        productId: productId,
        firstName: firstName,
        lastName: lastName,
        customerEmail, // Include the email in the notification if necessary
        rating: rating,
        comment: comment,
      });
    }

    return json(review);
  } catch (error) {
    console.error("Error processing review:", error);
    return json(
      { error: "An error occurred while processing the review" },
      { status: 500 },
    );
  }
};
