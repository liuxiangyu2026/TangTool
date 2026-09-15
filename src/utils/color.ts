import { t } from "../i18n/core";
export type RgbaColor = { r: number; g: number; b: number; a: number };

export function rgbToHsv(color: RgbaColor) {
  const [r, g, b] = [color.r, color.g, color.b].map(value => value / 255);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let hue = 0;
  if (delta > 0) {
    hue = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { h: hue, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToRgb(h: number, s: number, v: number, a = 1): RgbaColor {
  const hue = ((h % 360) + 360) % 360 / 60;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(hue % 2 - 1));
  const base = v - chroma;
  const channels = hue < 1 ? [chroma, x, 0] : hue < 2 ? [x, chroma, 0] : hue < 3 ? [0, chroma, x]
    : hue < 4 ? [0, x, chroma] : hue < 5 ? [x, 0, chroma] : [chroma, 0, x];
  return { r: Math.round((channels[0] + base) * 255), g: Math.round((channels[1] + base) * 255), b: Math.round((channels[2] + base) * 255), a };
}

export function parseHexColor(input: string): RgbaColor {
  let value = input.trim().replace(/^#/, "");
  if (!/^(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)) {
    throw new Error(t('请输入 HEX 颜色：#RGB、#RGBA、#RRGGBB 或 #RRGGBBAA。'));
  }
  if (value.length <= 4) value = [...value].map(char => char + char).join("");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    a: value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1,
  };
}

export function describeColor(color: RgbaColor) {
  const { r, g, b, a } = color;
  if (![r, g, b].every(value => Number.isInteger(value) && value >= 0 && value <= 255) || !Number.isFinite(a) || a < 0 || a > 1) {
    throw new Error(t('RGB 通道需为 0～255 的整数，透明度需为 0～1。'));
  }
  const channels = [r, g, b].map(value => value / 255);
  const high = Math.max(...channels);
  const low = Math.min(...channels);
  const delta = high - low;
  const lightness = (high + low) / 2;
  let hue = 0;
  if (delta !== 0) {
    if (high === channels[0]) hue = ((channels[1] - channels[2]) / delta) % 6;
    else if (high === channels[1]) hue = (channels[2] - channels[0]) / delta + 2;
    else hue = (channels[0] - channels[1]) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const h = Number(hue.toFixed(1)) % 360;
  const s = Number((saturation * 100).toFixed(1));
  const l = Number((lightness * 100).toFixed(1));
  const alpha = Number(a.toFixed(4));
  const hex = "#" + [r, g, b].map(value => value.toString(16).padStart(2, "0")).join("").toUpperCase();
  const hex8 = hex + Math.round(a * 255).toString(16).padStart(2, "0").toUpperCase();
  return {
    hex, hex8,
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: `rgba(${r}, ${g}, ${b}, ${alpha})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
    hsla: `hsla(${h}, ${s}%, ${l}%, ${alpha})`,
    hsv: `hsv(${h}, ${Number((high === 0 ? 0 : delta / high * 100).toFixed(1))}%, ${Number((high * 100).toFixed(1))}%)`,
    isWebSafe: a === 1 && [r, g, b].every(value => value % 51 === 0),
  };
}

export function textContrast(color: RgbaColor, background: "white" | "black") {
  // 先把半透明色叠加到明确底色，再用 WCAG 相对亮度计算黑/白字对比度。
  const base = background === "white" ? 255 : 0;
  const channels = [color.r, color.g, color.b].map(value => (value * color.a + base * (1 - color.a)) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return { black: (luminance + 0.05) / 0.05, white: 1.05 / (luminance + 0.05) };
}

const levels = ["00", "33", "66", "99", "CC", "FF"];
export const webSafeColors = levels.flatMap(r => levels.flatMap(g => levels.map(b => `#${r}${g}${b}`)));

// 从传统 216 色中挑选中性色、深色和强调色；不是“所有组合都符合无障碍要求”的保证。
export const recommendedColors = [
  { name: "墨黑", hex: "#000000" }, { name: "深灰", hex: "#333333" }, { name: "中灰", hex: "#666666" },
  { name: "浅灰", hex: "#CCCCCC" }, { name: "纯白", hex: "#FFFFFF" }, { name: "深蓝", hex: "#003366" },
  { name: "海蓝", hex: "#006699" }, { name: "湖蓝", hex: "#3399CC" }, { name: "松绿", hex: "#006633" },
  { name: "青绿", hex: "#009999" }, { name: "浅青", hex: "#CCFFFF" }, { name: "紫色", hex: "#663399" },
  { name: "酒红", hex: "#990033" }, { name: "砖红", hex: "#CC3300" }, { name: "橙色", hex: "#FF9900" },
  { name: "明黄", hex: "#FFCC00" }, { name: "奶油", hex: "#FFFFCC" }, { name: "浅粉", hex: "#FFCCCC" },
];
