<script setup lang="ts">
defineProps<{ pdfUrl: string }>()
const emit = defineEmits<{ close: [] }>()
const query = ref('')
</script>

<template>
  <div class="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[340px] rounded-[14px] px-4 py-3"
    style="background-color: rgba(26, 18, 12, 0.94); backdrop-filter: blur(12px); border: 1px solid rgba(193,127,58,0.18); box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
    <div class="flex items-center gap-2">
      <svg class="w-4 h-4 flex-shrink-0 opacity-50" viewBox="0 0 24 24" fill="none" stroke="#E8DFD0" stroke-width="2">
        <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <input
        v-model="query"
        type="text"
        placeholder="Search in document…"
        autofocus
        class="flex-1 bg-transparent border-none outline-none text-[15px]"
        style="color: #E8DFD0; font-family: 'Lora', Georgia, serif;"
        @keydown.escape="emit('close')"
      />
      <button @click="emit('close')" class="opacity-60 hover:opacity-100 transition-opacity">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#E8DFD0" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <p class="text-[11px] mt-2" style="color: #9E8E7E;">In-document search coming soon. Use browser search (Ctrl+F) for now.</p>
  </div>
</template>
