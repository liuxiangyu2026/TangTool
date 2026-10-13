<template>
  <ToolPage :description="t('在本机遮盖文本中的常见敏感信息；基于格式识别，可能误判或漏判，请检查结果后分享。')" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click="example"><BookOpen :size="14" />{{ t('示例') }}</button>
      <button class="tool-button bg-blue-600" type="button" :disabled="busy" @click="run"><ShieldCheck :size="14" />{{ busy ? t('处理中') : t('脱敏预览') }}</button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!result" @click="copy"><Copy :size="14" />{{ t('复制结果') }}</button>
      <button class="tool-button bg-indigo-600" type="button" :disabled="!result" @click="save"><Save :size="14" />{{ t('导出') }}</button>
      <button class="tool-button bg-red-600" type="button" @click="input = ''; reset()"><Trash2 :size="14" />{{ t('清除') }}</button>
    </template>
    <div class="tool-panel flex flex-wrap items-center gap-4 text-sm">
      <label v-for="rule in rules" :key="rule.key" class="flex items-center gap-2"><input v-model="options[rule.key]" type="checkbox" />{{ t(rule.label) }}<span v-if="result" class="text-xs text-neutral-500">{{ result.counts[rule.key] }}</span></label>
      <label class="flex items-center gap-2"><input v-model="options.custom" type="checkbox" />{{ t('自定义正则') }}</label>
    </div>
    <div v-if="options.custom" class="tool-panel flex flex-wrap gap-3 text-sm">
      <label class="flex min-w-0 flex-1 items-center gap-2">{{ t('表达式') }}<input v-model="options.pattern" class="tool-field min-w-0 flex-1 font-mono" placeholder="token=[A-Za-z0-9]+" /></label>
      <label class="flex min-w-0 flex-1 items-center gap-2">{{ t('替换内容') }}<input v-model="options.replacement" class="tool-field min-w-0 flex-1 font-mono" /></label>
    </div>
    <p class="text-xs text-neutral-500">{{ t('手机号保留前 3 后 4 位，身份证前 3 后 4 位，银行卡前 6 后 4 位；邮箱保留域名和用户名首尾。自定义规则在默认脱敏后执行，使用 gu 标志，支持 $1 等捕获组。') }}</p>
    <SplitPane :label="t('调整脱敏原文和结果宽度')">
      <template #first><textarea v-model="input" class="tool-editor h-full" :aria-label="t('脱敏原文')" :placeholder="t('输入文本，最多 10 万字符')"></textarea></template>
      <template #second><textarea :value="result?.output ?? ''" class="tool-editor h-full" readonly :aria-label="t('脱敏结果')"></textarea></template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, watch } from "vue";
import { BookOpen, Copy, Save, ShieldCheck, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import SplitPane from "../components/SplitPane.vue";
import { t } from "../i18n";
import { runWorker } from "../utils/workerTask";
import { copyText } from "../utils/textClipboard";
import { saveOutput } from "../utils/saveOutput";
import type { RedactionOptions, RedactionResult } from "../utils/textRedaction";

const rules = [{ key: "phone", label: "手机号" }, { key: "email", label: "邮箱" }, { key: "identity", label: "中国大陆身份证" }, { key: "bank", label: "银行卡号" }] as const;
const options = reactive<RedactionOptions>({ phone: true, email: true, identity: true, bank: true, custom: false, pattern: "token=([A-Za-z0-9]+)", replacement: "token=***" });
const input = ref("");
const result = ref<RedactionResult | null>(null);
const error = ref("");
const status = ref("");
const busy = ref(false);
let revision = 0;
let controller: AbortController | undefined;
watch([input, options], reset, { deep: true, flush: "sync" });
onBeforeUnmount(() => controller?.abort());

function reset() {
  controller?.abort();
  revision++;
  result.value = null;
  error.value = "";
  status.value = "";
  busy.value = false;
}

function example() {
  input.value = "手机号：13800138000\n邮箱：demo@example.com\n身份证：110101199001011234\n银行卡：6222021234567890123\ntoken=ExampleOnly123";
}

async function run() {
  reset();
  const id = revision;
  controller = new AbortController();
  busy.value = true;
  try {
    const value = await runWorker<RedactionResult>(new Worker(new URL("../workers/redaction.worker.ts", import.meta.url), { type: "module" }), { input: input.value, options: { ...options } }, 3000, controller.signal);
    if (id === revision) result.value = value;
  } catch (reason) {
    if (id === revision) error.value = reason instanceof Error ? reason.message : t('脱敏失败，请检查规则。');
  } finally {
    if (id === revision) busy.value = false;
  }
}

async function copy() {
  if (!result.value) return;
  try {
    await copyText(result.value.output);
    status.value = t('已复制到剪贴板');
  } catch {
    error.value = t('复制失败，请检查剪贴板权限。');
  }
}

async function save() {
  if (!result.value) return;
  const id = revision;
  try {
    const saved = await saveOutput(new TextEncoder().encode(result.value.output), "redacted.txt", "txt", "text/plain;charset=utf-8");
    if (id === revision) status.value = saved ? t('已保存') : t('已取消保存');
  } catch {
    if (id === revision) error.value = t('保存失败，请检查目标路径。');
  }
}
</script>
