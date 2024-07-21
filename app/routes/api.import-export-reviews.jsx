import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Readable } from "stream";
import { stringify } from "csv-stringify";
import { parse } from "csv-parse";

const PRODUCTS_QUERY = `
  query getProducts {
    products(first: 250) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`;

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const { shop } = session;

  console.log("api.import-export-reviews.jsx shopName", shop);

  if (!shop) {
    return json({ error: "Shop ID is required" }, { status: 400 });
  }

  if (action === "reviews-count") {
    const productId = url.searchParams.get("productId");
    const count = await prisma.review.count({
      where: { productId, shopId: shop },
    });
    return json({ count });
  }

  const response = await admin.graphql(PRODUCTS_QUERY);
  const data = await response.json();
  const products = data.data.products.edges.map((edge) => edge.node);

  return json({ products });
};

function getSentimentFromRating(rating) {
  if (rating >= 4) {
    return "POSITIVE";
  } else if (rating >= 2) {
    return "NEUTRAL";
  } else {
    return "NEGATIVE";
  }
}

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const contentType = request.headers.get("Content-Type");

  if (!shop) {
    return json({ error: "Shop ID is required" }, { status: 400 });
  }

  if (contentType.includes("application/json")) {
    const formData = await request.json();
    const { actionType, productId, fields } = formData;

    if (actionType === "export") {
      const reviews = await prisma.review.findMany({
        where: { productId, shopId: shop },
        select: fields.reduce((acc, field) => {
          acc[field] = true;
          return acc;
        }, {}),
      });

      const csvString = await new Promise((resolve, reject) => {
        stringify(reviews, { header: true }, (err, output) => {
          if (err) reject(err);
          resolve(output);
        });
      });

      return new Response(csvString, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="reviews.csv"`,
        },
      });
    }
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const actionType = formData.get("actionType");

    if (actionType === "import") {
      const productId = formData.get("productId");
      const productTitle = formData.get("productTitle");
      const file = formData.get("file");

      const reviews = await new Promise((resolve, reject) => {
        const parser = parse({ columns: true }, (err, records) => {
          if (err) reject(err);
          resolve(records);
        });
        Readable.from(file.stream()).pipe(parser);
      });

      // Check if the product exists
      let product = await prisma.product.findUnique({ where: { productId } });

      // If the product does not exist, create it
      if (!product) {
        // Assuming productTitle can be derived or should be provided in another way
        product = await prisma.product.create({
          data: {
            productId,
            title: productTitle || "Default Product Title",
            shopId: shop,
          },
        });
      }

      await prisma.review.createMany({
        data: reviews.map((review) => ({
          ...review,
          rating: parseFloat(review.rating),
          sentiment:
            review.sentiment ||
            getSentimentFromRating(parseFloat(review.rating)),
          productId,
          shopId: shop,
        })),
      });

      return json({ imported: reviews.length });
    }
  } else {
    return json({ error: "Invalid content type" }, { status: 400 });
  }
};
