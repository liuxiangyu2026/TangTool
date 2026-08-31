import { describe, it, expect } from "vitest";
import { formatJson } from "./json";

describe("formatJson", () => {
  it("formats a valid object", () => {
    const input = `{
      "name": "John",
      "age": 30
    }`;
    const result = formatJson(input);
    expect(result.ok).toBe(true);
    if (!result.ok) {
        expect(result.error).not.toBe("");
      }
  });
});