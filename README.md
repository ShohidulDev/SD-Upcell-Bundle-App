# 🎁 Upcell Bundle & Save — Theme App Extension (Remix)

## কী বদলেছে পুরনো প্রজেক্ট থেকে

পুরনো `server.js` Express app সরাসরি Admin Asset API দিয়ে আপনার থিমের
`templates/product.liquid` বা `sections/product-template.liquid` ফাইলে
liquid কোড **inject** করত। এই পদ্ধতিতে merchant সেই ব্লক drag করে move
করতে পারত না, এবং কোনো নতুন থিমে switch করলে আবার ইনজেক্ট করতে হতো।

নতুন প্রজেক্ট **Theme App Extension** ব্যবহার করে — কোনো থিম ফাইল এডিট হয় না।
Merchant theme editor-এ গিয়ে **Add block → Apps → "Upcell: Bundle & Save"**
সিলেক্ট করে, drag করে product section-এর ভেতরে যেকোনো জায়গায় বসাতে এবং
move করতে পারবে। থিম পরিবর্তন করলেও merchant শুধু আবার ব্লক যুক্ত করবে —
কোনো কোড touch করতে হবে না।

## ফোল্ডার স্ট্রাকচার

```
sd-upcell-bundle-app/
├── shopify.app.toml              ← App-level কনফিগ (scopes, webhooks)
├── package.json
├── vite.config.ts
├── prisma/schema.prisma          ← Session storage (SQLite, dev-ready)
├── app/
│   ├── shopify.server.js         ← OAuth + API client সেটআপ (shopify-app-remix)
│   ├── db.server.js
│   ├── root.jsx
│   └── routes/
│       ├── auth.$.jsx            ← OAuth callback (HMAC verify built-in)
│       ├── auth.login/route.jsx
│       ├── app.jsx               ← Embedded admin shell (nav)
│       ├── app._index.jsx        ← Dashboard: setup status + "Open theme editor" বাটন
│       ├── webhooks.app.uninstalled.jsx
│       ├── webhooks.app.scopes_update.jsx
│       ├── webhooks.customers.data_request.jsx
│       ├── webhooks.customers.redact.jsx
│       └── webhooks.shop.redact.jsx
└── extensions/
    └── upcell-bundle/
        ├── shopify.extension.toml
        ├── blocks/
        │   └── bundle-save.liquid    ← মূল App Block (Apps ট্যাবে দেখাবে)
        ├── assets/
        │   └── upcell-bundle.css
        └── locales/
            └── en.default.json
```

## Bundle matching logic (অপরিবর্তিত)

পুরনো লজিকই রাখা হয়েছে, শুধু এখন এটা App Block-এর ভেতরে চলে:

1. `Packages` কালেকশনে থাকা প্রোডাক্ট, যাদের `is-bundle` ট্যাগ আছে।
2. সেই বান্ডেলের অন্য ট্যাগগুলো (is-bundle বাদে) যদি current product-এর
   ট্যাগের সাথে মিলে যায় (case-insensitive), তাহলে বান্ডেল কার্ড দেখাবে।
3. মার্চেন্ট চাইলে কালেকশন handle, badge text, heading, button text,
   এবং max bundle সংখ্যা — সব **theme editor থেকে** কনফিগার করতে পারবে
   (block settings এ আগে থেকেই দেওয়া আছে)।

## প্রথমবার সেটআপ করার ধাপ

```bash
npm install
shopify app config link        # আপনার Partner Dashboard-এর app-এর সাথে link করুন
cp .env.example .env           # SHOPIFY_API_KEY, SECRET, APP_URL ভরে দিন
npm run dev                    # dev store-এ test করার জন্য
```

`shopify app dev` চালালে CLI আপনাকে dev store সিলেক্ট করতে বলবে এবং
automatically tunnel/HTTPS URL সেট করে দেবে।

## Theme editor-এ ব্লক বসানো (merchant-এর করণীয়)

1. Online Store → Themes → Customize
2. Product page-এ যান
3. "Product information" section-এ **Add block → Apps**
4. **"Upcell: Bundle & Save"** সিলেক্ট করুন
5. Drag করে যেকোনো জায়গায় বসান (Buy button-এর নিচে, Description-এর উপরে — যেখানে ইচ্ছা)

Dashboard-এর "Open theme editor" বাটনে ক্লিক করলে সরাসরি product
template-এর editor-এ চলে যাবে, deep-link প্যারামিটার দিয়ে।

## Production deploy

```bash
shopify app deploy     # extension ভার্সন তৈরি করে Partner Dashboard-এ পাঠাবে
```

Hosting-এর জন্য Vercel/Fly.io/Render যেকোনো Node host চলবে; Remix-এর
`build` ও `start` script আগে থেকেই `package.json`-এ দেওয়া আছে।

## এখনো করতে হবে (আপনার তথ্য দিয়ে পূরণ করুন)

- `shopify.app.toml` → `client_id` ও `application_url`
- `.env` → `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`
- Privacy Policy ও Terms of Service পেজ (App Store submission-এর জন্য লাগবে — পুরনো
  app-এ static HTML রুট ছিল; চাইলে আমি Remix route হিসেবে আবার বানিয়ে দিতে পারি)
- `node_modules` ইচ্ছাকৃতভাবে দেওয়া হয়নি — `npm install` চালালে চলে আসবে
