<template>
  <ToolPage
    :description="
      kind === 'word'
        ? t('DOCX 与 PDF 本地互转。文字模式可编辑，但复杂表格、图片和多栏排版不会完整还原；外观模式每页保存为图片，不可直接编辑文字。')
        : t('PDF 每页转为图片，可指定最长边或固定宽高；保持页面比例，固定宽高不足处留白。')
    "
    :status="status"
    :error="error"
  >
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" :disabled="busy" @click="selectDocument">
        <FolderOpen :size="14" />{{ t("选择文档") }}
      </button>
      <button
        class="tool-button bg-blue-600"
        type="button"
        :disabled="busy || !filename || (direction === 'word-pdf' && !runtimeAvailable)"
        @click="convert"
      >
        <RefreshCw :size="14" />{{ kind === "image" ? t("生成预览") : t("转换并保存") }}
      </button>
      <button v-if="kind === 'image'" class="tool-button bg-emerald-600" type="button" :disabled="busy || !preview" @click="savePreview">
        <Save :size="14" />{{ t("保存当前页") }}
      </button>
      <button v-if="kind === 'image'" class="tool-button bg-sky-600" type="button" :disabled="busy || !file" @click="savePages">
        <Files :size="14" />{{ t("导出所选页 ZIP") }}
      </button>
      <button v-if="busy" class="tool-button bg-amber-600" type="button" :disabled="direction === 'word-pdf'" @click="cancel">
        <X :size="14" />{{ t("取消") }}
      </button>
      <button class="tool-button bg-red-600" type="button" :disabled="busy" @click="clear"><Trash2 :size="14" />{{ t("清除") }}</button>
    </template>

    <div v-if="kind === 'word'" class="tool-panel flex flex-wrap items-center gap-3 text-sm">
      <label class="flex items-center gap-2"
        >{{ t("转换方向")
        }}<select v-model="direction" class="tool-field" :disabled="busy" @change="clear">
          <option value="pdf-word">PDF → Word (.docx)</option>
          <option value="word-pdf">Word (.docx) → PDF</option>
        </select></label
      >
      <label v-if="direction === 'pdf-word'" class="flex items-center gap-2"
        >{{ t("输出模式")
        }}<select v-model="appearance" class="tool-field" :disabled="busy">
          <option :value="false">{{ t("可编辑文字") }}</option>
          <option :value="true">{{ t("保留页面外观（图片）") }}</option>
        </select></label
      >
    </div>
    <div v-if="direction === 'word-pdf'" class="tool-panel flex flex-wrap items-center justify-between gap-3 text-sm">
      <p>{{ runtimeAvailable ? t("LibreOffice 已就绪") : t("请先安装 LibreOffice，然后重新检测") }}</p>
      <div class="flex gap-2">
        <button type="button" class="tool-button bg-blue-600" @click="downloadRuntime">
          <Download :size="14" />{{ t("下载 LibreOffice") }}</button
        ><button type="button" class="tool-button bg-neutral-600" :disabled="busy" @click="checkRuntime">
          <RefreshCw :size="14" />{{ t("重新检测") }}
        </button>
      </div>
      <p class="w-full text-xs text-neutral-500">
        {{ t("使用默认安装位置；已有文档转 Markdown 组件不包含 LibreOffice。转换最多等待 3 分钟。") }}
      </p>
    </div>
    <div v-if="kind === 'image'" class="tool-panel flex flex-wrap items-center gap-3 text-sm">
      <label class="flex items-center gap-2"
        >{{ t("尺寸方式")
        }}<select v-model="sizing" class="tool-field" :disabled="busy">
          <option value="edge">{{ t("最长边") }}</option>
          <option value="box">{{ t("固定宽高（等比留白）") }}</option>
        </select></label
      >
      <label v-if="sizing === 'edge'" class="flex items-center gap-2"
        >{{ t("最长边")
        }}<input v-model.number="maxEdge" class="tool-field w-24" type="number" min="64" max="8192" :disabled="busy" />px</label
      >
      <template v-else
        ><label class="flex items-center gap-2"
          >{{ t("宽度")
          }}<input v-model.number="width" class="tool-field w-24" type="number" min="64" max="8192" :disabled="busy" />px</label
        ><label class="flex items-center gap-2"
          >{{ t("高度")
          }}<input v-model.number="height" class="tool-field w-24" type="number" min="64" max="8192" :disabled="busy" />px</label
        ></template
      >
      <label class="flex items-center gap-2"
        >{{ t("格式")
        }}<select v-model="format" class="tool-field" :disabled="busy">
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
        </select></label
      >
      <label v-if="format === 'jpeg'" class="flex items-center gap-2"
        >{{ t("质量") }}<input v-model.number="quality" class="tool-field w-20" type="number" min="10" max="100" :disabled="busy"
      /></label>
    </div>
    <div class="flex h-6 shrink-0 items-center gap-3 text-xs text-neutral-500" aria-live="polite">
      <span class="truncate">{{ filename || t("尚未选择文档") }}</span
      ><span v-if="pages">{{ t("共 {pages} 页", { pages }) }}</span
      ><progress v-if="busy" class="h-2 w-32" :value="progress" max="100"></progress><span v-if="busy">{{ progress }}%</span>
    </div>
    <template v-if="kind === 'image'">
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <label class="flex items-center gap-2"
          >{{ t("预览页码") }}<input v-model.number="page" class="tool-field w-20" type="number" min="1" :max="pages || 1" :disabled="busy"
        /></label>
        <label class="flex items-center gap-2"
          >{{ t("导出页码") }}<input v-model="pageRange" class="tool-field w-44" :placeholder="t('全部或例如 1-3,5')" :disabled="busy"
        /></label>
      </div>
      <div class="tool-panel flex min-h-40 flex-1 items-center justify-center overflow-hidden">
        <img v-if="previewUrl" :src="previewUrl" :alt="t('PDF 页面预览')" class="h-full w-full object-contain" />
        <p v-else class="text-sm text-neutral-500">{{ t("选择 PDF 后生成页面预览") }}</p>
      </div>
    </template>
    <p class="text-xs leading-5 text-neutral-500">
      {{ t("文件最多 50 MiB，每次最多导出 100 页。PDF 转 Word 不含 OCR；扫描件可选择保留页面外观。输出请另存为新文件。") }}
    </p>
    <input ref="fileInput" type="file" accept="application/pdf,.pdf" class="hidden" @change="receiveFile" />
  </ToolPage>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, ref, shallowRef, watch } from "vue";
import { Download, Files, FolderOpen, RefreshCw, Save, Trash2, X } from "lucide-vue-next";
import { isTauri } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { t } from "../i18n";
import ToolPage from "../components/ToolPage.vue";
import { invoke } from "../utils/invoke";
import { exportDefaults } from "../utils/exportDefaults";
import { saveOutput } from "../utils/saveOutput";
import type { PdfImageOptions } from "../utils/pdfTools";

const props = defineProps<{ kind: "word" | "image" }>();
const fileInput = ref<HTMLInputElement | null>(null);
const file = shallowRef<File | null>(null);
const filename = ref("");
const sourcePath = ref("");
const direction = ref(props.kind === "image" ? "pdf-image" : "pdf-word");
const appearance = ref(false);
const runtimeAvailable = ref(false);
const pages = ref(0);
const page = ref(1);
const pageRange = ref("");
const sizing = ref<PdfImageOptions["sizing"]>("edge");
const maxEdge = ref(2000);
const width = ref(1600);
const height = ref(1200);
const format = ref<PdfImageOptions["format"]>("png");
const quality = ref(90);
const preview = shallowRef<Blob | null>(null);
const previewUrl = ref("");
const progress = ref(0);
const busy = ref(false);
const status = ref("");
const error = ref("");
const options = computed(() => ({
  sizing: sizing.value,
  maxEdge: maxEdge.value,
  width: width.value,
  height: height.value,
  format: format.value,
  quality: quality.value,
}));
let controller: AbortController | undefined;
let active = true;

function resetPreview() {
  URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
  preview.value = null;
}
watch([options, page], resetPreview);
watch(direction, () => {
  if (direction.value === "word-pdf") void checkRuntime();
});
onDeactivated(() => {
  active = false;
  URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
});
onActivated(() => {
  active = true;
  if (preview.value) previewUrl.value = URL.createObjectURL(preview.value);
});
onBeforeUnmount(() => {
  controller?.abort();
  resetPreview();
});

function clear() {
  if (busy.value) return;
  file.value = null;
  filename.value = "";
  sourcePath.value = "";
  pages.value = 0;
  page.value = 1;
  pageRange.value = "";
  status.value = "";
  error.value = "";
  resetPreview();
}
function cancel() {
  controller?.abort();
}

async function checkRuntime() {
  try {
    runtimeAvailable.value = isTauri() && (await invoke<{ available: boolean }>("check_word_runtime")).available;
  } catch (reason) {
    error.value = String(reason);
  }
}
async function downloadRuntime() {
  const url = "https://www.libreoffice.org/download/download-libreoffice/";
  try {
    if (isTauri()) await openUrl(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    error.value = t("无法打开浏览器，请手动访问 LibreOffice 官网");
  }
}
async function selectDocument() {
  if (direction.value !== "word-pdf") {
    fileInput.value?.click();
    return;
  }
  if (!isTauri()) {
    error.value = t("Word 转 PDF 请在桌面应用中使用");
    return;
  }
  try {
    const path = await open({ multiple: false, directory: false, filters: [{ name: "Word", extensions: ["docx"] }] });
    if (typeof path === "string") {
      clear();
      sourcePath.value = path;
      filename.value = path.split(/[\\/]/).pop() ?? "document.docx";
    }
  } catch (reason) {
    error.value = String(reason);
  }
}
function receiveFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const selected = input.files?.[0];
  input.value = "";
  if (!selected) return;
  clear();
  if (!/\.pdf$/i.test(selected.name) || selected.size === 0 || selected.size > 50 * 1024 * 1024) {
    error.value = t("请选择非空且不超过 50 MiB 的 PDF");
    return;
  }
  file.value = selected;
  filename.value = selected.name;
  if (props.kind === "image") void convert();
}

async function convert() {
  if (busy.value || !filename.value) return;
  busy.value = true;
  error.value = "";
  status.value = "";
  progress.value = 0;
  controller = new AbortController();
  const signal = controller.signal;
  try {
    if (direction.value === "word-pdf") {
      const output = await save({
        defaultPath: exportDefaults(filename.value.replace(/\.docx$/i, ".pdf")).path,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!output) return;
      await invoke("convert_word_to_pdf", { path: sourcePath.value, output });
    } else if (file.value && props.kind === "word") {
      const { pdfToDocx } = await import("../utils/pdfTools");
      const blob = await pdfToDocx(
        file.value,
        signal,
        (done, total) => {
          progress.value = Math.round((done / total) * 100);
          pages.value = total;
        },
        appearance.value,
      );
      signal.throwIfAborted();
      if (!(await saveOutput(new Uint8Array(await blob.arrayBuffer()), filename.value.replace(/\.pdf$/i, ".docx"), "docx", blob.type)))
        return;
    } else if (file.value) {
      const { withPdf, renderPdfPage } = await import("../utils/pdfTools");
      resetPreview();
      const blob = await withPdf(file.value, signal, async (pdf) => {
        pages.value = pdf.numPages;
        if (!Number.isInteger(page.value) || page.value < 1 || page.value > pdf.numPages) throw new Error(t("页码超出文档范围"));
        return renderPdfPage(pdf, page.value, options.value, signal);
      });
      signal.throwIfAborted();
      preview.value = blob;
      if (active) previewUrl.value = URL.createObjectURL(blob);
    }
    progress.value = 100;
    status.value = props.kind === "image" ? t("处理完成，检查预览后另存。") : t("转换结果已保存");
  } catch (reason) {
    error.value = signal.aborted ? "" : reason instanceof Error ? reason.message : String(reason);
    if (signal.aborted) status.value = t("任务已取消");
  } finally {
    busy.value = false;
  }
}

async function savePreview() {
  if (!preview.value || busy.value) return;
  const blob = preview.value;
  const extension = blob.type === "image/jpeg" ? "jpg" : "png";
  busy.value = true;
  try {
    status.value = (await saveOutput(
      new Uint8Array(await blob.arrayBuffer()),
      `${filename.value.replace(/\.pdf$/i, "")}-${page.value}.${extension}`,
      extension,
      blob.type,
    ))
      ? t("图片已另存")
      : t("已取消保存");
  } catch (reason) {
    error.value = String(reason);
  } finally {
    busy.value = false;
  }
}

async function savePages() {
  if (!file.value || busy.value) return;
  busy.value = true;
  error.value = "";
  status.value = "";
  progress.value = 0;
  controller = new AbortController();
  const signal = controller.signal;
  try {
    const { default: JSZip } = await import("jszip");
    const { withPdf, renderPdfPage } = await import("../utils/pdfTools");
    const zip = new JSZip();
    await withPdf(file.value, signal, async (pdf) => {
      pages.value = pdf.numPages;
      const selected = new Set<number>();
      for (const part of (pageRange.value.trim() || `1-${pdf.numPages}`).split(/[,，]/)) {
        const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!match) throw new Error(t("页码格式无效，请使用 1-3,5"));
        const first = Number(match[1]);
        const last = Number(match[2] ?? first);
        if (first < 1 || last > pdf.numPages || last < first || last - first >= 100) throw new Error(t("页码越界或超过 100 页"));
        for (let number = first; number <= last; number++) selected.add(number);
        if (selected.size > 100) throw new Error(t("页码越界或超过 100 页"));
      }
      let bytes = 0;
      let done = 0;
      // 逐页渲染并释放画布，ZIP 中仅保留编码后的图片。
      for (const number of [...selected].sort((a, b) => a - b)) {
        const blob = await renderPdfPage(pdf, number, options.value, signal);
        signal.throwIfAborted();
        bytes += blob.size;
        if (bytes > 100 * 1024 * 1024) throw new Error(t("输出超过 100 MiB，请减少页数或图片尺寸"));
        zip.file(`page-${String(number).padStart(3, "0")}.${format.value === "jpeg" ? "jpg" : "png"}`, await blob.arrayBuffer());
        progress.value = Math.round((++done / selected.size) * 90);
      }
    });
    const bytes = await zip.generateAsync({ type: "uint8array", compression: "STORE" }, () => signal.throwIfAborted());
    signal.throwIfAborted();
    status.value = (await saveOutput(bytes, `${filename.value.replace(/\.pdf$/i, "")}-pages.zip`, "zip", "application/zip"))
      ? t("图片 ZIP 已保存")
      : t("已取消保存");
    progress.value = 100;
  } catch (reason) {
    if (signal.aborted) status.value = t("任务已取消");
    else error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    busy.value = false;
  }
}
</script>
