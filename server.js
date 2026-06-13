const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const HOST = process.env.HOST;

// ============================================
// BUNDLE LIQUID CODE
// ============================================
const BUNDLE_LIQUID = `
              {%- if block.settings.title == 'SHIPPING & RETURNS' -%}
                <!-- started of bundel -->
                {%- assign current_tags_lower2 = '' -%}
                {%- for tag in product.tags -%}
                  {%- assign tl = tag | downcase -%}
                  {%- unless tl == 'is-bundle' -%}
                    {%- assign current_tags_lower2 = current_tags_lower2 | append: tl | append: ',' -%}
                  {%- endunless -%}
                {%- endfor -%}
                {%- capture ship_bundle_items -%}
                  {%- assign bundle_col = collections['packages'] -%}
                  {%- if bundle_col -%}
                    {%- for p in bundle_col.products limit: 50 -%}
                      {%- assign p_is_bundle2 = false -%}
                      {%- for ptag in p.tags -%}
                        {%- assign ptag_check2 = ptag | downcase -%}
                        {%- if ptag_check2 == 'is-bundle' -%}
                          {%- assign p_is_bundle2 = true -%}
                          {%- break -%}
                        {%- endif -%}
                      {%- endfor -%}
                      {%- if p_is_bundle2 and p.handle != product.handle -%}
                        {%- assign matched2 = false -%}
                        {%- for ptag in p.tags -%}
                          {%- assign ptag_lower2 = ptag | downcase -%}
                          {%- unless ptag_lower2 == 'is-bundle' -%}
                            {%- if current_tags_lower2 contains ptag_lower2 -%}
                              {%- assign matched2 = true -%}
                              {%- break -%}
                            {%- endif -%}
                          {%- endunless -%}
                        {%- endfor -%}
                        {%- if matched2 -%}
                          <div class="inline-bundle-item">
                            <a href="{{ p.url }}" class="inline-bundle-link">
                              <div class="inline-bundle-img">
                                {%- if p.featured_image -%}<img src="{{ p.featured_image | img_url: '120x120' }}" alt="{{ p.title | escape }}" width="60" height="60">{%- endif -%}
                              </div>
                              <div class="inline-bundle-info">
                                <span class="inline-bundle-title">{{ p.title }}</span>
                                <span class="inline-bundle-price">{{ p.price | money }}</span>
                              </div>
                            </a>
                            <a href="{{ p.url }}" class="inline-bundle-btn">View Bundle</a>
                          </div>
                        {%- endif -%}
                      {%- endif -%}
                    {%- endfor -%}
                  {%- endif -%}
                {%- endcapture -%}
                {%- assign ship_bundle_items = ship_bundle_items | strip -%}
                {%- unless ship_bundle_items == blank -%}
                  <div class="inline-bundles-wrap">
                    <div class="inline-bundles-header">
                      <span class="inline-bundles-badge">Bundle & Save</span>
                      <h4 class="inline-bundles-title">Available Bundles</h4>
                    </div>
                    <div class="inline-bundles-list">{{ ship_bundle_items }}</div>
                  </div>
                {%- endunless -%}
                <!-- End of bundel -->
              {%- endif -%}`;

const BUNDLE_CSS = `
<style>
.inline-bundles-wrap { border: 1px solid #e8e8e8; border-radius: 8px; padding: 16px; margin-top: 20px; background: #fafafa; }
.inline-bundles-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.inline-bundles-badge { background: #2e7d32; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.inline-bundles-title { font-size: 14px; font-weight: 600; margin: 0; color: #333; }
.inline-bundles-list { display: flex; flex-direction: column; gap: 10px; }
.inline-bundle-item { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid #ececec; border-radius: 6px; padding: 10px 12px; gap: 10px; }
.inline-bundle-link { display: flex; align-items: center; gap: 12px; text-decoration: none; flex: 1; }
.inline-bundle-img img { width: 52px; height: 52px; object-fit: cover; border-radius: 4px; border: 1px solid #eee; }
.inline-bundle-info { display: flex; flex-direction: column; gap: 3px; }
.inline-bundle-title { font-size: 13px; font-weight: 600; color: #222; line-height: 1.3; }
.inline-bundle-price { font-size: 13px; color: #2e7d32; font-weight: 700; }
.inline-bundle-btn { background: #222; color: #fff; font-size: 12px; font-weight: 600; padding: 7px 14px; border-radius: 4px; text-decoration: none; white-space: nowrap; transition: background 0.2s; }
.inline-bundle-btn:hover { background: #2e7d32; color: #fff; }
</style>`;

// ============================================
// HOME PAGE
// ============================================
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Upcell Bundle & Product</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f6f6f7; }
    .hero { background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); color: white; padding: 80px 20px; text-align: center; }
    .hero h1 { font-size: 42px; margin-bottom: 12px; }
    .hero p { font-size: 18px; opacity: 0.8; margin-bottom: 40px; }
    .btn { background: white; color: #1a1a2e; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 18px; display: inline-block; }
    .features { max-width: 900px; margin: 60px auto; padding: 0 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .feature { background: white; border-radius: 12px; padding: 32px 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .feature .icon { font-size: 48px; margin-bottom: 16px; }
    .feature h3 { font-size: 18px; margin-bottom: 12px; }
    .feature p { color: #666; line-height: 1.6; font-size: 14px; }
    .install-section { background: linear-gradient(135deg, #1a1a2e, #0f3460); color: white; padding: 60px 20px; text-align: center; }
    .install-section h2 { font-size: 32px; margin-bottom: 16px; }
    .install-section p { font-size: 16px; opacity: 0.8; margin-bottom: 32px; }
    .install-form { max-width: 500px; margin: 0 auto; display: flex; gap: 12px; }
    .install-form input { flex: 1; padding: 14px; border-radius: 8px; border: none; font-size: 15px; }
    .install-form button { background: white; color: #1a1a2e; padding: 14px 24px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; }
    .steps { max-width: 700px; margin: 40px auto; display: grid; gap: 16px; }
    .step { display: flex; align-items: flex-start; gap: 20px; background: #f6f6f7; padding: 20px; border-radius: 10px; }
    .step-num { background: #2e7d32; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .how { background: white; padding: 60px 20px; text-align: center; }
    .how h2 { font-size: 32px; margin-bottom: 8px; }
    footer { background: #111; color: #666; padding: 24px; text-align: center; font-size: 13px; }
    footer a { color: #888; text-decoration: none; margin: 0 8px; }
    @media(max-width: 768px) { .features { grid-template-columns: 1fr; } .install-form { flex-direction: column; } }
  </style>
</head>
<body>
  <div class="hero">
    <h1>🎁 Upcell Bundle & Product</h1>
    <p>Automatically show bundle products on single product pages.<br>Boost your average order value with zero effort.</p>
    <a href="#install" class="btn">Install Free →</a>
  </div>

  <div class="features">
    <div class="feature">
      <div class="icon">⚡</div>
      <h3>Auto Inject</h3>
      <p>One click install. Bundle code automatically added to your theme.</p>
    </div>
    <div class="feature">
      <div class="icon">🎯</div>
      <h3>Smart Tag Matching</h3>
      <p>Tag-based matching shows the right bundle for each product.</p>
    </div>
    <div class="feature">
      <div class="icon">🆓</div>
      <h3>100% Free</h3>
      <p>Completely free forever. No hidden fees or premium plans.</p>
    </div>
  </div>

  <div class="how">
    <h2>How It Works</h2>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><div><strong>Install the app</strong><br><small>Bundle code automatically injected into your theme.</small></div></div>
      <div class="step"><div class="step-num">2</div><div><strong>Add bundles to Packages collection</strong><br><small>Create bundle products and add them to a collection named Packages.</small></div></div>
      <div class="step"><div class="step-num">3</div><div><strong>Tag your products</strong><br><small>Add is-bundle + shared tag to bundle. Add same tag to single product.</small></div></div>
      <div class="step"><div class="step-num">4</div><div><strong>Bundles appear automatically!</strong><br><small>Matching bundles show under Shipping & Returns. Done! 🎁</small></div></div>
    </div>
  </div>

  <div class="install-section" id="install">
    <h2>Install on Your Store</h2>
    <p>Enter your Shopify store URL to get started for free</p>
    <form class="install-form" action="/install" method="GET">
      <input type="text" name="shop" placeholder="yourstore.myshopify.com" required />
      <button type="submit">Install Free →</button>
    </form>
  </div>

  <footer>
    <p>
      Upcell Bundle & Product &nbsp;|&nbsp;
      <a href="/privacy">Privacy Policy</a> &nbsp;|&nbsp;
      <a href="/terms">Terms of Service</a> &nbsp;|&nbsp;
      <a href="mailto:shohidul.islam.dev@gmail.com">Support</a>
    </p>
    <p style="margin-top:8px;">Built by Shohidul Islam &nbsp;|&nbsp; <a href="https://github.com/shohiduldev">GitHub</a></p>
  </footer>
</body>
</html>`);
});

// Privacy Policy
app.get("/privacy", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Privacy Policy</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.8;}h1{color:#2e7d32;}a{color:#2e7d32;}</style></head><body>
  <h1>Privacy Policy — Upcell Bundle & Product</h1>
  <p><strong>Last updated:</strong> June 2026</p>
  <h2>1. Information We Collect</h2><p>We only access your Shopify theme files to inject bundle display code. We do not collect, store, or share any personal data.</p>
  <h2>2. How We Use Your Information</h2><p>Your Shopify access token is used only to read and update theme files during installation. It is not stored permanently.</p>
  <h2>3. Data Sharing</h2><p>We do not sell, trade, or share any data with third parties.</p>
  <h2>4. GDPR Compliance</h2><p>No customer personal data is collected or processed by this app.</p>
  <h2>5. Contact</h2><p><a href="mailto:shohidul.islam.dev@gmail.com">shohidul.islam.dev@gmail.com</a></p>
  <p><a href="/">← Back to Home</a></p>
  </body></html>`);
});

// Terms of Service
app.get("/terms", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Terms of Service</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.8;}h1{color:#2e7d32;}a{color:#2e7d32;}</style></head><body>
  <h1>Terms of Service — Upcell Bundle & Product</h1>
  <p><strong>Last updated:</strong> June 2026</p>
  <h2>1. Acceptance</h2><p>By installing this app, you agree to these terms.</p>
  <h2>2. Service</h2><p>This free app injects bundle display code into your Shopify theme.</p>
  <h2>3. Theme Modification</h2><p>By installing, you authorize us to modify your active theme. We recommend backing up your theme first.</p>
  <h2>4. Limitation of Liability</h2><p>We are not liable for any damages from use of this app.</p>
  <h2>5. Contact</h2><p><a href="mailto:shohidul.islam.dev@gmail.com">shohidul.islam.dev@gmail.com</a></p>
  <p><a href="/">← Back to Home</a></p>
  </body></html>`);
});

// Install
app.get("/install", (req, res) => {
  let shop = req.query.shop;
  if (!shop) return res.redirect("/#install");
  if (!shop.includes(".myshopify.com")) shop = shop + ".myshopify.com";
  const redirectUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=write_themes,read_themes,read_products&redirect_uri=${HOST}/auth/callback`;
  res.redirect(redirectUrl);
});

// OAuth Callback
app.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;
  if (!shop || !code) return res.status(400).send("Invalid request");
  try {
    const nodeFetch = require("node-fetch");
    const tokenRes = await nodeFetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code }),
    });
    const { access_token } = await tokenRes.json();
    if (!access_token) throw new Error("No access token");

    const result = await injectBundleCode(shop, access_token, nodeFetch);

    res.send(`<!DOCTYPE html><html><head><title>Installed!</title>
    <style>body{font-family:sans-serif;max-width:600px;margin:60px auto;padding:20px;text-align:center;}
    h1{color:#2e7d32;}.btn{display:inline-block;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:6px;background:#2e7d32;color:white;}
    .steps{background:#f6f6f7;border-radius:12px;padding:24px;text-align:left;margin:24px 0;}
    ol li{margin-bottom:10px;color:#444;font-size:14px;}</style></head>
    <body>
    <div style="font-size:72px;">✅</div>
    <h1>Installation Complete!</h1>
    <p>${result.alreadyInstalled ? "⚠️ Bundle code was already installed." : "🎉 Bundle code successfully added to your theme!"}</p>
    <div class="steps"><h3>Next Steps:</h3><ol>
    <li>Add bundle products to <strong>Packages</strong> collection</li>
    <li>Tag bundle products: <strong>is-bundle</strong> + shared tag (e.g. haircare)</li>
    <li>Tag single products with same shared tag</li>
    <li>Bundles appear automatically on product pages! 🎁</li>
    </ol></div>
    <a href="https://${shop}/admin" class="btn">Go to Shopify Admin</a>
    </body></html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error: ${err.message}. <a href="/">Try again</a>`);
  }
});

// GDPR Webhooks
app.post("/webhooks/customers/redact", (req, res) => res.sendStatus(200));
app.post("/webhooks/shop/redact", (req, res) => res.sendStatus(200));
app.post("/webhooks/customers/data_request", (req, res) => res.sendStatus(200));
app.post("/webhooks/app/uninstalled", (req, res) => res.sendStatus(200));

// Inject bundle code
async function injectBundleCode(shop, accessToken, nodeFetch) {
  const headers = { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" };
  const themesRes = await nodeFetch(`https://${shop}/admin/api/2023-10/themes.json`, { headers });
  const themesData = await themesRes.json();
  const activeTheme = themesData.themes.find((t) => t.role === "main");
  if (!activeTheme) throw new Error("No active theme found");

  const fileRes = await nodeFetch(
    `https://${shop}/admin/api/2023-10/themes/${activeTheme.id}/assets.json?asset[key]=sections/product-template.liquid`,
    { headers }
  );
  const fileData = await fileRes.json();
  if (!fileData.asset) throw new Error("product-template.liquid not found");

  let content = fileData.asset.value;
  if (content.includes("<!-- started of bundel -->")) return { alreadyInstalled: true };

  const target = `{% when 'custom' %}\n\t\t\t\t\t\t\t\t{{blockTitle}}\n\t\t\t\t\t\t\t\t<div id="tab{{block.id}}" class="{{tabClass}} rte">{{block.settings.content}}</div>`;
  if (!content.includes(target)) throw new Error("Injection point not found. Theme may not be compatible.");

  content = content.replace(target, target + "\n" + BUNDLE_LIQUID);
  content = content.replace("{% schema %}", BUNDLE_CSS + "\n\n{% schema %}");

  await nodeFetch(`https://${shop}/admin/api/2023-10/themes/${activeTheme.id}/assets.json`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ asset: { key: "sections/product-template.liquid", value: content } }),
  });

  return { alreadyInstalled: false };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));

module.exports = app;