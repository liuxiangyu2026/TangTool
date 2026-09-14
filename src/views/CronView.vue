<template>
  <ToolPage description="标准 5 段 Cron：分 时 日 月 星期。只解析规则，不创建定时任务；未来时间以所选时区与其夏令时规则计算。" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click="expression = '0 9 * * MON-FRI'">
        <BookOpen :size="14" />
        工作日示例
      </button>
      <button class="tool-button bg-blue-600" type="button" :disabled="busy" @click="run">
        <CalendarClock :size="14" />
        {{ busy ? "解析中" : "解析 / 预览" }}
      </button>
      <button class="tool-button bg-red-600" type="button" @click=" expression = ''; reset(); ">
        <Trash2 :size="14" />
        清除
      </button>
    </template>
    <div class="tool-panel space-y-3">
      <label class="flex flex-wrap items-center gap-3 text-sm">
        Cron
        <input v-model="expression" class="tool-field min-w-0 flex-1 font-mono" placeholder="*/5 * * * *" />
      </label>
      <div class="flex flex-wrap gap-3 text-sm">
        <label class="flex items-center gap-2">
          时区
          <input v-model="timeZone" list="cron-zones" class="tool-field" />
        </label>
        <datalist id="cron-zones"><option v-for="zone in zones" :key="zone" :value="zone" /></datalist>
        <label class="flex min-w-0 flex-1 items-center gap-2">
          起点
          <input v-model="start" class="tool-field min-w-0 flex-1 font-mono" placeholder="带 Z 或偏移的 ISO 日期" />
        </label>
        <button type="button" class="text-xs text-blue-700" @click="start = new Date().toISOString()">使用当前时间</button>
      </div>
      <p class="text-xs text-neutral-500">预览严格晚于起点的 10 次执行；星期 0 / 7 均表示周日。支持 *、逗号列表、范围与 / 步长，不支持 Quartz。</p>
    </div>
    <div v-if="result" class="tool-panel space-y-3">
      <h2 class="text-sm font-semibold">{{ result.description }}</h2>
      <p v-if="result.dayOr" class="text-xs text-orange-700">日期与星期同时受限：满足其中任一条件就执行，不是必须同时满足。</p>
      <div class="flex flex-wrap gap-3 text-xs text-neutral-500">
        <span v-for="(field, index) in result.fields" :key="index">{{ fieldNames[index] }}：{{ field }}</span>
      </div>
      <ol class="space-y-2 font-mono text-sm">
        <li v-for="(date, index) in result.dates" :key="date" class="flex flex-wrap gap-x-4 border-t border-neutral-200 pt-2">
          <span>{{ index + 1 }}. {{ formatDate(date) }}</span>
          <span class="text-xs text-neutral-500">{{ date }}</span>
        </li>
      </ol>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { BookOpen, CalendarClock, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import type { CronResult } from "../utils/cron";
import { runWorker } from "../utils/workerTask";

const expression = ref("*/5 * * * *");
const timeZone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);
const zones = [...new Set([timeZone.value, "UTC", "Asia/Shanghai", "Asia/Tokyo", "America/New_York", "Europe/London"])];
const start = ref(new Date().toISOString());
const fieldNames = ["分", "时", "日", "月", "星期"];
const result = ref<CronResult | null>(null);
const error = ref("");
const status = ref("");
const busy = ref(false);
let revision = 0;
let controller: AbortController | undefined;
watch([expression, timeZone, start], reset, { flush: "sync" });
onBeforeUnmount(() => controller?.abort());

function reset() {
  controller?.abort();
  revision++;
  busy.value = false;
  result.value = null;
  error.value = "";
  status.value = "";
}

async function run() {
  reset();
  const id = revision;
  controller = new AbortController();
  busy.value = true;
  try {
    const value = await runWorker<CronResult>(
      new Worker(new URL("../workers/cron.worker.ts", import.meta.url), { type: "module" }),
      {
        expression: expression.value,
        timeZone: timeZone.value,
        start: start.value,
      },
      5000,
      controller.signal,
    );
    if (id === revision) {
      result.value = value;
      status.value = "已生成未来 10 次执行时间";
    }
  } catch (reason) {
    if (id === revision) error.value = reason instanceof Error ? reason.message : "解析失败。";
  } finally {
    if (id === revision) busy.value = false;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: timeZone.value, dateStyle: "medium", timeStyle: "long", hourCycle: "h23" }).format(new Date(date));
}
</script>
