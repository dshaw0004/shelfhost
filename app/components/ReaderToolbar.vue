<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
  isBookmarked: boolean
  showSidebar: boolean
  showThumbnails: boolean
  showSearch: boolean
}>()

const emit = defineEmits<{
  back: []
  'go-to-page': [page: number]
  'prev-page': []
  'next-page': []
  'toggle-bookmark': []
  'toggle-sidebar': []
  'toggle-thumbnails': []
  'toggle-search': []
}>()

const visible = ref(true)
const pageInput = ref(props.currentPage.toString())
let hideTimer: ReturnType<typeof setTimeout>

watch(() => props.currentPage, (v) => { pageInput.value = v.toString() })

function showToolbar() {
  visible.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    if (!props.showSidebar && !props.showThumbnails && !props.showSearch) {
      visible.value = false
    }
  }, 3000)
}

function onPageInputEnter() {
  const p = parseInt(pageInput.value)
  if (p >= 1 && p <= props.totalPages) emit('go-to-page', p)
  else pageInput.value = props.currentPage.toString()
}

onMounted(() => {
  window.addEventListener('mousemove', showToolbar)
  visible.value = true
})
onUnmounted(() => window.removeEventListener('mousemove', showToolbar))

watch([() => props.showSidebar, () => props.showThumbnails, () => props.showSearch], ([s, t, sr]) => {
  if (s || t || sr) { visible.value = true; clearTimeout(hideTimer) }
})
</script>

<template>
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-4 h-12 rounded-[14px] transition-all duration-200"
    :style="{
      opacity: visible ? 1 : 0,
      transform: `translateX(-50%) translateY(${visible ? '0' : '-8px'})`,
      backgroundColor: 'rgba(26, 18, 12, 0.88)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(193,127,58,0.18)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      pointerEvents: visible ? 'auto' : 'none'
    }">

    <!-- Back -->
    <button @click="emit('back')" class="w-8 h-8 flex items-center justify-center rounded hover:opacity-100 opacity-70 transition-opacity"
      aria-label="Back to library">
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#E8DFD0" stroke-width="2">
        <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="w-px h-6 mx-1" style="background-color: rgba(193,127,58,0.18);"></div>

    <!-- Page navigation -->
    <button @click="emit('prev-page')" class="w-8 h-8 flex items-center justify-center rounded opacity-70 hover:opacity-100 transition-opacity" aria-label="Previous page">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#E8DFD0" stroke-width="2">
        <path d="M15.75 19.5L8.25 12l7.5-7.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="flex items-center gap-1">
      <input
        v-model="pageInput"
        type="number"
        class="w-10 text-center text-[13px] bg-transparent border-none outline-none"
        style="font-family: 'JetBrains Mono', monospace; color: #E8DFD0;"
        @keydown.enter="onPageInputEnter"
        @blur="onPageInputEnter"
        :min="1"
        :max="totalPages"
      />
      <span class="text-[13px]" style="font-family: 'JetBrains Mono', monospace; color: #9E8E7E;">/ {{ totalPages }}</span>
    </div>

    <button @click="emit('next-page')" class="w-8 h-8 flex items-center justify-center rounded opacity-70 hover:opacity-100 transition-opacity" aria-label="Next page">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#E8DFD0" stroke-width="2">
        <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>


    <div class="w-px h-6 mx-1" style="background-color: rgba(193,127,58,0.18);"></div>

    <!-- Search -->
    <button @click="emit('toggle-search')" class="w-8 h-8 flex items-center justify-center rounded transition-all"
      :style="{ color: showSearch ? '#C17F3A' : '#E8DFD0', opacity: showSearch ? 1 : 0.7 }"
      aria-label="Search in document">
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Thumbnails -->
    <button @click="emit('toggle-thumbnails')" class="w-8 h-8 flex items-center justify-center rounded transition-all"
      :style="{ color: showThumbnails ? '#C17F3A' : '#E8DFD0', opacity: showThumbnails ? 1 : 0.7 }"
      aria-label="Page thumbnails">
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Bookmark -->
    <button @click="emit('toggle-bookmark')" class="w-8 h-8 flex items-center justify-center rounded transition-all"
      :style="{ color: isBookmarked ? '#C17F3A' : '#E8DFD0', opacity: isBookmarked ? 1 : 0.7 }"
      aria-label="Bookmark current page">
      <svg class="w-5 h-5" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Highlights sidebar -->
    <button @click="emit('toggle-sidebar')" class="w-8 h-8 flex items-center justify-center rounded transition-all"
      :style="{ color: showSidebar ? '#C17F3A' : '#E8DFD0', opacity: showSidebar ? 1 : 0.7 }"
      aria-label="Highlights and bookmarks">
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3.75 5.25h16.5m-16.5 4.5H12m-8.25 4.5h16.5m-16.5 4.5H12" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</template>
