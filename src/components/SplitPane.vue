<template>
  <div ref="root" class="split-pane min-h-0 min-w-0 flex-1" :style="layoutStyle">
    <div class="split-pane-content"><slot name="first" /></div>
    <div class="group flex shrink-0 touch-none items-center justify-center select-none" :class="direction === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize'"
      role="separator" :aria-label="label" :aria-orientation="direction === 'horizontal' ? 'vertical' : 'horizontal'"
      :aria-valuemin="min" :aria-valuemax="max" :aria-valuenow="Math.round(percent)" tabindex="0"
      @pointerdown="startDrag" @pointermove="drag" @pointerup="stopDrag" @pointercancel="stopDrag" @lostpointercapture="stopDrag" @keydown="resizeWithKey">
      <span class="flex items-center justify-center rounded-full border border-neutral-300 bg-surface text-neutral-400 shadow-sm group-hover:border-blue-400 group-hover:text-blue-600"
        :class="direction === 'horizontal' ? 'h-12 w-3' : 'h-3 w-12'">
        <component :is="direction === 'horizontal' ? GripVertical : GripHorizontal" :size="14" aria-hidden="true" />
      </span>
    </div>
    <div class="split-pane-content"><slot name="second" /></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, ref } from "vue";
import { GripHorizontal, GripVertical } from "lucide-vue-next";
import { usePanelRatio } from "../composables/usePanelRatio";

const props = withDefaults(defineProps<{ direction?: "horizontal" | "vertical"; initial?: number; min?: number; max?: number; label: string }>(), {
  direction: "horizontal", initial: 50, min: 25, max: 75,
});
const root = ref<HTMLDivElement | null>(null);
const percent = usePanelRatio(`split:${props.label}`, props.initial, props.min, props.max);
let pointerId: number | null = null;
let handle: HTMLElement | null = null;
const layoutStyle = computed(() => {
  // fr 分配的是扣除手柄后的剩余空间，不因手柄宽度使右侧溢出；minmax(0, …) 防止长内容撑大面板。
  const tracks = `minmax(0, ${percent.value}fr) 16px minmax(0, ${100 - percent.value}fr)`;
  return props.direction === "horizontal" ? { gridTemplateColumns: tracks, gridTemplateRows: "minmax(0, 1fr)" }
    : { gridTemplateRows: tracks, gridTemplateColumns: "minmax(0, 1fr)" };
});

function startDrag(event: PointerEvent) {
  if (event.button !== 0 || pointerId !== null) return;
  event.preventDefault();
  handle = event.currentTarget as HTMLElement;
  pointerId = event.pointerId;
  handle.setPointerCapture(event.pointerId);
  handle.focus({ preventScroll: true });
}

function drag(event: PointerEvent) {
  if (event.pointerId !== pointerId || !root.value) return;
  const bounds = root.value.getBoundingClientRect();
  const length = (props.direction === "horizontal" ? bounds.width : bounds.height) - 16;
  if (length <= 0) return;
  const offset = props.direction === "horizontal" ? event.clientX - bounds.left : event.clientY - bounds.top;
  percent.value = Math.max(props.min, Math.min(props.max, (offset - 8) / length * 100));
}

function stopDrag() {
  const id = pointerId;
  const target = handle;
  pointerId = null;
  handle = null;
  if (id !== null && target?.hasPointerCapture(id)) target.releasePointerCapture(id);
}

function resizeWithKey(event: KeyboardEvent) {
  const decrease = props.direction === "horizontal" ? "ArrowLeft" : "ArrowUp";
  const increase = props.direction === "horizontal" ? "ArrowRight" : "ArrowDown";
  if (![decrease, increase, "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  percent.value = event.key === "Home" ? props.min : event.key === "End" ? props.max
    : Math.max(props.min, Math.min(props.max, percent.value + (event.key === increase ? 2 : -2)));
}

onDeactivated(stopDrag);
onBeforeUnmount(stopDrag);
</script>

<style scoped>
.split-pane { display: grid; overflow: hidden; }
.split-pane-content { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: auto; }
/* 每块内容填满用户分配的空间，滚动在面板内部进行，不让图片或长文本反向决定尺寸。 */
.split-pane-content > :deep(*) { min-width: 0; min-height: 0; flex: 1 1 0%; }
</style>
