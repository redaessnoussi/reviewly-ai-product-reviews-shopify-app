import { isFeatureEnabled } from "./isFeatureEnabled";

function getSentimentFromRating(rating) {
  if (rating >= 4) {
    return "POSITIVE";
  } else if (rating >= 2) {
    return "NEUTRAL";
  } else {
    return "NEGATIVE";
  }
}

async function analyzeSentiment(text, retries = 5, delay = 1000) {
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

      console.log("sentiment api attempt", attempt);

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

export async function handleSentimentAnalysis(
  comment,
  rating,
  settings,
  subscriptionPlan,
) {
  const basicSentimentEnabled = isFeatureEnabled(
    subscriptionPlan,
    "Basic Sentiment Analysis",
  );

  if (settings.enableSentimentAnalysis) {
    if (basicSentimentEnabled) {
      return getSentimentFromRating(parseFloat(rating));
    } else {
      return await analyzeSentiment(comment);
    }
  } else {
    return getSentimentFromRating(parseFloat(rating));
  }
}
