import {createRouter, createWebHashHistory} from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // JSON / 表格
    {
      path: "/json/format",
      name: "json-format",
      component: () => import("../views/JsonFormatView.vue"),
      meta: {
        title: "JSON 格式化",
        group: "JSON"
      }
    },
    {
      path: "/json/diff",
      name: "json-diff",
      component: () => import("../views/JsonDiffView.vue"),
      meta: {
        title: "JSON 对比",
        group: "JSON"
      }
    },
    {
      path: "/json/excel",
      name: "json-excel",
      component: () => import("../views/JsonExcelView.vue"),
      meta: {
        title: "JSON 转 Excel",
        group: "JSON"
      }
    },
    {path: "/excel/json", name: "excel-json", component: () => import("../views/ExcelJsonView.vue"), meta: {title: "Excel / CSV 转 JSON", group: "JSON / 表格"}},
    {path: "/json/yaml", name: "json-yaml", component: () => import("../views/JsonYamlView.vue"), meta: {title: "JSON / YAML 互转", group: "JSON / 表格"}},

    // 文档
    {
      path: "/document/markdown",
      name: "document-markdown",
      component: () => import("../views/DocumentMarkdownView.vue"),
      meta: {
        title: "文档转 Markdown",
        group: "文档"
      }
    },
    {
      path: "/document/word-pdf",
      name: "word-pdf",
      component: () => import("../views/DocumentConvertView.vue"),
      props: {kind: "word"},
      meta: {title: "Word / PDF 互转", group: "文档"}
    },
    {
      path: "/document/pdf-images",
      name: "pdf-images",
      component: () => import("../views/DocumentConvertView.vue"),
      props: {kind: "image"},
      meta: {title: "PDF 转图片", group: "文档"}
    },

    // 文本
    {path: "/text/redact", name: "text-redact", component: () => import("../views/TextRedactionView.vue"), meta: {title: "文本脱敏", group: "文本"}},
    {path: "/text", name: "text", component: () => import("../views/TextToolsView.vue"), meta: {title: "文本整理", group: "文本"}},
    {path: "/text/diff", name: "text-diff", component: () => import("../views/TextDiffView.vue"), meta: {title: "文本对比", group: "文本"}},

    // 安全
    {
      path: "/password",
      name: "password",
      component: () => import("../views/PasswordGeneratorView.vue"),
      meta: {
        title: "密码生成器",
        group: "安全"
      }
    },
    {path: "/sha", name: "sha", component: () => import("../views/ShaView.vue"), meta: {title: "SHA 摘要", group: "安全"}},
    {
      path: "/hash-codec",
      name: "hash-codec",
      component: () => import("../views/UrlCodecView.vue"),
      meta: {
        title: "URL 编码",
        group: "安全"
      }
    },
    {path: "/md5", name: "md5", component: () => import("../views/Md5View.vue"), meta: {title: "MD5", group: "安全"}},
    {path: "/base64", name: "base64", component: () => import("../views/Base64View.vue"), meta: {title: "Base64", group: "安全"}},

    // 开发辅助
    {path: "/timestamp", name: "timestamp", component: () => import("../views/TimestampView.vue"), meta: {title: "时间戳 / 时区", group: "开发辅助"}},
    {path: "/uuid", name: "uuid", component: () => import("../views/UuidView.vue"), meta: {title: "UUID 生成", group: "开发辅助"}},
    {path: "/cron", name: "cron", component: () => import("../views/CronView.vue"), meta: {title: "Cron 解析", group: "开发辅助"}},
    {path: "/regex", name: "regex", component: () => import("../views/RegexView.vue"), meta: {title: "正则调试", group: "开发辅助"}},

    // 图像
    {path: "/color", name: "color", component: () => import("../views/ColorPickerView.vue"), meta: {title: "颜色选择器", group: "图像"}},
    {path: "/qrcode", name: "qrcode", component: () => import("../views/QrCodeView.vue"), meta: {title: "二维码生成", group: "图像"}},
    {path: "/image/compress", name: "image-compress", component: () => import("../views/ImageCompressView.vue"), meta: {title: "图片转换与压缩", group: "图像"}},
    {path: "/image/logo", name: "image-logo", component: () => import("../views/LogoMakerView.vue"), meta: {title: "Logo / 图标制作", group: "图像"}},

    // 应用
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
      meta: {title: "首页", group: "应用"}
    },
    {path: "/settings", name: "settings", component: () => import("../views/SettingsView.vue"), meta: {title: "用户设置", group: "应用"}},
    {path: "/releases", name: "releases", component: () => import("../views/ReleasesView.vue"), meta: {title: "版本与升级说明", group: "应用"}}
  ]
});

export default router;
