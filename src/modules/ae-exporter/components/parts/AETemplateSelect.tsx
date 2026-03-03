// 文件路径：src/modules/ae-exporter/components/parts/AETemplateSelect.tsx
import { Box, Button, Card, Flex, Grid, ScrollArea, Select, Switch, Text } from '@radix-ui/themes';
import { useAtom, useSetAtom, useStore } from 'jotai';
import { type DragEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { uid } from 'uid';

import { aeConfigAtom } from '$/states/aeConfig';
import { type AETemplate, aeTemplatesAtom, selectedAETemplateIdAtom, defaultAETemplate, performanceAETemplate, spatialNodeTemplate } from '$/states/aeTemplates';
import { isGlobalFileDraggingAtom, lyricLinesAtom } from '$/states/main';
import { spatialDataAtom } from '$/states/spatial'; 

interface AETemplateSelectProps {
	enableEffects: boolean;
	setEnableEffects: (val: boolean) => void;
}

export default function AETemplateSelect({ enableEffects, setEnableEffects }: AETemplateSelectProps) {
	const { t } = useTranslation();
	const store = useStore();
	const [templates, setTemplates] = useAtom(aeTemplatesAtom);
	const [selectedId, setSelectedId] = useAtom(selectedAETemplateIdAtom);
	const [config] = useAtom(aeConfigAtom);
	const [isDragging, setIsDragging] = useState(false);
	const setIsGlobalDragging = useSetAtom(isGlobalFileDraggingAtom);

	useEffect(() => {
		setTemplates((prev) => {
			const customTemplates = prev.filter((t) => !t.isDefault);
			return [spatialNodeTemplate, defaultAETemplate, performanceAETemplate, ...customTemplates];
		});
	}, [setTemplates]);

	const currentTemplate = templates.find((tpl) => tpl.id === selectedId) || templates[0];

	const handleGenerate = () => {
		if (!currentTemplate) return;
		try {
			const ttmlData = store.get(lyricLinesAtom);
			const spatialData = store.get(spatialDataAtom); 
			const lines = ttmlData.lyricLines;
			if (!lines || lines.length === 0) { toast.error(t('ae.exportErrorEmpty', '导出失败：当前没有可用的歌词数据！')); return; }
			
			let maxTime = 0;
			const calculateWidth = (text: string, fontSize: number) => {
				let width = 0;
				for (let i = 0; i < text.length; i++) width += text.charCodeAt(i) > 255 ? fontSize : fontSize * 0.55;
				return width + (text.length * config.letterSpacing);
			};

			const parseMixedText = (rawText: string, defaultColor: string, fontSize: number) => {
				const result = [];
				const suffixMatch = rawText.match(/^(.*?)#([0-9A-Fa-f]{6})$/);
				if (suffixMatch && !rawText.includes('{')) {
					result.push({ text: suffixMatch[1], color: `#${suffixMatch[2]}`, width: calculateWidth(suffixMatch[1], fontSize) });
					return result;
				}
				const regex = /\{([^}]+)#([0-9A-Fa-f]{6})\}/g;
				let lastIndex = 0;
				let match = regex.exec(rawText);
				while (match !== null) {
					if (match.index > lastIndex) {
						const text = rawText.substring(lastIndex, match.index);
						result.push({ text, color: defaultColor, width: calculateWidth(text, fontSize) });
					}
					result.push({ text: match[1], color: `#${match[2]}`, width: calculateWidth(match[1], fontSize) });
					lastIndex = regex.lastIndex;
					match = regex.exec(rawText);
				}
				if (lastIndex < rawText.length) {
					const text = rawText.substring(lastIndex);
					result.push({ text, color: defaultColor, width: calculateWidth(text, fontSize) });
				}
				return result;
			};
			
			const parsedLines = lines.map((line) => {
				maxTime = Math.max(maxTime, line.endTime / 1000); 
				let total_main_w = 0; let total_sub_w = 0;
				const main_words: Array<{ text: string; color: string; start: number; width: number }> = [];
				const sub_words: Array<{ text: string; color: string; start: number; width: number }> = [];

				line.words.forEach((w) => {
					const parsed = parseMixedText(w.word, '#FFFFFF', config.mainFontSize); 
					parsed.forEach((p) => { main_words.push({ text: p.text, color: p.color, start: w.startTime / 1000, width: p.width }); total_main_w += p.width; });
				});
				if (line.translatedLyric) {
					const parsed = parseMixedText(line.translatedLyric, '#FFFFFF', config.subFontSize); 
					parsed.forEach((p) => { sub_words.push({ text: p.text, color: p.color, start: line.startTime / 1000, width: p.width }); total_sub_w += p.width; });
				}
				return { start: line.startTime / 1000, end: line.endTime / 1000, total_main_w, total_sub_w, main_words, sub_words };
			});

			const finalData = { maxTime, lines: parsedLines, spatial: spatialData };
			const executor = new Function('data', 'options', `${currentTemplate.code}\nreturn buildAMLLScript(data, options);`);
			const jsxContent = executor(finalData, { enableEffects, config });

			const blob = new Blob([jsxContent], { type: 'text/plain;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a'); a.href = url; a.download = `AMLL_NodeEngine_Lyrics_${Date.now()}.jsx`;
			document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
			toast.success(t('ae.exportSuccess', '🎉 节点 JSX 脚本生成成功！请在 AE 中运行。'));
		} catch (error) { toast.error(t('ae.exportError', '模板执行失败: ') + (error instanceof Error ? error.message : String(error))); }
	};

	const processImportedFile = useCallback((file: File) => {
		const reader = new FileReader();
		reader.onload = (evt) => {
			const code = evt.target?.result as string;
			if (!code.includes('buildAMLLScript')) { toast.error(t('ae.importFormatError', '导入失败：该文件不符合规范！')); return; }
			const newTemplate: AETemplate = { id: uid(), name: file.name.replace(/\.[^/.]+$/, ''), description: '用户导入模板', code: code, isDefault: false };
			setTemplates((prev) => [...prev, newTemplate]); setSelectedId(newTemplate.id);
			toast.success(t('ae.importSuccess', `🎉 模板导入成功！`));
		};
		reader.readAsText(file);
	}, [setTemplates, setSelectedId, t]);

	const handleDragOverLocal = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
	const handleDragLeaveLocal = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
	const handleDropLocal = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault(); e.stopPropagation(); setIsDragging(false); setIsGlobalDragging(false);
		const file = e.dataTransfer.files[0]; if (!file) return;
		processImportedFile(file);
	}, [processImportedFile, setIsGlobalDragging]);

	const handleFileClick = () => {
		const input = document.createElement('input'); input.type = 'file'; input.accept = '.js,.txt';
		input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) processImportedFile(file); };
		input.click();
	};

	const handleExportTemplate = (template: AETemplate) => {
		const blob = new Blob([template.code], { type: 'application/javascript;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href = url; a.download = `${template.name}.js`;
		document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
	};

	return (
		// 🌟 核心修改：双列 Grid，极度节省高度空间
		<Grid columns="1fr 1fr" gap="4" style={{ width: '100%' }}>
			
			<Card size="2" variant="surface">
				<Flex direction="column" gap="3" height="100%">
					<Text weight="bold" size="3">🚀 1. 渲染导出台</Text>
					<Flex direction="column" gap="3" justify="center" style={{ flex: 1 }}>
						<Select.Root value={selectedId} onValueChange={setSelectedId}>
							<Select.Trigger style={{ width: '100%' }} />
							<Select.Content>{templates.map((tpl) => (<Select.Item key={tpl.id} value={tpl.id}>{tpl.name}</Select.Item>))}</Select.Content>
						</Select.Root>
						<Flex gap="2" align="center">
							<Switch size="1" color="indigo" checked={enableEffects} onCheckedChange={setEnableEffects} style={{ cursor: 'pointer' }} />
							<Text size="2" color="gray">✨ 附带内置特效渲染 (如全局发光)</Text>
						</Flex>
						<Button size="3" color="jade" variant="solid" style={{ cursor: 'pointer', width: '100%', marginTop: 'auto' }} onClick={handleGenerate}>
							⚡ 编译节点数据并导出 JSX
						</Button>
					</Flex>
				</Flex>
			</Card>

			<Card size="2" variant="surface">
				<Flex direction="column" height="100%">
					<Text weight="bold" size="3" mb="2">📂 2. 模板引擎管理</Text>
					<Box 
						onDrop={handleDropLocal} onDragOver={handleDragOverLocal} onDragLeave={handleDragLeaveLocal} onClick={handleFileClick}
						style={{ cursor: 'pointer', border: `2px dashed ${isDragging ? 'var(--accent-9)' : 'var(--gray-7)'}`, borderRadius: '6px', padding: '10px', textAlign: 'center', backgroundColor: isDragging ? 'var(--accent-3)' : 'transparent', transition: 'all 0.2s', marginBottom: '10px' }}
					>
						<Text size="2" color={isDragging ? 'jade' : 'gray'}>{isDragging ? '松开导入' : '拖拽 .js 模板导入'}</Text>
					</Box>
					<ScrollArea style={{ height: '90px' }} type="auto" scrollbars="vertical">
						<Flex direction="column" gap="2">
							{templates.map((tpl) => (
								<Flex key={tpl.id} justify="between" align="center" p="2" style={{ backgroundColor: 'var(--gray-3)', borderRadius: '4px' }}>
									<Box><Text size="2" weight="bold">{tpl.name}</Text></Box>
									<Flex gap="2">
										<Button size="1" color="cyan" variant="soft" onClick={() => handleExportTemplate(tpl)} style={{ cursor: 'pointer' }}>导出</Button>
										{!tpl.isDefault && (<Button size="1" color="red" variant="soft" onClick={() => { setTemplates((prev) => prev.filter((t) => t.id !== tpl.id)); if (selectedId === tpl.id) setSelectedId(templates[0]?.id || ''); }} style={{ cursor: 'pointer' }}>删除</Button>)}
									</Flex>
								</Flex>
							))}
						</Flex>
					</ScrollArea>
				</Flex>
			</Card>
		</Grid>
	);
}