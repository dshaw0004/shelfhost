<script setup lang="ts">
defineProps<{ x: number; y: number }>()
const emit = defineEmits<{
  'select-color': [color: string]
  dismiss: []
}>()

const colors = [
  { name: 'Yellow', value: 'rgba(255, 220, 50, 0.60)' },
  { name: 'Amber', value: 'rgba(230, 140, 30, 0.60)' },
  { name: 'Green', value: 'rgba(80, 170, 100, 0.60)' },
  { name: 'Pink', value: 'rgba(220, 90, 120, 0.60)' },
  { name: 'Blue', value: 'rgba(70, 140, 210, 0.60)' },
]
</script>

<template>
  <div
    class="absolute z-30 flex items-center gap-2 px-3 py-2 rounded-full"
    :style="{
      left: x + 'px',
      top: y + 'px',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(26, 18, 12, 0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(193,127,58,0.18)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
    }">
    <button
      v-for="c in colors"
      :key="c.value"
      :aria-label="`Highlight in ${c.name}`"
      class="w-5 h-5 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2"
      :style="{ backgroundColor: c.value }"
      @click.stop="emit('select-color', c.value)"
    />
  </div>
</template>
