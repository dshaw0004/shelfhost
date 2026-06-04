<script setup lang="ts">
const emit = defineEmits<{ close: []; uploaded: [] }>()

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const uploadSuccess = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && file.type === 'application/pdf') selectedFile.value = file
}

function onFileInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) selectedFile.value = file
}

async function upload() {
  if (!selectedFile.value) return
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', selectedFile.value)
    await $fetch('/api/pdfs', { method: 'POST', body: form })
    uploadSuccess.value = true
    setTimeout(() => { emit('uploaded'); emit('close') }, 800)
  } catch {
    uploading.value = false
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center"
    style="background-color: rgba(28,22,18,0.75);"
    @click.self="emit('close')">
    <div class="w-full max-w-[480px] rounded-[14px] p-8 mx-4"
      style="background-color: #2A2118; box-shadow: 0 24px 64px rgba(0,0,0,0.7);">
      <h2 class="text-[22px] mb-6" style="font-family: 'Lora', Georgia, serif; color: #E8DFD0;">Upload a PDF</h2>

      <!-- Drop zone -->
      <div v-if="!selectedFile"
        class="relative h-[160px] rounded-[14px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
        :style="{
          border: isDragging ? '2px solid #C17F3A' : '2px dashed rgba(193,127,58,0.18)',
          backgroundColor: isDragging ? 'rgba(193,127,58,0.10)' : 'rgba(193,127,58,0.04)'
        }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
        @click="fileInput?.click()">
        <input ref="fileInput" type="file" accept="application/pdf" class="hidden" @change="onFileInput" />
        <svg class="w-10 h-10 mb-3 transition-transform" :class="isDragging ? 'scale-110' : ''"
          viewBox="0 0 24 24" fill="none" stroke="#C17F3A" stroke-width="1.5">
          <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="text-[15px]" style="color: #E8DFD0;">Drag &amp; drop your PDF here</p>
        <p class="text-[13px] mt-1" style="color: #9E8E7E;">or click to browse files</p>
      </div>

      <!-- File selected -->
      <div v-else class="flex items-center gap-3 p-4 rounded-[14px]"
        style="background-color: rgba(193,127,58,0.08); border: 1px solid rgba(193,127,58,0.18);">
        <svg class="w-8 h-8 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#C17F3A" stroke-width="1.5">
          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] truncate" style="color: #E8DFD0;">{{ selectedFile.name }}</p>
          <p class="text-[11px]" style="color: #9E8E7E;">{{ formatSize(selectedFile.size) }}</p>
        </div>
        <button @click="selectedFile = null" class="p-1" style="color: #9E8E7E;">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Upload button -->
      <button
        class="w-full mt-5 h-12 rounded-[8px] font-medium text-[15px] transition-all duration-200 flex items-center justify-center gap-2"
        :disabled="!selectedFile || uploading"
        :style="{
          backgroundColor: selectedFile && !uploading ? '#C17F3A' : 'rgba(193,127,58,0.3)',
          color: selectedFile && !uploading ? '#1A1208' : '#9E8E7E',
          cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed',
          fontFamily: 'Lora, Georgia, serif'
        }"
        @click="upload">
        <svg v-if="uploading" class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round"/>
        </svg>
        <svg v-else-if="uploadSuccess" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ uploading ? 'Uploading…' : uploadSuccess ? 'Done!' : 'Upload PDF' }}</span>
      </button>

      <!-- Cancel -->
      <button @click="emit('close')" class="w-full mt-3 text-[13px]" style="color: #9E8E7E;">Cancel</button>
    </div>
  </div>
</template>
