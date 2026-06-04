<script setup lang="ts">
const props = defineProps<{
  pdfUrl: string;
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  "go-to-page": [page: number];
  close: [];
}>();

const pdfDoc = ref<any>(null);

onMounted(async () => {
  const pdfjsLib = await usePdfJs();
  pdfDoc.value = await pdfjsLib.getDocument(props.pdfUrl).promise;
  await nextTick();
  renderThumbnails();
});

async function renderThumbnails() {
  if (!pdfDoc.value) return;
  for (let i = 1; i <= pdfDoc.value.numPages; i++) {
    const canvas = document.getElementById(`thumb-${i}`) as HTMLCanvasElement;
    if (!canvas) continue;
    const page = await pdfDoc.value.getPage(i);
    const viewport = page.getViewport({ scale: 0.2 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport })
      .promise;
  }
}

// Auto-scroll to current page thumbnail
watch(
  () => props.currentPage,
  (page) => {
    const el = document.getElementById(`thumb-container-${page}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  },
);
</script>

<template>
  <div
    class="flex flex-col w-[200px] h-screen flex-shrink-0 overflow-auto"
    style="
      background-color: #2a2118;
      border-right: 1px solid rgba(193, 127, 58, 0.18);
    "
  >
    <div
      class="p-3 flex items-center justify-between sticky top-0 z-10"
      style="
        background-color: #2a2118;
        border-bottom: 1px solid rgba(193, 127, 58, 0.18);
      "
    >
      <span
        class="text-[11px]"
        style="
          color: #9e8e7e;
          font-family: &quot;Inter&quot;, system-ui, sans-serif;
        "
        >Pages</span
      >
      <button
        @click="emit('close')"
        class="opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg
          class="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E8DFD0"
          stroke-width="2"
        >
          <path
            d="M6 18L18 6M6 6l12 12"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    <div class="p-2 flex flex-col gap-2">
      <button
        v-for="i in pdfDoc?.numPages ?? 0"
        :id="`thumb-container-${i}`"
        :key="i"
        class="flex flex-col items-center gap-1 p-1 rounded-[4px] cursor-pointer transition-all duration-150 hover:brightness-110"
        :style="{
          border:
            currentPage === i ? '4px solid #C17F3A' : '4px solid transparent',
        }"
        @click="emit('go-to-page', i)"
      >
        <canvas
          :id="`thumb-${i}`"
          class="w-full rounded-[2px]"
          style="background-color: #f5f0e8"
        ></canvas>
        <span
          class="text-[11px]"
          :style="{
            fontFamily: 'JetBrains Mono, monospace',
            color: currentPage === i ? '#C17F3A' : '#9E8E7E',
          }"
        >
          {{ i }}
        </span>
      </button>
    </div>
  </div>
</template>
