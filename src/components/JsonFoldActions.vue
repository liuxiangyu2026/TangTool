<template>
  <div class="flex min-w-0 items-center gap-3 text-xs">
    <button type="button" class="flex min-w-0 items-center gap-1 text-blue-700 disabled:opacity-50" :disabled="disabled" :aria-label="t('全部折叠')" :title="t('全部折叠')" @click="emit('fold', true)"><FoldVertical :size="14" class="shrink-0" /><span class="truncate">{{ t('全部折叠') }}</span></button>
    <button type="button" class="flex min-w-0 items-center gap-1 text-blue-700 disabled:opacity-50" :disabled="disabled" :aria-label="t('全部展开')" :title="t('全部展开')" @click="emit('fold', false)"><UnfoldVertical :size="14" class="shrink-0" /><span class="truncate">{{ t('全部展开') }}</span></button>
  </div>
</template>

<script setup lang="ts">
import { FoldVertical, UnfoldVertical } from "lucide-vue-next";
import { t } from "../i18n/index";

defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{ fold: [collapse: boolean] }>();
</script>
