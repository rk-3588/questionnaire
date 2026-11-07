@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo 未找到 Node.js。请先安装 Node.js 22 或以上版本，再重新打开本脚本。
  echo 本脚本不会自动安装任何软件。
  pause
  exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)"
if errorlevel 1 (
  echo 当前 Node.js 版本不符合要求。请使用 Node.js 22 或以上版本。
  pause
  exit /b 1
)
if not exist "server\index.mjs" (
  echo 找不到服务文件。请先完整解压软件包，不要单独移动此启动脚本。
  pause
  exit /b 1
)
echo 心动之间 V3 正在启动，请保持此命令窗口开启。
echo 填写入口：http://127.0.0.1:8765/
echo 管理后台独立启动：在另一个终端运行 npm run start:admin
echo 本机管理入口：http://127.0.0.1:8766/
echo 关闭窗口会停止问卷服务。首次管理密码请在本机管理页设置。
echo.
node server/index.mjs
set "survey_exit=%errorlevel%"
if not "%survey_exit%"=="0" (
  echo.
  echo 服务未能正常启动或已异常停止，请查看上方错误。
  echo 如果端口8765已被占用，请确认是否已经运行了本软件。
  echo 更多设置请阅读“使用说明.txt”和“README-server.txt”。
  pause
)
exit /b %survey_exit%
