# Deploying Shelfhost

Shelfhost is designed to run serverless on **Cloudflare Pages / Workers** using **Cloudflare D1** (for database persistence) and **Cloudflare R2** (for PDF file storage).

This guide walks you through setting up your local environment and deploying the application to production on Cloudflare.

---

## Prerequisites

Before starting, ensure you have:
1. A **Cloudflare Account** with access to Pages, D1, and R2 (available on the free tier).
2. **Node.js** (v18+) or **Bun** installed on your system.
3. The **Wrangler CLI** installed (typically run via `npx wrangler` or installed globally).

---

## Local Development Setup

Wrangler simulates the Cloudflare environment locally, including local SQLite (D1) and local directories (R2).

### 1. Install Dependencies
```bash
# Using bun (recommended)
bun install

# Using npm
npm install
```

### 2. Apply Database Migrations (Local)
Initialize your local database by running the migration schema against your local wrangler instance:
```bash
# Using bun
bun wrangler d1 migrations apply shelfhost-db --local

# Using npm
npx wrangler d1 migrations apply shelfhost-db --local
```

### 3. Start the Dev Server
```bash
# Using bun
bun run dev

# Using npm
npm run dev
```
Open your browser to `http://localhost:3000`. You can upload and highlight PDFs locally!

---

## Production Deployment on Cloudflare

To host your own production instance on Cloudflare, follow these steps to provision D1 and R2 resources and deploy the code.

### 1. Authenticate Wrangler
Log in to your Cloudflare account from your terminal:
```bash
npx wrangler login
```

### 2. Create D1 Database
Create a production D1 database:
```bash
npx wrangler d1 create shelfhost-db
```
Wrangler will output the configuration details for your database. It will look like this:
```json
{
  "binding": "DB",
  "database_name": "shelfhost-db",
  "database_id": "YOUR_NEW_DATABASE_UUID"
}
```
Open **`wrangler.jsonc`** in your project root and update the `d1_databases` array with the new `database_id`:
```json
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "shelfhost-db",
      "database_id": "YOUR_NEW_DATABASE_UUID",
      "migrations_dir": "migrations"
    }
  ]
```

### 3. Create R2 Bucket
Create a production R2 bucket for PDF storage:
```bash
npx wrangler r2 bucket create shelfhost-pdfs
```
If you change the bucket name, make sure the `r2_buckets` section in **`wrangler.jsonc`** matches it:
```json
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "shelfhost-pdfs"
    }
  ]
```

### 4. Apply Database Migrations (Production)
Run the migration script on Cloudflare to initialize the tables in your production database:
```bash
npx wrangler d1 migrations apply shelfhost-db --remote
```

### 5. Deploy to Cloudflare Pages
Deploy the compiled build bundle to Cloudflare:
```bash
# Using bun
bun run deploy

# Using npm
npm run deploy
```
Once complete, Wrangler will provide your project's production URL (e.g., `https://shelfhost.pages.dev`).

---

## Common Troubleshooting

* **Error: `Database not available`**:
  Make sure you ran the migrations locally using `--local` or remotely using `--remote`. If running locally, you must run the server with wrangler dev capability (typically bundled in `bun run dev` or `nuxt dev` with the `nitro-cloudflare-dev` preset enabled).
  
* **R2 Upload Failures**:
  Check that the R2 bucket name in `wrangler.jsonc` matches the one created on your Cloudflare dashboard, and ensure your Cloudflare account has R2 billing enabled (it is free up to 10GB/month).
