import { t } from "../i18n/core";
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const MAX_BASE64_LENGTH = 4 * Math.ceil(MAX_TEXT_BYTES / 3);

export function encodeBase64Text(input: string): string {
  if (input.length > MAX_TEXT_BYTES) throw new Error(t('文本最多支持 2 MiB，请改用文件模式。'));
  const bytes = new TextEncoder().encode(input);
  if (bytes.length > MAX_TEXT_BYTES) throw new Error(t('UTF-8 文本最多支持 2 MiB，请改用文件模式。'));
  const chunks: string[] = [];
  // 按小块展开，避免大文本超出函数实参数量限制。
  for (let offset = 0; offset < bytes.length; offset += 32768) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)));
  }
  return btoa(chunks.join(""));
}

export function decodeBase64Text(input: string): string {
  if (input.length > MAX_BASE64_LENGTH) throw new Error(t('Base64 文本过长，请改用文件模式（解码后最多 2 MiB）。'));
  let binary: string;
  try {
    binary = atob(input);
  } catch {
    throw new Error(t('Base64 内容无效，请检查字符和补位。'));
  }
  if (binary.length > MAX_TEXT_BYTES) throw new Error(t('解码后超过 2 MiB，请改用文件模式。'));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  try {
    // 不能把二进制中的非法字节静默替换成 �，否则复制出的内容已经损坏。
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new Error(t('解码结果不是有效 UTF-8 文本，请使用文件模式保存二进制内容。'));
  }
}
