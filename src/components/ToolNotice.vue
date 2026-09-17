<template>
  <Teleport to="body">
    <div v-if="active && message && !dismissed" class="fixed left-1/2 top-2 z-50 flex w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 items-start gap-3 rounded-lg border bg-surface px-4 py-2 text-sm shadow-lg"
      :class="error ? 'border-red-200 text-red-700' : tone === 'neutral' ? 'border-neutral-300 text-neutral-700' : 'border-emerald-200 text-emerald-700'"
      :role="error ? 'alert' : 'status'" aria-atomic="true">
      <!-- 顶部固定距离与紧凑高度避免长提示下伸到工具栏，完整内容仍可滚动查看。 -->
      <p class="max-h-10 min-w-0 flex-1 overflow-auto whitespace-pre-wrap break-words">{{ message }}</p>
      <button type="button" class="shrink-0 rounded p-0.5 text-neutral-500 hover:bg-neutral-100" :aria-label="t('关闭提示')" @click="dismissed = true"><X :size="16" /></button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import { computed, onActivated, onBeforeUnmount, onDeactivated, ref, watch } from "vue";
import { X } from "lucide-vue-next";

const props = withDefaults(defineProps<{ status?: string; error?: string; tone?: "success" | "neutral" }>(), { status: "", error: "", tone: "success" });
const active = ref(true);
const dismissed = ref(false);
const message = computed(() => props.error || props.status);
let timer: ReturnType<typeof setTimeout> | undefined;
watch([message, () => props.error], () => {
  clearTimeout(timer);
  dismissed.value = false;
  if (active.value && message.value) timer = setTimeout(() => { dismissed.value = true; }, 2000);
}, { immediate: true, flush: "sync" });
// KeepAlive 不卸载工具；离开页面时隐藏 Teleport，避免显示其他工具的旧提示。
onActivated(() => { active.value = true; });
onDeactivated(() => {
  active.value = false;
  dismissed.value = true;
  clearTimeout(timer);
});
onBeforeUnmount(() => clearTimeout(timer));
</script>
