const express = require("express");
const nodeFetch = require("node-fetch");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// Configure body-parser to save raw body for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const HOST = process.env.HOST;
const API_VERSION = "2026-01";

// Safe fetch using node-fetch
async function apiFetch(url, options = {}) {
  const method = options.method || "GET";
  const res = await nodeFetch(url, options);
  const text = await res.text();
  if (!text || text.trim() === "") {
    throw new Error(`Empty response from Shopify API (${method} ${url} status: ${res.status})`);
  }
  try {
    const json = JSON.parse(text);
    if (json.errors) {
      throw new Error(`Shopify API Error (${method} ${url}): ${JSON.stringify(json.errors)}`);
    }
    return json;
  } catch (e) {
    throw new Error(`API Error (${method} ${url}): ${text.substring(0, 300)}`);
  }
}

// HMAC validation helper
function verifyShopifyHmac(query, apiSecret) {
  const { hmac, ...params } = query;
  if (!hmac) return false;

  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const calculatedHmac = crypto
    .createHmac("sha256", apiSecret)
    .update(queryString)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(calculatedHmac), Buffer.from(hmac));
  } catch (e) {
    return false;
  }
}

// BUNDLE LIQUID FOR SHOPIFY 2.0 (AS A SECTION)
const BUNDLE_SECTION = `{%- assign current_tags_lower2 = ',' -%}
{%- for tag in product.tags -%}
  {%- assign tl = tag | downcase | strip -%}
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
        {%- assign ptag_check2 = ptag | downcase | strip -%}
        {%- if ptag_check2 == 'is-bundle' -%}{%- assign p_is_bundle2 = true -%}{%- break -%}{%- endif -%}
      {%- endfor -%}
      {%- if p_is_bundle2 and p.handle != product.handle -%}
        {%- assign matched2 = false -%}
        {%- for ptag in p.tags -%}
          {%- assign ptag_lower2 = ptag | downcase | strip -%}
          {%- unless ptag_lower2 == 'is-bundle' -%}
            {%- assign ptag_search = ',' | append: ptag_lower2 | append: ',' -%}
            {%- if current_tags_lower2 contains ptag_search -%}{%- assign matched2 = true -%}{%- break -%}{%- endif -%}
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
.ub-btn{background:#222;color:#fff;font-size:12px;font-weight:600;padding:7px 14px;border-radius:4px;text-decoration:none;white-space:nowrap;transition:background 0.2s}
.ub-btn:hover{background:#2e7d32}
@media (max-width: 480px) {
  .ub-item { flex-direction: column; align-items: stretch; padding: 14px 12px; gap: 12px; }
  .ub-link { flex-direction: column; text-align: center; }
  .ub-img img { width: 64px; height: 64px; }
  .ub-btn { text-align: center; padding: 10px; }
}
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

// BUNDLE SNIPPET FOR LEGACY THEMES
const LEGACY_LIQUID = `<!-- started of bundel -->
{%- assign current_tags_lower2 = ',' -%}
{%- for tag in product.tags -%}
  {%- assign tl = tag | downcase | strip -%}
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
        {%- assign ptag_check2 = ptag | downcase | strip -%}
        {%- if ptag_check2 == 'is-bundle' -%}{%- assign p_is_bundle2 = true -%}{%- break -%}{%- endif -%}
      {%- endfor -%}
      {%- if p_is_bundle2 and p.handle != product.handle -%}
        {%- assign matched2 = false -%}
        {%- for ptag in p.tags -%}
          {%- assign ptag_lower2 = ptag | downcase | strip -%}
          {%- unless ptag_lower2 == 'is-bundle' -%}
            {%- assign ptag_search = ',' | append: ptag_lower2 | append: ',' -%}
            {%- if current_tags_lower2 contains ptag_search -%}{%- assign matched2 = true -%}{%- break -%}{%- endif -%}
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
.ub-btn{background:#222;color:#fff;font-size:12px;font-weight:600;padding:7px 14px;border-radius:4px;text-decoration:none;white-space:nowrap;transition:background 0.2s}
.ub-btn:hover{background:#2e7d32}
@media (max-width: 480px) {
  .ub-item { flex-direction: column; align-items: stretch; padding: 14px 12px; gap: 12px; }
  .ub-link { flex-direction: column; text-align: center; }
  .ub-img img { width: 64px; height: 64px; }
  .ub-btn { text-align: center; padding: 10px; }
}
</style>
<!-- End of bundel -->`;

// SHARED PREMIUM CSS THEME
const FRONTEND_STYLE = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-dark: #070913;
    --bg-card: rgba(15, 23, 42, 0.4);
    --border-glow: rgba(99, 102, 241, 0.15);
    --primary: #6366F1;
    --primary-gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
    --secondary-gradient: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
    --accent-green: #10B981;
    --accent-red: #EF4444;
    --text-main: #F3F4F6;
    --text-muted: #9CA3AF;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: var(--bg-dark);
    color: var(--text-main);
    line-height: 1.6;
    overflow-x: hidden;
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Animated background mesh */
  body::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.07) 0%, transparent 45%);
    z-index: -2;
    pointer-events: none;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
    width: 100%;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 22px;
    font-weight: 800;
    color: #FFF;
    text-decoration: none;
    background: linear-gradient(135deg, #FFF 0%, #D1D5DB 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .logo-icon {
    font-size: 26px;
    -webkit-text-fill-color: initial;
  }

  .nav-links a {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s ease;
    margin-left: 20px;
  }

  .nav-links a:hover {
    color: #FFF;
  }

  /* Glassmorphism Cards */
  .glass-card {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    position: relative;
    overflow: hidden;
  }

  .glass-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%);
  }

  /* Typography & Titles */
  h1 {
    font-size: 48px;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #FFFFFF 0%, #A5B4FC 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.02em;
  }

  p.subtitle {
    font-size: 18px;
    color: var(--text-muted);
    margin-bottom: 32px;
    max-width: 650px;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-gradient);
    color: white;
    font-size: 15px;
    font-weight: 600;
    padding: 14px 28px;
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.2);
    cursor: pointer;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.45);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .btn:active {
    transform: translateY(0);
  }

  .btn-secondary {
    background: var(--secondary-gradient);
    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.25);
  }

  .btn-secondary:hover {
    box-shadow: 0 8px 30px rgba(6, 182, 212, 0.5);
  }

  .btn-outline {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: none;
    color: var(--text-main);
  }

  .btn-outline:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    box-shadow: none;
  }

  /* Form Elements */
  .form-group {
    display: flex;
    gap: 12px;
    max-width: 500px;
    width: 100%;
  }

  .form-input {
    flex: 1;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 14px 18px;
    color: white;
    font-size: 15px;
    font-family: inherit;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2);
    background: rgba(15, 23, 42, 0.8);
  }

  .form-input::placeholder {
    color: #4B5563;
  }

  /* Footer */
  footer {
    margin-top: auto;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding: 30px 0;
    text-align: center;
    font-size: 13px;
    color: var(--text-muted);
  }

  footer a {
    color: var(--text-muted);
    text-decoration: none;
    margin: 0 10px;
    transition: color 0.2s ease;
  }

  footer a:hover {
    color: #FFF;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    h1 {
      font-size: 36px;
    }
    .form-group {
      flex-direction: column;
    }
    .btn {
      width: 100%;
    }
  }
</style>`;

// LANDING PAGE ROUTE
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Upcell Bundle & Product — Smart Shopify Upselling</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Boost your average order value automatically. Display custom product bundles on your Shopify store with easy tag-based matching and zero setup code.">
  ${FRONTEND_STYLE}
  <style>
    /* Hero layout split */
    .hero-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 40px;
      align-items: center;
      margin: 60px 0 100px 0;
    }

    /* Live preview simulated widget */
    .phone-mockup {
      width: 100%;
      max-width: 380px;
      border: 10px solid #1E293B;
      border-radius: 36px;
      background: #FFFFFF;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8);
      overflow: hidden;
      margin: 0 auto;
      color: #1E293B;
    }

    .phone-screen {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #FAFBFD;
      font-size: 12px;
    }

    .mock-product {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mock-image-container {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #EEF2F6 0%, #E2E8F0 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .mock-image-container svg {
      width: 60px;
      height: 60px;
      opacity: 0.35;
      fill: #475569;
    }

    .mock-title {
      font-size: 16px;
      font-weight: 700;
      color: #0F172A;
    }

    .mock-price {
      font-size: 15px;
      font-weight: 600;
      color: #4F46E5;
    }

    .mock-btn {
      background: #0F172A;
      color: white;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    /* Simulated Upcell Widget inside phone screen */
    .mock-upcell-widget {
      border: 1px dashed #6366F1;
      border-radius: 10px;
      padding: 12px;
      background: #F5F7FF;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
      position: relative;
      animation: pulse-glow 3s infinite alternate;
    }

    @keyframes pulse-glow {
      0% { box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08); border-color: #6366F1; }
      100% { box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25); border-color: #8B5CF6; }
    }

    .mock-widget-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .mock-badge {
      background: #10B981;
      color: white;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 20px;
    }

    .mock-widget-title {
      font-weight: 700;
      font-size: 10px;
      color: #374151;
    }

    .mock-bundle-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: white;
      border: 1px solid #E5E7EB;
      padding: 6px 8px;
      border-radius: 6px;
      gap: 8px;
    }

    .mock-bundle-img {
      width: 32px;
      height: 32px;
      background: #F3F4F6;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mock-bundle-img svg {
      width: 16px;
      height: 16px;
      fill: #9CA3AF;
    }

    .mock-bundle-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .mock-bundle-title {
      font-weight: 600;
      font-size: 10px;
      color: #1F2937;
    }

    .mock-bundle-price {
      font-weight: 700;
      color: #10B981;
      font-size: 9px;
    }

    .mock-bundle-btn {
      background: #1F2937;
      color: white;
      font-size: 9px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      text-decoration: none;
    }

    /* Features Grid */
    .features-section {
      padding: 60px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .section-title {
      text-align: center;
      margin-bottom: 40px;
    }

    .section-title h2 {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #FFF 0%, #D1D5DB 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }

    .section-title p {
      color: var(--text-muted);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }

    .feature-card {
      padding: 32px;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      border-color: rgba(99, 102, 241, 0.3);
      background: rgba(15, 23, 42, 0.6);
    }

    .feature-icon {
      font-size: 32px;
      margin-bottom: 16px;
      display: inline-block;
    }

    .feature-card h3 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      color: white;
    }

    .feature-card p {
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.6;
    }

    /* How it works */
    .steps-section {
      padding: 60px 0 100px 0;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
    }

    .step-card {
      text-align: center;
      position: relative;
    }

    .step-num {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 800;
      margin: 0 auto 20px auto;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }

    .step-card h4 {
      font-size: 18px;
      margin-bottom: 8px;
      color: white;
    }

    .step-card p {
      color: var(--text-muted);
      font-size: 14px;
    }

    @media (max-width: 900px) {
      .hero-grid {
        grid-template-columns: 1fr;
        text-align: center;
        margin-top: 40px;
      }
      .form-group {
        margin: 0 auto;
      }
      .features-grid, .steps-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>

  <div class="container">
    <header>
      <a href="/" class="logo">
        <span class="logo-icon">🎁</span> Upcell Bundle
      </a>
      <div class="nav-links">
        <a href="#install">Install</a>
        <a href="#features">Features</a>
        <a href="mailto:shohidul.islam.dev@gmail.com">Support</a>
      </div>
    </header>

    <div class="hero-grid">
      <div>
        <h1>Increase Your Order Value Instantly</h1>
        <p class="subtitle">Automatically display matched product bundles on single product pages. Zero code required. Zero fee forever.</p>
        
        <form class="form-group" id="install" action="/install" method="GET">
          <input type="text" class="form-input" name="shop" placeholder="yourstore.myshopify.com" required>
          <button type="submit" class="btn">Install Free →</button>
        </form>
      </div>

      <div>
        <!-- Phone Mockup showing the live upcell widget -->
        <div class="phone-mockup">
          <div class="phone-screen">
            <div class="mock-product">
              <div class="mock-image-container">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
              </div>
              <span class="mock-title">Hydrating Facial Serum</span>
              <span class="mock-price">$28.00</span>
              <div class="mock-btn">Add to Cart</div>
            </div>

            <!-- Animated Simulated Upcell Bundle Widget -->
            <div class="mock-upcell-widget">
              <div class="mock-widget-header">
                <span class="mock-badge">Bundle & Save</span>
                <span class="mock-widget-title">Perfect Partners</span>
              </div>
              <div class="mock-bundle-item">
                <div class="mock-bundle-img">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
                </div>
                <div class="mock-bundle-info">
                  <span class="mock-bundle-title">Hydrating Skincare Bundle</span>
                  <span class="mock-bundle-price">$45.00</span>
                </div>
                <div class="mock-bundle-btn">View Bundle</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <section class="features-section" id="features">
      <div class="section-title">
        <h2>Why Choose Upcell Bundle?</h2>
        <p>Built specifically for speed, simplicity, and conversion.</p>
      </div>
      <div class="features-grid">
        <div class="glass-card feature-card">
          <span class="feature-icon">⚡</span>
          <h3>Instant Integration</h3>
          <p>Seamlessly matching. Code auto-adds to product pages. Works on all classic & OS 2.0 themes.</p>
        </div>
        <div class="glass-card feature-card">
          <span class="feature-icon">🎯</span>
          <h3>Smart Tag Matching</h3>
          <p>Matches products automatically by tags. Case-insensitive tags mean you never make config errors.</p>
        </div>
        <div class="glass-card feature-card">
          <span class="feature-icon">💎</span>
          <h3>100% Free Forever</h3>
          <p>Unlimited displays, unlimited orders, and zero limits. The app is completely free, forever.</p>
        </div>
      </div>
    </section>

    <section class="steps-section">
      <div class="section-title">
        <h2>How It Works</h2>
        <p>You can set up custom bundles in under 2 minutes.</p>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num">1</div>
          <h4>Install App</h4>
          <p>Enter your store domain and click install. The theme files are configured automatically.</p>
        </div>
        <div class="step-card">
          <div class="step-num">2</div>
          <h4>Tag Your Bundles</h4>
          <p>Create a bundle product in your store, put it in the "Packages" collection, and tag it with "is-bundle".</p>
        </div>
        <div class="step-card">
          <div class="step-num">3</div>
          <h4>Link and Sell</h4>
          <p>Add a matching tag (like "skincare") to both the bundle and your product. The bundle appears instantly.</p>
        </div>
      </div>
    </section>

    <footer>
      <div style="margin-bottom: 12px;">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="mailto:shohidul.islam.dev@gmail.com">Support</a>
      </div>
      <p>Built with ❤️ by Shohidul Islam | © 2026 Upcell Bundle</p>
    </footer>
  </div>

</body>
</html>`);
});

// PRIVACY ROUTE
app.get("/privacy", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Privacy Policy — Upcell Bundle</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${FRONTEND_STYLE}
  <style>
    .legal-content {
      margin: 60px auto 100px auto;
      max-width: 800px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      margin-bottom: 24px;
      gap: 6px;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    h1 {
      margin-bottom: 8px;
    }
    .update-date {
      color: var(--text-muted);
      font-size: 14px;
      margin-bottom: 40px;
    }
    h2 {
      margin: 32px 0 16px 0;
      font-size: 20px;
      color: white;
    }
    p {
      color: var(--text-muted);
      margin-bottom: 16px;
      line-height: 1.7;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="glass-card legal-content">
      <a href="/" class="back-link">← Back to Home</a>
      <h1>Privacy Policy</h1>
      <div class="update-date">Last updated: June 2026</div>

      <h2>1. Information We Access</h2>
      <p>Upcell Bundle accesses theme files and product database directories strictly to query matching product tags and inject code for displaying the bundle interface. We do not copy, extract, or store product catalogs or customer details on our servers.</p>

      <h2>2. Customer Personal Data</h2>
      <p>Our application functions purely on front-end Liquid templates inside your store. We do not collect, process, track, or share any personal customer data (including IP addresses, name, browsing activity, or cart details).</p>

      <h2>3. GDPR & CCPA Compliance</h2>
      <p>Since we do not compile databases, save records, or process customer identities, we are compliant with standard global privacy specifications. Any GDPR webhook calls received from Shopify are returned with a positive acknowledgement immediately.</p>

      <h2>4. Data Security</h2>
      <p>All authentication processes, token exchanges, and communications with the Shopify API are secured via transport layer security (HTTPS/TLS).</p>

      <h2>5. Support and Contact</h2>
      <p>If you have any questions, feel free to reach out to us at <a href="mailto:shohidul.islam.dev@gmail.com" style="color: var(--primary); text-decoration: none;">shohidul.islam.dev@gmail.com</a>.</p>
    </div>
  </div>

</body>
</html>`);
});

// TERMS OF SERVICE ROUTE
app.get("/terms", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Terms of Service — Upcell Bundle</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${FRONTEND_STYLE}
  <style>
    .legal-content {
      margin: 60px auto 100px auto;
      max-width: 800px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      margin-bottom: 24px;
      gap: 6px;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    h1 {
      margin-bottom: 8px;
    }
    .update-date {
      color: var(--text-muted);
      font-size: 14px;
      margin-bottom: 40px;
    }
    h2 {
      margin: 32px 0 16px 0;
      font-size: 20px;
      color: white;
    }
    p {
      color: var(--text-muted);
      margin-bottom: 16px;
      line-height: 1.7;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="glass-card legal-content">
      <a href="/" class="back-link">← Back to Home</a>
      <h1>Terms of Service</h1>
      <div class="update-date">Last updated: June 2026</div>

      <h2>1. Acceptance of Terms</h2>
      <p>By installing and integrating Upcell Bundle into your Shopify store, you agree to comply with and be bound by the following terms and conditions. If you do not agree, please uninstall the app immediately.</p>

      <h2>2. Provided Services</h2>
      <p>We provide a styling block and script matching mechanism that renders bundled products on your storefront. This service is provided as-is without warranties of any kind regarding uptime or compatibility constraints with future customized themes.</p>

      <h2>3. Recommendations and Backups</h2>
      <p>We highly suggest duplicating or creating a backup of your active Shopify theme before completing the installation. While our system is designed to inject code non-destructively, we are not responsible for conflicts caused by pre-existing JavaScript or third-party layouts.</p>

      <h2>4. Limitation of Liability</h2>
      <p>In no event shall Upcell Bundle, its authors, or maintainers be liable for any direct, indirect, incidental, or consequential damages (including loss of sales, cart bugs, or display glitches).</p>

      <h2>5. Contact</h2>
      <p>Support inquiries can be submitted via email to <a href="mailto:shohidul.islam.dev@gmail.com" style="color: var(--primary); text-decoration: none;">shohidul.islam.dev@gmail.com</a>.</p>
    </div>
  </div>

</body>
</html>`);
});

// INSTALL REDIRECT ROUTE
app.get("/install", (req, res) => {
  let shop = req.query.shop;
  if (!shop) return res.redirect("/#install");
  shop = shop.trim();
  if (!shop.includes(".myshopify.com")) shop = shop + ".myshopify.com";

  // Security regex validate shop domain format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return res.status(400).send("Invalid shop domain format. Expected format: store-name.myshopify.com");
  }

  const redirectUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=write_themes,read_themes,read_products,write_products&redirect_uri=${HOST}/auth/callback`;
  res.redirect(redirectUrl);
});

// OAUTH CALLBACK ROUTE (INSTALLATION PROCESS)
app.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;
  if (!shop || !code) return res.status(400).send("Invalid callback request");

  // 1. Verify HMAC security
  if (!verifyShopifyHmac(req.query, SHOPIFY_API_SECRET)) {
    console.error("HMAC verification failed for callback query:", req.query);
    return res.status(400).send("HMAC verification failed. The request signature is invalid.");
  }

  try {
    // 2. Obtain access token
    const tokenData = await apiFetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code, expiring: true }),
    });

    const access_token = tokenData.access_token;
    if (!access_token) {
      throw new Error(`No access token returned in handshake: ${JSON.stringify(tokenData)}`);
    }

    // 3. Inject code and check/create packages collection
    const result = await injectBundleCode(shop, access_token);

    // 4. Send beautiful success response
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Installation Successful! — Upcell Bundle</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${FRONTEND_STYLE}
  <style>
    .success-card {
      margin: 80px auto;
      max-width: 650px;
      text-align: center;
    }
    .success-icon {
      font-size: 64px;
      margin-bottom: 20px;
      display: inline-block;
      animation: bounce-scale 1s infinite alternate;
    }
    @keyframes bounce-scale {
      0% { transform: scale(1); }
      100% { transform: scale(1.1); }
    }
    .badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--accent-green);
      color: var(--accent-green);
      border-radius: 8px;
      padding: 10px 16px;
      margin: 20px 0;
      font-size: 14px;
      font-weight: 600;
    }
    .steps-container {
      text-align: left;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      padding: 24px;
      margin: 28px 0;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .steps-container h3 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      color: white;
    }
    ol {
      padding-left: 20px;
    }
    ol li {
      margin-bottom: 12px;
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.6;
    }
    ol li strong {
      color: var(--text-main);
    }
    .btn-row {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    @media(max-width: 500px) {
      .btn-row {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="glass-card success-card">
      <span class="success-icon">🎉</span>
      <h1>Installation Complete!</h1>
      
      <div class="badge">
        ${result.method === 'legacy' ? '✅ Successfully Injected into product-template (Legacy)' :
          result.method === 'section_auto' ? '✅ Successfully Added and Mounted "Upcell Bundles" Section (Shopify 2.0)' :
          result.method === 'section' ? '✅ Custom theme section added. Manual placement required.' :
          '✅ Upcell Bundle is already configured for this store.'}
      </div>

      <div class="steps-container">
        <h3>Next Steps to Activate:</h3>
        <ol>
          <li>We've automatically verified/created the <strong>Packages</strong> collection in your store.</li>
          <li>Create a bundle product and assign it to the <strong>Packages</strong> collection.</li>
          <li>Tag the bundle product with <strong>is-bundle</strong>, plus a shared category tag (e.g., <strong>haircare</strong>).</li>
          <li>Tag the target single products with the same shared category tag (e.g., <strong>haircare</strong>).</li>
          ${result.method === 'section' ? '<li><strong>Go to Theme Editor → Product templates → Add Section → select "Upcell Bundles"</strong>.</li>' : ''}
          <li>Bundles will automatically display on matching product pages! 🎁</li>
        </ol>
      </div>

      <div class="btn-row">
        <a href="https://${shop}/admin" class="btn" target="_blank">Shopify Admin</a>
        ${result.method === 'section' || result.method === 'section_auto' ? `<a href="https://${shop}/admin/themes/current/editor" class="btn btn-secondary" target="_blank">Customize Theme</a>` : ''}
      </div>
    </div>
  </div>

</body>
</html>`);

  } catch (err) {
    console.error("Installation failed for store:", shop, err.message);
    res.status(500).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Installation Failed — Upcell Bundle</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${FRONTEND_STYLE}
  <style>
    .error-card {
      margin: 100px auto;
      max-width: 550px;
      text-align: center;
    }
    .error-icon {
      font-size: 64px;
      margin-bottom: 20px;
      color: var(--accent-red);
    }
    .error-message {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--accent-red);
      color: #FCA5A5;
      padding: 16px;
      border-radius: 10px;
      margin: 24px 0;
      font-size: 14px;
      font-family: monospace;
      text-align: left;
      word-break: break-all;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="glass-card error-card">
      <span class="error-icon">❌</span>
      <h1>Installation Failed</h1>
      <p style="color: var(--text-muted);">Something went wrong while setting up the integration.</p>
      
      <div class="error-message">
        Error: ${err.message}
      </div>

      <div style="display: flex; gap: 12px; justify-content: center; margin-top: 16px;">
        <a href="/" class="btn">Try Again</a>
        <a href="mailto:shohidul.islam.dev@gmail.com" class="btn btn-outline">Contact Support</a>
      </div>
    </div>
  </div>

</body>
</html>`);
  }
});

// GDPR WEBHOOK STUBS
app.post("/webhooks/customers/redact", (req, res) => res.sendStatus(200));
app.post("/webhooks/shop/redact", (req, res) => res.sendStatus(200));
app.post("/webhooks/customers/data_request", (req, res) => res.sendStatus(200));
app.post("/webhooks/app/uninstalled", (req, res) => res.sendStatus(200));

// UTILITY CORE INTEGRATION LOGIC
async function injectBundleCode(shop, accessToken) {
  const headers = { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" };
  const API = `https://${shop}/admin/api/${API_VERSION}`;

  // 1. Auto-create Packages collection if not exists
  try {
    const customCols = await apiFetch(`${API}/custom_collections.json?handle=packages`, { headers });
    let hasPackagesCol = customCols.custom_collections && customCols.custom_collections.length > 0;

    if (!hasPackagesCol) {
      const smartCols = await apiFetch(`${API}/smart_collections.json?handle=packages`, { headers });
      hasPackagesCol = smartCols.smart_collections && smartCols.smart_collections.length > 0;
    }

    if (!hasPackagesCol) {
      await apiFetch(`${API}/custom_collections.json`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          custom_collection: {
            title: "Packages",
            published: true
          }
        })
      });
    }
  } catch (err) {
    console.error("Autocreate Packages Collection failed:", err.message);
  }

  // 2. Fetch active theme
  const themesData = await apiFetch(`${API}/themes.json`, { headers });
  const activeTheme = themesData.themes.find((t) => t.role === "main");
  if (!activeTheme) throw new Error("No active theme found for this Shopify store.");
  const themeId = activeTheme.id;

  // 3. Try to inject into legacy product template section
  let legacyData;
  try {
    legacyData = await apiFetch(
      `${API}/themes/${themeId}/assets.json?asset[key]=sections/product-template.liquid`,
      { headers }
    );
  } catch (e) {
    // Legacy file does not exist on OS 2.0
  }

  if (legacyData && legacyData.asset && legacyData.asset.value) {
    let content = legacyData.asset.value;
    if (content.includes("<!-- started of bundel -->")) {
      return { method: "already" };
    }

    const targets = [
      `{% when 'custom' %}\n\t\t\t\t\t\t\t\t{{blockTitle}}\n\t\t\t\t\t\t\t\t<div id="tab{{block.id}}" class="{{tabClass}} rte">{{block.settings.content}}</div>`,
      `{% when 'custom' %}\n							{{blockTitle}}\n							<div id="tab{{block.id}}" class="{{tabClass}} rte">{{block.settings.content}}</div>`,
      `{{ product.description }}`,
      `{% schema %}`
    ];

    let injected = false;
    for (const target of targets) {
      if (content.includes(target)) {
        if (target === `{% schema %}`) {
          content = content.replace(target, LEGACY_LIQUID + "\n\n" + target);
        } else {
          content = content.replace(target, target + "\n" + LEGACY_LIQUID);
        }
        injected = true;
        break;
      }
    }

    if (injected) {
      await apiFetch(`${API}/themes/${themeId}/assets.json`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ asset: { key: "sections/product-template.liquid", value: content } }),
      });
      return { method: "legacy" };
    }
  }

  // 4. Check if templates/product.json (Shopify 2.0 JSON layout) exists
  let jsonTemplateData;
  try {
    jsonTemplateData = await apiFetch(
      `${API}/themes/${themeId}/assets.json?asset[key]=templates/product.json`,
      { headers }
    );
  } catch (e) {
    // No templates/product.json
  }

  if (jsonTemplateData && jsonTemplateData.asset && jsonTemplateData.asset.value) {
    // Upload sections/upcell-bundles.liquid first
    await apiFetch(`${API}/themes/${themeId}/assets.json`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ asset: { key: "sections/upcell-bundles.liquid", value: BUNDLE_SECTION } }),
    });

    try {
      const json = JSON.parse(jsonTemplateData.asset.value);
      if (json.sections && !json.sections["upcell-bundles"]) {
        // Inject upcell section block config
        json.sections["upcell-bundles"] = {
          type: "upcell-bundles",
          settings: {
            title: "Available Bundles"
          }
        };

        // Inject order position
        if (json.order && Array.isArray(json.order)) {
          const mainIdx = json.order.indexOf("main");
          if (mainIdx !== -1) {
            json.order.splice(mainIdx + 1, 0, "upcell-bundles");
          } else {
            json.order.push("upcell-bundles");
          }
        } else {
          json.order = ["upcell-bundles"];
        }

        // Save updated template JSON back
        await apiFetch(`${API}/themes/${themeId}/assets.json`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            asset: {
              key: "templates/product.json",
              value: JSON.stringify(json, null, 2)
            }
          })
        });
        return { method: "section_auto" };
      } else {
        return { method: "already" };
      }
    } catch (err) {
      console.error("Failed to parse or write templates/product.json:", err.message);
      return { method: "section" }; // Manual fallback
    }
  }

  // 5. Try to inject into templates/product.liquid (pure liquid product template fallback)
  let liquidTemplateData;
  try {
    liquidTemplateData = await apiFetch(
      `${API}/themes/${themeId}/assets.json?asset[key]=templates/product.liquid`,
      { headers }
    );
  } catch (e) {
    // No templates/product.liquid
  }

  if (liquidTemplateData && liquidTemplateData.asset && liquidTemplateData.asset.value) {
    let content = liquidTemplateData.asset.value;
    if (content.includes("<!-- started of bundel -->")) {
      return { method: "already" };
    }

    if (content.includes("{{ product.description }}")) {
      content = content.replace("{{ product.description }}", "{{ product.description }}\n" + LEGACY_LIQUID);
    } else {
      content = content + "\n" + LEGACY_LIQUID;
    }

    await apiFetch(`${API}/themes/${themeId}/assets.json`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ asset: { key: "templates/product.liquid", value: content } }),
    });
    return { method: "legacy" };
  }

  // 6. Theme 2.0 manual fallback: upload asset section but don't edit templates
  let existingData;
  try {
    existingData = await apiFetch(
      `${API}/themes/${themeId}/assets.json?asset[key]=sections/upcell-bundles.liquid`,
      { headers }
    );
  } catch (e) {
    // Fine
  }
  if (existingData && existingData.asset) return { method: "already" };

  await apiFetch(`${API}/themes/${themeId}/assets.json`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ asset: { key: "sections/upcell-bundles.liquid", value: BUNDLE_SECTION } }),
  });

  return { method: "section" };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running Upcell Bundle App on port ${PORT}`));
module.exports = app;