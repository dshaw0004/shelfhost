<script setup lang="ts">
interface Highlight {
  id: string;
  page: number;
  color: string;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
}

const props = defineProps<{
  pdfUrl: string;
  highlights: Highlight[];
  currentPage: number;
}>();

const emit = defineEmits<{
  highlight: [
    data: { page: number; text: string; color: string; rects: any[] },
  ];
  "page-change": [page: number];
  "total-pages": [n: number];
}>();

const pagesContainer = ref<HTMLElement | null>(null);
const pdfDoc = shallowRef<any>(null);
const renderedPages = ref<Set<number>>(new Set());
const renderQueue = ref<Set<number>>(new Set());
const pageDimensions = ref<{ width: number; height: number }[]>([]);

// Layout stability state
const lastWindowWidth = ref(0);
const lastWindowHeight = ref(0);

// Popover state
const lastObservedPage = ref(0);
const popover = ref<{
  visible: boolean;
  x: number;
  y: number;
  page: number;
  text: string;
  rects: any[];
} | null>(null);

// Watch currentPage from parent to scroll to it
watch(
  () => props.currentPage,
  (newPage) => {
    if (newPage !== lastObservedPage.value) {
      scrollToPage(newPage);
    }
  },
);

onMounted(async () => {
  const pdfjsLib = await usePdfJs();
  const loadingTask = pdfjsLib.getDocument(props.pdfUrl);
  pdfDoc.value = markRaw(await loadingTask.promise);
  emit("total-pages", pdfDoc.value.numPages);

  // Calculate ALL page dimensions first so the scroll container has correct height
  await calculateAllPageDimensions();

  // Initialize window dimensions
  lastWindowWidth.value = window.innerWidth;
  lastWindowHeight.value = window.innerHeight;

  // Setup ResizeObserver to handle window resizing/rotation
  if (pagesContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const widthChanged = Math.abs(w - lastWindowWidth.value) > 20; // Ignore small changes (e.g. scrollbar toggle)
      const heightChanged = Math.abs(h - lastWindowHeight.value) > 20;

      if (widthChanged || heightChanged) {
        lastWindowWidth.value = w;
        lastWindowHeight.value = h;

        renderedPages.value.clear();
        renderQueue.value.clear();
        calculateAllPageDimensions().then(() => {
          renderVisiblePages();
          // Restore scroll position after re-render (instant jump to avoid visual glitch)
          scrollToPage(props.currentPage, "auto");
        });
      } else {
        // Container resized but window dimensions are stable (e.g. sidebar toggle)
        // Just restore the scroll position immediately to prevent layout shift
        scrollToPage(props.currentPage, "auto");
      }
    });
    resizeObserver.observe(pagesContainer.value);
  }

  // Now we can accurately scroll to the target page
  if (props.currentPage > 1) {
    await nextTick(); // Ensure DOM has updated with dimensions
    scrollToPage(props.currentPage);
    lastObservedPage.value = props.currentPage;
  }

  setupIntersectionObserver();
  await renderVisiblePages();
});

let resizeObserver: ResizeObserver | null = null;

function getScaleForPage(page: any) {
  const unscaledViewport = page.getViewport({ scale: 1 });
  // Check if mobile (using 768px as breakpoint)
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    // 100vw width
    return window.innerWidth / unscaledViewport.width;
  } else {
    // 100vh height
    return window.innerHeight / unscaledViewport.height;
  }
}

async function calculateAllPageDimensions() {
  if (!pdfDoc.value) return;

  const promises = [];
  for (let i = 1; i <= pdfDoc.value.numPages; i++) {
    promises.push(pdfDoc.value.getPage(i).then((page: any) => {
      const scale = getScaleForPage(page);
      const viewport = page.getViewport({ scale });
      return { width: viewport.width, height: viewport.height };
    }));
  }

  pageDimensions.value = await Promise.all(promises);
}

function scrollToPage(pageNum: number, behavior: ScrollBehavior = "smooth") {
  // Target the wrapper to scroll horizontally
  const el = document.getElementById(`page-wrapper-${pageNum}`);
  if (el) {
    el.scrollIntoView({ behavior, block: "start", inline: "start" });
    el.scrollTop = 0; // Reset vertical scroll to top of page
  }
}

let observer: IntersectionObserver | null = null;

function setupIntersectionObserver() {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const pageNum = parseInt(
            entry.target.getAttribute("data-page") ?? "0",
          );
          if (pageNum) {
            lastObservedPage.value = pageNum;
            emit("page-change", pageNum);
            renderPageIfNeeded(pageNum);
            if (pageNum > 1) renderPageIfNeeded(pageNum - 1);
            if (pageNum < (pdfDoc.value?.numPages ?? 0))
              renderPageIfNeeded(pageNum + 1);
          }
        }
      }
    },
    { threshold: 0.5 }, // Increased threshold for snap scrolling
  );

  document
    .querySelectorAll("[data-page]")
    .forEach((el) => observer?.observe(el));
}

async function renderVisiblePages() {
  if (!pdfDoc.value) return;
  const start = Math.max(1, props.currentPage - 1);
  const end = Math.min(props.currentPage + 2, pdfDoc.value.numPages);
  for (let i = start; i <= end; i++) {
    await renderPageIfNeeded(i);
  }
}

async function renderPageIfNeeded(pageNum: number) {
  if (
    !pdfDoc.value ||
    renderedPages.value.has(pageNum) ||
    renderQueue.value.has(pageNum)
  )
    return;
  renderQueue.value.add(pageNum);

  const canvas = document.getElementById(
    `canvas-${pageNum}`,
  ) as HTMLCanvasElement;
  const textLayer = document.getElementById(`text-${pageNum}`) as HTMLElement;
  if (!canvas || !textLayer) return;

  try {
    const page = await pdfDoc.value.getPage(pageNum);
    const scale = getScaleForPage(page);
    const viewport = page.getViewport({ scale });
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    // Dimensions are already set on the container via pageDimensions

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
    }).promise;

    // Text layer
    const pdfjsLib = await usePdfJs();
    textLayer.innerHTML = "";
    const tl = new pdfjsLib.TextLayer({
      textContentSource: page.streamTextContent(),
      container: textLayer,
      viewport,
    });
    await tl.render();

    renderedPages.value.add(pageNum);
  } finally {
    renderQueue.value.delete(pageNum);
  }
}

function onMouseUp(pageNum: number) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    popover.value = null;
    return;
  }

  const range = selection.getRangeAt(0);
  const domRects = Array.from(range.getClientRects());
  const pageContainer = document.getElementById(`page-${pageNum}`);
  if (!pageContainer) return;

  const containerRect = pageContainer.getBoundingClientRect();
  const rects = domRects
    .map((r) => ({
      x: r.left - containerRect.left,
      y: r.top - containerRect.top,
      width: r.width,
      height: r.height,
    }))
    .filter((r) => r.width > 0 && r.height > 0);

  if (rects.length === 0) return;

  const midX =
    domRects.reduce((s, r) => s + r.left + r.width / 2, 0) / domRects.length;
  const topY = Math.min(...domRects.map((r) => r.top));

  popover.value = {
    visible: true,
    x: midX - containerRect.left,
    y: topY - containerRect.top - 60,
    page: pageNum,
    text: selection.toString(),
    rects,
  };
}

function onHighlightSelect(color: string) {
  if (!popover.value) return;
  emit("highlight", {
    page: popover.value.page,
    text: popover.value.text,
    color,
    rects: popover.value.rects,
  });
  popover.value = null;
  window.getSelection()?.removeAllRanges();
}

function dismissPopover() {
  popover.value = null;
}

function getPageHighlights(pageNum: number) {
  return props.highlights.filter((h) => h.page === pageNum);
}

onUnmounted(() => {
  observer?.disconnect();
  resizeObserver?.disconnect();
});
</script>

<template>
  <div
    ref="pagesContainer"
    class="flex flex-row items-start min-h-full w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory"
  >
    <template v-if="pdfDoc">
      <!-- Wrapper for each page to handle vertical scrolling and snap alignment -->
      <div
        v-for="pageNum in pdfDoc.numPages"
        :key="pageNum"
        :id="`page-wrapper-${pageNum}`"
        :data-page="pageNum"
        class="min-w-full h-full overflow-y-auto flex flex-col items-center justify-center snap-center relative"
      >
        <div
          :id="`page-${pageNum}`"
          class="relative bg-white"
          :style="{
            width: (pageDimensions[pageNum - 1]?.width ?? 800) + 'px',
            height: (pageDimensions[pageNum - 1]?.height ?? 1100) + 'px',
            borderRadius: '2px',
            boxShadow: '0 4px 32px rgba(0, 0, 0, 0.6)',
            backgroundColor: '#f5f0e8',
            flexShrink: 0
          }"
        >
          <canvas
            :id="`canvas-${pageNum}`"
            style="display: block; width: 100%; height: 100%"
          ></canvas>

          <div
            :id="`text-${pageNum}`"
            class="textLayer absolute top-0 left-0 overflow-hidden"
            style="cursor: text; user-select: text; width: 100%; height: 100%"
            @mouseup="onMouseUp(pageNum)"
            @click="dismissPopover"
          ></div>

          <template
            v-for="highlight in getPageHighlights(pageNum)"
            :key="highlight.id"
          >
            <div
              v-for="(rect, i) in highlight.rects"
              :key="i"
              class="absolute pointer-events-none"
              style="mix-blend-mode: multiply"
              :style="{
                left: rect.x + 'px',
                top: rect.y + 'px',
                width: rect.width + 'px',
                height: rect.height + 'px',
                backgroundColor: highlight.color,
                opacity: 0.5,
              }"
            />
          </template>

          <HighlightPopover
            v-if="popover && popover.page === pageNum"
            :x="popover.x"
            :y="popover.y"
            @select-color="onHighlightSelect"
            @dismiss="dismissPopover"
          />
        </div>
      </div>
    </template>
    <div v-else class="flex items-center justify-center h-screen w-full">
      <div class="text-center">
        <div
          class="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
        ></div>
        <p style="color: #9e8e7e">Loading PDF…</p>
      </div>
    </div>
  </div>
</template>

<style>
.textLayer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 1;
  line-height: 1;
  user-select: text;
}
.textLayer span {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}
.textLayer ::selection {
  background: rgba(193, 127, 58, 0.3);
}
</style>
