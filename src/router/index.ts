import { createRouter, createWebHashHistory } from "vue-router";
import ToolPlaceholderView from "../views/ToolPlaceholderView.vue";

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
      component: ToolPlaceholderView,
      meta: {
        title: "JSON 格式化",
        group: "JSON",
      },
    },
    {
      path: "/json/diff",
      name: "json-diff",
      component: ToolPlaceholderView,
      meta: {
        title: "JSON 对比",
        group: "JSON",
      },
    },
    {
      path: "/json/excel",
      name: "json-excel",
      component: ToolPlaceholderView,
      meta: {
        title: "JSON 转 Excel",
        group: "JSON",
      },
    },
    {
      path: "/document/markdown",
      name: "document-markdown",
      component: ToolPlaceholderView,
      meta: {
        title: "文档转 Markdown",
        group: "文档",
      },
    },
    {
      path: "/password",
      name: "password",
      component: ToolPlaceholderView,
      meta: {
        title: "密码生成器",
        group: "安全",
      },
    },
    {
      path: "/hash-codec",
      name: "hash-codec",
      component: ToolPlaceholderView,
      meta: {
        title: "MD5 / Base64",
        group: "编码",
      },
    },
  ],
});

export default router;
