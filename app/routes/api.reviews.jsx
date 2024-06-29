// api.reviews.jsx

import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import OpenAI from "openai";
import { setupFirebase } from "../firebaseConfig";
import { getDownloadURL, ref, uploadBytes } from "@firebase/storage";
import sendEmail from "../utils/sendEmails";
import { getSubscriptionPlan } from "../utils/subscriptionPlan";

async function analyzeSentiment(text, retries = 3, delay = 1000) {
  const url =
    "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english";
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DISTILBERT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Failed to analyze sentiment: ${response.statusText}`);
      }

      const data = await response.json();

      // Find the label with the highest score
      const highestScoreLabel = data[0].reduce((prev, current) => {
        return prev.score > current.score ? prev : current;
      }).label;

      return highestScoreLabel;
    } catch (error) {
      if (attempt < retries) {
        console.warn(`Attempt ${attempt} failed. Retrying in ${delay} ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        console.error("All attempts to analyze sentiment failed.");
        throw error;
      }
    }
  }
}

async function uploadFile(file, folder, storage) {
  const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  // console.log("url :", url);
  return url;
}

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.GPT_TURBO_API_KEY,
});

async function generateAIResponse(review) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Generate a response for the following review:\n\n"${review}"`,
        },
      ],
      stream: false, // Set to true if you want to handle streaming
    });

    const aiResponse = response.choices[0].message.content.trim();
    return aiResponse;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Thank you for your review!";
  }
}

function getSentimentFromRating(rating) {
  if (rating >= 4) {
    return "POSITIVE";
  } else if (rating >= 2) {
    return "NEUTRAL";
  } else {
    return "NEGATIVE";
  }
}

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

  // console.log("productId: ", productId);
  // console.log("comment: ", comment);

  if (!productId || !comment || !firstName || rating == null) {
    return json(
      { error: "Product ID, comment, first name, and rating are required" },
      { status: 400 },
    );
  }

  // Fetch settings
  const settings = await prisma.settings.findFirst({ where: { id: 1 } });

  if (!settings.allowMedia) {
    formData.delete("image");
    formData.delete("video");
  }

  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };

  const { storage } = setupFirebase(firebaseConfig);

  let imageUrl = null;
  let videoUrl = null;

  const imageFile = formData.get("image");
  const videoFile = formData.get("video");

  // console.log("imageFile: ", imageFile);

  if (settings.allowMedia) {
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadFile(imageFile, "images", storage);
    }

    if (videoFile && videoFile.size > 0) {
      videoUrl = await uploadFile(videoFile, "videos", storage);
    }
  }

  try {
    let subscriptionPlan = await getSubscriptionPlan(shopName);

    console.log("Current Subscription plan: ", subscriptionPlan);

    let sentiment = null;
    if (settings.enableSentimentAnalysis) {
      if (subscriptionPlan === "Free Plan") {
        sentiment = getSentimentFromRating(parseFloat(rating));
      } else {
        sentiment = await analyzeSentiment(comment);
      }
    } else {
      sentiment = getSentimentFromRating(parseFloat(rating));
    }

    let aiResponse = null;
    if (settings.enableAutomatedResponses && subscriptionPlan !== "Free Plan") {
      aiResponse = await generateAIResponse(comment);
    }

    let approved = true; // All reviews approved for Free Plan

    if (
      subscriptionPlan !== "Free Plan" &&
      settings.reviewModeration === "none"
    ) {
      approved = true; // All reviews approved for paid plans based on settings
    } else if (settings.reviewModeration === "negative") {
      approved = sentiment !== "NEGATIVE"; // Approve all except negative
    } else if (settings.reviewModeration === "all") {
      approved = false; // Require approval for all
    }

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
    // await sendEmail({
    //   to: "redavan95@gmail.com", // Replace with the admin's email address
    //   subject: "New Product Review Submitted",
    //   productId: productId,
    //   firstName: firstName,
    //   lastName: lastName,
    //   rating: rating,
    //   comment: comment,
    // });

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
