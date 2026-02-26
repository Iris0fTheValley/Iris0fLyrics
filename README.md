# Iris0fLyrics
All-in-one TTML lyrics editor with intuitive color markup, asset library, and AI-assisted After Effects export for highly customizable per-character colored karaoke videos. 一站式TTML歌词编辑工具，支持直观的颜色标记、色彩资产库，以及AI辅助的After Effects导出，轻松实现高自定义性的逐字上色特效字幕视频。
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Iris0fLyrics —— 一站式逐字特效字幕制作工具
人性化 · 高自定义 · 低学习成本

一个集歌词打轴、逐字着色、AE 脚本生成、AI 辅助设计于一体的专业歌词字幕编辑器。

感谢原项目团队，本项目基于 amll-ttml-tool 扩展而来。

------------
核心目标与理念
-
核心目标：打造一个 “一站式、简单人性化、低学习成本、高自定义性” 的逐字特效字幕视频制作工具。

核心理念：让用户能够轻松完成从歌词打轴、逐字着色、特效模板管理，到最终生成 After Effects 可执行的 JSX 脚本的全流程，并辅以 AI 辅助设计能力，降低专业视频制作的门槛。

------------------------
使用案例
-
以下是使用 Iris0fLyrics 制作的特效字幕翻唱视频示例：
<img width="1313" height="627" alt="4b644a51-b983-4c82-a42e-0fd874232a78" src="https://github.com/user-attachments/assets/f0f5c9d1-961b-4259-a8cd-3eb29b07b962" />

- https://www.bilibili.com/video/BV1HucHzSETM/?share_source=copy_web&vd_source=13adc6b31e23fbedf766aac8c11219a5 —— （全程没手工操作过ae的特效，仅仅用ae进行渲染出视频，其他字幕工作均由此工具完成,一站式不用学ae，爽！）

欢迎分享您的作品！如果您也想在此展示，请提交 Issue 或 PR。

--------------------------------------
主要功能

基础编辑功能（源自原版）
-
基本输入、编辑、打轴功能

读取保存 TTML 格式歌词

配置歌词行行为（背景歌词、对唱歌词等）

配置歌词文件元数据（名称、作者、网易云音乐 ID 等）

拆分/组合/移动单词

LRC/ESLyric/YRC/QRC/Lyricify Syllable 等歌词文件格式的导入以及部分格式的导出

支持带有特殊标识符的纯文本导入歌词

可配置的快捷键

------------------
新增功能
-
颜色语法：{文本#RRGGBB} 实现单字/单词独立着色。

实时预览着色：通过 useLyricColorizer 轮询 DOM，将颜色标记渲染为实际颜色（支持主歌词和翻译行）。(注：这功能实现方法很不优雅，维护性不强)

色彩资产库：多文件夹，每文件夹 100 个颜色槽，数据持久化至 localStorage。

悬浮调色工具栏：可拖拽，集成分号插入、颜色拾取器、HEX 输入、预设颜色槽、资产库面板，支持横向/竖向布局。

<img width="2016" height="1422" alt="02da1ee5-804e-41f0-9292-0dcef521bb21" src="https://github.com/user-attachments/assets/63c34144-6d3c-45d2-ba80-9f52e9859e25" />

<img width="2233" height="1584" alt="5d9e4d44-abad-4c4b-8757-413653f1dd77" src="https://github.com/user-attachments/assets/af1e630a-2a76-49fa-8a58-a92194494fb4" />

-----------------------------------------
AE 导出与特效模板系统
-
模板规范
每个模板为包含 buildAMLLScript(data, options) 函数的 JS 文件，接收经过前端预处理的 JSON 数据（包含主歌词、翻译的单词级时间、颜色、宽度等），返回 AE 可执行的 JSX 字符串。

模板管理
内置两个模板（默认满血版、性能超频版）

支持用户通过拖拽 .js 文件导入自定义模板

模板持久化至 localStorage，导入时自动校验是否包含 buildAMLLScript

支持模板的删除与导出

模板静态分析：通过正则表达式提取当前选中模板的行间距、存活时间、视野阈值，并检测是否为标准架构（cur_x 和 relX），非标准模板显示橙色警告，预览块以虚线呈现。

导出引擎
从 lyricLinesAtom 获取歌词数据，解析颜色标记，计算每个单词的像素宽度（估算），构造 data 对象。

通过 new Function 动态执行模板代码，传入 data 和 options（含 enableEffects 开关），获取 JSX 字符串。

触发浏览器下载 .jsx 文件。

特效开关（纯净模式）
允许用户选择是否在生成的 JSX 中包含高斯模糊、全局发光等内置特效，方便老手二次加工。



<img width="2545" height="1896" alt="51784d99-92fd-4831-8530-f1fe50f1e24d" src="https://github.com/user-attachments/assets/a3fd3fe8-82ff-4710-92ba-38325b8ab83b" />

-
关于颜色标记的 TTML 兼容性说明
项目引入的颜色标记语法（如 {文本#颜色}）并非标准 TTML 规范的一部分。在导出为 .ttml 文件时，这些标记会被原样保留为普通文本，而不会转换为标准样式属性。这意味着，在其他标准 TTML 播放器中打开导出的文件，颜色标记将显示为普通文字，不会产生颜色效果。

此功能的设计初衷是：

在 Iris0fLyrics 的预览界面中提供所见即所得的着色体验。

配合独立的 AE 脚本生成器，将颜色信息传递给 After Effects，实现视频字幕的特效渲染。

因此，它主要服务于“从编辑到视频制作”的扩展工作流，而非增强 TTML 文件本身的互操作性。所有功能均通过特性开关控制，默认关闭，不影响标准 TTML 编辑和导出。未来若社区有需求，可以考虑扩展导出选项，将颜色标记转换为标准 TTML 样式属性，但这需要进一步讨论和实现。

视觉效果完全由渲染端决定。Iris0fLyrics 负责处理歌词数据——时间轴、单词拆分、以及颜色标记。它输出的 .ttml 文件本质上是一个结构化的数据源，其中颜色标记仅作为元数据存在，不强制任何播放器如何渲染它。

由于模板是完全独立的，用户可以根据自己的需求轻松修改模板，以适配不同的视频风格，或添加新的特效（如粒子、描边、变形等）。这比将特效硬编码到播放器中要灵活得多。

----------------------------------------------
AI 辅助设计与参数化
-
⚠️ 目前功能提示词生成效果有限，且尚未支持翻译行的动效显示预览。

⚠️ 重要提示：目前的 AI 辅助生成提示词框架几乎不能用。真要用的话，别管生成的提示词，把上面的模板导出后丢给 AI 让它对着改，可能更有效。

参数控制台：提供滑块与输入框，实时调节行间距、图层存活时间、视野渲染阈值、基础入场动效（直接出现/向上浮出/缩放弹出）、预览行数等。

灵感胶囊：预设多种动效关键词（物理抛物线、3D环形缠绕、波浪浮动、终端打字机），点击即可注入自然语言描述框。

自然语言输入：用户可用自由语言描述创意动效（如“让字幕像被抛起的硬币一样从屏幕底部弹出”），输入时自动关闭内置特效开关。

动态提示词工厂：结构化提示词，将参数值、用户描述、安全红线（ES3语法、转义、生命周期裁剪、特效权限）组装成最终提示词，实时在右侧文本框中展示，并支持一键复制。

抽象微缩预览引擎：在网页端用 CSS 模拟 AE 的滚动、景深衰减、时间裁剪，实时反映参数调整对空间布局的影响（灰色块代表歌词行，高亮块表示当前行，支持特效开关下的模糊/发光模拟）。

<img width="2513" height="1832" alt="1c75f62e-a2e0-4c3b-9eb2-6dabf32e85af" src="https://github.com/user-attachments/assets/93dbddb3-7e62-4cab-8eaf-15cf9d6ae5b0" />
-------------------------------
安装与依赖
本项目仅可使用 PNPM。其次你可以在文件夹内运行提供的 【a开始运行.bat】 脚本来一键安装 node 库依赖，会自动切换镜像源。

本地开发运行（推荐）
bash
# 1. 克隆仓库
git clone https://github.com/your-username/Iris0fLyrics.git
cd Iris0fLyrics

# 2. 安装依赖（仅支持 PNPM）
pnpm install

# 3. 启动开发服务器（网页版）
pnpm dev

# 4. 构建网页版（输出到 dist/）
pnpm build
-------------------
🤝 贡献指南
欢迎提交 Issue 和 PR！如果您想添加新的语言翻译，请参考以下文件：

翻译文件位置：./locales/[lang]/translation.json

参考中文模板：./locales/zh-CN/translation.json

翻译索引：./src/i18n/index.ts
