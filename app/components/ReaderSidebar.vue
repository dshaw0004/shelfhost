<script setup lang="ts">
interface Bookmark {
  id: string;
  page: number;
  label: string | null;
  created_at: string;
}

interface Highlight {
  id: string;
  page: number;
  text: string;
  color: string;
}

const props = defineProps<{
  bookmarks: Bookmark[];
  highlights: Highlight[];
}>();

const emit = defineEmits<{
  "delete-bookmark": [id: string];
  "delete-highlight": [id: string];
  "go-to-page": [page: number];
  close: [];
}>();

const activeTab = ref<"bookmarks" | "highlights">("bookmarks");

const highlightPages = computed(() =>
  [...new Set(props.highlights.map((h) => h.page))].sort((a, b) => a - b),
);

const hoveredBookmark = ref<string | null>(null);
const hoveredHighlight = ref<string | null>(null);
</script>

<template>
  <div
    class="flex flex-col w-[300px] h-screen flex-shrink-0"
    style="
      background-color: #2a2118;
      border-left: 1px solid rgba(193, 127, 58, 0.18);
    "
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-4 pb-2">
      <div class="flex gap-4">
        <button
          v-for="tab in ['bookmarks', 'highlights'] as const"
          :key="tab"
          class="text-[13px] pb-1 transition-all capitalize"
          :style="{
            fontFamily: 'Lora, Georgia, serif',
            color: activeTab === tab ? '#C17F3A' : '#9E8E7E',
            borderBottom:
              activeTab === tab ? '2px solid #C17F3A' : '2px solid transparent',
          }"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>
      <button
        @click="emit('close')"
        class="opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg
          class="w-4 h-4"
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

    <!-- Bookmarks tab -->
    <div
      v-if="activeTab === 'bookmarks'"
      class="flex-1 overflow-auto px-2 py-2"
    >
      <div
        v-if="bookmarks.length === 0"
        class="flex flex-col items-center justify-center h-48 text-center px-4"
      >
        <p class="text-[13px]" style="color: #9e8e7e">
          No bookmarks yet. Press
          <kbd
            class="px-1 py-0.5 rounded text-[11px]"
            style="background: rgba(193, 127, 58, 0.1); color: #c17f3a"
            >B</kbd
          >
          while reading to add one.
        </p>
      </div>
      <button
        v-for="bm in bookmarks"
        :key="bm.id"
        class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-left transition-all mb-1"
        :style="{
          backgroundColor:
            hoveredBookmark === bm.id ? 'rgba(193,127,58,0.12)' : '',
        }"
        @mouseenter="hoveredBookmark = bm.id"
        @mouseleave="hoveredBookmark = null"
        @click="emit('go-to-page', bm.page)"
      >
        <span
          class="px-2 py-0.5 rounded-full text-[11px] flex-shrink-0"
          style="
            background-color: #c17f3a;
            color: #1a1208;
            font-family: &quot;JetBrains Mono&quot;, monospace;
          "
        >
          p.{{ bm.page }}
        </span>
        <span
          class="flex-1 text-[13px] truncate"
          style="font-family: &quot;Lora&quot;, Georgia, serif; color: #e8dfd0"
        >
          {{ bm.label || `Page ${bm.page}` }}
        </span>
        <span
          role="button"
          tabindex="0"
          @click.stop="emit('delete-bookmark', bm.id)"
          @keydown.enter.stop="emit('delete-bookmark', bm.id)"
          class="opacity-0 group-hover:opacity-100 transition-opacity p-1"
        >
          <svg
            class="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9E8E7E"
            stroke-width="2"
          >
            <path
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>

    <!-- Highlights tab -->
    <div
      v-if="activeTab === 'highlights'"
      class="flex-1 overflow-auto px-2 py-2"
    >
      <div
        v-if="highlights.length === 0"
        class="flex flex-col items-center justify-center h-48 text-center px-4"
      >
        <p class="text-[13px]" style="color: #9e8e7e">
          No highlights yet. Select text while reading to highlight.
        </p>
      </div>
      <template v-else>
        <template v-for="page in highlightPages" :key="page">
          <div
            class="sticky top-0 px-3 py-1 text-[11px]"
            style="color: #9e8e7e; background-color: #2a2118"
          >
            Page {{ page }}
          </div>
          <button
            v-for="h in highlights.filter((hl) => hl.page === page)"
            :key="h.id"
            class="group w-full flex items-start gap-0 mb-1 rounded-[8px] overflow-hidden text-left transition-all"
            :style="{
              backgroundColor:
                hoveredHighlight === h.id ? 'rgba(193,127,58,0.08)' : '',
            }"
            @mouseenter="hoveredHighlight = h.id"
            @mouseleave="hoveredHighlight = null"
            @click="emit('go-to-page', h.page)"
          >
            <!-- Color bar -->
            <div
              class="w-1 self-stretch flex-shrink-0"
              :style="{ backgroundColor: h.color }"
            ></div>
            <div
              class="flex-1 px-3 py-2 flex items-start justify-between gap-2"
            >
              <p class="text-[13px] line-clamp-3" style="color: #e8dfd0">
                {{ h.text }}
              </p>
              <span
                role="button"
                tabindex="0"
                @click.stop="emit('delete-highlight', h.id)"
                @keydown.enter.stop="emit('delete-highlight', h.id)"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1 flex-shrink-0"
              >
                <svg
                  class="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9E8E7E"
                  stroke-width="2"
                >
                  <path
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </div>
          </button>
        </template>
      </template>
    </div>
  </div>
</template>
