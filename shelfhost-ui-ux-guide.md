# PDF Reader — UI/UX Design Document

## Design Philosophy

The app should feel like sitting down with a good book — warm, focused, and unhurried. Every element of the interface exists to serve the reading experience. Chrome is minimal. Distractions are eliminated by default. When tools are needed (highlights, bookmarks, search), they appear naturally and retreat when done.

Inspiration: physical books, Kindle Paperwhite, Bear Notes, iA Writer.

---

## Design Tokens

### Color Palette

```
/* Backgrounds */
--color-bg-base:        #1C1612   /* Deep espresso — app shell */
--color-bg-surface:     #F5F0E8   /* Warm cream — PDF page background */
--color-bg-elevated:    #2A2118   /* Slightly lighter espresso — panels, modals */
--color-bg-overlay:     rgba(28, 22, 18, 0.75)  /* Dimmed backdrop */

/* Text */
--color-text-primary:   #1A1208   /* Near-black warm brown — body text on cream */
--color-text-secondary: #6B5D4F   /* Muted warm brown — labels, captions */
--color-text-inverse:   #E8DFD0   /* Warm off-white — text on dark backgrounds */
--color-text-muted:     #9E8E7E   /* Soft taupe — placeholders, disabled */

/* Accents */
--color-accent:         #C17F3A   /* Amber gold — primary actions, active states */
--color-accent-hover:   #D4923F   /* Lighter gold — hover state */
--color-accent-subtle:  rgba(193, 127, 58, 0.12)  /* Ghost gold — selected rows */

/* Highlight Colors (5 options) */
--highlight-yellow:     rgba(255, 220, 50, 0.40)
--highlight-amber:      rgba(230, 140, 30, 0.38)
--highlight-green:      rgba(80, 170, 100, 0.35)
--highlight-pink:       rgba(220, 90, 120, 0.32)
--highlight-blue:       rgba(70, 140, 210, 0.35)

/* UI */
--color-border:         rgba(193, 127, 58, 0.18)  /* Warm subtle border */
--color-shadow:         rgba(0, 0, 0, 0.45)
```

### Typography

```
/* Fonts */
--font-serif:    'Lora', 'Georgia', serif          /* Headings, sidebar labels */
--font-sans:     'Inter', system-ui, sans-serif    /* UI elements, metadata */
--font-mono:     'JetBrains Mono', monospace       /* Page numbers, counts */

/* Scale */
--text-xs:    11px
--text-sm:    13px
--text-base:  15px
--text-lg:    18px
--text-xl:    22px
--text-2xl:   28px
```

### Spacing & Shape

```
--radius-sm:   4px
--radius-md:   8px
--radius-lg:   14px
--radius-full: 9999px

--spacing-unit: 4px   /* Base unit. Use multiples: 4, 8, 12, 16, 24, 32, 48 */
```

### Motion

```
--duration-fast:   120ms
--duration-base:   220ms
--duration-slow:   380ms
--ease-out:        cubic-bezier(0.16, 1, 0.3, 1)   /* Snappy, natural */
--ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1)
```

---

## Pages & Screens

---

### 1. Library Page (`/`)

**Purpose:** Display all uploaded PDFs in a warm, bookshelf-like grid.

**Layout:**
- Full-page dark background (`--color-bg-base`)
- Centered content column, max-width `1100px`, horizontal padding `32px`
- Top navbar + scrollable grid below

**Navbar (top, sticky):**
- Left: App logo/wordmark in serif font, warm off-white color
- Right: Upload button — amber gold, rounded pill shape, label "Add PDF"
- Height: `60px`
- Bottom border: 1px `--color-border`

**Grid:**
- 3 columns on desktop, 2 on tablet, 1 on mobile
- Gap: `24px`
- Each card: see PDF Card spec below

**Empty state:**
- Center of page, vertically centered
- Large book icon (outline, amber gold tint)
- Heading: "Your library is empty" (serif, `--color-text-inverse`)
- Subtext: "Upload a PDF to get started" (sans, `--color-text-muted`)
- Upload button below text

**PDF Card:**
- Background: `--color-bg-elevated`
- Border radius: `--radius-lg`
- Border: 1px `--color-border`
- Padding: `20px`
- Subtle box shadow on hover (`--color-shadow` at 30% opacity)
- Hover: card lifts slightly (`transform: translateY(-2px)`), border brightens
- Transition: `--duration-base` `--ease-out`

Card contents (top to bottom):
1. **Thumbnail area** — `160px` tall, dark warm bg (`#251C13`), centered PDF icon or first-page preview if generated. Rounded top corners.
2. **File name** — serif font, `--text-base`, `--color-text-inverse`, truncated to 2 lines, `margin-top: 12px`
3. **Metadata row** — sans font, `--text-xs`, `--color-text-muted`: page count on left, upload date on right
4. **Progress bar** (if reading started) — thin `4px` bar, amber gold fill, warm dark track, `border-radius: full`, `margin-top: 8px`

Card hover reveals a subtle "Open" label overlaid on the thumbnail.

---

### 2. Reader Page (`/read/[id]`)

**Purpose:** Distraction-free reading environment. The PDF is the entire screen. All tools are hidden until needed.

**Layout:**
- Full viewport, dark shell (`--color-bg-base`)
- PDF pages centered in a scrollable area
- Floating top toolbar (hidden until hover/focus)
- Floating panels (search, thumbnails, sidebar) slide in from edges
- No persistent sidebars visible by default

---

#### Reader — PDF Canvas Area

- Background: `#0F0C09` (darkest warm black — makes cream pages pop)
- Pages rendered as stacked vertical blocks with `32px` gap between pages
- Each page:
  - Background: `--color-bg-surface` (warm cream)
  - Box shadow: `0 4px 32px rgba(0,0,0,0.6)` — makes pages feel physical/lifted
  - Max width: `800px`, centered
  - Border radius: `2px` (very slight — pages are mostly rectangular)
- Smooth scroll behavior

---

#### Reader — Floating Toolbar

**Behavior:**
- Hidden by default (`opacity: 0`, `translateY(-8px)`)
- Appears on: mouse move near top of screen (within 80px), or pressing any keyboard shortcut
- Auto-hides after `3s` of mouse inactivity
- Transition: `--duration-base` fade + slide
- Always visible when any panel is open

**Appearance:**
- Fixed to top of viewport, centered horizontally
- `margin-top: 16px`
- Background: `rgba(26, 18, 12, 0.88)` with `backdrop-filter: blur(16px)`
- Border: 1px `--color-border`
- Border radius: `--radius-lg`
- Padding: `8px 16px`
- Height: `48px`
- Shadow: `0 8px 32px rgba(0,0,0,0.5)`

**Toolbar contents (left to right):**

| Element | Detail |
|---|---|
| ← Back arrow | Returns to library. Icon only. |
| Divider | 1px vertical line, `--color-border` |
| Page input | Editable number input — current page. `/ {total}` label after. Monospace font. Click to edit, press Enter to jump. |
| Prev / Next page | Chevron icon buttons, `32px` hit area |
| Divider | |
| Zoom out / Zoom in | `−` and `+` icon buttons. Current zoom % shown between them in monospace. |
| Divider | |
| Search icon | Opens search panel. Highlighted amber when active. |
| Thumbnails icon | Opens thumbnail navigator panel. |
| Bookmark icon | Bookmarks current page. Fills amber gold when page is bookmarked. |
| Highlights icon | Opens highlights/bookmarks sidebar. |

All toolbar icons: `20px`, `--color-text-inverse` default, `--color-accent` on hover/active.

---

#### Reader — Highlight Interaction

**Text selection flow:**

1. User selects text on the PDF page (via text layer)
2. A small **Highlight Popover** floats just above the selection midpoint
3. Popover fades in with `--duration-fast` ease
4. Popover contains 5 color swatches (circles, `20px` diameter) in a horizontal row:
   - Yellow, Amber, Green, Pink, Blue
   - Default selection: Yellow (shown with a thin ring border)
   - Clicking a color applies the highlight in that color immediately
5. A small trash icon at the end of the row (only shown when re-selecting an existing highlight)
6. Clicking outside the popover dismisses it without highlighting

**Popover appearance:**
- Background: `rgba(26, 18, 12, 0.92)` + `backdrop-filter: blur(12px)`
- Border: 1px `--color-border`
- Border radius: `--radius-full` (pill shape)
- Padding: `8px 12px`
- Gap between swatches: `8px`
- Shadow: `0 4px 16px rgba(0,0,0,0.5)`
- Arrow pointing down toward selection (CSS triangle)

**Applied highlights:**
- Rendered as semi-transparent colored `<div>` overlays on the page
- `mix-blend-mode: multiply` so text remains legible beneath
- On hover: highlight brightens slightly (opacity +0.1), shows a subtle underline
- Clicking an existing highlight re-opens the popover (with delete option)

---

#### Reader — Search Panel

**Trigger:** Search icon in toolbar, or `Cmd/Ctrl + F`

**Appearance:**
- Slides in from the top, just below the toolbar
- Width: `340px`, centered horizontally
- Background: `rgba(26, 18, 12, 0.94)` + blur
- Border: 1px `--color-border`
- Border radius: `--radius-lg`
- Padding: `12px 16px`
- Shadow: same as toolbar

**Contents:**
- Text input, full-width, serif placeholder: "Search in document…"
- Input: `--color-bg-elevated` background, `--color-text-inverse` text, `--color-accent` focus ring
- Match count: `--color-text-muted`, `--text-xs`, shown right-aligned inside input (e.g. "3 of 12")
- Prev / Next match buttons: chevron icons, right of input
- `✕` close button: top right of panel

**Search results behavior:**
- Matching text highlighted on the page with a distinct bright amber overlay (different from user highlights — use a dashed underline + amber bg)
- Current match: brighter, with a solid amber ring around it
- Page auto-scrolls to bring current match into view (smooth scroll)
- Matches persist visually until search is closed

---

#### Reader — Thumbnail Navigator Panel

**Trigger:** Thumbnails icon in toolbar

**Appearance:**
- Slides in from the **left** edge of the screen
- Width: `200px`
- Full viewport height, sits below the toolbar
- Background: `--color-bg-elevated`
- Right border: 1px `--color-border`
- Internal scroll

**Contents:**
- Scrollable vertical list of page thumbnails
- Each thumbnail:
  - Rendered mini canvas of the page (use PDF.js at low scale, e.g. 0.2)
  - Warm cream background
  - Page number below in monospace `--text-xs` `--color-text-muted`
  - Border radius: `--radius-sm`
  - `4px` border, transparent by default
  - **Current page:** amber gold border, page number turns amber
  - Hover: slight brightness increase, cursor pointer
  - Clicking scrolls reader to that page

**Behavior:**
- Panel opens with a slide-in animation (`translateX(-200px)` → `0`) `--duration-slow` `--ease-out`
- Thumbnails panel auto-scrolls to keep current page thumbnail in view as user reads
- Clicking anywhere in the main PDF area closes the panel (on mobile)
- On desktop, panel stays open until explicitly closed

---

#### Reader — Highlights & Bookmarks Sidebar

**Trigger:** Highlights icon in toolbar

**Appearance:**
- Slides in from the **right** edge
- Width: `300px`
- Full viewport height
- Background: `--color-bg-elevated`
- Left border: 1px `--color-border`

**Header:**
- Two tabs: "Bookmarks" | "Highlights"
- Active tab: serif font, `--color-accent`, bottom border `2px` amber
- Inactive tab: `--color-text-muted`

**Bookmarks tab:**
- Scrollable list
- Each bookmark row:
  - Page number badge: small amber pill, monospace, e.g. "p.12"
  - Label text (editable inline on double-click): `--color-text-inverse`, serif
  - Clicking row: reader jumps to that page (smooth scroll)
  - Hover: `--color-accent-subtle` background, shows trash icon on right
- Empty state: "No bookmarks yet. Press B while reading to add one."

**Highlights tab:**
- Scrollable list, grouped by page
- Page group header: `--text-xs`, `--color-text-muted`, "Page 12" label, sticky within scroll
- Each highlight row:
  - Left color bar: `4px` wide, full height of row, in the highlight's color
  - Highlight text snippet: `--color-text-inverse`, `--text-sm`, max 3 lines, truncated
  - Clicking row: reader jumps to that page and briefly pulses the highlight (scale animation)
  - Hover: shows trash icon on right
- Empty state: "No highlights yet. Select text while reading to highlight."

---

### 3. Upload Modal

**Trigger:** "Add PDF" button on library page

**Appearance:**
- Full-screen dark overlay (`--color-bg-overlay`)
- Modal card: centered, `480px` wide, `--color-bg-elevated` background, `--radius-lg`, `32px` padding
- Shadow: `0 24px 64px rgba(0,0,0,0.7)`
- Fade + scale-in animation (`scale(0.96)` → `scale(1)`, `--duration-base`)

**Contents:**

1. **Heading:** "Upload a PDF" — serif, `--text-xl`, `--color-text-inverse`
2. **Drop zone:**
   - Dashed border `2px`, `--color-border`, `--radius-lg`
   - Background: `rgba(193, 127, 58, 0.04)`
   - Height: `160px`
   - Centered icon (upload arrow) + text: "Drag & drop your PDF here"
   - Subtext: "or click to browse files" — `--color-text-muted`, `--text-sm`
   - **Drag-over state:** border turns solid amber, background `rgba(193,127,58,0.10)`, icon scales up slightly
3. **File selected state:** replaces drop zone with file name + size + remove `✕` button
4. **Upload button:** full-width, amber gold bg, `--radius-md`, `48px` height, serif label "Upload PDF"
   - Loading state: spinner replaces label, button disabled
   - Success: brief checkmark animation, modal closes, library refreshes
5. **Cancel link:** below button, `--color-text-muted`, small

---

## Interaction & Micro-animation Patterns

**Page load (reader):**
- PDF pages fade in one by one as they render (`opacity: 0 → 1`, staggered by 60ms per page)
- Skeleton placeholder (warm cream block with subtle shimmer) shown before render

**Toolbar show/hide:**
- Smooth opacity + translateY transition, `--duration-base`
- Never abruptly disappears mid-interaction

**Panel slide-ins (all):**
- `translateX` or `translateY` from edge → `0`, `--duration-slow`, `--ease-out`
- Backdrop dims slightly when any panel is open

**Highlight applied:**
- Overlay div fades in over `150ms`
- Brief soft pulse (scale `1.0 → 1.02 → 1.0`) to confirm it was saved

**Bookmark toggled:**
- Toolbar icon animates: empty → filled with a gentle scale bounce
- A small toast appears bottom-center: "Bookmark added — Page 12" (auto-dismisses in `2.5s`)

**Toast notifications:**
- Slides up from bottom center (`translateY(16px) → 0`)
- Background: `--color-bg-elevated`, border `--color-border`, text `--color-text-inverse`
- Icon left: checkmark (green) or warning (amber)
- Auto-dismiss after `2.5s` with fade-out

**Thumbnail hover:**
- Scale: `1.0 → 1.03`, shadow increases, `--duration-fast`

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `B` | Bookmark / unbookmark current page |
| `Cmd/Ctrl + F` | Open search |
| `Escape` | Close any open panel / dismiss popover |
| `←` / `→` | Previous / next page |
| `T` | Toggle thumbnail navigator |
| `H` | Toggle highlights & bookmarks sidebar |
| `+` / `-` | Zoom in / out |

---

## Responsive Behavior

**Desktop (≥1024px):**
- Full experience as described above
- Thumbnail panel and sidebar can be open simultaneously

**Tablet (768px – 1023px):**
- Thumbnail panel overlays the PDF (does not push it)
- Sidebar overlays from right
- Toolbar always visible (not auto-hidden)

**Mobile (<768px):**
- Toolbar fixed at bottom of screen (not top)
- Thumbnail panel: full-width bottom sheet, shows 2-column thumbnail grid
- Sidebar: full-screen sheet from bottom
- Highlight popover: appears above selection, slightly larger touch targets (`28px` swatches)
- Pinch-to-zoom on PDF canvas

---

## Accessibility

- All interactive elements have visible focus rings (`2px` amber gold outline, `2px` offset)
- Toolbar icons have `aria-label` attributes
- Color swatches in highlight popover labeled with color name (`aria-label="Highlight in yellow"`)
- Sidebar items are keyboard navigable (arrow keys within list)
- Sufficient contrast: all text on dark backgrounds meets WCAG AA (4.5:1 minimum)
- Warm cream page background (`#F5F0E8`) with near-black text (`#1A1208`) contrast ratio: ~14:1
- Animations respect `prefers-reduced-motion`: all transitions reduced to `opacity` only, no transforms

---

## Component Summary

| Component | Description |
|---|---|
| `LibraryGrid.vue` | Responsive grid of PDF cards |
| `PdfCard.vue` | Individual book card with thumbnail, title, progress |
| `UploadModal.vue` | Drag-and-drop upload modal |
| `ReaderToolbar.vue` | Floating top toolbar, auto-hide behavior |
| `PdfViewer.vue` | PDF.js canvas + text layer + highlight overlays |
| `HighlightPopover.vue` | Color picker popover on text selection |
| `SearchPanel.vue` | Floating search panel with match navigation |
| `ThumbnailNavigator.vue` | Left-side thumbnail panel |
| `ReaderSidebar.vue` | Right-side bookmarks + highlights sidebar |
| `ToastNotification.vue` | Bottom-center auto-dismissing toast |
| `PageSkeleton.vue` | Warm shimmer placeholder while page renders |
