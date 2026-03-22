# Iris0fLyrics
All-in-one TTML lyrics editor with intuitive color markup, asset library, and AI-assisted After Effects export for highly customizable per-character colored karaoke videos. 一站式TTML歌词编辑工具，支持直观的颜色标记、色彩资产库，以及AI辅助的After Effects导出，轻松实现高自定义性的逐字上色特效字幕视频。
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Iris0fLyrics —— 一站式逐字特效字幕制作工具
人性化 · 高自定义 · 低学习成本

一个集歌词打轴、逐字着色、AE 脚本生成、AI 辅助设计于一体的专业歌词字幕编辑器。

感谢原项目团队，本项目基于 amll-ttml-tool 扩展而来。

你可以通过访问https://iris0fthevalley.github.io/Iris0fLyrics/来使用本工具的在线版本。

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

<img width="2516" height="1895" alt="8c01e6d3-ac6e-4a23-bb75-27cbad8f7495" src="https://github.com/user-attachments/assets/e99c92f0-709b-4955-9798-31adbf35f343" />


<img width="2233" height="1584" alt="5d9e4d44-abad-4c4b-8757-413653f1dd77" src="https://github.com/user-attachments/assets/af1e630a-2a76-49fa-8a58-a92194494fb4" />

-----------------------------------------
### AE 导出与空间节点引擎
系统现已升级为“双引擎”架构，既保留了向下兼容的历史经典模板，又引入了全新的可视化空间漫游体系。

**1. 空间节点漫游引擎 (Spatial Node Engine)**
彻底改变了写死坐标的排版方式，提供一个所见即所得的“物理级”空间画布：

* **多角色资产库与平行轨道系统**：内置完善的角色资产库（支持多文件夹分类管理，每组预设提供独立的独立角色槽位）。在界面一键切换角色后，系统会为其提供“主歌词”、“翻译”和“音译”三大独立物理轨道。配合侧边栏的“全局吸附”与“联动锁”功能，瞬间即可将子轨道的节点、角度及转场规则与主轨道完全对齐，轻松实现复杂的双语错位排版。

<img width="525" height="319" alt="bca4b6c0-ad52-4c0f-8dc7-8d95f16ad350" src="https://github.com/user-attachments/assets/c55e54b3-e4fb-40a4-b0e0-c39add002dc1" /><img width="605" height="402" alt="6c80bd7d-f06a-4962-a8fc-2790df9d24cc" src="https://github.com/user-attachments/assets/0f39c39e-a5be-4780-8927-e6673359095d" />

<img width="2730" height="1351" alt="5768172b-0efb-453e-aaf3-3c9742063499" src="https://github.com/user-attachments/assets/7ada4006-e6e2-4def-afd6-f1a315c26eeb" />


* **轨迹魔法 (矩阵变换与克隆)**：在进行多角色合唱编排时无需重复打轴。通过内置的“轨迹魔法”功能，你可以一键提取其他角色的空间排版动线，并进行“1:1 绝对克隆”、“左右/上下对称镜像”或“中心环绕旋转”等矩阵空间变换，瞬间完成极具对称美学与互动感的合唱排版。

<img width="539" height="503" alt="a1d4ea92-d362-4555-bcf8-c25f0394a1fe" src="https://github.com/user-attachments/assets/1d5f3729-2cde-4f67-b6e5-ee6bf0241a86" />


* **引流阀与分离轴转场 (Split-Axis Transition)**：在画布的连线轨迹上提供独立的转场控制点。支持为每段飞行定制物理规则：“全局跟随”（位置与角度同步平滑过渡）、“机械折角”（到点瞬间突变），以及高级的“延迟漂移”（分离轴动画：位置全程平滑移动，角度在到达设定百分比的触发点时才开始平滑转向）。
<img width="456" height="185" alt="image" src="https://github.com/user-attachments/assets/050604b3-3e05-47bf-846f-6db0e5eef036" />
<img width="1635" height="1419" alt="ec6a5b89-2102-47df-b2a3-e7302525ada9" src="https://github.com/user-attachments/assets/355f2227-0403-4cb4-996d-741baebc7c05" />
<img width="756" height="717" alt="3a85ddd8-a72a-4df9-ba2a-82f4da4ed6c9" src="https://github.com/user-attachments/assets/1876abcd-e02f-46c8-bb0b-7c1886ace25f" />


* **可视化节点排版**：通过拖拽“入场点”、“先焦点”、“焦点”等节点，在画布上自由规划歌词的运动轨迹。
<img width="3255" height="1809" alt="5d87feb1-a5a4-48b8-a4e3-45d7a378b4e2" src="https://github.com/user-attachments/assets/b44822d5-9753-4c65-b36e-033fd64c0683" />


* **响应式相对坐标**：放弃绝对像素，底层采用 0-100% 的比例坐标打入 AE 的滑块控制 (Slider Control)。在 AE 中任意修改合成尺寸（如 1080p 切 4K，横屏切竖屏），歌词轨迹将自适应缩放，永不偏离。
<img width="1888" height="1431" alt="8767d7e5-abfe-4fdf-a856-fe7d04c99388" src="https://github.com/user-attachments/assets/d6579342-bbd0-4e9a-b940-75e0a73e72e0" />

* **磁吸对齐系统**：画布内置中心十字基准线与元素雷达，拖拽节点时可触发边缘与中心的物理级磁吸对齐。

* **多维排版架构**：支持一键切换“横向排布”与“古文竖排”。底层注入了 `sourceRectAtTime` 动态锚点算法，不论文字如何变形，几何中心永远死死咬住你的空间坐标节点。
<img width="2438" height="1365" alt="c96274c2-dbb7-44ad-85d2-aa741f74b8b8" src="https://github.com/user-attachments/assets/0b6ee7f3-f264-49d9-8393-9c62ebb95cb4" />

**引擎定位说明：**
在最终的 JSX 导出上，引擎会将所有复杂的数学运算（如延迟百分比计算、分离轴遍历）在浏览器端处理完毕，向 AE 输出纯净的原生关键帧与极简的响应式绑定。
对于熟悉 AE 的后期人员，这相当于提供了一个极其干净、便于二次编辑的极品工程文件，免去了大量打轴排版的重复劳动；但这套引擎的核心初衷，依然是为了让完全不想学习 AE 的用户，也能通过直观的前端 UI 拖拽，一键生成高端、高自定义度的专业级歌词或字幕动效。

**2. 经典垂直模板系统 (向下兼容)**
* 内置“默认满血版”与“性能超频版”垂直滚动模板。(和预览界面的差不多，不过是居中格式)

* 保持与空间节点引擎的绝对隔离，选用旧模板时，导出行为将严格遵循原版逻辑，不受画布节点干扰。

* 支持拖拽导入第三方 `.js` 模板。

关于多角色与颜色标记的 TTML 兼容性说明：
导出的 .ttml 文件本质上是一个高度结构化的数据源。你在编辑器中分配的多角色轨道信息（主歌词、翻译、音译）以及精细的颜色标记，均会作为元数据无缝封装在 TTML 标签内。
这种设计确保了文件不仅能作为普通 TTML 在标准播放器中正常显示基础文本，更完美保存了你的多角色分类与色彩资产，为后续在 AE 中自动生成独立的角色图层与特效脚本提供了坚实的数据支持。

----------------------------------------------
### AI 辅助设计与插件化组装
摒弃了过去容易导致大模型产生“长文本幻觉”的暴力代码续写模式，重构为现代化的 **“控制反转 (IoC) 插件钩子”** 架构。
<img width="2814" height="1085" alt="85cefbe5-a5de-4c87-b24a-69cfd50e384e" src="https://github.com/user-attachments/assets/4bbca15f-1112-444e-9b2b-ca47cfdfdd7d" />


* **职能分离，绝对安全**：前端节点引擎负责输出“物理空间坐标”骨架，并在底层原生接管所有复杂的时间轴计算与分离轴锁帧操作（确保排版动线与节奏不被破坏）。弹性的缓动曲线、发光、动态模糊等“视觉特效”则交由 AI 处理。

* **自然语言生成基站**：提供独立的“动效”与“视觉特效”描述框，用户只需用自然语言描述画面需求（如“平滑的缓入缓出曲线、距离中心越远越模糊”）。

* **一键打包 Prompt**：系统会在后台静默编译排版规则，将其与严格的 API 约束指令合并为一份提示词自动复制到剪贴板，杜绝 AI 擅自破坏时间轴。

* **AI 插件回填组装**：大模型收到指令后，只需输出简短的 `ai_custom_easing` 和 `ai_custom_effects` 钩子函数。将其粘贴回控制台，系统即可将“多角色物理底座”与“AI 插件”合并编译出最终的 JSX 脚本。

* **全资产预设打包 (模板系统升级)**：界面的原生模板管理系统已全面升维。现在，你可以将当前精心调校好的“空间动线节点”、“分离轴转场参数”以及“AI 特效插件代码”一键融合，打包保存为全新的自定义模板。不仅可以保存在本地直接读取，还能作为预设文件导出并分享给其他创作者，实现动效知识的资产化。

这种设计不仅大大节省了 AI 的 token 消耗，还支持用户将好用的 AI 插件代码与当前的画布排版节点融合成新的自定义模板，保存在本地并无缝集成到界面的顶部模板菜单中，以便日后无限复用。

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
