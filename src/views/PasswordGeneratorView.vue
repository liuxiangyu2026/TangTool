<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <header class="shrink-0">
      <p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1>
    </header>

    <div class="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
      <section class="overflow-auto rounded-lg border border-neutral-200 bg-white p-4" aria-label="密码生成设置">
        <h2 class="text-sm font-semibold text-neutral-800">生成设置</h2>

        <div class="mt-5">
          <div class="flex items-center justify-between gap-4">
            <label class="text-sm font-medium text-neutral-700" for="password-length">密码长度</label>
            <input id="password-length-number" v-model.number="options.length" class="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-center text-sm text-neutral-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" type="number" min="4" max="128" @change="normalizeLengthAndGenerate" />
          </div>
          <input id="password-length" v-model.number="options.length" class="mt-3 w-full accent-blue-600" type="range" min="4" max="128" @change="generatePassword" />
          <div class="mt-1 flex justify-between text-xs text-neutral-400">
            <span>4</span>
            <span>128</span>
          </div>
        </div>

        <div class="mt-5 border-t border-neutral-100 pt-4">
          <div class="flex items-center justify-between gap-4">
            <label class="text-sm font-medium text-neutral-700" for="password-count">生成数量</label>
            <input id="password-count" v-model.number="options.count" class="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-center text-sm text-neutral-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" type="number" min="1" max="20" @change="normalizeCountAndGenerate" />
          </div>
          <p class="mt-1 text-xs text-neutral-400">一次生成 1～20 条</p>
        </div>

        <fieldset class="mt-5 border-t border-neutral-100 pt-4">
          <legend class="text-sm font-medium text-neutral-700">字符类型</legend>
          <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label v-for="characterType in characterTypes" :key="characterType.key" class="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50">
              <input v-model="options[characterType.key]" class="h-4 w-4 accent-blue-600" type="checkbox" @change="generatePassword" />
              <span>{{ characterType.label }}</span>
              <code class="ml-auto text-xs text-neutral-400">{{ characterType.example }}</code>
            </label>
          </div>
        </fieldset>

        <label class="mt-4 flex cursor-pointer items-start gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <input v-model="options.excludeAmbiguous" class="mt-0.5 h-4 w-4 accent-amber-600" type="checkbox" @change="generatePassword" />
          <span>
            <span class="block font-medium">排除易混淆字符</span>
            <code class="mt-0.5 block text-xs text-amber-700">0 O o 1 I l |</code>
          </span>
        </label>
      </section>

      <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white" aria-label="密码生成结果">
        <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 px-3 py-2">
          <button class="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" type="button" :disabled="isGenerating" @click="generatePassword">
            <RefreshCw :size="14" :class="isGenerating ? 'animate-spin' : ''" aria-hidden="true" />
            <span>{{ isGenerating ? "生成中" : "重新生成" }}</span>
          </button>
          <button class="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" type="button" :disabled="passwords.length === 0" @click="copyAllPasswords">
            <Copy :size="14" aria-hidden="true" />
            <span>复制全部</span>
          </button>
          <p v-if="statusMessage" class="ml-auto text-sm text-emerald-700" role="status">{{ statusMessage }}</p>
        </div>

        <div class="flex min-h-0 flex-1 flex-col overflow-auto p-5 sm:p-8">
          <div class="min-h-0 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">生成的密码</p>
            <div v-if="passwords.length > 0" class="mt-3 max-h-80 space-y-2 overflow-auto">
              <div v-for="(generatedPassword, index) in passwords" :key="`${generatedPassword}-${index}`" class="flex items-center gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2">
                <span class="w-6 shrink-0 text-right text-xs text-neutral-400">{{ index + 1 }}</span>
                <code class="min-w-0 flex-1 select-all break-all font-mono text-base leading-7 text-neutral-900">{{ generatedPassword }}</code>
                <button class="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400" type="button" :aria-label="`复制第 ${index + 1} 条密码`" @click="copyPassword(generatedPassword, index)">
                  <Copy :size="13" aria-hidden="true" />
                  <span>复制</span>
                </button>
              </div>
            </div>
            <p v-else class="mt-3 min-h-16 flex items-center font-mono text-xl leading-8 text-neutral-400">等待生成…</p>
          </div>

          <div v-if="passwords.length > 0" class="mt-5 rounded-lg border p-4" :class="strengthMeta.containerClass">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <ShieldCheck :size="18" aria-hidden="true" />
                <span class="text-sm font-semibold">密码强度：{{ strengthMeta.label }}</span>
              </div>
              <span class="text-xs">约 {{ entropyBits }} bit</span>
            </div>
            <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
              <div class="h-full rounded-full transition-all" :class="strengthMeta.barClass" :style="{ width: `${strengthPercent}%` }"></div>
            </div>
          </div>

          <p v-if="errorMessage" class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ errorMessage }}</p>
          <p class="mt-4 text-sm leading-6 text-neutral-500">密码由 Rust 调用操作系统安全随机源在本机生成，不会上传或保存。建议为每个账户使用不同密码，并交由密码管理器保管。</p>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Copy, RefreshCw, ShieldCheck } from "lucide-vue-next";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";

type CharacterOptionKey = "includeUppercase" | "includeLowercase" | "includeNumbers" | "includeSymbols";

type PasswordOptions = {
  length: number;
  count: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
};

const AMBIGUOUS_CHARACTERS = new Set("0Oo1Il|");
const CHARACTER_SETS: Record<CharacterOptionKey, string> = {
  includeUppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  includeLowercase: "abcdefghijklmnopqrstuvwxyz",
  includeNumbers: "0123456789",
  includeSymbols: "!@#$%^&*()-_=+[]{};:,.?",
};

const characterTypes: { key: CharacterOptionKey; label: string; example: string }[] = [
  { key: "includeUppercase", label: "大写字母", example: "A-Z" },
  { key: "includeLowercase", label: "小写字母", example: "a-z" },
  { key: "includeNumbers", label: "数字", example: "0-9" },
  { key: "includeSymbols", label: "特殊字符", example: "!@#$" },
];

const route = useRoute();
const options = reactive<PasswordOptions>({
  length: 20,
  count: 6,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: true,
});
const passwords = ref<string[]>([]);
const generatedEntropy = ref(0);
const errorMessage = ref("");
const statusMessage = ref("");
const isGenerating = ref(false);
let latestRequestId = 0;

const entropyBits = computed(() => Math.round(generatedEntropy.value));
const strengthPercent = computed(() => Math.min((generatedEntropy.value / 100) * 100, 100));
const strengthMeta = computed(() => {
  if (generatedEntropy.value < 50) {
    return { label: "较弱", containerClass: "border-red-200 bg-red-50 text-red-700", barClass: "bg-red-500" };
  }
  if (generatedEntropy.value < 80) {
    return { label: "中等", containerClass: "border-amber-200 bg-amber-50 text-amber-700", barClass: "bg-amber-500" };
  }
  return { label: "较强", containerClass: "border-emerald-200 bg-emerald-50 text-emerald-700", barClass: "bg-emerald-500" };
});

onMounted(() => {
  generatePassword();
});

async function generatePassword() {
  const requestId = ++latestRequestId;
  isGenerating.value = true;
  errorMessage.value = "";
  statusMessage.value = "";

  try {
    const generatedPasswords = await invoke<string[]>("generate_passwords", { options: { ...options } });
    if (requestId !== latestRequestId) {
      return;
    }

    passwords.value = generatedPasswords;
    generatedEntropy.value = calculateEntropy();
  } catch (error) {
    if (requestId !== latestRequestId) {
      return;
    }

    passwords.value = [];
    generatedEntropy.value = 0;
    errorMessage.value = typeof error === "string" ? error : "密码生成失败，请重新尝试";
  } finally {
    if (requestId === latestRequestId) {
      isGenerating.value = false;
    }
  }
}

function normalizeLengthAndGenerate() {
  options.length = Math.min(Math.max(Math.round(Number(options.length) || 20), 4), 128);
  generatePassword();
}

function normalizeCountAndGenerate() {
  options.count = Math.min(Math.max(Math.round(Number(options.count) || 6), 1), 20);
  generatePassword();
}

function calculateEntropy(): number {
  const poolSize = characterTypes.reduce((size, characterType) => {
    if (!options[characterType.key]) {
      return size;
    }

    const characters = CHARACTER_SETS[characterType.key];
    return size + Array.from(characters).filter((character) => !options.excludeAmbiguous || !AMBIGUOUS_CHARACTERS.has(character)).length;
  }, 0);

  return poolSize > 0 ? options.length * Math.log2(poolSize) : 0;
}

async function copyPassword(value: string, index: number) {
  try {
    await writeText(value);
    statusMessage.value = `已复制第 ${index + 1} 条密码`;
    errorMessage.value = "";
  } catch {
    errorMessage.value = "复制失败，请重新尝试";
    statusMessage.value = "";
  }
}

async function copyAllPasswords() {
  if (passwords.value.length === 0) {
    return;
  }

  try {
    await writeText(passwords.value.join("\n"));
    statusMessage.value = `已复制全部 ${passwords.value.length} 条密码`;
    errorMessage.value = "";
  } catch {
    errorMessage.value = "复制失败，请重新尝试";
    statusMessage.value = "";
  }
}
</script>
