// app.manage-reviews.jsx

import { useCallback, useEffect, useState } from "react";
import { json, useLoaderData, useNavigate } from "@remix-run/react";
import {
  IndexTable,
  Thumbnail,
  Text,
  Page,
  Badge,
  useIndexResourceState,
  useSetIndexFiltersMode,
  RangeSlider,
  ChoiceList,
  LegacyCard,
  IndexFilters,
  useBreakpoints,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import {
  authenticate,
  BASIC_PLAN,
  PREMIUM_PLAN,
  STANDARD_PLAN,
} from "../shopify.server";
import { updateSubscriptionPlan } from "../utils/subscriptionPlan";

export async function loader({ request }) {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

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

    console.log("\n\n pricing shop name:", shop);

    await updateSubscriptionPlan(shop, subscription.name);

    return json({ plan: subscription });
  } catch (error) {
    if (error.message === "No active plan") {
      // Update to Free Plan if no active plan
      await updateSubscriptionPlan(shop, "Free Plan");

      return json({ plan: { name: "Free Plan" } });
    }
    throw error;
  }
}

export default function ManageReviews() {
  const { plan } = useLoaderData();
  const [products, setProducts] = useState([]);
  const [queryValue, setQueryValue] = useState("");
  const [sortSelected, setSortSelected] = useState(["reviewCount desc"]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust as needed

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fetch-products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products);

  const { mode, setMode } = useSetIndexFiltersMode();

  const [itemStrings] = useState(["All", "Positive", "Negative"]);
  const [selected, setSelected] = useState(0);

  const handleTabChange = (selectedTabIndex) => {
    setSelected(selectedTabIndex);
    if (selectedTabIndex === 0) {
      setSentimentFilter([]);
    } else if (selectedTabIndex === 1) {
      setSentimentFilter(["positive"]);
    } else if (selectedTabIndex === 2) {
      setSentimentFilter(["negative"]);
    }
  };

  const onHandleCancel = () => {};

  const onHandleSave = async () => {
    return true;
  };

  const primaryAction =
    selected === 0
      ? {
          type: "save-as",
          onAction: () => console.log("Save as"),
          disabled: false,
          loading: false,
        }
      : {
          type: "save",
          onAction: onHandleSave,
          disabled: false,
          loading: false,
        };

  const sortOptions = [
    {
      label: "Review Count",
      value: "reviewCount asc",
      directionLabel: "Ascending",
    },
    {
      label: "Review Count",
      value: "reviewCount desc",
      directionLabel: "Descending",
    },
    {
      label: "Average Rating",
      value: "averageRating asc",
      directionLabel: "Ascending",
    },
    {
      label: "Average Rating",
      value: "averageRating desc",
      directionLabel: "Descending",
    },
  ];

  const [ratingFilter, setRatingFilter] = useState([0, 5]);
  const [sentimentFilter, setSentimentFilter] = useState([]);

  const handleRatingFilterChange = useCallback(
    (value) => setRatingFilter(value),
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

  const filters = [
    {
      key: "rating",
      label: "Average Rating",
      filter: (
        <RangeSlider
          label="Average Rating"
          value={ratingFilter}
          min={0}
          max={5}
          step={0.1}
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
            { label: "Positive", value: "positive" },
            { label: "Negative", value: "negative" },
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
      label: `Average Rating: ${ratingFilter[0]} - ${ratingFilter[1]}`,
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

  const filteredProducts = products.filter((product) => {
    const matchesQuery =
      product.title.toLowerCase().includes(queryValue.toLowerCase()) ||
      product.productId.toString().includes(queryValue);
    const matchesRating =
      product.averageRating >= ratingFilter[0] &&
      product.averageRating <= ratingFilter[1];
    const matchesSentiment =
      sentimentFilter.length === 0 ||
      sentimentFilter.includes(product.dominantSentiment.toLowerCase());
    return matchesQuery && matchesRating && matchesSentiment;
  });

  // Sort the filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const [sortKey, sortDirection] = sortSelected[0].split(" ");
    if (sortKey === "reviewCount") {
      return sortDirection === "asc"
        ? a.reviewCount - b.reviewCount
        : b.reviewCount - a.reviewCount;
    } else if (sortKey === "averageRating") {
      return sortDirection === "asc"
        ? a.averageRating - b.averageRating
        : b.averageRating - a.averageRating;
    }
    return 0;
  });

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const rowMarkup = paginatedProducts.map(
    (
      {
        id,
        productId,
        title,
        featuredImage,
        reviewCount,
        averageRating,
        lastReviewedDate,
        dominantSentiment,
        sentimentPercentages,
      },
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
        onClick={() => navigate(`/app/products/${productId}`)}
      >
        <IndexTable.Cell>
          <Thumbnail
            source={featuredImage ? featuredImage.url : ImageIcon}
            alt={title}
            size="small"
          />
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{productId}</IndexTable.Cell>
        <IndexTable.Cell>{reviewCount}</IndexTable.Cell>
        <IndexTable.Cell>{averageRating}</IndexTable.Cell>
        <IndexTable.Cell>
          {new Date(lastReviewedDate).toLocaleDateString()}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge
            tone={
              dominantSentiment === "Positive"
                ? "success"
                : dominantSentiment === "Negative"
                  ? "critical"
                  : "warning"
            }
          >
            {dominantSentiment &&
              `${sentimentPercentages[dominantSentiment.toLowerCase()].toFixed(
                0,
              )}% ${dominantSentiment}`}
          </Badge>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page title="Manage Reviews">
      <LegacyCard>
        <IndexFilters
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          queryValue={queryValue}
          queryPlaceholder="Search products by title or ID"
          onQueryChange={handleFiltersQueryChange}
          onQueryClear={() => setQueryValue("")}
          onSort={setSortSelected}
          primaryAction={primaryAction}
          cancelAction={{
            onAction: onHandleCancel,
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
          itemCount={sortedProducts.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "Image" },
            { title: "Title" },
            { title: "ID" },
            { title: "Reviews" },
            { title: "Avg Rating" },
            { title: "Last Review" },
            { title: "Sentiment" },
          ]}
          pagination={{
            hasNext: currentPage * itemsPerPage < sortedProducts.length,
            onNext: () => setCurrentPage((prev) => prev + 1),
            hasPrevious: currentPage > 1,
            onPrevious: () => setCurrentPage((prev) => prev - 1),
          }}
        >
          {rowMarkup}
        </IndexTable>
      </LegacyCard>
    </Page>
  );
}
