import DOMPurify from "dompurify";
import { marked } from "marked";

/** 预览只保留文档排版；链接仍显示文字，但不导航，也不加载文档中的图片。 */
export function renderMarkdownPreview(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
      "ul", "ol", "li", "blockquote", "pre", "code", "strong", "b",
      "em", "i", "del", "s", "table", "thead", "tbody", "tfoot",
      "tr", "th", "td", "a", "span", "sup", "sub",
    ],
    ALLOWED_ATTR: ["colspan", "rowspan", "title", "start"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}
