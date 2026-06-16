import { authenticate } from "../shopify.server";

// This app does not store any customer personal data, so there is
// nothing to return here. The request is still verified via HMAC
// by authenticate.webhook before responding.
export const action = async ({ request }) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  return new Response();
};
