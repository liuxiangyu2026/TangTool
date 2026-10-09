import { t } from "../i18n/core";
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

GlobalWorkerOptions.workerSrc = workerUrl;
export type PdfImageOptions = {
  sizing: "edge" | "box";
  maxEdge: number;
  width: number;
  height: number;
  format: "png" | "jpeg";
  quality: number;
};

export async function withPdf<T>(file: File, signal: AbortSignal, action: (pdf: PDFDocumentProxy) => Promise<T>): Promise<T> {
  if (!/\.pdf$/i.test(file.name) || file.size === 0 || file.size > 50 * 1024 * 1024) throw new Error(t("请选择非空且不超过 50 MiB 的 PDF"));
  signal.throwIfAborted();
  const data = await file.arrayBuffer();
  signal.throwIfAborted();
  const task = getDocument({
    data,
    isEvalSupported: false,
    enableXfa: false,
    cMapUrl: "/pdf-assets/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdf-assets/standard_fonts/",
    wasmUrl: "/pdf-assets/wasm/",
  });
  const abort = () => {
    void task.destroy();
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    const pdf = await task.promise;
    signal.throwIfAborted();
    return await action(pdf);
  } finally {
    signal.removeEventListener("abort", abort);
    // 每次任务独立持有解析器和 Worker，完成、失败或取消都释放。
    await task.destroy();
  }
}

export async function renderPdfPage(pdf: PDFDocumentProxy, number: number, options: PdfImageOptions, signal: AbortSignal): Promise<Blob> {
  const values = options.sizing === "edge" ? [options.maxEdge] : [options.width, options.height];
  if (values.some((value) => !Number.isInteger(value) || value < 64 || value > 8192))
    throw new Error(t("图片尺寸需要是 64～8192 像素的整数"));
  if (!Number.isInteger(options.quality) || options.quality < 10 || options.quality > 100)
    throw new Error(t("质量需要是 10～100 的整数。"));
  signal.throwIfAborted();
  const page = await pdf.getPage(number);
  const canvas = document.createElement("canvas");
  try {
    const original = page.getViewport({ scale: 1 });
    const scale =
      options.sizing === "edge"
        ? options.maxEdge / Math.max(original.width, original.height)
        : Math.min(options.width / original.width, options.height / original.height);
    const viewport = page.getViewport({ scale });
    const width = options.sizing === "box" ? options.width : Math.max(1, Math.round(viewport.width));
    const height = options.sizing === "box" ? options.height : Math.max(1, Math.round(viewport.height));
    // 在分配像素缓冲区之前检查，避免无效尺寸也产生一次大内存峰值。
    if (width * height > 24_000_000) throw new Error(t("输出图片不能超过 2400 万像素"));
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error(t("当前环境无法创建图像画布。"));
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const render = page.render({
      canvas,
      canvasContext: context,
      viewport,
      transform: [1, 0, 0, 1, (canvas.width - viewport.width) / 2, (canvas.height - viewport.height) / 2],
      background: "#ffffff",
    });
    const cancel = () => render.cancel();
    signal.addEventListener("abort", cancel, { once: true });
    try {
      signal.throwIfAborted();
      await render.promise;
      signal.throwIfAborted();
      return await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error(t("图片编码失败。")))),
          `image/${options.format}`,
          options.quality / 100,
        ),
      );
    } finally {
      signal.removeEventListener("abort", cancel);
    }
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }
}

export async function pdfToDocx(
  file: File,
  signal: AbortSignal,
  progress: (page: number, total: number) => void,
  appearance = false,
): Promise<Blob> {
  const { Document, Paragraph, TextRun, ImageRun, Packer, TextWrappingType } = await import("docx");
  return withPdf(file, signal, async (pdf) => {
    if (pdf.numPages > 100) throw new Error(t("首批最多转换 100 页，请拆分文档后重试"));
    const sections = [];
    let characters = 0;
    let imageBytes = 0;
    for (let number = 1; number <= pdf.numPages; number++) {
      signal.throwIfAborted();
      const page = await pdf.getPage(number);
      try {
        if (appearance) {
          const viewport = page.getViewport({ scale: 1 });
          const image = await renderPdfPage(
            pdf,
            number,
            { sizing: "edge", maxEdge: 1600, width: 1600, height: 1600, format: "png", quality: 90 },
            signal,
          );
          imageBytes += image.size;
          if (imageBytes > 100 * 1024 * 1024) throw new Error(t("输出超过 100 MiB，请减少页数或图片尺寸"));
          sections.push({
            properties: {
              page: {
                size: { width: Math.round(viewport.width * 20), height: Math.round(viewport.height * 20) },
                margin: { top: 0, bottom: 0, left: 0, right: 0 },
              },
            },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new ImageRun({
                    type: "png",
                    data: new Uint8Array(await image.arrayBuffer()),
                    transformation: { width: (viewport.width * 4) / 3, height: (viewport.height * 4) / 3 },
                    // 以页面为锚点保留比例，避免内联图片的段落基线挤出额外空白页。
                    floating: {
                      horizontalPosition: { relative: "page", offset: 0 },
                      verticalPosition: { relative: "page", offset: 0 },
                      wrap: { type: TextWrappingType.NONE },
                      behindDocument: true,
                      allowOverlap: true,
                    },
                  }),
                ],
              }),
            ],
          });
          progress(number, pdf.numPages);
          continue;
        }
        const content = await page.getTextContent();
        const items = content.items.filter((item): item is TextItem => "str" in item && Boolean(item.str.trim()));
        characters += items.reduce((total, item) => total + item.str.length, 0);
        if (characters > 2_000_000) throw new Error(t("文档文字过多，请拆分后转换"));
        if (!items.length) throw new Error(t("第 {page} 页没有可提取文字，扫描件暂不支持转 Word", { page: number }));
        // 按视觉行与横坐标重建可编辑文字；跨列、表格和复杂图形不保证原样排版。
        items.sort((a, b) =>
          Math.abs(a.transform[5] - b.transform[5]) > 3 ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4],
        );
        const lines: TextItem[][] = [];
        for (const item of items) {
          const line = lines[lines.length - 1];
          if (!line || Math.abs(line[0].transform[5] - item.transform[5]) > 3) lines.push([item]);
          else line.push(item);
        }
        const viewport = page.getViewport({ scale: 1 });
        sections.push({
          properties: {
            page: {
              size: { width: Math.round(viewport.width * 20), height: Math.round(viewport.height * 20) },
              margin: { top: 720, bottom: 720, left: 720, right: 720 },
            },
          },
          children: lines.map(
            (line) =>
              new Paragraph({
                spacing: { after: 40 },
                children: line.map(
                  (item, index) =>
                    new TextRun({
                      text: (index ? " " : "") + item.str,
                      size: Math.round(Math.min(72, Math.max(6, Math.hypot(item.transform[2], item.transform[3]))) * 2),
                      bold: /bold/i.test(content.styles[item.fontName]?.fontFamily ?? ""),
                    }),
                ),
              }),
          ),
        });
        progress(number, pdf.numPages);
      } finally {
        page.cleanup();
      }
    }
    signal.throwIfAborted();
    const blob = await Packer.toBlob(new Document({ sections }));
    signal.throwIfAborted();
    return blob;
  });
}
