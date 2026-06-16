import { login } from "../shopify.server";
import { LoginErrorMessage } from "@shopify/shopify-app-remix/react";
import { useActionData, useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  const errors = login(request);
  return { errors: errors ?? {}, polarisTranslations: {} };
};

export const action = async ({ request }) => {
  const errors = await login(request);
  return { errors: errors ?? {} };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const errors = actionData?.errors || loaderData?.errors || {};

  return (
    <div>
      <form method="post">
        <label>
          Shop domain
          <input type="text" name="shop" placeholder="my-shop-domain.myshopify.com" />
        </label>
        {errors?.shop ? <div>{errors.shop}</div> : null}
        <button type="submit">Log in</button>
      </form>
    </div>
  );
}
