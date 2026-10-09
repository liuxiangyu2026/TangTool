<template>
  <div ref="host" class="min-h-0 flex-1 overflow-auto" :aria-label="t('全部 key 对比结果')" @scroll="scrollTop = host?.scrollTop ?? 0">
    <div class="relative min-w-full" :style="{ height: `${rows.length * rowHeight}px` }" role="list">
      <button
        v-for="(row, offset) in visibleRows"
        :key="row.pathLabel"
        type="button"
        class="absolute left-0 flex w-full items-center gap-3 border-b border-neutral-100 px-3 text-left font-mono text-xs hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        :class="selected === start + offset ? 'bg-blue-50' : ''"
        :style="{ top: `${(start + offset) * rowHeight}px`, height: `${rowHeight}px` }"
        :aria-label="t('定位字段 {path}', { path: row.pathLabel })"
        @click="$emit('select', row, start + offset)"
      >
        <code class="min-w-0 max-w-[45%] shrink-0 truncate text-neutral-700" :title="row.pathLabel">{{ row.pathLabel }}</code>
        <span
          v-if="row.type === 'same'"
          class="min-w-0 truncate text-neutral-600"
          :title="keysOnly ? t('key 相同，已忽略值') : row.leftPreview"
          >{{ keysOnly ? t("key 相同") : row.leftPreview }}</span
        >
        <template v-else>
          <span
            class="min-w-0 flex-1 truncate rounded bg-red-50 px-2 py-1 text-red-700"
            :title="t('原值') + ': ' + (row.leftPresent ? row.leftPreview : t('不存在'))"
            >{{ row.leftPresent ? row.leftPreview : t("不存在") }}</span
          >
          <span aria-hidden="true" class="text-neutral-400">→</span>
          <span
            class="min-w-0 flex-1 truncate rounded bg-emerald-50 px-2 py-1 text-emerald-700"
            :title="t('新值') + ': ' + (row.rightPresent ? row.rightPreview : t('不存在'))"
            >{{ row.rightPresent ? row.rightPreview : t("不存在") }}</span
          >
        </template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from "vue";
import { t } from "../i18n";
import type { JsonComparisonRow } from "../utils/jsonDiff";

const props = defineProps<{ rows: JsonComparisonRow[]; keysOnly: boolean; selected: number | null }>();
defineEmits<{ select: [row: JsonComparisonRow, index: number] }>();
const host = ref<HTMLDivElement | null>(null);
const scrollTop = ref(0);
const height = ref(320);
const active = ref(true);
const rowHeight = 40;
const start = computed(() => Math.max(0, Math.floor(scrollTop.value / rowHeight) - 5));
const visibleRows = computed(() =>
  active.value ? props.rows.slice(start.value, start.value + Math.ceil(height.value / rowHeight) + 10) : [],
);
let observer: ResizeObserver | undefined;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    height.value = entry.contentRect.height;
  });
  if (host.value) observer.observe(host.value);
});
onActivated(() => {
  active.value = true;
});
onDeactivated(() => {
  active.value = false;
});
onBeforeUnmount(() => observer?.disconnect());
watch(
  () => props.rows,
  () => {
    scrollTop.value = 0;
    if (host.value) host.value.scrollTop = 0;
  },
);
</script>
