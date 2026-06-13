# 🎁 Upcell Bundle & Product
### Shopify App — Free

Automatically display bundle products on single product pages to increase average order value.

---

## 📁 File Structure
```
upcell-bundle-app/
├── server.js          ← Main Express server
├── package.json       ← Dependencies
├── vercel.json        ← Vercel deployment config
├── .env.example       ← Environment variables template
├── .gitignore
└── README.md
```

---

## 🚀 Deploy to Vercel (Step by Step)

### Step 1 — Create Shopify Partner Account
1. Go to https://partners.shopify.com
2. Create a free account

### Step 2 — Create App in Partner Dashboard
1. Click **Apps → Create App → Create app manually**
2. Fill in:
   - App name: `Upcell Bundle & Product`
   - App URL: `https://your-app.vercel.app` *(update after deploy)*
   - Allowed redirection URLs: `https://your-app.vercel.app/auth/callback`
3. Copy **API Key** and **API Secret**

### Step 3 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/upcell-bundle-app.git
git push -u origin main
```

### Step 4 — Deploy to Vercel
1. Go to https://vercel.com
2. Click **Add New Project → Import Git Repository**
3. Select your repo
4. Add Environment Variables:
   | Key | Value |
   |---|---|
   | `SHOPIFY_API_KEY` | Your API key from Partner Dashboard |
   | `SHOPIFY_API_SECRET` | Your API secret from Partner Dashboard |
   | `HOST` | `https://your-app.vercel.app` |
5. Click **Deploy**

### Step 5 — Update Shopify App URLs
1. Go back to Partner Dashboard → Your App → App setup
2. Update **App URL** to your Vercel URL
3. Update **Allowed redirection URLs** to `https://your-app.vercel.app/auth/callback`
4. Save

---

## 📋 App URLs

| URL | Purpose |
|---|---|
| `https://your-app.vercel.app` | Home / Landing page |
| `https://your-app.vercel.app/install?shop=store.myshopify.com` | Install on a store |
| `https://your-app.vercel.app/auth/callback` | OAuth callback |
| `https://your-app.vercel.app/privacy` | Privacy policy |
| `https://your-app.vercel.app/terms` | Terms of service |

---

## 🏪 Submit to Shopify App Store

### Requirements checklist:
- ✅ OAuth authentication
- ✅ GDPR webhooks (customers/redact, shop/redact, customers/data_request)
- ✅ App uninstall webhook
- ✅ Privacy Policy page
- ✅ Terms of Service page
- ✅ Landing page

### Submit steps:
1. Partner Dashboard → Apps → Your App
2. Click **Distribution → Shopify App Store**
3. Fill in app listing details:
   - App name: `Upcell Bundle & Product`
   - Tagline: `Show bundle products on product pages automatically`
   - Description: (see below)
   - Screenshots: Take screenshots of bundles appearing on product pages
   - Category: `Merchandising`
   - Pricing: Free
4. Submit for review

### App Store Description:
```
Upcell Bundle & Product automatically displays bundle products on your single product pages — helping you increase average order value with zero effort.

How it works:
• Install the app — bundle code is automatically added to your theme
• Add bundle products to your "Packages" collection
• Tag bundle and single products with matching tags
• Bundles appear automatically under Shipping & Returns

Features:
✓ Automatic tag-based matching
✓ Case-insensitive tags (HairCare = haircare = HAIRCARE)
✓ Works with any theme using standard product template
✓ Beautiful bundle display with image, title, price and CTA button
✓ 100% Free — no hidden charges
```

---

## ⚙️ How Bundle Matching Works

```
Product page loads
      ↓
App reads all tags on current product (converted to lowercase)
      ↓
Loops through all products in "Packages" collection
      ↓
Finds products tagged with "is-bundle"
      ↓
Checks if any tag matches between bundle and single product
      ↓
Matching bundles appear under Shipping & Returns ✅
```

---

## 📞 Support
Email: shohidul.islam.dev@gmail.com
