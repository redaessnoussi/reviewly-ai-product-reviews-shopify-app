import { useEffect, useState, useCallback } from "react";
import {
  Page,
  Card,
  Button,
  FormLayout,
  Select,
  DropZone,
  Banner,
  ProgressBar,
  Thumbnail,
  LegacyStack,
  Link,
  Text,
} from "@shopify/polaris";
import { json, useFetcher, useLoaderData } from "@remix-run/react";
import { NoteIcon } from "@shopify/polaris-icons";
import { isFeatureEnabled } from "../utils/isFeatureEnabled";
import {
  authenticate,
  BASIC_PLAN,
  PREMIUM_PLAN,
  STANDARD_PLAN,
} from "../shopify.server";

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

    return json({ plan: subscription });
  } catch (error) {
    if (error.message === "No active plan") {
      // Update to Free Plan if no active plan

      return json({ plan: { name: "Free Plan" } });
    }
    throw error;
  }
}

export default function ImportExportReviews() {
  // const billingPlan = useBillingPlan();
  const { plan } = useLoaderData();

  const fetcher = useFetcher();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [fields, setFields] = useState([
    "firstName",
    "comment",
    "rating",
    "sentiment",
  ]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState("critical");
  const [reviewsCount, setReviewsCount] = useState(0);

  useEffect(() => {
    fetcher.load("/api/import-export-reviews");
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (fetcher.data?.products) {
      setSelectedProduct(fetcher.data.products[0]?.id || "");
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (selectedProduct) {
      const productId = selectedProduct.split("/").pop(); // Extract the product ID

      const fetchReviewsCount = async () => {
        const response = await fetch(
          `/api/import-export-reviews?action=reviews-count&productId=${productId}`,
        );
        const data = await response.json();
        setReviewsCount(data.count);
      };

      fetchReviewsCount();
    }
  }, [selectedProduct]);

  const products = fetcher.data?.products || [];
  const productOptions = products.map((product) => ({
    label: product.title,
    value: product.id,
  }));

  const handleDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setProgress(0);
    setMessage("");
    try {
      const productId = selectedProduct.split("/").pop(); // Extract the product ID
      const response = await fetch("/api/import-export-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actionType: "export",
          productId: productId,
          fields: fields,
        }),
      });
      if (!response.ok) throw new Error("Failed to export reviews");
      const blob = await response.blob();
      const productTitle = productOptions.find(
        (product) => product.value === selectedProduct,
      ).label;
      const exportDate = new Date().toISOString().split("T")[0];
      const filename = `${productTitle}_${exportDate}.csv`.replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setMessage("File exported successfully");
      setMessageStatus("success");
    } catch (error) {
      setMessage("Error exporting reviews: " + error.message);
      setMessageStatus("critical");
    }
    setLoading(false);
    setProgress(100);
  };

  const handleImport = async () => {
    if (!file) {
      setMessage("Please select a file to import.");
      setMessageStatus("critical");
      return;
    }
    setLoading(true);
    setProgress(0);
    setMessage("");
    const formData = new FormData();
    const productId = selectedProduct.split("/").pop(); // Extract the product ID
    formData.append("file", file);
    formData.append("productId", productId);
    formData.append("actionType", "import");

    try {
      const response = await fetch("/api/import-export-reviews", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to import reviews");
      const result = await response.json();
      setMessage(`Imported ${result.imported} reviews successfully.`);
      setMessageStatus("success");
    } catch (error) {
      setMessage("Error importing reviews: " + error.message);
      setMessageStatus("critical");
    }
    setLoading(false);
    setProgress(100);
  };

  if (!isFeatureEnabled(plan.name, "Review Export/Import")) {
    return (
      <Page title="Import/Export Reviews">
        <div>Feature not available for your plan. Please upgrade.</div>
      </Page>
    );
  } else
    return (
      <Page title="Import/Export Reviews">
        <Card sectioned>
          <FormLayout>
            {message && (
              <Banner
                title={message}
                tone={messageStatus == "critical" ? "warning" : "success"}
              />
            )}
            <Select
              label="Select Product"
              options={productOptions}
              onChange={setSelectedProduct}
              value={selectedProduct}
            />
            <Button
              primary
              onClick={handleExport}
              disabled={loading || reviewsCount === 0}
            >
              Export Reviews ({reviewsCount} reviews)
            </Button>
            <DropZone accept=".csv" onDrop={handleDrop}>
              {file ? (
                <LegacyStack>
                  <Thumbnail size="small" alt={file.name} source={NoteIcon} />
                  <div>
                    {file.name}{" "}
                    <Text variant="bodySm" as="p">
                      {file.size} bytes
                    </Text>
                  </div>
                </LegacyStack>
              ) : (
                <DropZone.FileUpload />
              )}
            </DropZone>
            <Link
              url="https://docs.google.com/spreadsheets/d/1awNIYVyFSPT63HhppPcnHp1mhc2DaKVtcUYffR3FjgU/edit?gid=0#gid=0"
              target="_blank"
            >
              Download Sample CSV
            </Link>
            <Button onClick={handleImport} disabled={loading}>
              Import Reviews
            </Button>
            {loading && <ProgressBar progress={progress} />}
          </FormLayout>
        </Card>
      </Page>
    );
}
