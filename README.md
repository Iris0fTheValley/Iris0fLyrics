# Iris0fLyrics
All-in-one TTML lyrics editor with intuitive color markup, asset library, and AI-assisted After Effects export for highly customizable per-character colored karaoke videos. 一站式TTML歌词编辑工具，支持直观的颜色标记、色彩资产库，以及AI辅助的After Effects导出，轻松实现高自定义性的逐字上色特效字幕视频。
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Iris0fLyrics —— 一站式逐字特效字幕制作工具
人性化 · 高自定义 · 低学习成本

一个集歌词打轴、逐字着色、AE 脚本生成、AI 辅助设计于一体的专业歌词字幕编辑器。

感谢原项目团队，本项目基于 amll-ttml-tool 扩展而来。

------------
## 核心目标与理念
核心目标：打造一个 “一站式、简单人性化、低学习成本、高自定义性” 的逐字特效字幕视频制作工具。

核心理念：让用户能够轻松完成从歌词打轴、逐字着色、特效模板管理，到最终生成 After Effects 可执行的 JSX 脚本的全流程，并辅以 AI 辅助设计能力，降低专业视频制作的门槛。

------------------------
## 使用案例
以下是使用 Iris0fLyrics 制作的特效字幕翻唱视频示例：
<img width="1313" height="627" alt="4b644a51-b983-4c82-a42e-0fd874232a78" src="https://github.com/user-attachments/assets/f0f5c9d1-961b-4259-a8cd-3eb29b07b962" />

- https://www.bilibili.com/video/BV1HucHzSETM/?share_source=copy_web&vd_source=13adc6b31e23fbedf766aac8c11219a5 —— （全程没手工操作过ae的特效，仅仅用ae进行渲染出视频，其他字幕工作均由此工具完成,一站式不用学ae，爽！）

欢迎分享您的作品！如果您也想在此展示，请提交 Issue 或 PR。

--------------------------------------
## 主要功能

### 基础编辑功能（源自原版）
基本输入、编辑、打轴功能

读取保存 TTML 格式歌词

配置歌词行行为（背景歌词、对唱歌词等）

配置歌词文件元数据（名称、作者、网易云音乐 ID 等）

拆分/组合/移动单词

LRC/ESLyric/YRC/QRC/Lyricify Syllable 等歌词文件格式的导入以及部分格式的导出

支持带有特殊标识符的纯文本导入歌词

可配置的快捷键(新功能没有)

------------------
### 新增功能
颜色语法：{文本#RRGGBB} 实现单字/单词独立着色。（导出为ttml时将转换为ttml标准颜色语法）

实时预览着色：通过 useLyricColorizer 轮询 DOM，将颜色标记渲染为实际颜色（支持主歌词和翻译行）。(注：这功能实现方法很不优雅，维护性不强)

色彩资产库：多文件夹，每文件夹 100 个颜色槽，数据持久化至 localStorage。

悬浮调色工具栏：可拖拽，集成分号插入、颜色拾取器、HEX 输入、预设颜色槽、资产库面板，支持横向/竖向布局。

<img width="2016" height="1422" alt="02da1ee5-804e-41f0-9292-0dcef521bb21" src="https://github.com/user-attachments/assets/63c34144-6d3c-45d2-ba80-9f52e9859e25" />

<img width="2233" height="1584" alt="5d9e4d44-abad-4c4b-8757-413653f1dd77" src="https://github.com/user-attachments/assets/af1e630a-2a76-49fa-8a58-a92194494fb4" />

-----------------------------------------
### AE 导出与空间节点引擎
系统现已升级为“双引擎”架构，既保留了向下兼容的历史经典模板，又引入了全新的可视化空间漫游体系。

**1. 空间节点漫游引擎 (Spatial Node Engine)**
彻底改变了写死坐标的排版方式，提供一个所见即所得的“物理级”空间画布：

* **可视化节点排版**：通过拖拽“入场点”、“先焦点”、“焦点”等节点，在画布上自由规划歌词的运动轨迹。
<img width="3125" height="1872" alt="4c213acd-da37-4979-88f6-5e004a51a3f1" src="https://github.com/user-attachments/assets/02e30c7b-dc6e-4db1-ad0e-983c2b4b359d" />

* **响应式相对坐标**：放弃绝对像素，底层采用 0-100% 的比例坐标打入 AE 的滑块控制 (Slider Control)。在 AE 中任意修改合成尺寸（如 1080p 切 4K，横屏切竖屏），歌词轨迹将自适应缩放，永不偏离。
<img width="1888" height="1431" alt="8767d7e5-abfe-4fdf-a856-fe7d04c99388" src="https://github.com/user-attachments/assets/d6579342-bbd0-4e9a-b940-75e0a73e72e0" />

* **磁吸对齐系统**：画布内置中心十字基准线与元素雷达，拖拽节点时可触发边缘与中心的物理级磁吸对齐。

* **多维排版架构**：支持一键切换“横向排布”与“古文竖排”。底层注入了 `sourceRectAtTime` 动态锚点算法，不论文字如何变形，几何中心永远死死咬住你的空间坐标节点。
<img width="2438" height="1365" alt="c96274c2-dbb7-44ad-85d2-aa741f74b8b8" src="https://github.com/user-attachments/assets/0b6ee7f3-f264-49d9-8393-9c62ebb95cb4" />

**2. 经典垂直模板系统 (向下兼容)**
* 内置“默认满血版”与“性能超频版”垂直滚动模板。(和预览界面的差不多，不过是居中格式)

* 保持与空间节点引擎的绝对隔离，选用旧模板时，导出行为将严格遵循原版逻辑，不受画布节点干扰。

* 支持拖拽导入第三方 `.js` 模板。

关于颜色标记的 TTML 兼容性说明：
输出的 .ttml 文件本质上是一个结构化的数据源，颜色标记仅作为元数据存在。此设计初衷是在 Iris0fLyrics 配合独立的 AE 脚本生成器，将颜色信息传递给 After Effects，实现视频字幕的特效渲染，不影响标准 TTML 的播放。

----------------------------------------------
### AI 辅助设计与插件化组装
摒弃了过去容易导致大模型产生“长文本幻觉”的暴力代码续写模式，重构为现代化的 **“控制反转 (IoC) 插件钩子”** 架构。
<img width="3125" height="1878" alt="daca961a-4f78-40bc-9cb4-e51df3ab1a0e" src="https://github.com/user-attachments/assets/a168fab1-2bf3-4938-9bc6-22300a866a6f" />

* **职能分离，绝对安全**：前端节点引擎只负责输出冷冰冰的“物理空间坐标”骨架（确保用户的排版动线不被破坏）。而弹性的缓动曲线、发光、动态模糊等“视觉灵魂”交由 AI 处理。

* **自然语言生成基站**：提供独立的“动效”与“视觉特效”描述框，用户只需用自然语言描述画面（如“像苹果发布会一样丝滑、距离中心越远越模糊”）。

* **一键打包 Prompt**：点击生成后，系统会在后台静默编译你的排版骨架，并将其与严格的“越权警告指令”合并为一份工业级提示词，自动复制到剪贴板。

* **AI 插件回填组装**：大模型收到指令后，只需输出不到 30 行的 `ai_custom_easing` 和 `ai_custom_effects` 纯净钩子函数。用户将其粘贴回控制台，系统即可将“骨架”与“AI 插件”合并编译出完美的最终 JSX 脚本。

这种设计不仅大大节省了 AI 的 token 消耗，还支持用户将好用的 AI 插件代码保存在本地，日后无限复用。(以后支持导出成文件以便分享)

-------------------------------
## 安装与依赖
本项目仅可使用 PNPM。其次你可以在文件夹内运行提供的 【a开始运行.bat】 脚本来一键安装 node 库依赖，会自动切换镜像源。

### 本地开发运行（推荐）
```bash

# 1. 克隆仓库
git clone [https://github.com/Iris0fTheValley/Iris0fLyrics.git](https://github.com/Iris0fTheValley/Iris0fLyrics.git)

# 2. 安装依赖（仅支持 PNPM）
pnpm install

# 3. 启动开发服务器（网页版）
pnpm dev

# 4. 构建网页版（输出到 dist/）
pnpm build

🤝 贡献指南
欢迎提交 Issue 和 PR！如果您想添加新的语言翻译，请参考以下文件：(目前新功能还没支持多语言，都是中文硬编码，以后补上)

翻译文件位置：./locales/[lang]/translation.json
参考中文模板：./locales/zh-CN/translation.json
翻译索引：./src/i18n/index.ts
