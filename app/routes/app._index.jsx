// // app._index.jsx

import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";

// import { json } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
// import { useLoaderData } from "@remix-run/react";

// import { redirect } from "@remix-run/node";

// export const loader = async ({ request }) => {
//   // const auth = await authenticate.admin(request);
//   // const shop = auth.session.shop;

//   return null;
// };

export const action = async ({ request }) => {};

export default function Index() {
  // const { auth, shop } = useLoaderData();
  const navigate = useNavigate();

  // console.log("auth ", auth);
  // console.log("shop ", shop);

  useEffect(() => {
    navigate("/app/dashboard");
  }, []);

  return null;
}
