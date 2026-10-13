# TangTool v0.1.5 Preview · 日常工具与图片处理升级

## 本版本更新

- **JSON / YAML 互转**：新增独立工具，支持本地转换、校验、UTF-8文件导入、复制和导出。YAML 1.2注释/排版不保留，重复键、循环引用、非字符串键、非有限数和不安全整数给出错误。
- **文本脱敏**：新增手机号、邮箱、中国大陆身份证、银行卡和自定义正则规则。支持规则开关、预览、复制和导出；原文保持不变。基于格式识别，分享前应核对结果。
- **Logo / 图标制作**：新增裁剪、留白、透明/自定义背景设置，支持多尺寸PNG（多张ZIP）及多尺寸ICO。
- **JSONPath查询**：集成到JSON格式化，支持字段、通配符、递归、索引/切片和逻辑条件筛选，可查看规范路径和值；不执行JavaScript脚本或函数调用。
- **正则替换预览**：支持数字和命名捕获组、原文保留与结果复制，沿用Worker超时停止，限制替换结果大小。
- **批量图片转换与压缩**：JPEG、PNG、WebP、BMP、ICO和静态GIF互转，支持保持原尺寸或等比缩小、按格式调节质量、单张另存及ZIP导出。最多50张顺序处理，单张失败不影响其余图片，重名文件自动编号。
- **单张图片拾色**：新增4～16色自动配色与原图像素拾色，支持透明度、像素放大镜、键盘微调及手动拾色记录。图片默认按宽高适应预览，初始高度最高400px；可放大、切换原始大小，长图与工具内容整体滚动。预览只绘制可见区域，避免巨幅画布。
- **Cron格式扩展**：Unix五段、秒级六段、Quartz六/七段、Spring及常用宏，支持特殊日期与年份。可手动选择格式；六段自动识别会提示方言差异。
- **体验修复**：单行及多行末行选区背景更清晰，工具栏文本框/数字框/下拉框统一高度，Web安全色至少显示三整行。工具目录与路由按分组排列，JSON/YAML位于JSON/表格组末尾。
- **双语与官网**：工具总数增至24个，中英文文案、目录与官网同步维护。工具内容仍全部在本机处理，不加入账户、收费或使用统计。

## 安装与限制

- 本版为Preview，未提供系统开发者签名或Apple公证；更新包沿用现有密钥签名，不生成新密钥。v0.1.4可在应用内检查更新，安装前保存工具内容。
- Markdown组件继续为1.0.0，已有组件无需重装；LibreOffice仍需单独安装。旧版本及附件保留。
- 图片不支持HEIC；动画GIF/WebP仅取首帧，元数据不保留。JPEG/BMP使用白底，GIF最多256色且只有透明/不透明两种状态。图片转换输出可能变大。Logo工具不输出macOS ICNS。
- 单图最多20 MiB/2400万像素；批量图片输入及结果各最多200 MiB。YAML/JSONPath、正则和脱敏另有输入/输出上限及Worker超时，详见工具页面和专题文档。
- YAML仅转换JSON兼容数据；JSONPath不包含脚本/函数扩展；Cron不包括AWS EventBridge、Jenkins `H`等专用语法。
- 浏览器验证和CI构建不替代全部原生真机验收。原生文件保存、Windows图标应用、完整升级重启及真实LibreOffice转换仍需目标机复核。

## English

- **Three new tools**: local JSON/YAML conversion with validation and file import/export, configurable text redaction with preview, and a logo/icon maker with multi-size PNG/ICO output.
- **JSONPath** in the JSON formatter: fields, wildcards, recursion, indices, slices and logical filters, with paths and values. JavaScript scripts and function calls are not executed.
- **Regex replacement previews** support numeric and named capture groups, preserve the source, and enforce worker timeouts and output limits.
- **Batch image conversion/compression** handles JPEG, PNG, WebP, BMP, ICO and static GIF, with shared options, sequential processing of up to 50 images, per-file failures and ZIP export with unique filenames.
- **Single-image color picking** adds automatic palettes, exact decoded source-pixel RGBA sampling, magnification, keyboard controls, zoom and tall-image scrolling. The initial preview fits both width and height, up to 400px high; only the visible region is rendered.
- **Cron** adds Unix, seconds, Quartz, Spring and common macros, including special dates and years. Dialects can be selected explicitly; ambiguous six-field detection is indicated.
- **UI improvements** make single/last-line selections visible, unify toolbar input heights, keep at least three complete web-safe color rows and group the tool catalog/routes. The toolkit now contains 24 tools with Simplified Chinese and English interfaces.

This remains an unsigned/unnotarized Preview at the OS level; update packages use the existing signing key. Document Runtime remains at 1.0.0; existing installations need no component reinstall. HEIC, animated image output, ICNS, JSONPath scripts/functions and vendor-specific Cron extensions are not included. Format-based redaction requires review before sharing. Native saving, Windows icon use, end-to-end upgrades and real LibreOffice conversion remain subject to target-machine acceptance.
