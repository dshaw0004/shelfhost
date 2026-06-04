<script setup lang="ts">
interface Pdf {
  id: string
  name: string
  size: number
  page_count: number | null
  created_at: string
  current_page: number
}

useSeoMeta({
  title: 'Shelfhost - Your PDF Library',
  ogTitle: 'Shelfhost - Your PDF Library',
  description: 'A self-hosted PDF library, reader, and highlighting tool designed for a distraction-free reading experience.',
  ogDescription: 'A self-hosted PDF library, reader, and highlighting tool designed for a distraction-free reading experience.',
})

const pdfs = ref<Pdf[]>([]);
const showUploadModal = ref(false);
const loading = ref(true);

async function fetchPdfs() {
  loading.value = true
  try {
    pdfs.value = await $fetch<Pdf[]>('/api/pdfs')
  } finally {
    loading.value = false
  }
}

onMounted(fetchPdfs)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function readingProgress(pdf: Pdf) {
  if (!pdf.page_count || pdf.page_count === 0) return 0
  if (pdf.page_count === 1) return pdf.current_page > 1 ? 100 : 0
  return Math.round(((pdf.current_page - 1) / (pdf.page_count - 1)) * 100)
}
</script>

<template>
  <div class="min-h-screen" style="background-color: #1C1612;">
    <!-- Navbar -->
    <nav class="sticky top-0 z-10 flex items-center justify-between px-8 h-[60px]"
      style="border-bottom: 1px solid rgba(193,127,58,0.18); background-color: #1C1612;">
      <span class="text-xl font-serif" style="color: #E8DFD0; font-family: 'Lora', Georgia, serif;">Shelfhost</span>
      <button @click="showUploadModal = true"
        class="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
        style="background-color: #C17F3A; color: #1A1208; font-family: 'Inter', system-ui, sans-serif;">
        + Add PDF
      </button>
    </nav>

    <!-- Main content -->
    <main class="max-w-[1100px] mx-auto px-8 py-8">
      <!-- Loading skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="rounded-[14px] overflow-hidden animate-pulse"
          style="background-color: #2A2118; border: 1px solid rgba(193,127,58,0.18);">
          <div class="h-[160px]" style="background-color: #251C13;"></div>
          <div class="p-5">
            <div class="h-4 rounded mb-2" style="background-color: #3A2D1E; width: 80%;"></div>
            <div class="h-3 rounded" style="background-color: #3A2D1E; width: 50%;"></div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="pdfs.length === 0" class="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <svg class="w-20 h-20 mb-6" viewBox="0 0 24 24" fill="none" stroke="#C17F3A" stroke-width="1.5">
          <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h2 class="text-2xl mb-2" style="font-family: 'Lora', Georgia, serif; color: #E8DFD0;">Your library is empty</h2>
        <p class="mb-6 text-sm" style="font-family: 'Inter', system-ui, sans-serif; color: #9E8E7E;">Upload a PDF to get started</p>
        <button @click="showUploadModal = true"
          class="px-6 py-2.5 rounded-full font-medium transition-all duration-200"
          style="background-color: #C17F3A; color: #1A1208;">Upload PDF</button>
      </div>

      <!-- PDF Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink v-for="pdf in pdfs" :key="pdf.id" :to="`/read/${pdf.id}`"
          class="group block rounded-[14px] overflow-hidden transition-all duration-200 cursor-pointer"
          style="background-color: #2A2118; border: 1px solid rgba(193,127,58,0.18);">
          <!-- Thumbnail -->
          <div class="relative h-[160px] flex items-center justify-center overflow-hidden"
            style="background-color: #251C13; border-radius: 14px 14px 0 0;">
            <svg class="w-12 h-12 opacity-40" viewBox="0 0 24 24" fill="none" stroke="#C17F3A" stroke-width="1.5">
              <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <!-- Hover overlay -->
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style="background-color: rgba(193,127,58,0.15);">
              <span class="text-sm font-medium px-4 py-1.5 rounded-full" style="background-color: #C17F3A; color: #1A1208;">Open</span>
            </div>
          </div>
          <!-- Card content -->
          <div class="p-5 group-hover:-translate-y-0.5 transition-transform duration-200">
            <h3 class="text-[15px] leading-snug mb-2 line-clamp-2"
              style="font-family: 'Lora', Georgia, serif; color: #E8DFD0;">{{ pdf.name }}</h3>
            <div class="flex justify-between text-[11px]" style="font-family: 'Inter', system-ui, sans-serif; color: #9E8E7E;">
              <span>{{ pdf.page_count ? `${pdf.page_count} pages` : 'Unknown pages' }}</span>
              <span>{{ formatDate(pdf.created_at) }}</span>
            </div>
            <!-- Progress bar -->
            <div v-if="pdf.page_count && pdf.current_page > 1" class="mt-2 h-[4px] rounded-full overflow-hidden"
              style="background-color: #3A2D1E;">
              <div class="h-full rounded-full transition-all" style="background-color: #C17F3A;"
                :style="{ width: readingProgress(pdf) + '%' }"></div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </main>

    <!-- Upload Modal -->
    <UploadModal v-if="showUploadModal" @close="showUploadModal = false" @uploaded="fetchPdfs" />
  </div>
</template>
