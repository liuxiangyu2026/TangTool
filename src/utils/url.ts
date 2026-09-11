export type UrlCodecResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function encodeUrlComponent(input: string): UrlCodecResult {
  if (input.length === 0) {
    return { ok: false, error: "请输入需要编码的内容" };
  }

  return { ok: true, value: encodeURIComponent(input) };
}

export function decodeUrlComponent(input: string): UrlCodecResult {
  if (input.length === 0) {
    return { ok: false, error: "请输入需要解码的内容" };
  }

  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: "URL 编码格式无效，请检查百分号编码是否完整" };
  }
}
