# 中英文界面维护

桌面应用和官网支持 `zh-CN`、`en`，默认简体中文，各自记住选择。切换语言不修改路由 key、不重建 KeepAlive 工具，也不自动翻译用户输入、文件名、JSON key/value 或转换后的文档。

## 消息与参数

- `src/i18n/core.ts` 提供纯文本翻译和参数替换，供桌面、Worker、官网共用，不调用在线翻译服务，不编译 HTML/模板代码。
- 普通文案使用中文原文作为可读标识，例如 `t('复制')`；英文在 `src/i18n/en.json` 中维护。
- 同字异义用语义标识，例如 `json.minify`、`color.apply`，在 `zh.json` / `en.json` 分别提供对应文案。
- 动态值通过明确参数传入，例如 `t('已导入 {p0}', { p0: filename })`。英文中的参数集合必须与原文一致；路径、文件名和用户数据参数原样插入。
- 组件在渲染或 computed 中翻译固定选项，避免模块初始化时翻译一次后无法响应语言切换。对话框过滤器同样使用 computed。

## 语言状态与后台

- `src/i18n/index.ts` 的 Vue ref 是桌面语言来源，偏好 store 把 `language` 保存到原有 `tangtool.preferences.v1`，旧设置缺少该字段时使用中文，不清空其他偏好。
- 页面 lang 属性、CodeMirror 辅助标签/提示及日期显示随语言更新，编辑器通过 Compartment 调整配置，不替换文档内容。
- Worker 请求携带当前语言，Worker 独立配置语言来源。Cron 一次返回中英文说明，切换语言时复用已计算的时间；表格字段调整说明和正则未匹配标记保留结构化数据，在界面翻译。
- Rust 错误使用 `AppError { key, parameters, cause }`。`src/utils/invoke.ts` 在 IPC 边界翻译为原有调用方可处理的字符串。系统/第三方错误详情保留原文，消息和详情按纯文本展示。

## 官网与截图

- `src/data/toolCatalog.ts` 是桌面与官网共用的工具目录；图标依赖单独保留在桌面的 `tools.ts`，官网构建时注入完整目录，因此没有 JavaScript 时仍能阅读功能。
- 官网用 `tangtool.website.language.v1` 记住选择，也支持 `?lang=en` / `?lang=zh-CN` 链接。语言切换复用已获取的 Release 数据，不重复请求 API。
- 固定文案使用 `data-i18n`，辅助标签和图片说明使用 `data-i18n-aria`、`data-i18n-alt`；翻译只写 textContent/属性，远端 Release 文字不作为 HTML 注入。
- `website/screenshots/` 包含首页、JSON 格式化/对比/转 Excel、Cron、颜色选择器六组中英文截图。它们来自生产前端的实际渲染，使用虚构演示数据；不是绘制的示意界面，也不能代替原生文件能力验收。
- 截图均为 1280×720，无损 WebP，保持原始像素比例；禁止旋转、透视或拉伸。更换截图后同时检查中英文版本、缩略图、大图和手机布局。

## 验证

运行前端/官网构建、现有测试及 Rust 检查。还需检查英文页面无意外中文文案、参数未被翻译、切换语言后输入和结果保留、语言刷新后记忆，以及后台错误的本地化。按协作约定，新增验证脚本和样本仅临时使用，完成后删除，不新增永久单元测试文件。
