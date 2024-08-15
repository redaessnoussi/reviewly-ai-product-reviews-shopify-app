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

  const url = new URL(request.url);
  const sortKey = url.searchParams.get("sortKey") || "createdAt";
  const sortDirection = url.searchParams.get("sortDirection") || "desc";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const itemsPerPage = 10;

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
    const skip = (page - 1) * itemsPerPage;
    const orderBy = { [sortKey]: sortDirection.toLowerCase() };

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy,
      skip,
      take: itemsPerPage,
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
    console.log(`Shop is on ${subscription.name} (id ${subscription.id})`);

    await updateSubscriptionPlan(shop, subscription.name);

    const product = await fetchProductDetails();
    const { reviews, totalReviews } = await fetchReviews();

    return json({
      plan: subscription,
      product,
      reviews,
      totalReviews,
      currentPage: page,
      sortKey,
      sortDirection,
    });
  } catch (error) {
    if (error.message === "No active plan") {
      const product = await fetchProductDetails();
      const { reviews, totalReviews } = await fetchReviews();

      await updateSubscriptionPlan(shop, "Free Plan");

      return json({
        plan: { name: "Free Plan" },
        product,
        reviews,
        totalReviews,
        currentPage: page,
        sortKey,
        sortDirection,
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
  const {
    plan,
    product,
    reviews: initialReviews,
    totalReviews,
    currentPage: initialPage,
    sortKey: initialSortKey,
    sortDirection: initialSortDirection,
  } = useLoaderData();
  const [loading, setLoading] = useState(false);
  const [queryValue, setQueryValue] = useState("");
  const [sortSelected, setSortSelected] = useState([
    `${initialSortKey} ${initialSortDirection}`,
  ]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState(null);
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const breakpoints = useBreakpoints();

  const isBulkActionsEnabled = isFeatureEnabled(plan.name, "Bulk Actions");

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(initialReviews);

  const { mode, setMode } = useSetIndexFiltersMode();
  const [itemStrings] = useState(["All", "Positive", "Negative"]);
  const [selected, setSelected] = useState(0);
  const [ratingFilter, setRatingFilter] = useState([0, 5]);
  const [sentimentFilter, setSentimentFilter] = useState([]);

  useEffect(() => {
    setLoading(false);
  }, [initialReviews]);

  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelected(selectedTabIndex);
    if (selectedTabIndex === 0) {
      setSentimentFilter([]);
    } else if (selectedTabIndex === 1) {
      setSentimentFilter(["POSITIVE"]);
    } else if (selectedTabIndex === 2) {
      setSentimentFilter(["NEGATIVE"]);
    }
  }, []);

  const handleSort = useCallback(
    (selected) => {
      setSortSelected(selected);
      const [key, direction] = selected[0].split(" ");
      setLoading(true);
      navigate(`?sortKey=${key}&sortDirection=${direction}&page=1`, {
        replace: true,
      });
    },
    [navigate],
  );

  const handleFiltersQueryChange = useCallback(
    (value) => setQueryValue(value),
    [],
  );

  const handleRatingFilterChange = useCallback(
    (value) => setRatingFilter(value),
    [],
  );

  const handleSentimentFilterChange = useCallback(
    (value) => setSentimentFilter(value),
    [],
  );

  const handleRatingFilterRemove = useCallback(
    () => setRatingFilter([0, 5]),
    [],
  );
  const handleSentimentFilterRemove = useCallback(
    () => setSentimentFilter([]),
    [],
  );
  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);

  const handleFiltersClearAll = useCallback(() => {
    handleRatingFilterRemove();
    handleSentimentFilterRemove();
    handleQueryValueRemove();
  }, [
    handleRatingFilterRemove,
    handleSentimentFilterRemove,
    handleQueryValueRemove,
  ]);

  const handleReviewClick = useCallback((review) => {
    setSelectedReview(review);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedReview(null);
    setReplyText("");
    setReplyStatus(null);
  }, []);

  const handleReplySubmit = useCallback(() => {
    if (selectedReview && replyText.trim()) {
      fetcher.submit(
        { reviewId: selectedReview.id, reply: replyText },
        {
          method: "post",
          action: "/api/admin-reply",
          encType: "application/json",
        },
      );
    }
  }, [selectedReview, replyText, fetcher]);

  useEffect(() => {
    if (fetcher.type === "done") {
      if (fetcher.data.error) {
        setReplyStatus({ type: "error", content: fetcher.data.error });
      } else {
        setReplyStatus({
          type: "success",
          content: "Reply submitted successfully",
        });
        setReplyText("");
        setSelectedReview((prev) => ({
          ...prev,
          adminReplies: [
            ...prev.adminReplies,
            {
              id: fetcher.data.id,
              reply: fetcher.data.reply,
              createdAt: fetcher.data.createdAt,
            },
          ],
        }));
      }
    }
  }, [fetcher.type, fetcher.data]);

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

  const sortOptions = [
    {
      label: "Date",
      value: "createdAt desc",
      directionLabel: "Newest first",
    },
    {
      label: "Date",
      value: "createdAt asc",
      directionLabel: "Oldest first",
    },
    {
      label: "Rating",
      value: "rating desc",
      directionLabel: "Descending",
    },
    {
      label: "Rating",
      value: "rating asc",
      directionLabel: "Ascending",
    },
  ];

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
      key: "sentiment",
      label: "Sentiment",
      filter: (
        <ChoiceList
          title="Sentiment"
          titleHidden
          choices={[
            { label: "Positive", value: "POSITIVE" },
            { label: "Negative", value: "NEGATIVE" },
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
  if (sentimentFilter.length > 0) {
    appliedFilters.push({
      key: "sentiment",
      label: `Sentiment: ${sentimentFilter.join(", ")}`,
      onRemove: handleSentimentFilterRemove,
    });
  }

  const filteredReviews = initialReviews.filter((review) => {
    const matchesQuery = review.comment
      .toLowerCase()
      .includes(queryValue.toLowerCase());
    const matchesRating =
      review.rating >= ratingFilter[0] && review.rating <= ratingFilter[1];
    const matchesSentiment =
      sentimentFilter.length === 0 ||
      sentimentFilter.includes(review.sentiment);
    return matchesQuery && matchesRating && matchesSentiment;
  });

  const rowMarkup = filteredReviews.map(
    (
      {
        id,
        comment,
        createdAt,
        rating,
        sentiment,
        approved,
        imageUrl,
        firstName,
        lastName,
      },
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
        onClick={() =>
          handleReviewClick({
            id,
            comment,
            createdAt,
            rating,
            sentiment,
            approved,
            imageUrl,
            firstName,
            lastName,
          })
        }
      >
        <IndexTable.Cell>
          <Thumbnail source={imageUrl || ImageIcon} alt="Review" size="small" />
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {truncateText(comment, 50)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {new Date(createdAt).toLocaleDateString()}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <RatingStars value={rating} />
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
            {capitalizeFirstLetter(sentiment.toLowerCase())}
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

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <Page
      title={product.title}
      breadcrumbs={[{ content: "Products", url: "/app/manage-reviews" }]}
      primaryAction={{
        content: "Back to Products",
        onAction: () => navigate("/app/manage-reviews"),
      }}
    >
      <LegacyCard>
        <IndexFilters
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          queryValue={queryValue}
          queryPlaceholder="Search reviews"
          onQueryChange={handleFiltersQueryChange}
          onQueryClear={() => setQueryValue("")}
          onSort={handleSort}
          cancelAction={{
            onAction: handleFiltersClearAll,
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
          condensed={useBreakpoints.smDown}
          resourceName={{ singular: "review", plural: "reviews" }}
          itemCount={filteredReviews.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "Image" },
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
      </LegacyCard>
      {selectedReview && (
        <Modal
          open={Boolean(selectedReview)}
          onClose={handleCloseModal}
          title="Review Details"
        >
          <Modal.Section>
            <TextContainer>
              <p>
                <strong>Customer:</strong> {selectedReview.firstName}{" "}
                {selectedReview.lastName}
              </p>
              <p>
                <strong>Comment:</strong> {selectedReview.comment}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedReview.createdAt).toLocaleString()}
              </p>
              <div>
                <strong>Rating:</strong>{" "}
                <RatingStars value={selectedReview.rating} />
              </div>
              <p>
                <strong>Sentiment:</strong>{" "}
                {capitalizeFirstLetter(selectedReview.sentiment.toLowerCase())}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedReview.approved ? "Approved" : "Pending"}
              </p>
              {selectedReview.imageUrl && (
                <img
                  src={selectedReview.imageUrl}
                  alt="Review"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    marginTop: "1rem",
                  }}
                />
              )}
              {selectedReview.videoUrl && (
                <video
                  src={selectedReview.videoUrl}
                  controls
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    marginTop: "1rem",
                  }}
                />
              )}
              <h3>Admin Replies</h3>
              {selectedReview.adminReplies.map((reply) => (
                <div key={reply.id}>
                  <p>{reply.reply}</p>
                  <p>
                    <small>{new Date(reply.createdAt).toLocaleString()}</small>
                  </p>
                </div>
              ))}
              {replyStatus && (
                <Banner
                  tone={replyStatus.type === "success" ? "success" : "critical"}
                >
                  <p>{replyStatus.content}</p>
                </Banner>
              )}
              <TextField
                label="Reply to review"
                value={replyText}
                onChange={(value) => setReplyText(value)}
                multiline={4}
              />
              <Button onClick={handleReplySubmit} primary>
                Submit Reply
              </Button>
            </TextContainer>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
