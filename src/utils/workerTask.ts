export function runWorker<T>(worker: Worker, request: unknown, timeoutMs = 5000, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const finish = (error?: Error, value?: T) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      worker.terminate();
      if (error) reject(error);
      else resolve(value as T);
    };
    const abort = () => finish(new Error("任务已取消"));
    const timer = setTimeout(() => finish(new Error("处理超时，请缩小输入范围后重试。")), timeoutMs);
    worker.onmessage = (event) => {
      if (event.data.error) finish(new Error(event.data.error));
      else finish(undefined, event.data.value);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(new Error("后台处理失败，请重试。"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    else {
      try {
        worker.postMessage(request);
      } catch (error) {
        finish(error instanceof Error ? error : new Error("无法发送处理请求。"));
      }
    }
  });
}
