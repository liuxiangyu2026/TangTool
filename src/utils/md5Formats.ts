/** 常见“16位 MD5”是完整32位十六进制摘要的中间16位，不是另一种摘要算法。 */
export function md5Formats(digest: string) {
  const lower = /^[a-f\d]{32}$/i.test(digest) ? digest.toLowerCase() : "";
  const middle = lower.slice(8, 24);
  return [
    { label: "32位大写", value: lower.toUpperCase() },
    { label: "32位小写", value: lower },
    { label: "16位大写", value: middle.toUpperCase() },
    { label: "16位小写", value: middle },
  ];
}
