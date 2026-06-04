# PDF Reader Web App — Coding Agent Prompt

## Project Overview

Build a full-stack PDF reader web application using **Nuxt 4** (frontend + backend), **Cloudflare D1** (SQLite database), **Cloudflare R2** (file storage), and **Cloudflare Workers** (serverless runtime). The app allows users to upload PDFs, read them in-browser, highlight text, and bookmark pages.

Use worker bindings to wire up D1, R2, and KV bindings with minimal config. Deploy to **Cloudflare Pages**.

---

## Tech Stack

| Layer         | Technology                                               |
| ------------- | -------------------------------------------------------- |
| Frontend      | Nuxt 4 (Vue 3, Composition API)                          |
| Backend       | Nuxt server routes (run as Cloudflare Workers via Nitro) |
| PDF Rendering | PDF.js (Mozilla, open source)                            |
| Database      | Cloudflare D1 (SQLite)                                   |
| File Storage  | Cloudflare R2                                            |
| Deployment    | Cloudflare worker                                        |
| Styling       | Tailwind CSS                                             |

---

## Constraints & Important Notes

- **Never process PDFs server-side.** Cloudflare Workers have a 128MB memory limit. Always fetch PDFs from R2 and render them entirely in the browser via PDF.js.
- **All backend logic lives in `server/api/`** Nuxt server routes. These automatically become Cloudflare Workers when deployed.
- **D1 uses SQLite syntax.** No `SERIAL` or `AUTO_INCREMENT` — use `TEXT PRIMARY KEY` with UUIDs generated in the server route.
- **R2 keys** should be deterministic and collision-safe: use the pattern `pdfs/{uuid}.pdf`.
- **Do not use localStorage** for persisting highlights or bookmarks. Always persist to D1.
- **PDF.js coordinate system** uses bottom-left origin. When storing highlight rects, store them as-is from the PDF.js `getClientRects()` data after converting to PDF page space.

---

## Project Structure

```
pdf-reader/
├── server/
│   └── api/
│       ├── pdfs/
│       │   ├── index.get.ts          # List all PDFs
│       │   ├── index.post.ts         # Upload a new PDF to R2 + insert into D1
│       │   └── [id].delete.ts        # Delete PDF from R2 + D1 (cascades)
│       ├── pdfs/[id]/url.get.ts      # Generate a presigned/temporary R2 URL
│       ├── bookmarks/
│       │   ├── index.post.ts         # Create a bookmark
│       │   └── [pdfId].get.ts        # Get all bookmarks for a PDF
│       ├── highlights/
│       │   ├── index.post.ts         # Create a highlight
│       │   ├── [pdfId].get.ts        # Get all highlights for a PDF
│       │   └── [id].delete.ts        # Delete a highlight
│       └── progress/
│           ├── [pdfId].get.ts        # Get reading progress for a PDF
│           └── [pdfId].post.ts       # Upsert reading progress
├── pages/
│   ├── index.vue                     # Library page — grid of uploaded PDFs
│   └── read/
│       └── [id].vue                  # Reader page — PDF viewer + sidebar
├── components/
│   ├── PdfViewer.vue                 # PDF.js wrapper, emits highlight/page events
│   ├── PdfUpload.vue                 # Drag-and-drop upload component
│   ├── ReaderSidebar.vue             # Tabs: Bookmarks | Highlights
│   ├── BookmarkItem.vue              # Single bookmark row
│   └── HighlightItem.vue             # Single highlight row with color swatch
├── composables/
│   ├── usePdf.ts                     # PDF.js loading and page rendering logic
│   ├── useHighlights.ts              # Fetch, create, delete highlights
│   └── useBookmarks.ts              # Fetch, create, delete bookmarks
├── public/
│   └── pdfjs/                        # PDF.js dist files (worker + viewer)
├── nuxt.config.ts
└── wrangler.toml                     # Cloudflare bindings config
```

---

## Database Schema (D1 / SQLite)

Run these migrations via `wrangler d1 execute`.

```sql
-- PDF file metadata
CREATE TABLE IF NOT EXISTS pdfs (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  r2_key      TEXT NOT NULL UNIQUE,
  size        INTEGER NOT NULL,
  page_count  INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bookmarks (saved pages)
CREATE TABLE IF NOT EXISTS bookmarks (
  id          TEXT PRIMARY KEY,
  pdf_id      TEXT NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
  page        INTEGER NOT NULL,
  label       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(pdf_id, page)
);

-- Highlights (text selections with position data)
CREATE TABLE IF NOT EXISTS highlights (
  id          TEXT PRIMARY KEY,
  pdf_id      TEXT NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
  page        INTEGER NOT NULL,
  text        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#FFFF00',
  rects       TEXT NOT NULL,   -- JSON: [{x, y, width, height}, ...]  in PDF page coordinates
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reading progress (resume where you left off)
CREATE TABLE IF NOT EXISTS reading_progress (
  pdf_id      TEXT PRIMARY KEY REFERENCES pdfs(id) ON DELETE CASCADE,
  page        INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

### Install dependencies

```bash
npx nuxi init pdf-reader
cd pdf-reader
npm install @nuxtjs/tailwindcss
npm install -D wrangler
```

### Add PDF.js

Download PDF.js from https://mozilla.github.io/pdf.js/ and place the `pdf.worker.min.js` file in `/public/pdfjs/`. Install the npm package for types/imports:

```bash
npm install pdfjs-dist
```

---

## API Routes — Implementation Details

### `server/api/pdfs/index.post.ts` — Upload PDF

```ts
export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  const file = form?.find((f) => f.name === "file");
  if (!file || file.type !== "application/pdf") {
    throw createError({ statusCode: 400, message: "Invalid file" });
  }

  const id = crypto.randomUUID();
  const r2Key = `pdfs/${id}.pdf`;

  // Upload to R2
  await hubBlob().put(r2Key, file.data, { contentType: "application/pdf" });

  // Insert metadata into D1
  await hubDatabase()
    .prepare(`INSERT INTO pdfs (id, name, r2_key, size) VALUES (?, ?, ?, ?)`)
    .bind(id, file.filename, r2Key, file.data.length)
    .run();

  return { id, name: file.filename };
});
```

### `server/api/pdfs/[id]/url.get.ts` — Get PDF URL

Since R2 objects are private, generate a signed URL or serve the file directly:

```ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const pdf = await hubDatabase()
    .prepare(`SELECT r2_key FROM pdfs WHERE id = ?`)
    .bind(id)
    .first();
  if (!pdf) throw createError({ statusCode: 404 });

  // Return a signed URL valid for 1 hour
  const url = await hubBlob().createSignedUrl(pdf.r2_key, { expiresIn: 3600 });
  return { url };
});
```

### `server/api/highlights/index.post.ts` — Create Highlight

```ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { pdfId, page, text, color, rects } = body;

  const id = crypto.randomUUID();
  await hubDatabase()
    .prepare(
      `INSERT INTO highlights (id, pdf_id, page, text, color, rects) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, pdfId, page, text, color ?? "#FFFF00", JSON.stringify(rects))
    .run();

  return { id };
});
```

### `server/api/highlights/[pdfId].get.ts` — Get Highlights

```ts
export default defineEventHandler(async (event) => {
  const pdfId = getRouterParam(event, "pdfId");
  const { results } = await hubDatabase()
    .prepare(
      `SELECT * FROM highlights WHERE pdf_id = ? ORDER BY page, created_at`,
    )
    .bind(pdfId)
    .all();

  return results.map((h) => ({ ...h, rects: JSON.parse(h.rects as string) }));
});
```

### `server/api/progress/[pdfId].post.ts` — Upsert Progress

```ts
export default defineEventHandler(async (event) => {
  const pdfId = getRouterParam(event, "pdfId");
  const { page } = await readBody(event);

  await hubDatabase()
    .prepare(
      `
    INSERT INTO reading_progress (pdf_id, page, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(pdf_id) DO UPDATE SET page = excluded.page, updated_at = excluded.updated_at
  `,
    )
    .bind(pdfId, page)
    .run();

  return { ok: true };
});
```

---

## Frontend — Key Components

### `composables/usePdf.ts`

```ts
import * as pdfjsLib from "pdfjs-dist";

export function usePdf() {
  // Point to the worker file in /public
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

  async function loadPdf(url: string) {
    return await pdfjsLib.getDocument(url).promise;
  }

  async function renderPage(
    pdf: any,
    pageNum: number,
    canvas: HTMLCanvasElement,
    scale = 1.5,
  ) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport })
      .promise;
    return { page, viewport };
  }

  return { loadPdf, renderPage };
}
```

### `components/PdfViewer.vue` — Structure

The PdfViewer component must:

1. Accept props: `pdfUrl: string`, `highlights: Highlight[]`, `currentPage: number`
2. Render each page onto a `<canvas>` element
3. Overlay a transparent `<div>` on top of the canvas for text selection events
4. Use PDF.js `page.getTextContent()` + `renderTextLayer()` to enable real text selection
5. Listen for `mouseup` events on the text layer; when text is selected call `window.getSelection()` and compute the bounding rects relative to the PDF page using `getBoundingClientRect()` converted to PDF coordinate space
6. Emit a `highlight` event with `{ page, text, rects }` when selection is confirmed
7. Re-draw stored highlights as absolutely-positioned colored `<div>` overlays using the stored `rects` data
8. Emit `page-change` when user scrolls to a new page (use IntersectionObserver on each page container)

### `pages/read/[id].vue` — Reader Page Structure

```
<template>
  <div class="flex h-screen">
    <!-- Main PDF area -->
    <div class="flex-1 overflow-auto bg-gray-800">
      <PdfViewer
        :pdf-url="pdfUrl"
        :highlights="highlights"
        :current-page="currentPage"
        @highlight="onHighlight"
        @page-change="onPageChange"
      />
    </div>

    <!-- Sidebar -->
    <ReaderSidebar
      :bookmarks="bookmarks"
      :highlights="highlights"
      :current-page="currentPage"
      @add-bookmark="addBookmark"
      @delete-bookmark="deleteBookmark"
      @delete-highlight="deleteHighlight"
      @go-to-page="goToPage"
    />
  </div>
</template>
```

On mount:

1. Fetch PDF URL from `/api/pdfs/{id}/url`
2. Fetch highlights from `/api/highlights/{id}`
3. Fetch bookmarks from `/api/bookmarks/{id}`
4. Fetch progress from `/api/progress/{id}` and jump to that page

---

## Highlight Coordinate Mapping — Critical Detail

This is the most complex part of the app. Follow these steps precisely:

**On highlight creation (in PdfViewer.vue):**

```js
// 1. User selects text — get selection
const selection = window.getSelection();
const range = selection.getRangeAt(0);

// 2. Get bounding rects of the selection (can be multiple lines)
const domRects = Array.from(range.getClientRects());

// 3. Get the canvas/page container's bounding rect
const pageContainer = document.getElementById(`page-${currentPage}`);
const containerRect = pageContainer.getBoundingClientRect();

// 4. Convert DOM rects to coordinates relative to the page container
const rects = domRects.map((r) => ({
  x: r.left - containerRect.left,
  y: r.top - containerRect.top,
  width: r.width,
  height: r.height,
}));

// 5. Emit to parent to save
emit("highlight", { page: currentPage, text: selection.toString(), rects });
```

**On highlight render (re-drawing stored highlights):**

```html
<!-- For each highlight rect, render an overlay div -->
<div
  v-for="rect in highlight.rects"
  :key="rect.x"
  class="absolute pointer-events-none"
  :style="{
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    backgroundColor: highlight.color,
    opacity: 0.35,
  }"
/>
```

**Important:** The page container must have `position: relative` and the overlay divs must have `position: absolute`. The coordinate space is relative to the rendered canvas at the current scale. If scale changes, you must re-compute render positions (multiply stored rects by `newScale / storageScale`). Consider always storing rects normalized to scale=1 and applying scale on render.

---

## Build Order (Step by Step)

Follow this order to build incrementally and test each layer before moving on.

**Step 1 — Project scaffolding**

- Init Nuxt 4 project
- Install and configure Tailwind
- Set up D1 and run SQL migrations
- Configure R2 bucket

**Step 2 — Upload flow**

- Build `PdfUpload.vue` with drag-and-drop
- Implement `POST /api/pdfs` to upload to R2 and insert into D1
- Test upload end to end

**Step 3 — Library page**

- Implement `GET /api/pdfs` to list all uploaded PDFs
- Build `pages/index.vue` as a grid of PDF cards
- Each card shows name, date, page count; clicking navigates to `/read/{id}`

**Step 4 — PDF rendering**

- Implement `GET /api/pdfs/[id]/url` to serve R2 URL
- Integrate PDF.js in `usePdf.ts`
- Build `PdfViewer.vue` — render all pages as stacked canvases
- Test that a PDF renders correctly in the reader page

**Step 5 — Bookmarks**

- Implement `POST /api/bookmarks` and `GET /api/bookmarks/[pdfId]`
- Add bookmark button to reader toolbar
- Build `ReaderSidebar.vue` with bookmarks tab
- Test create, list, delete bookmark

**Step 6 — Reading progress**

- Implement progress API routes
- Use IntersectionObserver to detect current page as user scrolls
- Auto-save progress debounced (500ms) on page change
- On load, scroll to last saved page

**Step 7 — Highlights**

- Implement `POST /api/highlights`, `GET /api/highlights/[pdfId]`, `DELETE /api/highlights/[id]`
- Add text layer rendering with PDF.js `renderTextLayer()`
- Implement selection detection and rect capture on `mouseup`
- Show a small popover ("Highlight" button) after selection
- Save highlight and re-render overlay divs
- Show highlights in sidebar

**Step 8 — Polish**

- Add color picker for highlights (yellow, green, pink, blue)
- Keyboard shortcuts: `b` to bookmark current page, `Escape` to dismiss popover
- Loading skeletons on library and reader pages
- Error states (upload failed, PDF not found)
- Mobile-responsive layout

---

## Deployment

For local development with real Cloudflare bindings:

```bash
npm run dev
```

---

## Key Libraries & Versions

```json
{
  "dependencies": {
    "nuxt": "^3.x",
    "@nuxtjs/tailwindcss": "latest",
    "pdfjs-dist": "^4.x"
  }
}
```

---

## Common Pitfalls to Avoid

- **PDF.js worker must be in `/public`** — it cannot be bundled. Always set `GlobalWorkerOptions.workerSrc` to a static path.
- **D1 does not support `RETURNING *`** in all cases — fetch the inserted row separately if you need it back.
- **R2 objects are private by default** — you must generate signed URLs or proxy the file through a Worker endpoint. Do not make the bucket public.
- **Text layer and canvas must be perfectly aligned** — the text layer `<div>` must have the exact same dimensions as the canvas and `position: absolute` over it, otherwise highlight coordinates will be off.
- **Scale consistency** — PDF.js renders at a given scale. Store highlight rects at a known scale (e.g. 1.5) and document which scale they were captured at if you plan to support zoom.
- **Debounce progress saves** — do not POST on every scroll tick. Debounce by at least 500ms.
- **`ON DELETE CASCADE`** — ensure this is respected; D1 requires `PRAGMA foreign_keys = ON` to enforce it at query time (add this to each Worker handler that deletes, or rely on application-level cascades).
