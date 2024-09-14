// app/models/subscription.server.js

// Function to get the subscription status of the shop using Shopify's built-in GraphQL function
// app/models/subscription.server.js

export async function getSubscriptionStatus(graphql) {
  const query = `
      query {
        app {
          installation {
            activeSubscriptions {
              id
              name
              status
              lineItems {
                plan {
                  pricingDetails {
                    ... on AppRecurringPricing {
                      interval
                      price {
                        amount
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

  try {
    const result = await graphql(query);
    const fetchedData = await result.json();

    if (
      !fetchedData.data ||
      !fetchedData.data.app ||
      !fetchedData.data.app.installation
    ) {
      console.error("Unexpected response structure:", fetchedData);
      return { name: "Free Plan" };
    }

    const activeSubscriptions =
      fetchedData.data.app.installation.activeSubscriptions;

    if (activeSubscriptions.length === 0) {
      console.log("No active subscriptions found");
      return { name: "Free Plan" }; // No active subscriptions
    }

    // console.log("activeSubscriptions", activeSubscriptions);
    return activeSubscriptions[0]; // Return the first active subscription
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    throw new Error("Failed to fetch subscription status");
  }
}

// Function to update the subscription plan in Shopify Metafields
export async function updateSubscriptionMetafield(graphql, shop, plan) {
  console.log(`\n\n Updating metafield for shop: ${shop}, plan: ${plan} \n\n`);

  const shopIdQuery = `
    query {
      shop{
        id
      }
    }`;

  const shopIdResponse = await graphql(shopIdQuery);

  const shopIdResult = await shopIdResponse.json();

  const shopId = shopIdResult.data.shop.id;

  const mutation = `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
            type
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

  const variables = {
    metafields: [
      {
        namespace: "app_subscription",
        key: "current_plan",
        value: plan,
        type: "single_line_text_field",
        ownerId: shopId,
      },
    ],
  };

  try {
    console.log(
      "Executing GraphQL mutation with variables:",
      JSON.stringify(variables, null, 2),
    );
    const response = await graphql(mutation, { variables });
    const result = await response.json();
    console.log("GraphQL mutation response:", JSON.stringify(result, null, 2));

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      throw new Error(result.errors[0].message);
    }

    if (result.data.metafieldsSet.userErrors.length > 0) {
      console.error(
        "Metafield set user errors:",
        result.data.metafieldsSet.userErrors,
      );
      throw new Error(result.data.metafieldsSet.userErrors[0].message);
    }

    console.log(
      `Metafield updated successfully for shop: ${shop} to plan: ${plan}`,
    );
    return result.data.metafieldsSet.metafields[0];
  } catch (error) {
    console.error(`Failed to update metafield for shop: ${shop}`, error);
    throw new Error(`Failed to update metafield: ${error.message}`);
  }
}
