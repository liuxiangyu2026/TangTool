<template>
  <ToolPage :description="t('支持 Unix 五段、秒级六段、Quartz 六/七段、Spring 和常用宏；只解析规则，不创建定时任务。')" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button"
              @click="expression = dialect === 'quartz' ? '0 0 9 ? * MON-FRI' : dialect === 'spring' || dialect === 'seconds' ? '0 0 9 * * MON-FRI' : '0 9 * * MON-FRI'">
        <BookOpen :size="14"/>
        {{ t("工作日示例") }}
      </button>
      <button class="tool-button bg-blue-600" type="button" :disabled="busy" @click="run">
        <CalendarClock :size="14"/>
        {{ busy ? t("解析中") : t("解析 / 预览") }}
      </button>
      <button class="tool-button bg-red-600" type="button" @click=" expression = ''; reset(); ">
        <Trash2 :size="14"/>
        {{ t("清除") }}
      </button>
    </template>
    <div class="tool-panel space-y-3">
      <label class="flex flex-wrap items-center gap-3 text-sm">
        Cron
        <input v-model="expression" class="tool-field min-w-0 flex-1 font-mono" placeholder="*/5 * * * *"/>
      </label>
      <div class="flex flex-wrap gap-3 text-sm">
        <label class="flex items-center gap-2">{{ t("Cron 格式") }}
          <select v-model="dialect" class="tool-field">
            <option value="auto">{{ t("自动识别") }}</option>
            <option value="unix">{{ t("Unix / Linux（5 段）") }}</option>
            <option value="seconds">{{ t("秒级（6 段，星期 0/7 为周日）") }}</option>
            <option value="quartz">{{ t("Quartz（6/7 段，星期 1 为周日）") }}</option>
            <option value="spring">{{ t("Spring（6 段，星期 0/7 为周日）") }}</option>
          </select>
        </label>
        <label class="flex items-center gap-2">
          {{ t("时区") }}
          <input v-model="timeZone" list="cron-zones" class="tool-field"/>
        </label>
        <datalist id="cron-zones">
          <option v-for="zone in zones" :key="zone" :value="zone"/>
        </datalist>
        <label class="flex min-w-0 flex-1 items-center gap-2">
          {{ t("起点") }}
          <input v-model="start" class="tool-field min-w-0 flex-1 font-mono" :placeholder="t('带 Z 或偏移的 ISO 日期')"/>
        </label>
        <button type="button" class="text-xs text-blue-700" @click="start = new Date().toISOString()">{{ t("使用当前时间") }}</button>
      </div>
      <p class="text-xs text-neutral-500">{{ t("预览严格晚于起点的最多 10 次执行，按所选时区计算。支持列表、范围、步长及 Quartz / Spring 的 ?、L、L-n、W、LW、#；年份支持 1970～9999。") }}</p>
    </div>
    <div v-if="result" class="tool-panel space-y-3">
      <h2 class="text-sm font-semibold">{{ locale === "en" ? result.englishDescription : result.description }}</h2>
      <p class="text-xs text-neutral-500">{{ t("解析格式") }}: {{ dialectLabels[result.dialect] }}</p>
      <p v-if="result.ambiguous" class="text-xs text-orange-700">{{ t("六段表达式存在方言差异，当前为自动判断；请核对格式，尤其是数字星期。") }}</p>
      <p v-if="!result.reboot && result.dates.length < 10" class="text-xs text-orange-700">{{ t("已列出范围内所有匹配时间；规则可能已过期或没有匹配日期。") }}</p>
      <p v-if="result.dayOr" class="text-xs text-orange-700">{{ t("日期与星期同时受限：满足其中任一条件就执行，不是必须同时满足。") }}</p>
      <div class="flex flex-wrap gap-3 text-xs text-neutral-500">
        <span v-for="(field, index) in result.fields" :key="index">{{ t(result.fieldNames[index]!) }}: {{ field }}</span>
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
import {locale, t} from "../i18n/index";
import {computed, onBeforeUnmount, ref, watch} from "vue";
import {BookOpen, CalendarClock, Trash2} from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import type {CronDialect, CronResult} from "../utils/cron";
import {runWorker} from "../utils/workerTask";

const expression = ref("*/5 * * * *");
const timeZone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);
const zones = [...new Set([timeZone.value, "UTC", "Asia/Shanghai", "Asia/Tokyo", "America/New_York", "Europe/London"])];
const start = ref(new Date().toISOString());
const dialect = ref<CronDialect>("auto");
const dialectLabels = computed(() => ({unix: "Unix / Linux", seconds: t("秒级"), quartz: "Quartz", spring: "Spring"}));
const result = ref<CronResult | null>(null);
const error = ref("");
const status = ref("");
const busy = ref(false);
let revision = 0;
let controller: AbortController | undefined;
watch([expression, timeZone, start, dialect], reset, {flush: "sync"});
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
        new Worker(new URL("../workers/cron.worker.ts", import.meta.url), {type: "module"}),
        {
          expression: expression.value,
          timeZone: timeZone.value,
          start: start.value,
          dialect: dialect.value
        },
        5000,
        controller.signal
    );
    if (id === revision) {
      result.value = value;
      status.value = value.reboot ? "" : t("已生成 {count} 次执行时间", {count: value.dates.length});
    }
  } catch (reason) {
    if (id === revision) error.value = reason instanceof Error ? reason.message : t("解析失败。");
  } finally {
    if (id === revision) busy.value = false;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(locale.value, {timeZone: timeZone.value, dateStyle: "medium", timeStyle: "long", hourCycle: "h23"}).format(new Date(date));
}
</script>
