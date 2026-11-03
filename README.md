# 大学生婚恋意愿调查系统

一个面向在校大学生的婚恋意愿调查网站，覆盖专科、本科、硕士和博士研究生，包括已婚学生。新版问卷按题目保存选择与补充回答，通过三维档案界面浏览；六维雷达图和匹配百分比已移除，暂以分项回答呈现。

> 本项目基于 [LBEILC/RhineLabUI](https://github.com/LBEILC/RhineLabUI) 二次开发。原项目提供了三维交互终端的视觉与技术基础；本项目已将产品目标由游戏视觉复刻改为婚恋意愿调查与匿名档案系统。

## 功能

- 问卷 v2：4 道基本情况、20 道主体题、2 道选答，包含单选、多选与最多 200 字的开放回答。
- 适用范围：按当前婚姻及伴侣状态跳题；保留最近三个月刚进入或结束关系者的实际经历。
- 多选校验：最多三项、排他选项、住房条件互斥等规则由前后端共用。
- 分项展示：保留原始选择，区分未想清楚、不愿回答、不适用与主动跳过，不计算统一分数。
- 个人档案默认不公开；自愿公开时仅展示昵称与选择题回答，其他补充文字与开放回答不公开。
- 历史兼容：旧版二十题保留原题、原值与版本，不重新解释成新版回答。
- 三维档案界面：问卷档案与既有交互场景联动，远端数据会优先写入档案池。
- 本地优先：保留填写草稿和自己的提交；服务失败明确提示仅保存于本机，并可重试或导出 JSON。

## 使用方式

1. 打开问卷入口，了解用途并确认目前是高校在读学生；昵称可留空。
2. 按当前情况逐题填写，系统会跳过不适用的问题；选答题可跳过，也可选择不愿回答。
3. 核对回答，选择是否公开匿名选择题档案，再提交。
4. 查看自己的分项回答、导出本机副本，或浏览其他已公开档案。

题目全文和适用规则见 [问卷修订稿](docs/大学生婚恋意愿调查问卷_修订建议稿.md)。可用 `npm run export:questionnaire` 从共享题库重新导出文档，避免题目与网页不一致。

## 数据与隐私

服务端仅保存以下内容：

- 随机档案编号与提交时间；
- 问卷版本、题目编号、逐题回答及其状态；
- 自填昵称或系统生成的访客名称；
- 性别、学习阶段、当前伴侣及婚姻状态，和可选的补充文字；
- 是否自愿公开选择题档案。

系统不要求姓名、学号、联系方式、精确位置或账号信息。请勿在昵称或留言中填写自己或他人的个人敏感信息。

新版个人档案默认不进入公共索引；勾选公开后，昵称和选择题回答（包括基本情况）才对外可见。S2 开放回答与所有“其他”补充文字始终不公开。自己的完整提交保留于当前浏览器；旧版已公开记录沿用原有展示范围。后端原始数据文件应保存在网站静态资源目录之外。

## 运行

需要 Node.js 22.12 或更高版本，以及支持 WebGL 2 的现代浏览器。

```sh
npm ci
npm run dev
```

开发服务器默认在 `http://127.0.0.1:5173/` 提供页面。构建生产版本：

```sh
npm run build
npm run preview
```

## 问卷接口

生产接口为：`https://query.linxiksp.cn/api/survey`

前端可以在构建时通过 `VITE_SURVEY_API_URL` 指向其他 HTTPS 接口：

```sh
VITE_SURVEY_API_URL=https://example.com/api/survey npm run build
```

接口约定：

- `GET /api/survey`：返回最多 500 条可公开的档案；不包含新版未公开记录或补充文字。
- `POST /api/survey`：新版接收 `schemaVersion: 2`、`questionnaireVersion`、`label`、按题号组织的 `responses` 和 `publication.profile`。
- 继续兼容旧版 `answers` 数组，但旧数据始终标注为版本 1，不与新版合并计分。
- 前后端共用 [`src/questionnaire.ts`](src/questionnaire.ts)，同时定义题目、选项、跳题与校验规则。

仓库同时包含两种服务端实现：

- [`server/index.mjs`](server/index.mjs)：自托管 Node 服务，适合由 Nginx 等反向代理暴露 HTTPS 接口。
- [`functions/api/survey.ts`](functions/api/survey.ts)：Cloudflare Pages Function，可绑定 D1 数据库。

自托管服务示例：

```sh
npm run build
npm run start:server
```

运行时可用 `PORT`、`SURVEY_DATA_DIR` 与 `SURVEY_ROOT` 分别指定端口、提交数据目录和项目根目录。反向代理应将 `/api/survey` 转发到 Node 服务，并保留 `GET`、`POST` 与 `OPTIONS` 请求。JSON 存储采用顺序写入和原子替换，公共接口的 500 条限制不删除历史数据。D1 部署需先执行新增的 `0003_questionnaire_v2.sql` 迁移。更多说明见 [问卷后端部署](docs/SURVEY-BACKEND.md)。

## 验证

```sh
npm run check:survey
npm run check:content
npm run build
npm run check:survey:browser
```

浏览器检查使用 Playwright Chromium，全部提交写入隔离的临时文件。可通过 `PLAYWRIGHT_CHROMIUM_PATH` 指定本机浏览器可执行文件；截图输出到被 Git 忽略的 `.tools/survey-browser/`。

## 技术构成

- TypeScript、Vite、Three.js
- 浏览器 `localStorage` 本地回退
- Node.js JSON 存储或 Cloudflare Pages Function + D1
- PWA 离线资源与可安装入口

三维场景、开场动效与模型查看器来自原项目的界面体系；问卷、版本化回答、档案展示和后端接口为本项目的改造范围。

## 来源、致谢与许可证

本项目是对 [LBEILC/RhineLabUI](https://github.com/LBEILC/RhineLabUI) 的二次开发。感谢原项目在交互设计、Three.js 场景组织和构建体系上的工作。请同时阅读并遵守仓库中的 [MIT License](LICENSE)，以及原项目和相关资产各自适用的许可证与使用限制。

本项目与《明日方舟》、莱茵生命或其权利方没有官方合作或隶属关系。若将本项目公开部署或继续分发，请自行确认名称、图形、模型、字体、音频与其他资产的授权范围。
