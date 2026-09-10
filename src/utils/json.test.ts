import { describe, expect, it } from "vitest";

import { formatJson, minifyJson, validateJson } from "./json";

describe("formatJson", () => {
  it("formats a valid object", () => {
    const result = formatJson(`{
      "name": "TangTool",
      "enabled": true
    }`);

    expect(result).toEqual({
      ok: true,
      value: `{
  "name": "TangTool",
  "enabled": true
}`,
    });
  });

  it("formats a valid array", () => {
    const result = formatJson(`[{"id":1},{"id":2}]`);

    expect(result).toEqual({
      ok: true,
      value: `[
  {
    "id": 1
  },
  {
    "id": 2
  }
]`,
    });
  });

  it("formats compact JSON with two-space indentation", () => {
    const result = formatJson(`{"name":"TangTool","features":["format","validate"]}`);

    expect(result).toEqual({
      ok: true,
      value: `{
  "name": "TangTool",
  "features": [
    "format",
    "validate"
  ]
}`,
    });
  });

  it("returns an error for invalid JSON", () => {
    const result = formatJson(`{"name":"TangTool",}`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toBe("");
    }
  });

  it("returns a clear error for empty input", () => {
    expect(formatJson("   ")).toEqual({
      ok: false,
      error: "JSON 内容不能为空",
    });
  });
});

describe("minifyJson", () => {
  it("minifies a valid object", () => {
    expect(minifyJson(`{
      "name": "TangTool",
      "enabled": true
    }`)).toEqual({
      ok: true,
      value: `{"name":"TangTool","enabled":true}`,
    });
  });

  it("minifies a valid array", () => {
    expect(minifyJson(`[
      { "id": 1 },
      { "id": 2 }
    ]`)).toEqual({
      ok: true,
      value: `[{"id":1},{"id":2}]`,
    });
  });

  it("keeps compact JSON compact", () => {
    expect(minifyJson(`{"name":"TangTool","items":[1,2]}`)).toEqual({
      ok: true,
      value: `{"name":"TangTool","items":[1,2]}`,
    });
  });

  it("returns an error for invalid JSON", () => {
    const result = minifyJson(`{"name":"TangTool",}`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toBe("");
    }
  });

  it("returns a clear error for empty input", () => {
    expect(minifyJson("   ")).toEqual({
      ok: false,
      error: "JSON 内容不能为空",
    });
  });
});

describe("validateJson", () => {
  it("accepts valid JSON", () => {
    expect(validateJson(`{"name":"TangTool","enabled":true}`)).toEqual({ ok: true });
  });

  it("returns the error position, line and column for multiline JSON", () => {
    const input = `{
  "name": "TangTool",
}`;
    const result = validateJson(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("JSON 语法错误：");
      expect(result.position).toBe(input.lastIndexOf("}"));
      expect(result.line).toBe(3);
      expect(result.column).toBe(1);
    }
  });

  it("returns the empty input error without a misleading location", () => {
    expect(validateJson("\n  ")).toEqual({
      ok: false,
      error: "JSON 内容不能为空",
    });
  });
});
