// 文件路径：src/modules/ae-exporter/components/parts/AEPromptStation.tsx
import { Box, Button, Card, Flex, Grid, Text, TextArea, TextField } from '@radix-ui/themes';
import { useAtom, useStore } from 'jotai';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { aeConfigAtom } from '$/states/aeConfig';
import { selectedAETemplateIdAtom, aeTemplatesAtom, spatialNodeTemplate } from '$/states/aeTemplates';
import { lyricLinesAtom } from '$/states/main';
import { spatialDataAtom } from '$/states/spatial';

type ExtendedConfig = {
	fontFamily?: string;
	mainFontSize?: number;
	subFontSize?: number;
	letterSpacing?: number;
	[key: string]: any;
};

interface AEPromptStationProps {
	userDescription: string;
	setUserDescription: (desc: string) => void;
	enableEffects: boolean;
	setEnableEffects: (val: boolean) => void;
}

export default function AEPromptStation(_props: AEPromptStationProps) {
	const store = useStore();
	const [rawConfig, setConfig] = useAtom(aeConfigAtom);
	const config = rawConfig as ExtendedConfig;
	const [templates] = useAtom(aeTemplatesAtom);
	const [selectedId] = useAtom(selectedAETemplateIdAtom);

	// 分离提示词
	const [motionPrompt, setMotionPrompt] = useState('请帮我加上苹果发布会那种丝滑的缓入缓出贝塞尔曲线动效。');
	const [effectPrompt, setEffectPrompt] = useState('距离中心超过 1000 的歌词加上高斯模糊，其余无特效。');
	
	// 🌟 新增：承接 AI 吐出的插件代码
	const [aiGeneratedCode, setAiGeneratedCode] = useState('');

	const updateConfig = (key: string, value: any) => {
		setConfig(prev => ({ ...prev, [key]: value } as unknown as typeof prev));
	};

	const handleCopyPrompt = () => {
		// 🌟 我们只给 AI 最纯粹的 API 规范，绝对不给底层上万字的图层数据，彻底解决大模型长度幻觉问题！
		const apiDocPrompt = `你是一个世界顶级的 After Effects JSX 脚本特效专家。
我有一个已经在底层计算好所有绝对坐标与时间轴的歌词排版引擎。
请你帮我编写两个**独立的插件函数**，来实现我想要的动效与特效。

## 引擎提供的 API 与全局变量
全局变量 \`config\` 包含以下属性可用：\`config.width\`, \`config.height\`, \`config.renderThreshold\`。

**你需要编写的函数一：**
\`function ai_custom_easing(xProp, yProp, rProp, oProp, config)\`
- 作用：给位置（x/y滑块）、旋转、透明度打贝塞尔缓动关键帧。
- 提示：你可以使用 \`for (var k=1; k<=xProp.numKeys; k++) { xProp.setTemporalEaseAtKey(k, [new KeyframeEase(...)], ...); }\` 来遍历修改曲线。

**你需要编写的函数二：**
\`function ai_custom_effects(layer, config)\`
- 作用：给已生成的文字 \`layer\` 添加滤镜和表达式。
- 提示：可以使用 \`layer.property('ADBE Effect Parade').addProperty('ADBE Gaussian Blur 2')\` 等。

## 我的核心需求
**1. 动效需求 (针对 ai_custom_easing)：**
${motionPrompt || '使用简单的平滑缓动即可。'}

**2. 视觉特效需求 (针对 ai_custom_effects)：**
${effectPrompt || '无需特效。'}

⚠️ 请**只输出这两个函数的 JavaScript 代码**，绝对不要去写图层生成的循环代码。不要带 markdown 标记，直接给我纯文本代码。`;

		navigator.clipboard.writeText(apiDocPrompt);
		toast.success('🎉 AI 提示词与插件 API 规范已复制！请直接发给 ChatGPT/Claude！');
	};

	// 🌟 全新的生成导出逻辑：组装底座 + AI 插件
	const handleExportWithAI = () => {
		const currentTemplate = templates.find((tpl) => tpl.id === selectedId) || templates[0];
		if (currentTemplate.id !== spatialNodeTemplate.id) {
			toast.warn('当前选择的不是“空间节点引擎”，AI 插件代码将不会生效，正在使用常规模式导出。');
		}

		try {
			const ttmlData = store.get(lyricLinesAtom);
			const spatialData = store.get(spatialDataAtom);
			const lines = ttmlData.lyricLines;
			if (!lines || lines.length === 0) { toast.error('导出失败：没有可用的歌词数据！'); return; }

			// 计算字宽...
			let maxTime = 0;
			const calculateWidth = (text: string, fontSize: number) => {
				let width = 0;
				for (let i = 0; i < text.length; i++) width += text.charCodeAt(i) > 255 ? fontSize : fontSize * 0.55;
				return width + (text.length * (config.letterSpacing || 0));
			};
			const parseMixedText = (rawText: string, defaultColor: string, fontSize: number) => {
				const result = [];
				const suffixMatch = rawText.match(/^(.*?)#([0-9A-Fa-f]{6})$/);
				if (suffixMatch && !rawText.includes('{')) {
					result.push({ text: suffixMatch[1], color: `#${suffixMatch[2]}`, width: calculateWidth(suffixMatch[1], fontSize) }); return result;
				}
				const regex = /\{([^}]+)#([0-9A-Fa-f]{6})\}/g;
				let lastIndex = 0; let match = regex.exec(rawText);
				while (match !== null) {
					if (match.index > lastIndex) {
						const text = rawText.substring(lastIndex, match.index);
						result.push({ text, color: defaultColor, width: calculateWidth(text, fontSize) });
					}
					result.push({ text: match[1], color: `#${match[2]}`, width: calculateWidth(match[1], fontSize) });
					lastIndex = regex.lastIndex; match = regex.exec(rawText);
				}
				if (lastIndex < rawText.length) {
					const text = rawText.substring(lastIndex);
					result.push({ text, color: defaultColor, width: calculateWidth(text, fontSize) });
				}
				return result;
			};

			const parsedLines = lines.map((line) => {
				maxTime = Math.max(maxTime, line.endTime / 1000);
				const main_words: Array<any> = []; const sub_words: Array<any> = [];
				line.words.forEach((w) => {
					const parsed = parseMixedText(w.word, '#FFFFFF', config.mainFontSize || 80);
					parsed.forEach((p) => { main_words.push({ text: p.text, color: p.color, start: w.startTime / 1000, width: p.width }); });
				});
				if (line.translatedLyric) {
					const parsed = parseMixedText(line.translatedLyric, '#FFFFFF', config.subFontSize || 40);
					parsed.forEach((p) => { sub_words.push({ text: p.text, color: p.color, start: line.startTime / 1000, width: p.width }); });
				}
				return { start: line.startTime / 1000, end: line.endTime / 1000, main_words, sub_words };
			});

			const finalData = { maxTime, lines: parsedLines, spatial: spatialData };
			
			// 🌟 核心：将用户粘贴的 AI 代码通过 options.aiCode 传给模板进行拼装！
			const executor = new Function('data', 'options', `${currentTemplate.code}\nreturn buildAMLLScript(data, options);`);
			const jsxContent = executor(finalData, { enableEffects: true, config, aiCode: aiGeneratedCode });

			const blob = new Blob([jsxContent], { type: 'text/plain;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a'); a.href = url; a.download = `AMLL_AIPowered_${Date.now()}.jsx`;
			document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
			toast.success('🎉 融合了 AI 插件的完整 JSX 脚本已生成！');
		} catch (error) { toast.error('模板执行失败: ' + (error instanceof Error ? error.message : String(error))); }
	};

	return (
		<Flex direction="column" gap="4">
			<Grid columns="300px 1fr" gap="4">
				{/* 字体外观设置 */}
				<Card size="2" variant="surface">
					<Flex direction="column" gap="4">
						<Text weight="bold" size="3" mb="2">🔤 字体外观硬编码</Text>
						<Box>
							<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>AE 字体名 (需与 AE 中完全一致)</Text>
							<TextField.Root value={config.fontFamily || 'Microsoft YaHei'} onChange={(e) => updateConfig('fontFamily', e.target.value)} />
						</Box>
						<Flex gap="3">
							<Box style={{ flex: 1 }}><Text size="2" color="gray" mb="1" style={{ display: 'block' }}>主字号</Text><TextField.Root type="number" value={config.mainFontSize || 80} onChange={(e) => updateConfig('mainFontSize', Number(e.target.value))} /></Box>
							<Box style={{ flex: 1 }}><Text size="2" color="gray" mb="1" style={{ display: 'block' }}>翻译字号</Text><TextField.Root type="number" value={config.subFontSize || 40} onChange={(e) => updateConfig('subFontSize', Number(e.target.value))} /></Box>
						</Flex>
						<Box>
							<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>文字间距 (Tracking)</Text>
							<TextField.Root type="number" step="10" value={config.letterSpacing || 0} onChange={(e) => updateConfig('letterSpacing', Number(e.target.value))} />
						</Box>
					</Flex>
				</Card>

				{/* 提示词生成器 */}
				<Card size="2" variant="surface" style={{ backgroundColor: 'var(--indigo-2)', border: '1px solid var(--indigo-6)' }}>
					<Flex direction="column" gap="3" height="100%">
						<Text weight="bold" size="3" color="indigo">🧠 第一步：给大模型的提示词</Text>
						<Box style={{ flex: 1 }}>
							<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>💨 想要什么动效？</Text>
							<TextArea value={motionPrompt} onChange={(e) => setMotionPrompt(e.target.value)} style={{ height: '60px', resize: 'none' }} />
						</Box>
						<Box style={{ flex: 1 }}>
							<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>✨ 想要什么特效？</Text>
							<TextArea value={effectPrompt} onChange={(e) => setEffectPrompt(e.target.value)} style={{ height: '60px', resize: 'none' }} />
						</Box>
						<Button size="3" color="indigo" variant="soft" style={{ cursor: 'pointer', marginTop: 'auto' }} onClick={handleCopyPrompt}>
							📋 复制提示词 (发给 ChatGPT)
						</Button>
					</Flex>
				</Card>
			</Grid>

			{/* 🌟 AI 代码回填与终极导出区 */}
			<Card size="2" variant="surface" style={{ backgroundColor: 'var(--jade-2)', border: '1px solid var(--jade-6)' }}>
				<Flex direction="column" gap="3">
					<Text weight="bold" size="3" color="jade">⚡ 第二步：粘贴 AI 生成的代码并合成导出</Text>
					<Text size="2" color="gray">把大模型生成的 <code>ai_custom_easing</code> 和 <code>ai_custom_effects</code> 两个函数完整粘贴在下方：</Text>
					<TextArea 
						placeholder="function ai_custom_easing(...) { ... }&#10;function ai_custom_effects(...) { ... }" 
						value={aiGeneratedCode} 
						onChange={(e) => setAiGeneratedCode(e.target.value)}
						style={{ height: '150px', fontFamily: 'monospace' }}
					/>
					<Button size="3" color="jade" variant="solid" style={{ cursor: 'pointer' }} onClick={handleExportWithAI}>
						🚀 组装底座数据与 AI 插件，导出终极 JSX！
					</Button>
				</Flex>
			</Card>
		</Flex>
	);
}