<template>
  <ToolPage description="二维色板选择饱和度/明度，右侧竖条调色相。下方 216 个 Web 安全色独立滚动，点击后上方同步更新。" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-emerald-600" type="button" aria-label="复制当前 RGBA" @click="copyCode(codes.rgba)"><Copy :size="14" />复制 RGBA</button>
      <button class="tool-button bg-blue-600" type="button" aria-label="复制当前 HEX8" @click="copyCode(codes.hex8)"><Copy :size="14" />复制 HEX8</button>
      <button class="tool-button bg-neutral-700" type="button" @click="selectColor('#336699')"><RotateCcw :size="14" />重置</button>
    </template>
    <div class="color-workspace">
      <div class="color-controls">
        <section class="tool-panel flex min-h-0 flex-col gap-3 overflow-auto" aria-label="选色与通道">
          <ColorPlane v-model="color" />
          <div class="flex items-center gap-2">
            <div class="color-checker h-8 w-12 shrink-0 overflow-hidden rounded border border-neutral-200">
              <div class="h-full" :style="{ backgroundColor: codes.rgba }"></div>
            </div>
            <label class="flex min-w-0 flex-1 items-center gap-2 text-xs">HEX
              <input v-model="hexInput" class="tool-field min-w-0 w-full py-1 font-mono" spellcheck="false" @keydown.enter="applyHex" />
            </label>
            <button class="shrink-0 text-xs text-blue-700" type="button" @click="applyHex">应用</button>
          </div>
          <div class="flex gap-2">
            <label v-for="channel in channels" :key="channel" class="flex min-w-0 flex-1 items-center gap-1 text-xs text-neutral-500">{{ channel.toUpperCase() }}
              <input type="number" :value="color[channel]" min="0" max="255" step="1" class="tool-field min-w-0 w-full px-2 py-1" :aria-label="`${channel.toUpperCase()} 通道`" @change="changeChannel(channel, $event)" />
            </label>
          </div>
          <label class="flex items-center gap-2 text-xs">不透明度
            <input type="range" :value="color.a * 100" min="0" max="100" step="1" class="min-w-0 flex-1" @input="changeAlpha" />
            <span class="w-10 text-right font-mono">{{ Math.round(color.a * 100) }}%</span>
          </label>
          <p class="text-xs text-neutral-500">{{ codes.isWebSafe ? '当前为 Web 安全色' : '当前为自定义颜色' }} · 色板支持方向键，Shift 加速。</p>
        </section>
        <section class="tool-panel flex min-h-0 flex-col overflow-auto" aria-label="颜色编码与对比度">
          <div class="grid flex-1 grid-rows-7 gap-1.5">
            <button v-for="item in encodings" :key="item.label" type="button" class="flex min-h-8 w-full items-center gap-2 rounded bg-neutral-50 px-3 py-1.5 text-left text-sm hover:bg-neutral-200"
              :aria-label="`复制 ${item.label}`" @click="copyCode(item.value)">
              <span class="w-10 shrink-0 text-neutral-500">{{ item.label }}</span><code class="min-w-0 flex-1 break-all">{{ item.value }}</code><Copy :size="12" class="shrink-0" />
            </button>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span>文字对比度 · 叠加底色</span>
            <select v-model="backdrop" class="tool-field min-w-20 px-2 py-0.5 text-xs" aria-label="半透明叠加底色">
              <option value="white">白色</option>
              <option value="black">黑色</option>
            </select>
            <span class="flex items-center gap-1.5" aria-label="当前叠加底色">
              <span class="h-4 w-4 rounded-sm border border-neutral-400" :style="{ backgroundColor: backdrop }" aria-hidden="true"></span>
              <code>{{ backdrop === 'white' ? '#FFFFFF' : '#000000' }}</code>
            </span>
          </div>
          <div class="mt-1 grid grid-cols-2 gap-2">
            <div v-for="ink in inks" :key="ink" class="overflow-hidden rounded border border-neutral-200 text-xs">
              <div class="contrast-backdrop p-1" :style="{ backgroundColor: backdrop }" :aria-label="`${ink === 'black' ? '黑字' : '白字'}叠加预览`">
                <div class="contrast-sample rounded-sm px-2 py-1" :style="{ backgroundColor: codes.rgba, color: ink }">
                  Aa · {{ ink === 'black' ? '黑色文字' : '白色文字' }}
                </div>
              </div>
              <p class="bg-surface px-2 py-1 text-neutral-700">{{ contrast[ink].toFixed(2) }}:1 · {{ contrast[ink] >= 4.5 ? 'AA 达标' : 'AA 未达标' }}</p>
            </div>
          </div>
          <p class="mt-1 min-h-8 text-[11px] leading-4 text-neutral-500" aria-live="polite">
            {{ color.a === 1 ? '当前不透明度为 100%，颜色会完全遮住底色，对比度不随底色变化。降低左侧不透明度可查看叠加效果。' : '预览与对比度已按当前不透明度叠加到底色上；切换底色不会修改原始颜色编码。' }}
          </p>
          <p class="mt-1 text-[11px] leading-4 text-neutral-500">AA 普通文字阈值 4.5:1；安全色不保证对比度。HEX/RGB/HSL 不含透明度，HSV 不是 CSS 函数。</p>
        </section>
      </div>
      <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface" aria-label="Web 安全色区域">
        <header class="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-neutral-200 px-3 py-2">
          <h2 class="text-sm font-semibold">Web 安全色 · 全部 216 色</h2>
          <span class="text-xs text-neutral-500">常用色置前 · 点击选色恢复不透明</span>
        </header>
        <div class="safe-colors-scroll min-h-0 flex-1 overflow-y-scroll overscroll-contain p-2" aria-label="安全色列表" tabindex="0">
          <div class="safe-colors-grid">
            <button v-for="item in safeCards" :key="item.hex" type="button" class="relative flex aspect-[3/2] min-w-0 flex-col items-center justify-center rounded-md border border-black/15 text-xs"
              :style="{ backgroundColor: item.hex, color: item.ink }" :aria-label="`选择安全色 ${item.hex}`" :aria-pressed="codes.hex === item.hex && color.a === 1" @click="selectColor(item.hex)">
              <Check v-if="codes.hex === item.hex && color.a === 1" :size="12" class="absolute right-1 top-1" />
              <span v-if="item.name" class="text-[11px]">{{ item.name }}</span><code class="font-medium">{{ item.hex }}</code>
            </button>
          </div>
        </div>
      </section>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Check, Copy, RotateCcw } from "lucide-vue-next";
import { isTauri } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import ToolPage from "../components/ToolPage.vue";
import ColorPlane from "../components/ColorPlane.vue";
import { describeColor, parseHexColor, recommendedColors, textContrast, webSafeColors } from "../utils/color";

const color = ref(parseHexColor("#336699"));
const hexInput = ref("#336699");
const status = ref("");
const error = ref("");
const backdrop = ref<"white" | "black">("white");
const channels = ["r", "g", "b"] as const;
const inks = ["black", "white"] as const;
const codes = computed(() => describeColor(color.value));
const contrast = computed(() => textContrast(color.value, backdrop.value));
const safeCards = [...recommendedColors, ...webSafeColors.filter(hex => !recommendedColors.some(item => item.hex === hex)).map(hex => ({ name: "", hex }))]
  .map(item => ({ ...item, ink: textContrast(parseHexColor(item.hex), "white").black >= 4.5 ? "#000000" : "#FFFFFF" }));
const encodings = computed(() => [
  { label: "HEX", value: codes.value.hex }, { label: "HEX8", value: codes.value.hex8 },
  { label: "RGB", value: codes.value.rgb }, { label: "RGBA", value: codes.value.rgba },
  { label: "HSL", value: codes.value.hsl }, { label: "HSLA", value: codes.value.hsla }, { label: "HSV", value: codes.value.hsv },
]);
watch(color, () => {
  hexInput.value = color.value.a === 1 ? codes.value.hex : codes.value.hex8;
  status.value = "";
  error.value = "";
}, { deep: true, flush: "sync" });

function selectColor(hex: string) {
  color.value = parseHexColor(hex);
}

function applyHex() {
  try {
    color.value = parseHexColor(hexInput.value);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "颜色格式无效。";
  }
}

function changeChannel(channel: typeof channels[number], event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.valueAsNumber;
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    input.value = String(color.value[channel]);
    error.value = "RGB 通道需要是 0～255 的整数。";
    return;
  }
  color.value = { ...color.value, [channel]: value };
}

function changeAlpha(event: Event) {
  color.value = { ...color.value, a: Number((event.target as HTMLInputElement).value) / 100 };
}

async function copyCode(value: string) {
  status.value = "";
  error.value = "";
  try {
    if (isTauri()) await writeText(value);
    else await navigator.clipboard.writeText(value);
    status.value = `已复制 ${value}`;
  } catch {
    error.value = "复制失败，请检查剪贴板权限。";
  }
}
</script>

<style scoped>
.color-workspace { display: grid; flex: 1; min-height: 516px; grid-template-rows: minmax(386px, min(46vh, 480px)) minmax(118px, 1fr); gap: 12px; overflow: hidden; }
.color-controls { display: grid; min-height: 0; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); gap: 12px; }
.safe-colors-scroll { scrollbar-gutter: stable; }
.safe-colors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
.safe-colors-scroll::-webkit-scrollbar { width: 8px; }
.safe-colors-scroll::-webkit-scrollbar-thumb { background: var(--color-neutral-400); border: 2px solid var(--app-surface); border-radius: 8px; }
@media (max-width: 640px) { .color-controls { grid-template-columns: minmax(0, 1fr); overflow-y: auto; } .color-controls > section { min-height: 290px; overflow: visible; } }

.color-checker {
  background-color: white;
  background-image: conic-gradient(#e5e7eb 25%, transparent 0 50%, #e5e7eb 0 75%, transparent 0);
  background-size: 16px 16px;
}
</style>
