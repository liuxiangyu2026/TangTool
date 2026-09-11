import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/json/format",
    },
    {
      path: "/json/format",
      name: "json-format",
      component: () => import("../views/JsonFormatView.vue"),
      meta: {
        title: "JSON 格式化",
        group: "JSON",
      },
    },
    {
      path: "/json/diff",
      name: "json-diff",
      component: () => import("../views/JsonDiffView.vue"),
      meta: {
        title: "JSON 对比",
        group: "JSON",
      },
    },
    {
      path: "/json/excel",
      name: "json-excel",
      component: () => import("../views/JsonExcelView.vue"),
      meta: {
        title: "JSON 转 Excel",
        group: "JSON",
      },
    },
    {
      path: "/document/markdown",
      name: "document-markdown",
      component: () => import("../views/DocumentMarkdownView.vue"),
      meta: {
        title: "文档转 Markdown",
        group: "文档",
      },
    },
    {
      path: "/password",
      name: "password",
      component: () => import("../views/PasswordGeneratorView.vue"),
      meta: {
        title: "密码生成器",
        group: "安全",
      },
    },
    {
      path: "/hash-codec",
      name: "hash-codec",
      component: () => import("../views/UrlCodecView.vue"),
      meta: {
        title: "URL 编码",
        group: "编码",
      },
    },
    { path: "/md5", name: "md5", component: () => import("../views/Md5View.vue"), meta: { title: "MD5", group: "编码" } },
    { path: "/base64", name: "base64", component: () => import("../views/Base64View.vue"), meta: { title: "Base64", group: "编码" } },
  ],
});

export default router;
