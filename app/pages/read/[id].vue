<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

interface Highlight {
  id: string;
  pdf_id: string;
  page: number;
  text: string;
  color: string;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
}

interface Bookmark {
  id: string;
  pdf_id: string;
  page: number;
  label: string | null;
  created_at: string;
}

const highlights = ref<Highlight[]>([]);
const bookmarks = ref<Bookmark[]>([]);
const currentPage = ref(1);
const totalPages = ref(0);
const showSidebar = ref(false);
const showThumbnails = ref(false);
const showSearch = ref(false);
const toasts = ref<
  Array<{ id: string; message: string; icon: "check" | "warn" }>
>([]);
const pdfUrl = ref("");
const pdfName = ref("PDF Reader");

useSeoMeta({
  title: () => `${pdfName.value} | Shelfhost`,
  ogTitle: () => `${pdfName.value} | Shelfhost`,
});

// Fetch initial data
async function init() {
  // Set pdfUrl immediately so the viewer can mount while data loads
  pdfUrl.value = `/api/pdfs/${id}/file`;

  // Fetch highlights, bookmarks, and progress independently so
  // a single API failure (e.g. missing local D1 binding) doesn't
  // block the PDF from rendering.
  const [h, b, p, pdfs] = await Promise.all([
    $fetch<Highlight[]>(`/api/highlights/${id}`).catch(() => [] as Highlight[]),
    $fetch<Bookmark[]>(`/api/bookmarks/${id}`).catch(() => [] as Bookmark[]),
    $fetch<{ page: number }>(`/api/progress/${id}`).catch(() => ({ page: 1 })),
    $fetch<any[]>('/api/pdfs').catch(() => []),
  ]);
  highlights.value = h;
  bookmarks.value = b;
  currentPage.value = p.page ?? 1;

  const currentPdf = pdfs.find((item: any) => item.id === id);
  if (currentPdf) {
    pdfName.value = currentPdf.name;
  }
}

onMounted(init);

// Toast helper
function addToast(message: string, icon: "check" | "warn" = "check") {
  const toastId = crypto.randomUUID();
  toasts.value.push({ id: toastId, message, icon });
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== toastId);
  }, 2500);
}

// Debounced progress save
let progressTimer: ReturnType<typeof setTimeout>;

function onPageChange(page: number) {
  currentPage.value = page;
}

watch(currentPage, (page) => {
  clearTimeout(progressTimer);
  progressTimer = setTimeout(async () => {
    await $fetch(`/api/progress/${id}`, { method: "POST", body: { page } });
  }, 1000);
});

function onTotalPages(n: number) {
  totalPages.value = n;
}

async function onHighlight(data: {
  page: number;
  text: string;
  color: string;
  rects: any[];
}) {
  const result = await $fetch<{ id: string }>("/api/highlights", {
    method: "POST",
    body: { pdfId: id, ...data },
  });
  highlights.value.push({ id: result.id, pdf_id: id, ...data });
}

async function deleteHighlight(highlightId: string) {
  await $fetch(`/api/highlights/${highlightId}`, { method: "DELETE" });
  highlights.value = highlights.value.filter((h) => h.id !== highlightId);
}

const isCurrentPageBookmarked = computed(() =>
  bookmarks.value.some((b) => b.page === currentPage.value),
);

async function toggleBookmark() {
  const existing = bookmarks.value.find((b) => b.page === currentPage.value);
  if (existing) {
    await $fetch(`/api/bookmarks/${existing.id}`, { method: "DELETE" });
    bookmarks.value = bookmarks.value.filter((b) => b.id !== existing.id);
    addToast(`Bookmark removed — Page ${currentPage.value}`, "warn");
  } else {
    const result = await $fetch<{ id: string }>("/api/bookmarks", {
      method: "POST",
      body: { pdfId: id, page: currentPage.value },
    });
    bookmarks.value.push({
      id: result.id,
      pdf_id: id,
      page: currentPage.value,
      label: null,
      created_at: new Date().toISOString(),
    });
    addToast(`Bookmark added — Page ${currentPage.value}`);
  }
}

async function deleteBookmark(bookmarkId: string) {
  await $fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });
  bookmarks.value = bookmarks.value.filter((b) => b.id !== bookmarkId);
}

// Keyboard shortcuts
function handleKey(e: KeyboardEvent) {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  )
    return;
  if (e.key === "b" || e.key === "B") toggleBookmark();
  if (e.key === "Escape") {
    showSidebar.value = false;
    showThumbnails.value = false;
    showSearch.value = false;
  }
  if (e.key === "t" || e.key === "T")
    showThumbnails.value = !showThumbnails.value;
  if (e.key === "h" || e.key === "H") showSidebar.value = !showSidebar.value;
  if ((e.metaKey || e.ctrlKey) && e.key === "f") {
    e.preventDefault();
    showSearch.value = !showSearch.value;
  }
}

onMounted(() => window.addEventListener("keydown", handleKey));
onUnmounted(() => {
  window.removeEventListener("keydown", handleKey);
  clearTimeout(progressTimer);
});
</script>

<template>
  <div class="flex h-screen overflow-hidden" style="background-color: #0f0c09">
    <!-- Thumbnail navigator (left panel) -->
    <ThumbnailNavigator
      v-if="showThumbnails"
      :pdf-url="pdfUrl"
      :current-page="currentPage"
      :total-pages="totalPages"
      @go-to-page="
        (p) => {
          currentPage = p;
          showThumbnails = false;
        }
      "
      @close="showThumbnails = false"
    />

    <!-- Main reader area -->
    <div class="flex-1 overflow-hidden relative">
      <!-- Floating toolbar -->
      <ReaderToolbar
        :current-page="currentPage"
        :total-pages="totalPages"
        :is-bookmarked="isCurrentPageBookmarked"
        :show-sidebar="showSidebar"
        :show-thumbnails="showThumbnails"
        :show-search="showSearch"
        @back="router.push('/')"
        @go-to-page="(p) => (currentPage = p)"
        @prev-page="currentPage = Math.max(1, currentPage - 1)"
        @next-page="currentPage = Math.min(totalPages, currentPage + 1)"
        @toggle-bookmark="toggleBookmark"
        @toggle-sidebar="showSidebar = !showSidebar"
        @toggle-thumbnails="showThumbnails = !showThumbnails"
        @toggle-search="showSearch = !showSearch"
      />

      <!-- Search panel -->
      <SearchPanel
        v-if="showSearch"
        :pdf-url="pdfUrl"
        @close="showSearch = false"
      />

      <!-- PDF Viewer -->
      <PdfViewer
        v-if="pdfUrl"
        :pdf-url="pdfUrl"
        :highlights="highlights"
        :current-page="currentPage"
        @highlight="onHighlight"
        @page-change="onPageChange"
        @total-pages="onTotalPages"
      />
    </div>

    <!-- Right sidebar -->
    <ReaderSidebar
      v-if="showSidebar"
      :bookmarks="bookmarks"
      :highlights="highlights"
      @delete-bookmark="deleteBookmark"
      @delete-highlight="deleteHighlight"
      @go-to-page="(p) => (currentPage = p)"
      @close="showSidebar = false"
    />

    <!-- Toast notifications -->
    <div
      class="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50"
    >
      <ToastNotification
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :icon="toast.icon"
      />
    </div>
  </div>
</template>
