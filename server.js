const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const HOST = process.env.HOST;

// ============================================
// BUNDLE LIQUID — Universal Section File
// This works on ALL themes as a standalone section
// ============================================
const BUNDLE_SECTION_CONTENT = `
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
.ub-btn:hover{background:#2e7d32;color:#fff}
</style>

{% schema %}
{
  "name": "Upcell Bundles",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "Available Bundles"
    }
  ]
}
{% endschema %}
`;

// Bundle code for legacy themes (product-template.liquid injection)
const LEGACY_BUNDLE_LIQUID = `
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

const BUNDLE_CSS = `
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
.ub-btn:hover{background:#2e7d32;color:#fff}
</style>`;

// ============================================
// EXPRESS ROUTES
// ============================================

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Upcell Bundle & Product</title>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f6f7}
    .hero{background:linear-gradient(135deg,#1a1a2e,#0f3460);color:white;padding:80px 20px;text-align:center}
    .hero h1{font-size:40px;margin-bottom:12px}.hero p{font-size:17px;opacity:.8;margin-bottom:40px;color:#ccc}
    .btn{background:white;color:#1a1a2e;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block}
    .features{max-width:900px;margin:60px auto;padding:0 20px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
    .feature{background:white;border-radius:12px;padding:28px 20px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    .feature .icon{font-size:40px;margin-bottom:14px}.feature h3{font-size:17px;margin-bottom:10px}.feature p{color:#666;font-size:13px;line-height:1.6}
    .how{background:white;padding:60px 20px;text-align:center}.how h2{font-size:30px;margin-bottom:32px}
    .steps{max-width:680px;margin:0 auto;display:grid;gap:14px}
    .step{display:flex;align-items:flex-start;gap:18px;background:#f6f6f7;padding:18px 20px;border-radius:10px;text-align:left}
    .step-num{background:#2e7d32;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}
    .install-section{background:linear-gradient(135deg,#1a1a2e,#0f3460);color:white;padding:60px 20px;text-align:center}
    .install-section h2{font-size:30px;margin-bottom:14px}.install-section p{opacity:.8;margin-bottom:28px;color:#ccc}
    .install-form{max-width:500px;margin:0 auto;display:flex;gap:10px}
    .install-form input{flex:1;padding:13px;border-radius:8px;border:none;font-size:14px}
    .install-form button{background:white;color:#1a1a2e;padding:13px 22px;border-radius:8px;border:none;font-weight:700;cursor:pointer;white-space:nowrap}
    footer{background:#111;color:#666;padding:24px;text-align:center;font-size:13px}
    footer a{color:#888;text-decoration:none;margin:0 8px}
    .social-links{display:flex;gap:14px;justify-content:center;align-items:center;margin-top:14px}
    .social-links a{color:#666;transition:color .2s}.social-links a:hover{color:#fff}
    @media(max-width:768px){.features{grid-template-columns:1fr}.install-form{flex-direction:column}}
  </style>
</head>
<body>
  <div class="hero">
    <h1>🎁 Upcell Bundle & Product</h1>
    <p>Automatically show bundle products on single product pages.<br>Works with ALL Shopify themes — Legacy & 2.0</p>
    <a href="#install" class="btn">Install Free →</a>
  </div>
  <div class="features">
    <div class="feature"><div class="icon">⚡</div><h3>All Themes</h3><p>Works with every Shopify theme — Legacy themes and Shopify 2.0 Online Store themes.</p></div>
    <div class="feature"><div class="icon">🎯</div><h3>Smart Matching</h3><p>Tag-based matching shows the right bundle for each product. Case-insensitive.</p></div>
    <div class="feature"><div class="icon">🆓</div><h3>100% Free</h3><p>Completely free forever. No hidden fees, no credit card required.</p></div>
  </div>
  <div class="how">
    <h2>How It Works</h2>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><div><strong>Install the app</strong> — Code automatically added to your theme</div></div>
      <div class="step"><div class="step-num">2</div><div><strong>Add bundles to Packages collection</strong> — Create bundle products in Shopify</div></div>
      <div class="step"><div class="step-num">3</div><div><strong>Tag products</strong> — Add <strong>is-bundle</strong> + shared tag to bundle. Same tag to single product.</div></div>
      <div class="step"><div class="step-num">4</div><div><strong>Done!</strong> — Bundles appear automatically on product pages 🎁</div></div>
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
    <p><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="mailto:shohidul.islam.dev@gmail.com">Support</a></p>
    <p style="margin-top:8px">Built by <strong style="color:#ccc">Shohidul Islam</strong></p>
    <div class="social-links">
      <a href="https://github.com/shohiduldev" target="_blank" title="GitHub"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg></a>
      <a href="https://linkedin.com/in/shohiduldev" target="_blank" title="LinkedIn"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
      <a href="https://twitter.com/shohiduldev" target="_blank" title="Twitter"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
      <a href="https://facebook.com/shohiduldev" target="_blank" title="Facebook"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
      <a href="https://instagram.com/shohiduldev" target="_blank" title="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></a>
      <a href="https://youtube.com/@shohiduldev" target="_blank" title="YouTube"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg></a>
    </div>
    <p style="margin-top:14px">© 2026 Upcell Bundle & Product. All rights reserved.</p>
  </footer>
</body>
</html>`);
});

app.get("/privacy", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Privacy Policy</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.8}h1{color:#2e7d32}a{color:#2e7d32}</style></head><body>
  <a href="/">← Back</a><h1>Privacy Policy — Upcell Bundle & Product</h1>
  <p><strong>Last updated:</strong> June 2026 | <strong>Contact:</strong> <a href="mailto:shohidul.islam.dev@gmail.com">shohidul.islam.dev@gmail.com</a></p>
  <h2>1. Information We Collect</h2><p>We only access your Shopify theme files to inject bundle display code. We do not collect, store, or share any personal data.</p>
  <h2>2. How We Use Your Information</h2><p>Your Shopify access token is used only to read and update theme files during installation. Not stored permanently.</p>
  <h2>3. Data Sharing</h2><p>We do not sell, trade, or share any data with third parties.</p>
  <h2>4. GDPR Compliance</h2><p>No customer personal data is collected or processed.</p>
  <h2>5. CCPA Compliance</h2><p>We do not sell personal information.</p>
  <h2>6. Security</h2><p>All communications are encrypted using HTTPS/TLS.</p>
  <h2>7. Contact</h2><p><a href="mailto:shohidul.islam.dev@gmail.com">shohidul.islam.dev@gmail.com</a></p>
  </body></html>`);
});

app.get("/terms", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Terms of Service</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.8}h1{color:#2e7d32}a{color:#2e7d32}</style></head><body>
  <a href="/">← Back</a><h1>Terms of Service — Upcell Bundle & Product</h1>
  <p><strong>Last updated:</strong> June 2026</p>
  <h2>1. Acceptance</h2><p>By installing this app, you agree to these terms.</p>
  <h2>2. Service</h2><p>Free app that injects bundle display code into your Shopify theme.</p>
  <h2>3. Theme Modification</h2><p>By installing, you authorize us to modify your active theme. Backup your theme before installation.</p>
  <h2>4. Compatibility</h2><p>Works with Legacy themes and Shopify 2.0 themes.</p>
  <h2>5. Limitation of Liability</h2><p>Not liable for any damages from use of this app.</p>
  <h2>6. Contact</h2><p><a href="mailto:shohidul.islam.dev@gmail.com">shohidul.islam.dev@gmail.com</a></p>
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
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token");

    const result = await injectBundleCode(shop, tokenData.access_token);

    res.send(`<!DOCTYPE html><html><head><title>Installed!</title>
    <style>body{font-family:sans-serif;max-width:600px;margin:60px auto;padding:20px;text-align:center}
    h1{color:#2e7d32}.btn{display:inline-block;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:6px;background:#2e7d32;color:white}
    .steps{background:#f6f6f7;border-radius:12px;padding:24px;text-align:left;margin:24px 0}
    ol li{margin-bottom:10px;color:#444;font-size:14px}
    .method{background:#e8f5e9;border:1px solid #66bb6a;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:14px;color:#2e7d32}</style></head>
    <body>
    <div style="font-size:64px">✅</div>
    <h1>Installation Complete!</h1>
    <div class="method">${result.method === 'legacy' ? '✅ Injected into product-template.liquid (Legacy theme)' : result.method === 'section' ? '✅ Added as upcell-bundles.liquid section (Shopify 2.0 theme) — Add the section to your product page template in Theme Editor' : '⚠️ Already installed — no changes made'}</div>
    <div class="steps"><h3 style="margin-bottom:14px">📋 Next Steps:</h3><ol>
    <li>Add bundle products to <strong>Packages</strong> collection</li>
    <li>Tag bundle products: <strong>is-bundle</strong> + shared tag (e.g. <strong>haircare</strong>)</li>
    <li>Tag single products with the same shared tag</li>
    ${result.method === 'section' ? '<li><strong>Go to Theme Editor → Product page → Add section → Upcell Bundles</strong></li>' : ''}
    <li>Bundles automatically appear on product pages! 🎁</li>
    </ol></div>
    <a href="https://${shop}/admin" class="btn">Go to Admin</a>
    <a href="https://${shop}/admin/themes/current/editor" class="btn" style="background:#555">Theme Editor</a>
    </body></html>`);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).send(`<html><body style="font-family:sans-serif;max-width:500px;margin:60px auto;padding:20px;text-align:center">
    <h2 style="color:red">Installation Failed</h2><p>${err.message}</p>
    <p><a href="/">Try again</a> or <a href="mailto:shohidul.islam.dev@gmail.com">contact support</a></p>
    </body></html>`);
  }
});

// GDPR Webhooks
app.post("/webhooks/customers/redact", (req, res) => res.sendStatus(200));
app.post("/webhooks/shop/redact", (req, res) => res.sendStatus(200));
app.post("/webhooks/customers/data_request", (req, res) => res.sendStatus(200));
app.post("/webhooks/app/uninstalled", (req, res) => res.sendStatus(200));

// ============================================
// UNIVERSAL INJECT — Works on ALL themes
// ============================================
async function injectBundleCode(shop, accessToken) {
  const headers = { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" };

  // Get active theme
  const themesRes = await fetch(`https://${shop}/admin/api/2024-01/themes.json`, { headers });
  const themesData = await themesRes.json();
  const activeTheme = themesData.themes.find((t) => t.role === "main");
  if (!activeTheme) throw new Error("No active theme found");

  const themeId = activeTheme.id;

  // ---- Try Legacy Theme (product-template.liquid) ----
  const legacyRes = await fetch(
    `https://${shop}/admin/api/2024-01/themes/${themeId}/assets.json?asset[key]=sections/product-template.liquid`,
    { headers }
  );
  const legacyData = await legacyRes.json();

  if (legacyData.asset && legacyData.asset.value) {
    let content = legacyData.asset.value;

    // Already installed
    if (content.includes("<!-- started of bundel -->")) return { method: "already" };

    // Try to inject
    const targets = [
      `{% when 'custom' %}\n\t\t\t\t\t\t\t\t{{blockTitle}}\n\t\t\t\t\t\t\t\t<div id="tab{{block.id}}" class="{{tabClass}} rte">{{block.settings.content}}</div>`,
      `{% when 'custom' %}\n							{{blockTitle}}\n							<div id="tab{{block.id}}" class="{{tabClass}} rte">{{block.settings.content}}</div>`,
    ];

    let injected = false;
    for (const target of targets) {
      if (content.includes(target)) {
        content = content.replace(target, target + "\n" + LEGACY_BUNDLE_LIQUID);
        injected = true;
        break;
      }
    }

    if (injected) {
      if (content.includes("{% schema %}")) {
        content = content.replace("{% schema %}", BUNDLE_CSS + "\n\n{% schema %}");
      }
      await fetch(`https://${shop}/admin/api/2024-01/themes/${themeId}/assets.json`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ asset: { key: "sections/product-template.liquid", value: content } }),
      });
      return { method: "legacy" };
    }
  }

  // ---- Shopify 2.0 Theme — Add as standalone section ----
  // Check if already installed
  const existingRes = await fetch(
    `https://${shop}/admin/api/2024-01/themes/${themeId}/assets.json?asset[key]=sections/upcell-bundles.liquid`,
    { headers }
  );
  const existingData = await existingRes.json();
  if (existingData.asset) return { method: "already" };

  // Create new section file
  await fetch(`https://${shop}/admin/api/2024-01/themes/${themeId}/assets.json`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ asset: { key: "sections/upcell-bundles.liquid", value: BUNDLE_SECTION_CONTENT } }),
  });

  return { method: "section" };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
module.exports = app;