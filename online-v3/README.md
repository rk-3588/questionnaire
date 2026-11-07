# 心动之间 · 大学生婚恋意愿调查

当前线上 V3 的源码目录。问卷面向高校在读学生，按关系及婚姻状态分支；页面使用原生 JavaScript 和 CSS。问卷与管理后台由两个独立 Node.js 进程提供服务，共用服务端数据目录。

- 填写入口：<https://query.linxiksp.cn/>
- 独立后台：<https://admin.query.linxiksp.cn/>（需要配置该域名证书和反向代理）
- 问卷题库与校验：`public/survey-core.mjs`
- 问卷页面：`public/`
- 后台页面：`admin/`
- 后台统计：`server/statistics.mjs`
- 部署与统计口径：[后台统计与独立部署](docs/后台统计与独立部署.md)

## 本地运行

需要 Node.js 22 或以上；运行服务不需要安装第三方依赖。在本目录的两个终端分别运行：

```sh
npm start
npm run start:admin
```

问卷位于 `http://127.0.0.1:8765/`，后台位于 `http://127.0.0.1:8766/`。首次可在本机后台设置管理密码，或在交互终端执行 `npm run setup-admin`。生产环境需预先设置密码，不开放远程初始化。

答卷和密码校验值位于 `data/`，生产环境用 `SURVEY_DATA_DIR` 指向网站静态目录之外。两个进程必须使用同一数据目录；后台只读取答卷，提交仍由问卷进程处理。不要把 `data/`、服务配置、密码或导出的答卷提交到 Git。

## 验证

```sh
npm run check:admin
npm run check:admin:browser
```

接口与统计检查使用 Node 自带测试工具；浏览器检查使用仓库根目录已固定的 `playwright-core`，先在仓库根目录执行 `npm ci`，并提供 Playwright 支持的 Chromium。测试仅在系统临时目录创建模拟答卷与密码，不访问线上答卷。截图写入仓库忽略的 `.tools/admin-browser/`。

## 来源

本仓库基于 [LBEILC/RhineLabUI](https://github.com/LBEILC/RhineLabUI) 改造。`online-v3` 是合作者更新后的“心动之间”问卷实现，2026-11-07 从当时服务器发行包同步；此前版本及原项目资源保留在仓库其他目录。原项目版权与许可说明见仓库根目录。
