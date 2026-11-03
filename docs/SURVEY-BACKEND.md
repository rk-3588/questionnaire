# 问卷后端与数据版本

新版问卷版本为 `2026-11-03`，`schemaVersion` 为 `2`。生产接口默认是 [query.linxiksp.cn/api/survey](https://query.linxiksp.cn/api/survey)，可在构建时用 `VITE_SURVEY_API_URL` 覆盖。页面、Node 服务和 Pages Function 共用 `src/questionnaire.ts`，无需分别维护题目或选项编号。

## 新版提交

`POST /api/survey` 接收以下字段：

| 字段 | 内容 |
| --- | --- |
| `schemaVersion` | 固定为 `2` |
| `questionnaireVersion` | 当前为 `2026-11-03`，不接受未知版本 |
| `id` | 浏览器生成的 `Q-UUID`；同一份提交重试使用相同编号 |
| `label` | 可选昵称，最多 24 字 |
| `responses` | 以 B1—B4、Q1—Q20、S1—S2 为键的回答对象 |
| `publication.profile` | 是否自愿公开选择题档案，默认 `false` |

响应中的 `id`、`createdAt` 和完整回答供本人在本机保存。相同编号、相同内容的重试不会新增记录；同编号但内容不同返回 `409`，不能覆盖已有提交。

每道题保存 `status` 与稳定选项 ID，不使用选项的位置或显示字母作为数值。以下仅示意部分字段，并非完整可提交的问卷：

```json
{
  "Q1": { "status": "answered", "value": "willing" },
  "Q2": { "status": "unsure", "value": "unsure" },
  "Q5": { "status": "answered", "value": ["time", "cost"] },
  "Q4": { "status": "not_applicable", "reason": "current_partner" },
  "S1": { "status": "skipped" },
  "S2": { "status": "answered", "value": "开放回答，最多 200 字" }
}
```

状态包括 `answered`、`skipped`、`not_applicable`、`unsure`、`declined`。自动跳题通过 `reason` 记录依据；显式选择不适用则保留相应选项 ID。未选择的主体题不能提交，允许选择“不愿回答”。多选题校验最大项数、排他选项与住房条件互斥。B2 选非在校学生时不能提交。

## 公共索引与本人副本

`GET /api/survey` 返回最多 500 条可公开记录。新版未公开记录完全不进入此接口；公开记录中的 S2 替换为 `skipped / not_public`，所有 `other` 补充文字移除，`message` 置空。公共投影不会改写原始存储。

本人完整记录仅通过 POST 响应保存在当前浏览器，不因为打开公共索引而把其他访客当作本人。浏览器缓存与草稿采用单独的 v2 存储键，网络加载不会抹掉自己的未同步记录。提交失败显示仅保存在本机，并允许重试和下载 JSON；不会宣称已经提交成功。

旧版二十题缺少 `schemaVersion` 时识别为版本 1，缺少留言和性别时可正常读取。继续接受旧版 `answers` 提交，以兼容尚未更新的页面。旧版已公开数据保持原公开范围，不将旧题编号重新解释为新版题目。

## 自托管 Node 服务

需要 Node.js 22.12 或更高版本。启动命令已包含 TypeScript 类型剥离参数，用于读取共享题库：

```sh
npm run build
npm run start:server
```

- `PORT`：默认 `3100`。
- `SURVEY_ROOT`：项目根目录，静态文件来自其 `dist/`。
- `SURVEY_DATA_DIR`：数据目录，默认项目下的 `data/`，文件名 `submissions.json`。生产环境建议使用静态目录之外的独立持久目录。

Node 服务在同一 JSON 文件中保存带版本的新旧记录，不需要重写历史数据。写入经过队列串行化，以临时文件加原子重命名更新；公共接口的 500 条限制仅作用于读取，不截断数据文件。文件损坏或不可读时返回 `503` 并保留文件，不会以空数组覆盖历史记录。

反向代理将 HTTPS 的 `/api/survey` 转发到 Node 服务，保留 `GET`、`POST`、`OPTIONS` 和 JSON 请求体。API 提供匿名跨域响应；接口不应被 CDN 缓存。

如果希望本地页面也使用本机后端，构建前配置 `VITE_SURVEY_API_URL=/api/survey`，随后通过 Node 服务端口访问 `dist`。

## Cloudflare Pages Function + D1

Pages Function 为 `functions/api/survey.ts`，数据库绑定名为 `SURVEY_DB`。

首次部署使用 `functions/schema.sql` 创建两张表。已有版本 1 数据库应先执行 `functions/migrations/0003_questionnaire_v2.sql`，再发布 Function。新版独立保存于 `survey_submissions_v2` 的 `payload_json`，原来的 `survey_submissions` 不改名、不清空。

已有旧表需包含 `message` 和 `gender` 列；仅有早期四列的安装需先补齐这两列。仓库的 `0002_add_gender.sql` 只供尚未增加该列的旧部署使用，不要在已有该列时重复执行。

未绑定数据库或迁移未完成时接口返回 `503`，前端保留本机记录和已缓存索引。

## 检查

`npm run check:survey` 校验题目、跳题、恶意或不完整输入、历史兼容、200 字开放题、公开字段投影、并发与重复提交，并用内存 SQLite 执行 D1 查询与迁移。

`npm run check:survey:browser` 在构建后的实际页面中走单身与已婚学生流程，核对 SYSTEM 详情、手机布局及刷新后身份恢复。桌面数据绑定检查使用显式的 `?review=1&ui-only=1&scene=archive` 二维检查入口；手机流程使用正常入口。截图不评估三维背景、材质或镜头，也不代表真实 iPhone 测试。所有测试记录仅写入临时目录，不提交到生产接口。
