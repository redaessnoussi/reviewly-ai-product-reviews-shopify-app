// app.manage-reviews.jsx

import { useEffect, useState } from "react";
import { Link, useNavigate } from "@remix-run/react";
import {
  Card,
  IndexTable,
  TextField,
  Pagination,
  Thumbnail,
  Text,
  Page,
  Badge,
  Button,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import { useBillingPlan } from "../context/BillingPlanContext";

export default function ManageReviews() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  // const [userPlan, setUserPlan] = useState("Free Plan"); // Default to Free Plan
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const billingPlan = useBillingPlan();

  // Now you can use billingPlan in your component logic
  console.log("Current billing plan:", billingPlan);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch("/api/fetch-products");
      const data = await response.json();
      setProducts(data.products);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productId.toString().includes(searchQuery) ||
      product.dominantSentiment
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <Page title="Reviews by product" fullWidth>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Card>
          <Button
            onClick={() => {
              navigate("/app/import-export-reviews");
            }}
            primary
          >
            Go to Import/Export Reviews
          </Button>

          <TextField
            label="Search Products"
            value={searchQuery}
            onChange={setSearchQuery}
            autoComplete="off"
            clearButton
            onClearButtonClick={() => setSearchQuery("")}
          />

          <IndexTable
            resourceName={{ singular: "product", plural: "products" }}
            itemCount={filteredProducts.length}
            headings={[
              { title: "Thumbnail" },
              { title: "ID" },
              { title: "Title" },
              { title: "Review Count" },
              { title: "Average Rating" },
              { title: "Last Reviewed Date" },
              { title: "Sentiment" },
            ]}
            selectable={false}
          >
            {paginatedProducts.map((product) => (
              <IndexTable.Row
                id={product.id}
                key={product.id}
                position={product.id}
              >
                <IndexTable.Cell>
                  <Thumbnail
                    source={
                      product.featuredImage
                        ? product.featuredImage?.url
                        : ImageIcon
                    }
                    alt={product.title}
                    size="small"
                  />
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text variant="bodyMd" fontWeight="bold" as="span">
                    #{product.productId}
                  </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Link to={`/app/products/${product.id.split("/").pop()}`}>
                    {product.title}
                  </Link>
                </IndexTable.Cell>
                <IndexTable.Cell>{product.reviewCount} reviews</IndexTable.Cell>
                <IndexTable.Cell>{product.averageRating}</IndexTable.Cell>
                <IndexTable.Cell>
                  {new Date(product.lastReviewedDate).toLocaleDateString()}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge
                    tone={
                      product.dominantSentiment === "Positive"
                        ? "success"
                        : product.dominantSentiment === "Negative"
                          ? "critical"
                          : "warning"
                    }
                  >
                    {product.dominantSentiment &&
                      `${product.sentimentPercentages[
                        product.dominantSentiment.toLowerCase()
                      ].toFixed(0)}% ${product.dominantSentiment}`}
                  </Badge>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>

          <Pagination
            hasPrevious={currentPage > 1}
            onPrevious={() => setCurrentPage((prev) => prev - 1)}
            hasNext={currentPage < totalPages}
            onNext={() => setCurrentPage((prev) => prev + 1)}
          />
        </Card>
      )}
    </Page>
  );
}
