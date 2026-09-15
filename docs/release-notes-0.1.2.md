# TangTool v0.1.2 · 图标修复与更新提醒

- Windows 启动时显式设置窗口小图标和任务栏大图标，均从主程序内置 ICO 资源加载 TangTool B 标志，并按系统图标尺寸选择对应图像。
- Windows 安装器、卸载器和主程序统一使用同一份品牌 ICO。
- 保留轻量安装包和可选文档组件方案。已有文档组件 1.0.0 无需重新安装。
- 新增更新提醒：默认启动及使用期间每6小时查询 GitHub 公开版本；发现新版后侧栏“版本与升级”显示标记，版本页可手动检查、查看说明并前往对应版本下载。
- 设置中可关闭自动检查，也可关闭预发布提醒。当前预发布渠道默认开启；检查不上传工具内容、不自动安装、不关闭正在使用的工具。

旧版 v0.1.1 没有更新检查能力，需要先手动升级到本版，之后才能收到后续版本提醒。

请退出旧版后安装更新。若此前固定到任务栏的快捷方式仍显示旧图标，可取消固定，从开始菜单打开新版后重新固定；不需要清除应用设置或系统的全部图标缓存。

仍为未签名／未公证预发布版。包内资源和构建检查不能替代用户 Windows 桌面上实际任务栏显示的复核。

## English

- Windows now explicitly sets both the small window icon and the large taskbar icon from the embedded TangTool B icon resource, using the system's preferred icon sizes.
- Windows installers, uninstallers and the app share the same branded ICO file.
- Lightweight installers and the optional document component remain available. Existing Document Runtime 1.0.0 installations do not need to be replaced.
- Update reminders check public GitHub releases at startup and every six hours during use. A sidebar badge highlights a newer version; the version page supports manual checks, release notes and downloads.
- Automatic checks and preview releases can be configured in Settings. Preview updates are enabled by default for this preview distribution. Checks do not upload tool contents, install updates or close active tools.

Version 0.1.1 has no update checker. Users must manually install this version once to receive notifications about future releases.

Quit the previous version before updating. If an existing pinned shortcut still displays an old cached icon, unpin it, launch the updated app from the Start menu, and pin it again. App preferences and the system-wide icon cache do not need to be cleared.

This remains a preview without verified developer signing or Apple notarization. Build and resource checks do not replace checking the actual taskbar on the target Windows desktop.
