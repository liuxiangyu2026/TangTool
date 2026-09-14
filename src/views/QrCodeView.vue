<template>
  <ToolPage description="本地生成 QR Code，不会打开或上传输入的链接。支持文本与网址；留出四格白边以便识别，保存 PNG 或 SVG。" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click="input = 'https://github.com/liuxiangyu2026/TangTool'">
        <BookOpen :size="14" />
        示例
      </button>
      <button class="tool-button bg-blue-600" type="button" :disabled="busy" @click="generate">
        <QrCode :size="14" />
        生成
      </button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!png" @click="exportCode('png')">
        <Save :size="14" />
        保存 PNG
      </button>
      <button class="tool-button bg-cyan-600" type="button" :disabled="!svg" @click="exportCode('svg')">
        <Save :size="14" />
        保存 SVG
      </button>
      <button class="tool-button bg-red-600" type="button" @click=" input = ''; reset(); ">
        <Trash2 :size="14" />
        清除
      </button>
    </template>
    <div class="tool-panel flex flex-wrap items-center gap-4 text-sm">
      <label class="flex items-center gap-2">
        尺寸
        <select v-model.number="size" class="tool-field">
          <option :value="256">256 px</option>
          <option :value="512">512 px</option>
          <option :value="1024">1024 px</option>
        </select>
      </label>
      <label class="flex items-center gap-2">
        纠错等级
        <select v-model="level" class="tool-field">
          <option>L</option>
          <option>M</option>
          <option>Q</option>
          <option>H</option>
        </select>
      </label>
      <span class="text-xs text-neutral-500">默认 M；等级越高，图案通常越密。最多 1000 个 UTF-8 字节。</span>
    </div>
    <SplitPane direction="horizontal" label="调整二维码输入和预览宽度">
      <template #first>
        <textarea v-model="input" class="tool-editor h-full" aria-label="二维码内容" placeholder="输入文本或网址"></textarea>
      </template>
      <template #second>
        <div class="tool-panel flex flex-col items-center justify-center gap-3">
          <img v-if="png" :src="png" alt="生成的二维码预览" class="max-h-80 max-w-full" style="image-rendering: pixelated" />
          <p v-else class="text-sm text-neutral-500">生成后显示二维码</p>
          <p v-if="png" class="text-xs text-neutral-500">请实际扫码确认内容，再用于印刷或分享。</p>
        </div>
      </template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import SplitPane from "../components/SplitPane.vue";
import { ref, watch } from "vue";
import QRCode from "qrcode";
import { BookOpen, QrCode, Save, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import { saveOutput } from "../utils/saveOutput";

const input = ref("");
const size = ref(512);
const level = ref<"L" | "M" | "Q" | "H">("M");
const png = ref("");
const svg = ref("");
const error = ref("");
const status = ref("");
const busy = ref(false);
let revision = 0;
watch([input, size, level], reset, { flush: "sync" });

function reset() {
  revision++;
  png.value = "";
  svg.value = "";
  error.value = "";
  status.value = "";
  busy.value = false;
}

async function generate() {
  reset();
  if (!input.value.trim() || new TextEncoder().encode(input.value).byteLength > 1000) {
    error.value = "请输入非空内容，最多支持 1000 个 UTF-8 字节。";
    return;
  }
  const id = revision;
  busy.value = true;
  try {
    const options = { width: size.value, margin: 4, errorCorrectionLevel: level.value };
    const [image, vector] = await Promise.all([QRCode.toDataURL(input.value, options), QRCode.toString(input.value, { ...options, type: "svg" })]);
    if (id !== revision) return;
    png.value = image;
    svg.value = vector;
    status.value = "二维码已生成";
  } catch {
    if (id === revision) error.value = "生成失败，请缩短内容或降低纠错等级。";
  } finally {
    if (id === revision) busy.value = false;
  }
}

async function exportCode(format: "png" | "svg") {
  const content = format === "svg" ? svg.value : png.value;
  if (!content) return;
  try {
    const bytes = format === "svg" ? new TextEncoder().encode(content) : Uint8Array.from(atob(content.split(",")[1]), (char) => char.charCodeAt(0));
    const saved = await saveOutput(bytes, `qrcode.${format}`, format, format === "svg" ? "image/svg+xml" : "image/png");
    status.value = saved ? "二维码已保存" : "已取消保存";
  } catch {
    error.value = "保存失败，请检查目标路径。";
  }
}
</script>
