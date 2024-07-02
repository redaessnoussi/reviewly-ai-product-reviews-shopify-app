import OpenAI from "openai";
import { isFeatureEnabled } from "./isFeatureEnabled";

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.GPT_TURBO_API_KEY,
});

export async function handleAIResponse(comment, settings, subscriptionPlan) {
  const aiResponseEnabled = isFeatureEnabled(
    subscriptionPlan,
    "Automated Responses",
  );

  if (settings.enableAutomatedResponses && aiResponseEnabled) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Generate a response for the following review:\n\n"${comment}"`,
          },
        ],
        stream: false,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error generating AI response:", error);
      return "Thank you for your review!";
    }
  }
  return null;
}
