import {
  Binary,
  Braces,
  Fingerprint,
  GitCompareArrows,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Link2,
  Clock3,
  Hash,
  Regex,
  ListFilter,
  ShieldCheck,
  CalendarClock,
  QrCode,
  ImageDown,
  TableProperties,
  FileDiff,
  Palette,
} from "lucide-vue-next";
import { toolCatalog, toolGroups } from "./toolCatalog";

const icons = {
  "/color": Palette,
  "/json/format": Braces,
  "/json/diff": GitCompareArrows,
  "/json/excel": FileSpreadsheet,
  "/excel/json": TableProperties,
  "/document/markdown": FileText,
  "/password": KeyRound,
  "/sha": ShieldCheck,
  "/hash-codec": Link2,
  "/md5": Fingerprint,
  "/base64": Binary,
  "/timestamp": Clock3,
  "/uuid": Hash,
  "/cron": CalendarClock,
  "/regex": Regex,
  "/text": ListFilter,
  "/text/diff": FileDiff,
  "/qrcode": QrCode,
  "/image/compress": ImageDown,
};

export const tools = toolCatalog.map(tool => ({ ...tool, icon: icons[tool.path] }));

export const menuGroups = toolGroups.map(group => ({
  ...group,
  items: tools.filter(tool => tool.group === group.id),
}));
