import { authenticate } from "../shopify.server";
import db from "../db.server";

// Called 48 hours after uninstall. Ensure no shop data remains.
export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  await db.session.deleteMany({ where: { shop } });

  return new Response();
};
