# Shelfhost

Shelfhost is a self-hosted PDF library, reader, and highlighting tool designed to provide a warm, focused, and distraction-free reading experience for your PDF collection. 

Built using modern serverless tech stacks, Shelfhost can be deployed globally for **$0/month** on Cloudflare's free tier.

---

## Key Features

* **Distraction-Free Reader**: An interface designed to feel like sitting down with a good book — warm, focused, and unhurried. The browser UI chrome is minimal and retreats into the background while you read.
* **Text Highlights**: Highlight text selections instantly. Supports multiple highlight colors (yellow, green, pink, blue) to organize your thoughts.
* **Page Bookmarks**: Bookmark pages to easily navigate back to key reference points.
* **Auto-Resume Progress**: Automatically tracks your reading progress (debounced on scroll) and resumes right where you left off.
* **Global Serverless Backend**: Powered by Nuxt Nitro running on Cloudflare Workers and Pages, giving you instant load times anywhere in the world.
* **D1 & R2 Integration**: Uses Cloudflare D1 (SQLite) for ultra-fast, relational metadata queries and Cloudflare R2 for secure, private PDF file storage.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | Nuxt 3 (Vue 3, Composition API) |
| **Styling** | Tailwind CSS |
| **Backend API** | Nuxt server routes (running on Cloudflare Workers via Nitro) |
| **Database** | Cloudflare D1 (SQLite) |
| **File Storage** | Cloudflare R2 |
| **PDF Engine** | PDF.js (Client-side rendering to stay within serverless memory constraints) |

---

## Getting Started

### 1. Install Dependencies
```bash
# Using bun (recommended)
bun install

# Using npm
npm install
```

### 2. Apply Database Migrations (Local D1 SQLite)
Initialize your local database by running the migration schema:
```bash
# Using bun
bun wrangler d1 migrations apply shelfhost-db --local

# Using npm
npx wrangler d1 migrations apply shelfhost-db --local
```

### 3. Start Development Server
```bash
# Using bun
bun run dev

# Using npm
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to begin reading.

---

## Deployment

To host your own production instance on Cloudflare, please refer to the step-by-step instructions in the [Deployment Guide](DEPLOYMENT.md).

For a standalone promo landing page that showcases this project, see the [landing.html](landing.html) file.

---

## License

Released under the [MIT License](LICENSE).
Created by Dipankar Shaw ("dshaw0004").
