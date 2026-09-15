import { computed, onScopeDispose, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { isTauri } from '@tauri-apps/api/core';
import { version } from '../../package.json';
import { findAvailableUpdate, readReleases, type ReleaseInfo } from '../utils/appUpdates';
import { usePreferencesStore } from './preferences';

const releasesApi = 'https://api.github.com/repos/liuxiangyu2026/TangTool/releases?per_page=30';
const interval = 6 * 60 * 60 * 1000;

export const useUpdatesStore = defineStore('updates', () => {
  const preferences = usePreferencesStore();
  const releases = ref<ReleaseInfo[]>([]);
  const checking = ref(false);
  const errorKey = ref('');
  const lastCheckedAt = ref(0);
  const available = computed(() => findAvailableUpdate(releases.value, version, preferences.includePrereleases));
  let started = false;
  let lastAttemptAt = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let controller: AbortController | null = null;
  let requestId = 0;

  async function check() {
    if (checking.value) return;
    const id = ++requestId;
    const pending = new AbortController();
    controller = pending;
    checking.value = true;
    errorKey.value = '';
    lastAttemptAt = Date.now();
    let timedOut = false;
    let failure = '无法检查更新，请检查网络或稍后重试。';
    const timeout = setTimeout(() => { timedOut = true; pending.abort(); }, 10000);
    try {
      const response = await fetch(releasesApi, {
        signal: pending.signal,
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!response.ok) {
        if (response.status === 403 || response.status === 429) failure = '版本查询暂时受限，请稍后重试或打开 GitHub 版本列表。';
        throw new Error(`GitHub ${response.status}`);
      }
      failure = '版本信息无效，请稍后重试或打开 GitHub 版本列表。';
      const result = readReleases(await response.json());
      if (id !== requestId) return;
      releases.value = result;
      lastCheckedAt.value = Date.now();
    } catch {
      if (id === requestId) errorKey.value = timedOut ? '检查更新超时，请稍后重试。' : failure;
    } finally {
      clearTimeout(timeout);
      if (id === requestId) {
        checking.value = false;
        controller = null;
      }
    }
  }

  function checkIfDue() {
    if (!started || !preferences.autoCheckUpdates || document.hidden || !navigator.onLine || checking.value) return;
    // 离线/失败不刷屏；恢复网络或回到窗口后再按冷却时间检查。
    const cooldown = errorKey.value ? 10 * 60 * 1000 : interval;
    if (!lastAttemptAt || Date.now() - lastAttemptAt >= cooldown) void check();
  }

  function stop() {
    started = false;
    clearInterval(timer);
    timer = undefined;
    document.removeEventListener('visibilitychange', checkIfDue);
    window.removeEventListener('focus', checkIfDue);
    window.removeEventListener('online', checkIfDue);
    requestId += 1;
    controller?.abort();
    controller = null;
    checking.value = false;
  }

  function start() {
    // 普通浏览器开发预览不主动联网；手动检查仍可用于查看公开版本。
    if (started || !isTauri()) return;
    started = true;
    timer = setInterval(checkIfDue, 60000);
    document.addEventListener('visibilitychange', checkIfDue);
    window.addEventListener('focus', checkIfDue);
    window.addEventListener('online', checkIfDue);
    checkIfDue();
  }

  watch(() => preferences.autoCheckUpdates, enabled => {
    if (enabled) {
      lastAttemptAt = 0;
      checkIfDue();
    } else {
      // 关闭时取消正在进行的自动查询，迟到的响应不能重新显示旧状态。
      requestId += 1;
      controller?.abort();
      controller = null;
      checking.value = false;
    }
  }, { flush: 'sync' });
  onScopeDispose(stop);

  return { available, checking, errorKey, lastCheckedAt, check, start, stop };
});
