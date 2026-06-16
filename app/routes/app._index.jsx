import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  Badge,
  List,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  // Check whether the "Packages" collection already exists.
  const response = await admin.graphql(
    `#graphql
      query getPackagesCollection {
        collectionByHandle(handle: "packages") {
          id
          title
        }
        themes(first: 5, roles: [MAIN]) {
          nodes {
            id
            name
          }
        }
      }`,
  );
  const data = await response.json();

  const collection = data.data?.collectionByHandle ?? null;
  const mainTheme = data.data?.themes?.nodes?.[0] ?? null;

  return {
    shop: session.shop,
    hasCollection: Boolean(collection),
    mainTheme,
  };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      mutation createPackagesCollection($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection { id title handle }
          userErrors { field message }
        }
      }`,
    {
      variables: {
        input: {
          title: "Packages",
          handle: "packages",
        },
      },
    },
  );

  const data = await response.json();
  return { result: data.data?.collectionCreate };
};

export default function Index() {
  const { shop, hasCollection, mainTheme } = useLoaderData();

  const themeEditorUrl = mainTheme
    ? `https://${shop}/admin/themes/${mainTheme.id.split("/").pop()}/editor?template=product&addAppBlockId=upcell-bundle`
    : `https://${shop}/admin/themes/current/editor`;

  return (
    <Page title="Upcell Bundle & Save">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="start">
                <Text as="h2" variant="headingMd">
                  Setup
                </Text>
                {hasCollection ? (
                  <Badge tone="success">Packages collection ready</Badge>
                ) : (
                  <Badge tone="attention">Packages collection missing</Badge>
                )}
              </InlineStack>

              <Text as="p" variant="bodyMd">
                This app uses a Theme App Extension block, so nothing is
                injected into your theme files. Add the block once from the
                theme editor and it will keep working through theme changes.
              </Text>

              <List type="number">
                <List.Item>
                  Create bundle products and add them to the{" "}
                  <strong>Packages</strong> collection.
                </List.Item>
                <List.Item>
                  Tag each bundle product with <strong>is-bundle</strong>{" "}
                  plus a shared category tag (e.g. <strong>haircare</strong>).
                </List.Item>
                <List.Item>
                  Tag matching single products with the same category tag.
                </List.Item>
                <List.Item>
                  Open the theme editor, go to a product page, click{" "}
                  <strong>Add block → Apps</strong>, and drag in{" "}
                  <strong>Upcell: Bundle & Save</strong> wherever you'd like
                  it to appear.
                </List.Item>
              </List>

              <InlineStack gap="200">
                <Button url={themeEditorUrl} target="_blank" variant="primary">
                  Open theme editor
                </Button>
                {!hasCollection && (
                  <form method="post">
                    <Button submit>Create Packages collection</Button>
                  </form>
                )}
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
