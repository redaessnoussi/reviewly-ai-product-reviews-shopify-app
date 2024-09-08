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
  LegacyCard,
  IndexTable,
  Text,
  Badge,
  Button,
  useIndexResourceState,
  Spinner,
  Modal,
  IndexFilters,
  useSetIndexFiltersMode,
  RangeSlider,
  ChoiceList,
  useBreakpoints,
  Thumbnail,
  TextContainer,
  TextField,
  Banner,
  SkeletonPage,
  Layout,
  SkeletonBodyText,
  SkeletonDisplayText,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import capitalizeFirstLetter from "../utils/capitalizeFirstLetter";
import { useCallback, useEffect, useState } from "react";
import { truncateText } from "../utils/truncateText";
import { isFeatureEnabled } from "../utils/isFeatureEnabled";
import { updateSubscriptionPlan } from "../utils/subscriptionPlan";
import RatingStars from "../components/Home/RatingStars";

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
  const { billing, admin, session } = await authenticate.admin(request);
  const productId = params.productId;
  const shop = session.shop;

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
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { adminReplies: true },
    });

    const totalReviews = await prisma.review.count({ where: { productId } });

    return { reviews, totalReviews };
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
    await updateSubscriptionPlan(shop, subscription.name);

    const product = await fetchProductDetails();
    const { reviews, totalReviews } = await fetchReviews();

    return json({
      plan: subscription,
      product,
      reviews: reviews || [], // Ensure reviews is an array
      totalReviews,
    });
  } catch (error) {
    if (error.message === "No active plan") {
      const product = await fetchProductDetails();
      const { reviews, totalReviews } = await fetchReviews();

      await updateSubscriptionPlan(shop, "Free Plan");

      return json({
        plan: { name: "Free Plan" },
        product,
        reviews: reviews || [], // Ensure reviews is an array
        totalReviews,
      });
    }
    throw error;
  }
};

function SkeletonLoader() {
  return (
    <SkeletonPage primaryAction>
      <Layout>
        <Layout.Section>
          <LegacyCard sectioned>
            <SkeletonBodyText lines={1} />
            <div style={{ marginTop: "1rem" }}>
              <SkeletonDisplayText size="small" />
              <div style={{ height: "200px", marginTop: "1rem" }}>
                <SkeletonBodyText lines={10} />
              </div>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <SkeletonBodyText lines={1} />
            </div>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  );
}

export default function ProductReviews() {
  const { plan, product, reviews: initialReviews } = useLoaderData();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState(initialReviews);
  const [queryValue, setQueryValue] = useState("");
  const [sortSelected, setSortSelected] = useState(["createdAt desc"]);
  const fetcher = useFetcher();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust as needed
  const [actionMessage, setActionMessage] = useState(null);

  const isBulkActionsEnabled = isFeatureEnabled(plan.name, "Bulk Actions");

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(reviews);

  const { mode, setMode } = useSetIndexFiltersMode();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      // Refresh the reviews after a successful action
      setReviews((prevReviews) =>
        prevReviews.map((review) => {
          const updatedReview = fetcher.data.updatedReviews.find(
            (r) => r.id === review.id,
          );
          return updatedReview ? { ...review, ...updatedReview } : review;
        }),
      );
      setActionMessage({ content: fetcher.data.message, type: "success" });
      setLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  const handleBulkAction = (actionType) => {
    setLoading(true);
    setActionMessage(null);
    fetcher.submit(
      { actionType, reviewIds: selectedResources },
      {
        method: "post",
        action: "/api/bulk-actions",
        encType: "application/json",
      },
    );
  };

  const resourceName = {
    singular: "review",
    plural: "reviews",
  };

  const [itemStrings] = useState(["All", "Approved", "Pending"]);
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelected(selectedTabIndex);
    if (selectedTabIndex === 0) {
      setStatusFilter([]);
    } else if (selectedTabIndex === 1) {
      setStatusFilter(["approved"]);
    } else if (selectedTabIndex === 2) {
      setStatusFilter(["pending"]);
    }
  }, []);

  const sortOptions = [
    { label: "Date", value: "createdAt asc", directionLabel: "Oldest" },
    { label: "Date", value: "createdAt desc", directionLabel: "Newest" },
    { label: "Rating", value: "rating asc", directionLabel: "Lowest" },
    { label: "Rating", value: "rating desc", directionLabel: "Highest" },
  ];

  const [ratingFilter, setRatingFilter] = useState([0, 5]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [sentimentFilter, setSentimentFilter] = useState([]);

  const handleRatingFilterChange = useCallback(
    (value) => setRatingFilter(value),
    [],
  );

  const handleStatusFilterChange = useCallback(
    (value) => setStatusFilter(value),
    [],
  );

  const handleSentimentFilterChange = useCallback(
    (value) => setSentimentFilter(value),
    [],
  );

  const handleFiltersQueryChange = useCallback(
    (value) => setQueryValue(value),
    [],
  );

  const handleRatingFilterRemove = useCallback(
    () => setRatingFilter([0, 5]),
    [],
  );
  const handleStatusFilterRemove = useCallback(() => setStatusFilter([]), []);
  const handleSentimentFilterRemove = useCallback(
    () => setSentimentFilter([]),
    [],
  );
  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);

  const handleFiltersClearAll = useCallback(() => {
    handleRatingFilterRemove();
    handleStatusFilterRemove();
    handleSentimentFilterRemove();
    handleQueryValueRemove();
  }, [
    handleRatingFilterRemove,
    handleStatusFilterRemove,
    handleSentimentFilterRemove,
    handleQueryValueRemove,
  ]);

  const filters = [
    {
      key: "rating",
      label: "Rating",
      filter: (
        <RangeSlider
          label="Rating"
          value={ratingFilter}
          min={0}
          max={5}
          step={1}
          onChange={handleRatingFilterChange}
          output
        />
      ),
      shortcut: true,
    },
    {
      key: "status",
      label: "Status",
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            { label: "Approved", value: "approved" },
            { label: "Pending", value: "pending" },
          ]}
          selected={statusFilter}
          onChange={handleStatusFilterChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: "sentiment",
      label: "Sentiment",
      filter: (
        <ChoiceList
          title="Sentiment"
          titleHidden
          choices={[
            { label: "Positive", value: "positive" },
            { label: "Negative", value: "negative" },
            { label: "Neutral", value: "neutral" },
          ]}
          selected={sentimentFilter}
          onChange={handleSentimentFilterChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = [];
  if (ratingFilter[0] !== 0 || ratingFilter[1] !== 5) {
    appliedFilters.push({
      key: "rating",
      label: `Rating: ${ratingFilter[0]} - ${ratingFilter[1]}`,
      onRemove: handleRatingFilterRemove,
    });
  }
  if (statusFilter.length > 0) {
    appliedFilters.push({
      key: "status",
      label: `Status: ${statusFilter.join(", ")}`,
      onRemove: handleStatusFilterRemove,
    });
  }
  if (sentimentFilter.length > 0) {
    appliedFilters.push({
      key: "sentiment",
      label: `Sentiment: ${sentimentFilter.join(", ")}`,
      onRemove: handleSentimentFilterRemove,
    });
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesQuery = review.comment
      .toLowerCase()
      .includes(queryValue.toLowerCase());
    const matchesRating =
      review.rating >= ratingFilter[0] && review.rating <= ratingFilter[1];
    const matchesStatus =
      statusFilter.length === 0 ||
      statusFilter.includes(review.approved ? "approved" : "pending");
    const matchesSentiment =
      sentimentFilter.length === 0 ||
      sentimentFilter.includes(review.sentiment.toLowerCase());
    return matchesQuery && matchesRating && matchesStatus && matchesSentiment;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const [sortKey, sortDirection] = sortSelected[0].split(" ");
    if (sortKey === "createdAt") {
      return sortDirection === "asc"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortKey === "rating") {
      return sortDirection === "asc"
        ? a.rating - b.rating
        : b.rating - a.rating;
    }
    return 0;
  });

  const paginatedReviews = sortedReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const rowMarkup = paginatedReviews.map(
    ({ id, comment, createdAt, rating, sentiment, approved }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
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
          <Badge
            tone={
              sentiment === "POSITIVE"
                ? "success"
                : sentiment === "NEGATIVE"
                  ? "critical"
                  : "warning"
            }
          >
            {capitalizeFirstLetter(sentiment)}
          </Badge>
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
      title={`Reviews for ${product.title}`}
      breadcrumbs={[{ content: "Products", url: "/app/manage-reviews" }]}
    >
      <Layout>
        {actionMessage && (
          <Layout.Section>
            <Banner
              title={actionMessage.content}
              tone={actionMessage.type}
              onDismiss={() => setActionMessage(null)}
            />
          </Layout.Section>
        )}
        <Layout.Section>
          <LegacyCard>
            <IndexFilters
              sortOptions={sortOptions}
              sortSelected={sortSelected}
              queryValue={queryValue}
              queryPlaceholder="Search reviews"
              onQueryChange={handleFiltersQueryChange}
              onQueryClear={() => setQueryValue("")}
              onSort={setSortSelected}
              cancelAction={{
                onAction: () => {},
                disabled: false,
                loading: false,
              }}
              tabs={itemStrings.map((item, index) => ({
                content: item,
                index,
                onAction: () => handleTabChange(index),
                id: `${item}-${index}`,
              }))}
              selected={selected}
              onSelect={handleTabChange}
              filters={filters}
              appliedFilters={appliedFilters}
              onClearAll={handleFiltersClearAll}
              mode={mode}
              setMode={setMode}
            />
            <IndexTable
              condensed={useBreakpoints().smDown}
              resourceName={resourceName}
              itemCount={sortedReviews.length}
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
              pagination={{
                hasNext: currentPage * itemsPerPage < sortedReviews.length,
                onNext: () => setCurrentPage((prev) => prev + 1),
                hasPrevious: currentPage > 1,
                onPrevious: () => setCurrentPage((prev) => prev - 1),
              }}
            >
              {rowMarkup}
            </IndexTable>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
