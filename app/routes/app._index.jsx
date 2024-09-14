// // app._index.jsx

// import { json } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
// import { useLoaderData } from "@remix-run/react";

import { Page } from "@shopify/polaris";

// export const loader = async ({ request }) => {
//   await authenticate.admin(request);

//   return null;
// };

// export const action = async ({ request }) => {};

export default function Index() {
  return (
    <Page title="App Index">
      <h1>App Index</h1>
    </Page>
  );
}
