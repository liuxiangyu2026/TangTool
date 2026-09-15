<template>
  <ToolPage :description="t('显式区分秒 / 毫秒；日期输入必须带时区偏移。只在本机转换，不访问网络时间服务。')" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click="useNow">
        <Clock3 :size="14" />
        {{ t('当前时间') }}
      </button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="instant === null" @click="copyResult">
        <Copy :size="14" />
        {{ t('复制结果') }}
      </button>
      <button class="tool-button bg-red-600" type="button" @click="clear">
        <Trash2 :size="14" />
        {{ t('清除') }}
      </button>
    </template>
    <div class="tool-panel space-y-3">
      <label for="timestamp-input" class="block text-sm font-medium">{{ t('时间戳 → 日期') }}</label>
      <div class="flex flex-wrap gap-2">
        <input id="timestamp-input" v-model="timestamp" class="tool-field min-w-0 flex-1 font-mono" :placeholder="t('例如 0')" @input="invalidate" />
        <select v-model="unit" class="tool-field" :aria-label="t('时间戳单位')" @change="invalidate">
          <option value="seconds">{{ t('秒') }}</option>
          <option value="milliseconds">{{ t('毫秒') }}</option>
        </select>
        <button class="tool-button bg-blue-600" type="button" @click="convert('timestamp')">
          <ArrowRightLeft :size="14" />
          {{ t('转为日期') }}
        </button>
      </div>
    </div>
    <div class="tool-panel space-y-3">
      <label for="iso-input" class="block text-sm font-medium">{{ t('日期 → 时间戳') }}</label>
      <div class="flex flex-wrap gap-2">
        <input id="iso-input" v-model="isoInput" class="tool-field min-w-0 flex-1 font-mono" placeholder="2026-09-14T12:00:00+08:00" @input="invalidate" />
        <button class="tool-button bg-blue-600" type="button" @click="convert('date')">
          <ArrowRightLeft :size="14" />
          {{ t('转为时间戳') }}
        </button>
      </div>
    </div>
    <div class="tool-panel space-y-3">
      <label class="flex flex-wrap items-center gap-2 text-sm">
        {{ t('显示时区') }}
        <select v-model="timeZone" class="tool-field" @change="status = ''">
          <option v-for="zone in zones" :key="zone" :value="zone">{{ zone }}</option>
        </select>
      </label>
      <p class="text-xs text-neutral-500">{{ t('时区只影响显示，不改变时间戳；秒数向下取整，毫秒保留精度。') }}</p>
      <pre class="whitespace-pre-wrap break-all font-mono text-sm leading-7" :aria-label="t('时间转换结果')">{{ result || t('转换结果显示在这里') }}</pre>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { locale, t } from "../i18n/index";
import { computed, ref } from "vue";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ArrowRightLeft, Clock3, Copy, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import { parseIsoDate, parseTimestamp } from "../utils/developerTools";

const timestamp = ref("");
const unit = ref<"seconds" | "milliseconds">("seconds");
const isoInput = ref("");
const instant = ref<number | null>(null);
const error = ref("");
const status = ref("");
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const zones = [...new Set([localZone, "UTC", "Asia/Shanghai", "Asia/Tokyo", "America/New_York", "Europe/London"])];
const timeZone = ref(localZone);
const result = computed(() => {
  if (instant.value === null) return "";
  const date = new Date(instant.value);
  const display = new Intl.DateTimeFormat(locale.value, {
    timeZone: timeZone.value,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  }).format(date);
  return t('秒：{p0}\n毫秒：{p1}\nUTC：{p2}\n{p3}：{p4}', { p0: Math.floor(instant.value / 1000), p1: instant.value, p2: date.toISOString(), p3: timeZone.value, p4: display });
});

function invalidate() {
  instant.value = null;
  error.value = "";
  status.value = "";
}

function convert(source: "timestamp" | "date") {
  invalidate();
  try {
    instant.value = source === "timestamp" ? parseTimestamp(timestamp.value, unit.value) : parseIsoDate(isoInput.value);
    status.value = t('转换完成');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('转换失败');
  }
}

function useNow() {
  invalidate();
  const now = Date.now();
  unit.value = "milliseconds";
  timestamp.value = String(now);
  isoInput.value = new Date(now).toISOString();
  instant.value = now;
}

async function copyResult() {
  try {
    await writeText(result.value);
    status.value = t('已复制转换结果');
  } catch {
    error.value = t('复制失败，请重试。');
  }
}

function clear() {
  timestamp.value = "";
  isoInput.value = "";
  invalidate();
}
</script>
