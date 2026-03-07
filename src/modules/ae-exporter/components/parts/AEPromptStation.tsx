// 文件路径：src/modules/ae-exporter/components/parts/AEPromptStation.tsx
import { Box, Button, Card, Flex, Grid, Text, TextArea, TextField } from '@radix-ui/themes';
import { useAtom, useStore } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

import { aeConfigAtom } from '$/states/aeConfig';
import { selectedAETemplateIdAtom, aeTemplatesAtom, spatialNodeTemplate, type AETemplate } from '$/states/aeTemplates';
import { lyricLinesAtom } from '$/states/main';
import { spatialDataMapAtom } from '$/states/spatial'; 

type ExtendedConfig = {
	fontFamily?: string;
	mainFontSize?: number;
	subFontSize?: number;
	letterSpacing?: number;
	[key: string]: any;
};

// 本地持久化，确保未保存的 AI 代码刷新不丢失
const aiCodeAtom = atomWithStorage('amll-ai-code', '');

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
	const [templates, setTemplates] = useAtom(aeTemplatesAtom);
	const [selectedId, setSelectedId] = useAtom(selectedAETemplateIdAtom);

	const [motionPrompt, setMotionPrompt] = useState('请帮我加上苹果发布会那种丝滑的缓入缓出贝塞尔曲线动效。\\n对于旋转属性（rProp），请将所有关键帧设置为 KeyframeInterpolationType.HOLD 定格关键帧，让它到点再瞬间旋转。');
	const [effectPrompt, setEffectPrompt] = useState('距离中心超过 1000 的歌词加上高斯模糊，其余无特效。');
	const [aiGeneratedCode, setAiGeneratedCode] = useAtom(aiCodeAtom);

	const updateConfig = (key: string, value: any) => {
		setConfig(prev => ({ ...prev, [key]: value } as unknown as typeof prev));
	};

	// 🌟 核心：监听顶部菜单的模板切换事件
	// 一旦选中的模板里携带了 spatialMap 或 aiCode，瞬间还原到画板上！
	useEffect(() => {
		const currentTpl = templates.find(t => t.id === selectedId);
		if (currentTpl) {
			if (currentTpl.spatialMap) store.set(spatialDataMapAtom, currentTpl.spatialMap);
			if (currentTpl.config) store.set(aeConfigAtom, currentTpl.config as any);
			if (currentTpl.aiCode !== undefined) setAiGeneratedCode(currentTpl.aiCode);
		}
	}, [selectedId, templates, store, setAiGeneratedCode]);

	// 🌟 核心：将当前排版包装成标准模板，推入现有的顶部管理系统
	const handleSaveAsTemplate = () => {
		const name = window.prompt("请输入新模板名称：", "我的自定义空间动效模板");
		if (!name) return;
		const newTemplate: AETemplate = {
			id: `custom-tpl-${Date.now()}`,
			name: name,
			description: '包含自定义空间排版动线与 AI 特效插件代码的完整整合包。',
			code: spatialNodeTemplate.code, // 沿用基础底座代码
			isDefault: false,
			// 携带当前的所有宇宙级资产
			spatialMap: store.get(spatialDataMapAtom),
			config: store.get(aeConfigAtom),
			aiCode: aiGeneratedCode
		};
		setTemplates(prev => [...prev, newTemplate]);
		setSelectedId(newTemplate.id);
		toast.success("💾 模板已成功生成！现已无缝集成至界面顶部的模板管理系统中，你可以随时导出分享。");
	};

	const handleCopyPrompt = () => {
		const apiDocPrompt = `你是一个世界顶级的 After Effects JSX 脚本专家。
AE 的 ExtendScript API 非常古老且特殊，大模型经常臆造函数。请你**严格按照我给出的语法示例**，帮我编写两个独立的插件函数。

## 引擎提供的 API 与全局变量
全局变量 \`config\` 包含：\`config.width\`, \`config.height\`, \`config.renderThreshold\`。

=========================================
【函数一：ai_custom_easing(xProp, yProp, rProp, oProp, config)】
- 作用：给位置(x/y)、旋转(r)、透明度(o)打贝塞尔缓动或定格关键帧。
⚠️ 严格语法限制（绝对不要用 setEaseIn/Out）：
1. 缓动必须使用：prop.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]);
2. 定格(HOLD)必须使用：prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);

👉 参考写法模板（请基于此修改）：
function ai_custom_easing(xProp, yProp, rProp, oProp, config) {
    for (var k = 1; k <= xProp.numKeys; k++) {
        // 给位置打丝滑贝塞尔
        xProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]);
        yProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]);
        
        // 旋转定格到点突变 (HOLD)
        rProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
        
        // 透明度也可以打缓动
        oProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]);
    }
}

=========================================
【函数二：ai_custom_effects(layer, config)】
- 作用：给已生成的文字 layer 添加滤镜和表达式。
⚠️ 严格语法限制（绝对不要用 layer.effect）：
1. 必须用 \`layer.property('ADBE Effect Parade')\` 访问特效面板。
2. 添加模糊：\`var blur = layer.property('ADBE Effect Parade').addProperty('ADBE Gaussian Blur 2');\`
3. 挂载表达式：\`blur.property(1).expression = "你的代码";\`

👉 参考写法模板：
function ai_custom_effects(layer, config) {
    var fx = layer.property("ADBE Effect Parade");
    var blur = fx.addProperty("ADBE Gaussian Blur 2");
    blur.property(1).expression = "var cx = " + (config.width/2) + "; var cy = " + (config.height/2) + "; var d = length(transform.position, [cx, cy]); d > 1000 ? 20 : 0;";
}

=========================================
## 我的核心需求
**1. 动效需求：**
${motionPrompt || '使用模板里的平滑缓动即可。'}

**2. 视觉特效需求：**
${effectPrompt || '无需特效。'}

⚠️ 最终要求：请只输出这两个函数的 JavaScript 纯代码，绝对不要带 \`\`\`javascript 这样的 markdown 标记！直接给我代码本体！`;

		navigator.clipboard.writeText(apiDocPrompt);
		toast.success('🎉 强力防错版 AI 提示词已复制！请直接发给大模型！');
	};

	const handleExportWithAI = () => {
		const currentTemplate = templates.find((tpl) => tpl.id === selectedId) || templates[0];
		if (currentTemplate.id !== spatialNodeTemplate.id && !currentTemplate.spatialMap) {
			toast.warn('当前选择的不是基于“空间节点引擎”的模板，AI 插件代码将不会生效，正在使用常规模式导出。');
		}

		try {
			const ttmlData = store.get(lyricLinesAtom);
			const spatialMapData = store.get(spatialDataMapAtom); 
			const lines = ttmlData.lyricLines;
			if (!lines || lines.length === 0) { toast.error('导出失败：没有可用的歌词数据！'); return; }

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
				return { start: line.startTime / 1000, end: line.endTime / 1000, main_words, sub_words, role: line.role || '1' };
			});

			const finalData = { maxTime, lines: parsedLines, spatialMap: spatialMapData };
			const executor = new Function('data', 'options', `${currentTemplate.code}\nreturn buildAMLLScript(data, options);`);
			const jsxContent = executor(finalData, { enableEffects: true, config, aiCode: aiGeneratedCode });

			const blob = new Blob([jsxContent], { type: 'text/plain;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a'); a.href = url; a.download = `AMLL_AIPowered_${Date.now()}.jsx`;
			document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
			toast.success('🎉 融合了多角色宇宙与 AI 插件的完整 JSX 脚本已生成！');
		} catch (error) { toast.error('模板执行失败: ' + (error instanceof Error ? error.message : String(error))); }
	};

	return (
		<Flex direction="column" gap="4">
			<Grid columns="300px 1fr" gap="4">
				<Card size="2" variant="surface">
					<Flex direction="column" gap="4">
						<Text weight="bold" size="3" mb="2"> 字体外观硬编码</Text>
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

				<Card size="2" variant="surface" style={{ backgroundColor: 'var(--indigo-2)', border: '1px solid var(--indigo-6)' }}>
					<Flex direction="column" gap="3" height="100%">
						<Text weight="bold" size="3" color="indigo"> 第一步：给大模型的提示词</Text>
						<Box style={{ flex: 1 }}>
							<Text size="2" color="gray" mb="1" style={{ display: 'block' }}> 想要什么动效？</Text>
							<TextArea value={motionPrompt} onChange={(e) => setMotionPrompt(e.target.value)} style={{ height: '70px', resize: 'none' }} />
						</Box>
						<Box style={{ flex: 1 }}>
							<Text size="2" color="gray" mb="1" style={{ display: 'block' }}> 想要什么特效？</Text>
							<TextArea value={effectPrompt} onChange={(e) => setEffectPrompt(e.target.value)} style={{ height: '50px', resize: 'none' }} />
						</Box>
						<Button size="3" color="indigo" variant="soft" style={{ cursor: 'pointer', marginTop: 'auto' }} onClick={handleCopyPrompt}>
							📋 复制提示词 (发给 ChatGPT / Claude)
						</Button>
					</Flex>
				</Card>
			</Grid>

			<Card size="2" variant="surface" style={{ backgroundColor: 'var(--jade-2)', border: '1px solid var(--jade-6)' }}>
				<Flex direction="column" gap="3">
					<Flex justify="between" align="center">
						<Text weight="bold" size="3" color="jade">⚡ 第二步：粘贴代码，合体导出或入库！</Text>
						<Text size="2" color="gray">将 AI 生成代码贴在下方即可生效</Text>
					</Flex>
					
					<TextArea 
						placeholder="function ai_custom_easing(...) { ... }&#10;function ai_custom_effects(...) { ... }" 
						value={aiGeneratedCode} 
						onChange={(e) => setAiGeneratedCode(e.target.value)}
						style={{ height: '150px', fontFamily: 'monospace' }}
					/>
					
					<Flex gap="3" mt="2">
						<Button size="3" color="jade" variant="solid" style={{ cursor: 'pointer', flex: 1 }} onClick={handleExportWithAI}>
							🚀 仅组装底层与插件并导出 JSX 脚本
						</Button>
						<Button size="3" color="teal" variant="soft" style={{ cursor: 'pointer' }} onClick={handleSaveAsTemplate}>
							💾 融合当前画板与代码为新模板 (推入顶部菜单)
						</Button>
					</Flex>
				</Flex>
			</Card>
		</Flex>
	);
}