# Cron 格式（工作区未发布）

工具只解释表达式和预览时间，不创建任务。起点要求带时区偏移的ISO时间；结果严格晚于起点，最多显示10次。

| 格式 | 字段 | 星期 | 日期与星期同时受限 |
| --- | --- | --- | --- |
| Unix / Linux | 分 时 日 月 星期 | 0/7周日 | 或 |
| 秒级 | 秒 分 时 日 月 星期 | 0/7周日 | 或 |
| Quartz | 秒 分 时 日 月 星期 [年] | 1周日、7周六 | 必须且只能一个字段是 `?` |
| Spring | 秒 分 时 日 月 星期 | 0/7周日 | 且 |

自动识别：五段为Unix，七段或单独的`?`为Quartz，其他六段按秒级或含特殊日期的Spring处理。六段有方言歧义时会提示，用户应手动核对格式，尤其是数字星期与日期组合。

支持数字、月份/星期英文缩写、`*`、列表、范围、步长；Quartz/Spring另支持`?`、`L`、`L-n`、`nW`、`LW`、`L-nW`、`dL`、`d#n`。Quartz也支持跨边界范围（例如小时`22-2`）。特殊日期必须符合所选格式的组合规则，不能以说明库接受字符串替代规则校验。

年份输入支持1970～9999。没有固定年份时向后搜索一个400年公历周期；明确指定年份时按指定范围搜索。过期、无匹配或不足10次的规则如实显示已有结果。先按月确定有效日期，再由原有cron-parser引擎计算时区/夏令时，不逐秒扫描特殊日期。

支持宏：`@yearly` / `@annually`、`@monthly`、`@weekly`、`@daily` / `@midnight`、`@hourly`、`@minutely`、`@secondly`、`@weekdays`、`@weekends`。`@reboot`仅说明启动触发，不伪造未来执行时间。

本轮不包含AWS EventBridge、Jenkins的`H`或Go的`@every`等专用语法，也不解析crontab文件中的用户名、命令和环境变量。

语义依据：[Quartz说明](https://www.quartz-scheduler.org/documentation/quartz-2.2.2/tutorials/crontrigger)、[Spring CronExpression](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/support/CronExpression.html)。自然语言说明由cronstrue生成，无法说明的合法组合显示原规则；时间计算使用独立校验后的字段。

2026-10-13临时验证覆盖：标准五段/秒级、Quartz与Spring星期差异、月末和偏移、最近工作日、月初周末边界、最后/第n个星期、Spring特殊日期列表、日期与星期或/且、年份/过期/闰年/无解规则、跨边界范围、宏、时区/夏令时及非法规则。验证后删除临时测试，保留原测试基线。
