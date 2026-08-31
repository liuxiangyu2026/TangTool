<template>
  <div class="flex h-screen overflow-hidden">
    <aside class="flex w-56 shrink-0 flex-col border-r bg-neutral-50 p-3">
      <div class="mb-6 px-3 py-1 text-lg font-semibold text-neutral-900">TangTool</div>
      <nav class="space-y-5">
        <section v-for="group in menuGroups" :key="group.label">
          <h2 class="px-3 text-xs font-medium text-neutral-500">{{ group.label }}</h2>
          <div class="mt-2 space-y-1">
            <RouterLink v-for="item in group.items" :key="item.path" :to="item.path"
              class="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-neutral-100"
              exact-active-class="bg-neutral-200 text-neutral-900">
              <component :is="item.icon" :size="18" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </div>
        </section>
      </nav>
    </aside>
    <main class="min-w-0 flex-1 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>
<script setup lang="ts">
import { Braces, GitCompareArrows, FileSpreadsheet, FileText, KeyRound, Binary } from "lucide-vue-next";
const menuGroups = [
  {
    label: "JSON",
    items: [
      { label: "JSON 格式化", icon: Braces, path: "/json/format" },
      { label: "JSON 对比", icon: GitCompareArrows, path: "/json/diff" },
      { label: "JSON 转 Excel", icon: FileSpreadsheet, path: "/json/excel" },
    ]
  },
  {
    label: "文档",
    items: [
      { label: "文档转 Markdown", icon: FileText, path: "/document/markdown" },
    ]
  },
  {
    label: "安全",
    items: [
      { label: "密码生成器", icon: KeyRound, path: "/password" },
    ]
  },
  {
    label: "编码",
    items: [
      { label: "MD5 / Base64", icon: Binary, path: "/hash-codec" },
    ]
  },
];
</script>