<script setup lang="ts">
defineProps<{ message: string; icon: 'check' | 'warn' }>()
</script>

<template>
  <div class="flex items-center gap-3 px-4 py-3 rounded-[8px] text-[13px] animate-slide-up"
    style="background-color: #2A2118; border: 1px solid rgba(193,127,58,0.18); color: #E8DFD0; box-shadow: 0 4px 16px rgba(0,0,0,0.4);">
    <svg v-if="icon === 'check'" class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2.5">
      <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg v-else class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#C17F3A" stroke-width="2.5">
      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>{{ message }}</span>
  </div>
</template>

<style scoped>
@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
