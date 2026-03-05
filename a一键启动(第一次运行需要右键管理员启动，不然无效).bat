@echo off
chcp 65001 >nul
title AMLL 字幕编辑工具 - 智能启动控制台
color 0A

echo ========================================================
echo       AMLL TTML Tool 一键启动与环境检测系统
echo ========================================================
echo.

cd /d "%~dp0"

echo [检测] 正在检查 Node.js 核心运行环境...
node -v >nul 2>nul
if %errorlevel% equ 0 goto :CHECK_MODULES

:: ========== 未检测到 Node.js，进入安装引导 ==========
color 0E
echo.
echo ⚠️ [提示] 未检测到 Node.js 运行环境。
echo 您希望如何安装 Node.js？
echo.
echo 1. 自动安装到默认位置 (C:\Program Files\nodejs) [推荐]
echo 2. 手动下载并安装 (适合需要自定义安装路径的用户)
echo.
set /p choice="请输入数字 (1 或 2) 后回车: "

if "%choice%"=="1" goto :AUTO_INSTALL
if "%choice%"=="2" goto :MANUAL_INSTALL
echo 输入无效，请重新运行脚本。
pause
exit

:AUTO_INSTALL
echo.
echo 正在为您自动下载 Node.js 并静默安装，请稍候...

set "NODE_VERSION=v22.14.0"
set "NODE_INSTALLER=node-%NODE_VERSION%-x64.msi"
set "NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/%NODE_INSTALLER%"
set "INSTALL_DIR=%ProgramFiles%\nodejs"

:: 下载安装包
echo 正在从 Node.js 官方源下载安装包...
powershell -Command "try { $wc = New-Object System.Net.WebClient; $wc.DownloadFile('%NODE_URL%', '%TEMP%\%NODE_INSTALLER%'); Write-Host '下载完成' } catch { Write-Host '下载失败' ; exit 1 }"
if %errorlevel% neq 0 (
    echo 下载失败，请检查网络或手动安装。
    goto :MANUAL_INSTALL
)

:: 静默安装
echo 正在静默安装 Node.js 到 %INSTALL_DIR% ...
start /wait msiexec /i "%TEMP%\%NODE_INSTALLER%" /qn INSTALLDIR="%INSTALL_DIR%" ADDLOCAL="ALL"
if %errorlevel% neq 0 (
    echo 自动安装失败，可能缺少权限或系统不兼容。
    goto :MANUAL_INSTALL
)

:: 刷新环境变量
set "PATH=%INSTALL_DIR%;%INSTALL_DIR%\node_modules\npm\bin;%PATH%"

:: 验证安装
node -v >nul 2>nul
if %errorlevel% equ 0 (
    color 0A
    echo ✅ Node.js 已自动安装成功！继续初始化...
    goto :CHECK_MODULES
) else (
    echo 安装后验证失败，请手动安装。
    goto :MANUAL_INSTALL
)

:MANUAL_INSTALL
color 0C
echo.
echo ================ 手动安装指引 ================
echo ❌ 自动安装失败或您选择了手动安装。
echo.
echo 请按照以下步骤手动安装 Node.js：
echo 1. 访问 Node.js 中文官网：https://nodejs.org/zh-cn/
echo 2. 下载 LTS 版本（如 %NODE_VERSION%）的 Windows 安装包 (.msi)
echo 3. 双击运行安装包，可自定义安装路径，一路点击"下一步"完成安装
echo 4. 安装完成后，请关闭此窗口，重新双击本脚本
echo =================================================
pause
exit

:: ========== 后续模块检测与启动 ==========
:CHECK_MODULES
if not exist "node_modules\" goto :INSTALL_DEPS
echo ✅ [检测] 依赖库已完整存在，跳过安装阶段。
goto :START_DEV

:INSTALL_DEPS
color 0E
echo.
echo ⚠️ [首次运行] 检测到缺少必要的运行依赖库...
echo 🌐 [网络优化] 正在自动切换至国内淘宝 NPM 镜像源以加速下载...
call npm config set registry https://registry.npmmirror.com

echo ⏳ [自动安装] 正在疯狂下载依赖项，这大概需要 1 到 3 分钟...
call npm install --ignore-engines

if %errorlevel% neq 0 goto :INSTALL_FAIL
color 0A
echo.
echo ✅ [安装成功] 所有运行环境已就绪！
goto :START_DEV

:INSTALL_FAIL
color 0C
echo.
echo ❌ [安装失败] 依赖库下载失败！
pause
exit

:START_DEV
echo.
echo 🚀 [启动] 正在唤醒字幕编辑工具...
echo ========================================================
echo 💡 提示：底层引擎点火中... 网页即将自动在浏览器中弹出！
echo （如果浏览器未自动打开，请手动访问日志中的 Local 网址）
echo ========================================================
echo.

call npm run dev -- --open

pause