<template>
  <Teleport to="body">
    <dialog ref="dialog" class="m-auto w-[28rem] max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-surface p-5 text-neutral-900 shadow-xl backdrop:bg-black/40" aria-labelledby="update-progress-title" @cancel.prevent>
      <h2 id="update-progress-title" class="text-base font-semibold">{{ t('正在更新到 {version}', { version: updates.installTag }) }}</h2>
      <p class="mt-3 text-sm" role="status">{{ t(phaseLabel) }}</p>
      <progress class="mt-4 h-3 w-full accent-blue-600" max="100" :value="progressValue" :aria-label="t('更新进度')"></progress>
      <p class="mt-2 text-xs text-neutral-500">{{ progressText }}</p>
      <p class="mt-4 text-xs leading-5 text-neutral-500">{{ t('校验通过后将自动安装并重启，请勿关闭应用。') }}</p>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { t } from '../i18n/index';
import { useUpdatesStore } from '../stores/updates';

const updates = useUpdatesStore();
const dialog = ref<HTMLDialogElement | null>(null);
const phaseLabel = computed(() => ({
  idle: '', confirming: '请在确认窗口中确认更新', checking: '正在获取更新包信息…',
  downloading: '正在下载更新…', verifying: '正在校验更新签名…', installing: '正在安装并重启…', failed: '',
}[updates.installPhase]));
const progressValue = computed(() => ['verifying', 'installing'].includes(updates.installPhase)
  ? 100 : updates.downloadPercent ?? undefined);
const progressText = computed(() => {
  const received = (updates.downloadedBytes / 1024 / 1024).toFixed(1);
  if (updates.installPhase !== 'downloading') return '';
  return updates.totalBytes
    ? `${received} / ${(updates.totalBytes / 1024 / 1024).toFixed(1)} MiB · ${updates.downloadPercent}%`
    : t('已下载 {size} MiB', { size: received });
});
watch(() => updates.installBusy, async busy => {
  await nextTick();
  if (busy && updates.installBusy && !dialog.value?.open) dialog.value?.showModal();
  else if (!updates.installBusy && dialog.value?.open) dialog.value.close();
}, { immediate: true });
onBeforeUnmount(() => dialog.value?.close());
</script>
