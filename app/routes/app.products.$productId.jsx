// app/routes/app.products.$productId.jsx

import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import {
  authenticate,
  BASIC_PLAN,
  PREMIUM_PLAN,
  STANDARD_PLAN,
} from "../shopify.server";
import prisma from "../db.server";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  TextField,
  Text,
  Badge,
  Button,
  useIndexResourceState,
  Spinner,
} from "@shopify/polaris";
import capitalizeFirstLetter from "../utils/capitalizeFirstLetter";
import { useEffect, useState } from "react";
import { truncateText } from "../utils/truncateText";
import { isFeatureEnabled } from "../utils/isFeatureEnabled";

// GraphQL query to fetch product data
const PRODUCT_QUERY = `
  query getProduct($id: ID!) {
    product(id: $id) {
      featuredImage {
        url
      }
      title
    }
  }
`;

export const loader = async ({ request, params }) => {
  const { billing, admin } = await authenticate.admin(request);
  const productId = params.productId;

  const fetchProductDetails = async () => {
    const response = await admin.graphql(PRODUCT_QUERY, {
      variables: { id: `gid://shopify/Product/${productId}` },
    });

    const {
      data: { product },
    } = await response.json();
    return product;
  };

  const fetchReviews = async () => {
    return await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
  };

  try {
    const billingCheck = await billing.require({
      plans: [BASIC_PLAN, STANDARD_PLAN, PREMIUM_PLAN],
      isTest: true,
      onFailure: () => {
        throw new Error("No active plan");
      },
    });

    const subscription = billingCheck.appSubscriptions[0];
    console.log(`Shop is on ${subscription.name} (id ${subscription.id})`);

    const product = await fetchProductDetails();
    const reviews = await fetchReviews();

    return json({ plan: subscription, product, reviews });
  } catch (error) {
    if (error.message === "No active plan") {
      const product = await fetchProductDetails();
      const reviews = await fetchReviews();
      return json({ plan: { name: "Free Plan" }, product, reviews });
    }
    throw error;
  }
};

export default function ProductReviews() {
  const { plan } = useLoaderData();

  const { product, reviews } = useLoaderData();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const fetcher = useFetcher();

  // const billingPlan = useBillingPlan();
  const isBulkActionsEnabled = isFeatureEnabled(plan.name, "Bulk Actions");

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(reviews);

  useEffect(() => {
    setLoading(false);
  }, [product, reviews]);

  const handleBulkAction = (actionType) => {
    fetcher.submit(
      { actionType, reviewIds: selectedResources },
      {
        method: "post",
        action: "/api/bulk-actions",
        encType: "application/json",
      },
    );
  };

  const filteredReviews = reviews.filter((review) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      review.comment.toLowerCase().includes(searchLower) ||
      review.rating.toString().includes(searchLower) ||
      ("approved".includes(searchLower) && review.approved) ||
      ("pending".includes(searchLower) && !review.approved) ||
      (review.sentiment && review.sentiment.toLowerCase().includes(searchLower))
    );
  });

  const rowMarkup = filteredReviews.map(
    ({ id, comment, createdAt, rating, sentiment, approved }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text truncate={true} variant="bodyMd" fontWeight="bold" as="span">
            {truncateText(comment, 50)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {new Date(createdAt).toLocaleDateString()}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="center" numeric>
            {rating}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {sentiment && (
            <Badge
              tone={
                capitalizeFirstLetter(sentiment) === "Positive"
                  ? "success"
                  : capitalizeFirstLetter(sentiment) === "Negative"
                    ? "critical"
                    : "warning"
              }
            >
              {capitalizeFirstLetter(sentiment)}
            </Badge>
          )}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {approved ? (
            <Badge tone="success">Approved</Badge>
          ) : (
            <Badge tone="attention">Pending</Badge>
          )}
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  const bulkActions = [
    {
      content: "Approve",
      onAction: () => handleBulkAction("approve"),
      disabled: !isBulkActionsEnabled,
      helpText: !isBulkActionsEnabled
        ? "This feature is available in the Premium Plan"
        : null,
    },
    {
      content: "Reject",
      onAction: () => handleBulkAction("reject"),
      disabled: !isBulkActionsEnabled,
      helpText: !isBulkActionsEnabled
        ? "This feature is available in the Premium Plan"
        : null,
    },
    {
      content: "Delete",
      onAction: () => handleBulkAction("delete"),
      disabled: !isBulkActionsEnabled,
      helpText: !isBulkActionsEnabled
        ? "This feature is available in the Premium Plan"
        : null,
    },
  ];

  return (
    <Page
      title={product.title}
      breadcrumbs={[{ content: "Products", url: "/app/manage-reviews" }]}
    >
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Layout>
          <Layout.Section>
            <Button
              primary
              onClick={() => {
                navigate("/app/manage-reviews");
              }}
            >
              Back to Products
            </Button>
            {/* <Card title="Product Details" sectioned>
              <img
                alt={product.title}
                width="300"
                height="300"
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                }}
                src={product.featuredImage?.url}
              />
            </Card> */}
            <Card sectioned>
              <TextField
                label="Search Reviews"
                value={searchQuery}
                onChange={setSearchQuery}
                autoComplete="off"
                clearButton
                onClearButtonClick={() => setSearchQuery("")}
              />
              <IndexTable
                resourceName={{ singular: "review", plural: "reviews" }}
                itemCount={reviews.length}
                selectedItemsCount={
                  allResourcesSelected ? "All" : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: "Comment" },
                  { title: "Date" },
                  { title: "Rating" },
                  { title: "Sentiment" },
                  { title: "Status" },
                ]}
                bulkActions={bulkActions}
              >
                {rowMarkup}
              </IndexTable>
              {fetcher.state === "submitting" && <Spinner />}
            </Card>
          </Layout.Section>
        </Layout>
      )}
    </Page>
  );
}
