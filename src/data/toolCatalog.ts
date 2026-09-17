// 桌面与官网共用工具元数据；文案在显示时翻译，路径和分组标识保持稳定。
export const toolCatalog = [
  {
    "label": "颜色选择器",
    "path": "/color",
    "group": "image",
    "description": "色卡选色、RGBA 等编码与 Web 安全色参考。",
    "keywords": "color colour palette rgba hex hsl yanse 颜色 色卡 取色 安全色"
  },
  {
    "label": "JSON 格式化",
    "path": "/json/format",
    "group": "json",
    "description": "格式化、压缩、语法校验和错误定位。",
    "keywords": "json geshihua format minify 压缩 校验"
  },
  {
    "label": "JSON 对比",
    "path": "/json/diff",
    "group": "json",
    "description": "结构化对比、差异定位和 key 对齐。",
    "keywords": "json diff duibi 差异 比较"
  },
  {
    "label": "JSON 转 Excel",
    "path": "/json/excel",
    "group": "json",
    "description": "多 Sheet 导出与树形数据递归平铺。",
    "keywords": "json excel xlsx sheet 表格 递归 导出"
  },
  {
    "label": "Excel / CSV 转 JSON",
    "path": "/excel/json",
    "group": "json",
    "description": "选择工作表，把表格数据转换为 JSON。",
    "keywords": "excel csv xlsx xls json biaoge 表格 导入 反向转换"
  },
  {
    "label": "文档转 Markdown",
    "path": "/document/markdown",
    "group": "document",
    "description": "批量 DOCX / PDF 转 Markdown 并预览。",
    "keywords": "word docx pdf md markdown wendang 文档"
  },
  {
    "label": "密码生成器",
    "path": "/password",
    "group": "security",
    "description": "安全随机源，按规则批量生成密码。",
    "keywords": "password mima 密码 安全 随机"
  },
  {
    "label": "SHA 摘要",
    "path": "/sha",
    "group": "security",
    "description": "SHA-256 / SHA-512 文本摘要。",
    "keywords": "sha hash 哈希 摘要"
  },
  {
    "label": "URL 编码",
    "path": "/hash-codec",
    "group": "security",
    "description": "URL 参数的编码与解码。",
    "keywords": "url encode decode bianma 编码 解码"
  },
  {
    "label": "MD5",
    "path": "/md5",
    "group": "security",
    "description": "文本和文件 MD5 摘要。",
    "keywords": "md5 hash 哈希 文件 摘要"
  },
  {
    "label": "Base64",
    "path": "/base64",
    "group": "security",
    "description": "文本及文件 Base64 编解码。",
    "keywords": "base64 encode decode 编码 解码"
  },
  {
    "label": "时间戳 / 时区",
    "path": "/timestamp",
    "group": "developer",
    "description": "秒、毫秒、ISO 日期与时区显示。",
    "keywords": "timestamp date time shijian 时间戳 日期 时区"
  },
  {
    "label": "UUID 生成",
    "path": "/uuid",
    "group": "developer",
    "description": "批量 UUID v4，支持大小写和连字符。",
    "keywords": "uuid guid id shengcheng 标识 生成"
  },
  {
    "label": "Cron 解析",
    "path": "/cron",
    "group": "developer",
    "description": "说明执行规则，预览未来 10 次时间。",
    "keywords": "cron crontab ding shi 定时 计划 表达式"
  },
  {
    "label": "正则调试",
    "path": "/regex",
    "group": "developer",
    "description": "匹配位置、捕获组和超时保护。",
    "keywords": "regex regexp zhengze 正则 匹配 调试"
  },
  {
    "label": "文本整理",
    "path": "/text",
    "group": "text",
    "description": "实时去重排序、分隔符拼接与首尾引号处理。",
    "keywords": "text wenben 文本 去重 排序 空白 excel column delimiter join 列 拼接 分隔 分割 引号"
  },
  {
    "label": "文本对比",
    "path": "/text/diff",
    "group": "text",
    "description": "逐行差异高亮，可忽略空白。",
    "keywords": "text diff compare wenben duibi 文本 对比 差异"
  },
  {
    "label": "二维码生成",
    "path": "/qrcode",
    "group": "image",
    "description": "本地生成 QR Code，保存 PNG / SVG。",
    "keywords": "qr qrcode erweima 二维码 图片"
  },
  {
    "label": "图片压缩",
    "path": "/image/compress",
    "group": "image",
    "description": "调整质量和尺寸，另存 JPEG / WebP。",
    "keywords": "image compress tupian yasuo jpeg png webp 图片 压缩 缩放"
  }
] as const;

export const toolGroups = [
  {
    "id": "json",
    "label": "JSON / 表格"
  },
  {
    "id": "document",
    "label": "文档"
  },
  {
    "id": "text",
    "label": "文本"
  },
  {
    "id": "security",
    "label": "安全"
  },
  {
    "id": "developer",
    "label": "开发辅助"
  },
  {
    "id": "image",
    "label": "图像"
  }
] as const;
