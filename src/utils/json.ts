export type FormatJsonResult =
    | { ok: true, value: string }
    | { ok: false, error: string };

export function formatJson(input: string, indent = 2): FormatJsonResult {
    try {
        if (input.trim() === "") {
            return { ok: false, error: "JSON 内容不能为空" };
        }

        const parsedJson = JSON.parse(input);
        return { ok: true, value: JSON.stringify(parsedJson, null, indent) };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "JSON 格式无效" };
    }
}