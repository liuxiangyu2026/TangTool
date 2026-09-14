<template>
  <div class="flex min-h-48 min-w-0 flex-1 gap-3">
    <div ref="plane" class="color-plane relative min-w-0 flex-1 cursor-crosshair touch-none overflow-hidden rounded-md border border-neutral-300"
      :style="{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }" tabindex="0" role="group"
      aria-label="饱和度与明度选色板，左右调整饱和度，上下调整明度" @pointerdown="start" @pointermove="move" @pointerup="stop" @pointercancel="stop" @lostpointercapture="stop" @keydown="adjust">
      <span class="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_#000]"
        :style="{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }"></span>
      <span class="sr-only">饱和度 {{ Math.round(hsv.s * 100) }}%，明度 {{ Math.round(hsv.v * 100) }}%</span>
    </div>
    <input class="hue-slider h-full w-5 shrink-0 cursor-pointer" type="range" min="0" max="360" step="1" :value="hsv.h" aria-label="色相" aria-orientation="vertical" @input="changeHue" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref, watch } from "vue";
import { hsvToRgb, rgbToHsv, type RgbaColor } from "../utils/color";

const props = defineProps<{ modelValue: RgbaColor }>();
const emit = defineEmits<{ 'update:modelValue': [RgbaColor] }>();
const hsv = ref(rgbToHsv(props.modelValue));
const plane = ref<HTMLDivElement | null>(null);
let pointer: number | null = null;
watch(() => props.modelValue, value => {
  const current = hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v);
  // 内部拖动回写不重算 HSV，保留黑/灰色下用户选定的色相与饱和度，避免拖动跳点。
  if (current.r === value.r && current.g === value.g && current.b === value.b) return;
  const next = rgbToHsv(value);
  hsv.value = { ...next, h: next.s === 0 ? hsv.value.h : next.h };
});

function start(event: PointerEvent) {
  if (event.button !== 0 || pointer !== null || !plane.value) return;
  event.preventDefault();
  pointer = event.pointerId;
  plane.value.setPointerCapture(pointer);
  plane.value.focus({ preventScroll: true });
  move(event);
}

function move(event: PointerEvent) {
  if (pointer !== event.pointerId || !plane.value) return;
  const box = plane.value.getBoundingClientRect();
  if (!box.width || !box.height) return;
  hsv.value.s = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
  hsv.value.v = 1 - Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
  emit('update:modelValue', hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v, props.modelValue.a));
}

function stop() {
  const id = pointer;
  pointer = null;
  if (id !== null && plane.value?.hasPointerCapture(id)) plane.value.releasePointerCapture(id);
}

function changeHue(event: Event) {
  hsv.value.h = Number((event.target as HTMLInputElement).value);
  emit('update:modelValue', hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v, props.modelValue.a));
}

function adjust(event: KeyboardEvent) {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const step = event.shiftKey ? 0.1 : 0.01;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") hsv.value.s = Math.max(0, Math.min(1, hsv.value.s + (event.key === "ArrowRight" ? step : -step)));
  else hsv.value.v = Math.max(0, Math.min(1, hsv.value.v + (event.key === "ArrowUp" ? step : -step)));
  emit('update:modelValue', hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v, props.modelValue.a));
}

onDeactivated(stop);
onBeforeUnmount(stop);
</script>

<style scoped>
.color-plane { background-image: linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent); }
.hue-slider { writing-mode: vertical-lr; direction: ltr; appearance: none; border-radius: 3px; background: linear-gradient(to bottom, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00); }
.hue-slider::-webkit-slider-thumb { appearance: none; width: 25px; height: 8px; border: 2px solid white; border-radius: 3px; background: transparent; box-shadow: 0 0 0 1px #555; }
.hue-slider::-moz-range-thumb { width: 23px; height: 6px; border: 2px solid white; border-radius: 3px; background: transparent; box-shadow: 0 0 0 1px #555; }
</style>
