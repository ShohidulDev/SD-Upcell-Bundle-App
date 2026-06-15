const express = require("express");
const nodeFetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const HOST = process.env.HOST;

// Safe fetch using node-fetch
async function apiFetch(url, options = {}) {
  const res = await nodeFetch(url, options);
  const text = await res.text();
  if (!text || text.trim() === "") {
    throw new Error(`Empty response from Shopify API (status: ${res.status})`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`API Error: ${text.substring(0, 300)}`);
  }
}

const BUNDLE_SECTION = `{%- assign current_tags_lower2 = '' -%}
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
        {%- if ptag_check2 == 'is-bundle' -%}{%- assign p_is_bundle2 = true -%}{%- break -%}{%- endif -%}
      {%- endfor -%}
      {%- if p_is_bundle2 and p.handle != product.handle -%}
        {%- assign matched2 = false -%}
        {%- for ptag in p.tags -%}
          {%- assign ptag_lower2 = ptag | downcase -%}
          {%- unless ptag_lower2 == 'is-bundle' -%}
            {%- if current_tags_lower2 contains ptag_lower2 -%}{%- assign matched2 = true -%}{%- break -%}{%- endif -%}
          {%- endunless -%}
        {%- endfor -%}
        {%- if matched2 -%}
          <div class="ub-item">
            <a href="{{ p.url }}" class="ub-link">
              <div class="ub-img">{%- if p.featured_image -%}<img src="{{ p.featured_image | img_url: '120x120' }}" alt="{{ p.title | escape }}" width="60" height="60">{%- endif -%}</div>
              <div class="ub-info">
                <span class="ub-title">{{ p.title }}</span>
                <span class="ub-price">{{ p.price | money }}</span>
              </div>
            </a>
            <a href="{{ p.url }}" class="ub-btn">View Bundle</a>
          </div>
        {%- endif -%}
      {%- endif -%}
    {%- endfor -%}
  {%- endif -%}
{%- endcapture -%}
{%- assign ship_bundle_items = ship_bundle_items | strip -%}
{%- unless ship_bundle_items == blank -%}
<div class="ub-wrap">
  <div class="ub-header">
    <span class="ub-badge">Bundle & Save</span>
    <h4 class="ub-heading">{{ section.settings.title }}</h4>
  </div>
  <div class="ub-list">{{ ship_bundle_items }}</div>
</div>
{%- endunless -%}
<style>
.ub-wrap{border:1px solid #e8e8e8;border-radius:8px;padding:16px;margin:20px 0;background:#fafafa}
.ub-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.ub-badge{background:#2e7d32;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;padding:3px 10px;border-radius:20px;white-space:nowrap}
.ub-heading{font-size:14px;font-weight:600;margin:0;color:#333}
.ub-list{display:flex;flex-direction:column;gap:10px}
.ub-item{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #ececec;border-radius:6px;padding:10px 12px;gap:10px}
.ub-link{display:flex;align-items:center;gap:12px;text-decoration:none;flex:1}
.ub-img img{width:52px;height:52px;object-fit:cover;border-radius:4px}
.ub-info{display:flex;flex-direction:column;gap:3px}
.ub-title{font-size:13px;font-weight:600;color:#222}
.ub-price{font-size:13px;color:#2e7d32;font-weight:700}
.ub-btn{background:#222;color:#fff;font-size:12px;font-weight:600;padding:7px 14px;border-radius:4px;text-decoration:none;white-space:nowrap}
.ub-btn:hover{background:#2e7d32}
</style>
{% schema %}
{
  "name": "Upcell Bundles",
  "settings": [
    {"type":"text","id":"title","label":"Title","default":"Available Bundles"}
  ],
  "presets": [{"name":"Upcell Bundles"}]
}
{% endschema %}`;

const LEGACY_LIQUID = `
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
                        {%- if ptag_check2 == 'is-bundle' -%}{%- assign p_is_bundle2 = true -%}{%- break -%}{%- endif -%}
                      {%- endfor -%}
                      {%- if p_is_bundle2 and p.handle != product.handle -%}
                        {%- assign matched2 = false -%}
                        {%- for ptag in p.tags -%}
                          {%- assign ptag_lower2 = ptag | downcase -%}
                          {%- unless ptag_lower2 == 'is-bundle' -%}
                            {%- if current_tags_lower2 contains ptag_lower2 -%}{%- assign matched2 = true -%}{%- break -%}{%- endif -%}
                          {%- endunless -%}
                        {%- endfor -%}
                        {%- if matched2 -%}
                          <div class="ub-item">
                            <a href="{{ p.url }}" class="ub-link">
                              <div class="ub-img">{%- if p.featured_image -%}<img src="{{ p.featured_image | img_url: '120x120' }}" alt="{{ p.title | escape }}" width="60" height="60">{%- endif -%}</div>
                              <div class="ub-info">
                                <span class="ub-title">{{ p.title }}</span>
                                <span class="ub-price">{{ p.price | money }}</span>
                              </div>
                            </a>
                            <a href="{{ p.url }}" class="ub-btn">View Bundle</a>
                          </div>
                        {%- endif -%}
                      {%- endif -%}
                    {%- endfor -%}
                  {%- endif -%}
                {%- endcapture -%}
                {%- assign ship_bundle_items = ship_bundle_items | strip -%}
                {%- unless ship_bundle_items == blank -%}
                  <div class="ub-wrap">
                    <div class="ub-header">
                      <span class="ub-badge">Bundle & Save</span>
                      <h4 class="ub-heading">Available Bundles</h4>
                    </div>
                    <div class="ub-list">{{ ship_bundle_items }}</div>
                  </div>
                {%- endunless -%}
                <!-- End of bundel -->
              {%- endif -%}`;

const BUNDLE_CSS = `<style>
.ub-wrap{border:1px solid #e8e8e8;border-radius:8px;padding:16px;margin:20px 0;background:#fafafa}
.ub-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.ub-badge{background:#2e7d32;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;padding:3px 10px;border-radius:20px}
.ub-heading{font-size:14px;font-weight:600;margin:0;color:#333}
.ub-list{display:flex;flex-direction:column;gap:10px}
.ub-item{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #ececec;border-radius:6px;padding:10px 12px;gap:10px}
.ub-link{display:flex;align-items:center;gap:12px;text-decoration:none;flex:1}
.ub-img img{width:52px;height:52px;object-fit:cover;border-radius:4px}
.ub-info{display:flex;flex-direction:column;gap:3px}
.ub-title{font-size:13px;font-weight:600;color:#222}
.ub-price{font-size:13px;color:#2e7d32;font-weight:700}
.ub-btn{background:#222;color:#fff;font-size:12px;font-weight:600;padding:7px 14px;border-radius:4px;text-decoration:none;white-space:nowrap}
.ub-btn:hover{background:#2e7d32}
</style>`;

// Routes
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Upcell Bundle & Product</title>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#f6f6f7}
  .hero{background:linear-gradient(135deg,#1a1a2e,#0f3460);color:white;padding:80px 20px;text-align:center}
  .hero h1{font-size:40px;margin-bottom:12px}.hero p{font-size:17px;opacity:.8;margin-bottom:36px;color:#ccc}
  .btn{background:white;color:#1a1a2e;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block}
  .features{max-width:900px;margin:60px auto;padding:0 20px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .feature{background:white;border-radius:12px;padding:28px 20px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .feature .icon{font-size:40px;margin-bottom:12px}.feature h3{margin-bottom:8px}.feature p{color:#666;font-size:13px;line-height:1.6}
  .install-section{background:linear-gradient(135deg,#1a1a2e,#0f3460);color:white;padding:60px 20px;text-align:center}
  .install-section h2{font-size:30px;margin-bottom:14px}.install-section p{opacity:.8;margin-bottom:28px;color:#ccc}
  .install-form{max-width:500px;margin:0 auto;display:flex;gap:10px}
  .install-form input{flex:1;padding:13px;border-radius:8px;border:none;font-size:14px}
  .install-form button{background:white;color:#1a1a2e;padding:13px 22px;border-radius:8px;border:none;font-weight:700;cursor:pointer}
  footer{background:#111;color:#666;padding:24px;text-align:center;font-size:13px}footer a{color:#888;text-decoration:none;margin:0 8px}
  @media(max-width:700px){.features{grid-template-columns:1fr}.install-form{flex-direction:column}}</style>
  </head><body>
  <div class="hero">
    <h1>🎁 Upcell Bundle & Product</h1>
    <p>Show bundle products on single product pages automatically.<br>Works with ALL Shopify themes — Legacy & 2.0</p>
    <a href="#install" class="btn">Install Free →</a>
  </div>
  <div class="features">
    <div class="feature"><div class="icon">⚡</div><h3>All Themes</h3><p>Works with every Shopify theme including Shopify 2.0.</p></div>
    <div class="feature"><div class="icon">🎯</div><h3>Smart Matching</h3><p>Tag-based matching. Case-insensitive. Shows right bundle for each product.</p></div>
    <div class="feature"><div class="icon">🆓</div><h3>100% Free</h3><p>Completely free forever. No hidden fees.</p></div>
  </div>
  <div class="install-section" id="install">
    <h2>Install on Your Store</h2>
    <p>Enter your Shopify store URL to get started</p>
    <form class="install-form" action="/install" method="GET">
      <input type="text" name="shop" placeholder="yourstore.myshopify.com" required />
      <button type="submit">Install Free →</button>
    </form>
  </div>
  <footer>
    <p><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="mailto:shohidul.islam.dev@gmail.com">Support</a></p>
    <p style="margin-top:8px">Built by <strong style="color:#ccc">Shohidul Islam</strong> | © 2026</p>
  </footer></body></html>`);
});

app.get("/privacy", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Privacy Policy</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.8}h1{color:#2e7d32}a{color:#2e7d32}</style></head><body>
  <a href="/">← Back</a><h1>Privacy Policy</h1><p><strong>Last updated:</strong> June 2026 | <a href="mailto:shohidul.islam.dev@gmail.com">shohidul.islam.dev@gmail.com</a></p>
  <h2>1. Data We Collect</h2><p>We only access theme files to inject bundle code. No personal data collected or stored.</p>
  <h2>2. Data Sharing</h2><p>We do not sell or share any data.</p>
  <h2>3. GDPR & CCPA</h2><p>No customer personal data is collected or processed.</p>
  <h2>4. Security</h2><p>All communications encrypted via HTTPS/TLS.</p>
  <h2>5. Contact</h2><p><a href="mailto:shohidul.islam.dev@gmail.com">shohidul.islam.dev@gmail.com</a></p>
  </body></html>`);
});

app.get("/terms", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Terms of Service</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.8}h1{color:#2e7d32}a{color:#2e7d32}</style></head><body>
  <a href="/">← Back</a><h1>Terms of Service</h1><p><strong>Last updated:</strong> June 2026</p>
  <h2>1. Acceptance</h2><p>By installing, you agree to these terms.</p>
  <h2>2. Service</h2><p>Free app that injects bundle display code into your Shopify theme.</p>
  <h2>3. Liability</h2><p>Not liable for any damages. Backup theme before installation.</p>
  <h2>4. Contact</h2><p><a href="mailto:shohidul.islam.dev@gmail.com">shohidul.islam.dev@gmail.com</a></p>
  </body></html>`);
});

app.get("/install", (req, res) => {
  let shop = req.query.shop;
  if (!shop) return res.redirect("/#install");
  if (!shop.includes(".myshopify.com")) shop = shop + ".myshopify.com";
  const redirectUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=write_themes,read_themes,read_products&redirect_uri=${HOST}/auth/callback`;
  res.redirect(redirectUrl);
});

app.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;
  if (!shop || !code) return res.status(400).send("Invalid request");
  try {
    // Get access token using node-fetch
    const tokenData = await apiFetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code }),
    });

    const access_token = tokenData.access_token;
    if (!access_token) throw new Error(`No access token. Response: ${JSON.stringify(tokenData)}`);

    const result = await injectBundleCode(shop, access_token);

    res.send(`<!DOCTYPE html><html><head><title>Installed!</title>
    <style>body{font-family:sans-serif;max-width:600px;margin:60px auto;padding:20px;text-align:center}
    h1{color:#2e7d32}.btn{display:inline-block;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:6px;background:#2e7d32;color:white}
    .steps{background:#f6f6f7;border-radius:12px;padding:20px;text-align:left;margin:20px 0}ol li{margin-bottom:8px;color:#444;font-size:14px}
    .badge{background:#e8f5e9;border:1px solid #66bb6a;border-radius:8px;padding:10px 14px;margin-bottom:18px;font-size:14px;color:#2e7d32}</style></head>
    <body>
    <div style="font-size:60px">✅</div>
    <h1>Installation Complete!</h1>
    <div class="badge">
      ${result.method === 'legacy' ? '✅ Injected into product-template.liquid (Legacy theme)' :
        result.method === 'section' ? '✅ Added upcell-bundles.liquid section — Add it in Theme Editor' :
        '⚠️ Already installed'}
    </div>
    <div class="steps"><h3 style="margin-bottom:12px">Next Steps:</h3><ol>
    <li>Add bundle products to <strong>Packages</strong> collection</li>
    <li>Tag bundle: <strong>is-bundle</strong> + shared tag (e.g. <strong>haircare</strong>)</li>
    <li>Tag single product with same shared tag</li>
    ${result.method === 'section' ? '<li><strong>Theme Editor → Product page → Add section → Upcell Bundles</strong></li>' : ''}
    <li>Bundles appear automatically! 🎁</li>
    </ol></div>
    <a href="https://${shop}/admin" class="btn">Go to Admin</a>
    ${result.method === 'section' ? `<a href="https://${shop}/admin/themes/current/editor" class="btn" style="background:#555">Theme Editor</a>` : ''}
    </body></html>`);

  } catch (err) {
    console.error("Install error:", err.message);
    res.status(500).send(`<html><body style="font-family:sans-serif;max-width:500px;margin:60px auto;padding:20px;text-align:center">
    <h2 style="color:red">Installation Failed</h2><p style="color:#666">${err.message}</p>
    <p><a href="/">Try again</a> or <a href="mailto:shohidul.islam.dev@gmail.com">contact support</a></p>
    </body></html>`);
  }
});

// GDPR Webhooks
app.post("/webhooks/customers/redact", (req, res) => res.sendStatus(200));
app.post("/webhooks/shop/redact", (req, res) => res.sendStatus(200));
app.post("/webhooks/customers/data_request", (req, res) => res.sendStatus(200));
app.post("/webhooks/app/uninstalled", (req, res) => res.sendStatus(200));

async function injectBundleCode(shop, accessToken) {
  const headers = { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" };
  const API = `https://${shop}/admin/api/2024-01`;

  const themesData = await apiFetch(`${API}/themes.json`, { headers });
  const activeTheme = themesData.themes.find((t) => t.role === "main");
  if (!activeTheme) throw new Error("No active theme found");
  const themeId = activeTheme.id;

  // Try legacy
  const legacyData = await apiFetch(
    `${API}/themes/${themeId}/assets.json?asset[key]=sections/product-template.liquid`,
    { headers }
  );

  if (legacyData.asset && legacyData.asset.value) {
    let content = legacyData.asset.value;
    if (content.includes("<!-- started of bundel -->")) return { method: "already" };

    const targets = [
      `{% when 'custom' %}\n\t\t\t\t\t\t\t\t{{blockTitle}}\n\t\t\t\t\t\t\t\t<div id="tab{{block.id}}" class="{{tabClass}} rte">{{block.settings.content}}</div>`,
      `{% when 'custom' %}\n							{{blockTitle}}\n							<div id="tab{{block.id}}" class="{{tabClass}} rte">{{block.settings.content}}</div>`,
    ];

    for (const target of targets) {
      if (content.includes(target)) {
        content = content.replace(target, target + "\n" + LEGACY_LIQUID);
        if (content.includes("{% schema %}")) {
          content = content.replace("{% schema %}", BUNDLE_CSS + "\n\n{% schema %}");
        }
        await apiFetch(`${API}/themes/${themeId}/assets.json`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ asset: { key: "sections/product-template.liquid", value: content } }),
        });
        return { method: "legacy" };
      }
    }
  }

  // Shopify 2.0
  const existingData = await apiFetch(
    `${API}/themes/${themeId}/assets.json?asset[key]=sections/upcell-bundles.liquid`,
    { headers }
  );
  if (existingData.asset) return { method: "already" };

  await apiFetch(`${API}/themes/${themeId}/assets.json`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ asset: { key: "sections/upcell-bundles.liquid", value: BUNDLE_SECTION } }),
  });

  return { method: "section" };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
module.exports = app;