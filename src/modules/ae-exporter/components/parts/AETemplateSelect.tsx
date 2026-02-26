// 文件路径：src/modules/ae-exporter/components/parts/AETemplateSelect.tsx
import { Box, Button, Card, Flex, ScrollArea, Select, Switch, Text } from '@radix-ui/themes';
import { useAtom, useSetAtom, useStore } from 'jotai';
import { type DragEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { uid } from 'uid';

import { aeConfigAtom } from '$/states/aeConfig';
import { type AETemplate, aeTemplatesAtom, selectedAETemplateIdAtom, defaultAETemplate, performanceAETemplate } from '$/states/aeTemplates';
import { isGlobalFileDraggingAtom, lyricLinesAtom } from '$/states/main';

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

	// 🚀 核心修复 2：每次组件加载时，强制使用代码中最新的内置模板覆盖 localStorage 缓存
	useEffect(() => {
		setTemplates((prev) => {
			const customTemplates = prev.filter((t) => !t.isDefault);
			return [defaultAETemplate, performanceAETemplate, ...customTemplates];
		});
	}, [setTemplates]);

	const currentTemplate = templates.find((tpl) => tpl.id === selectedId) || templates[0];

	// =========== 核心：导出 JSX 逻辑 ===========
	const handleGenerate = () => {
		if (!currentTemplate) return;
		try {
			const ttmlData = store.get(lyricLinesAtom);
			const lines = ttmlData.lyricLines;
			if (!lines || lines.length === 0) { toast.error(t('ae.exportErrorEmpty', '导出失败：当前没有可用的歌词数据！')); return; }
			
			let maxTime = 0;
			const calculateWidth = (text: string, fontSize: number) => {
				let width = 0;
				for (let i = 0; i < text.length; i++) width += text.charCodeAt(i) > 255 ? fontSize : fontSize * 0.55;
				return width + (text.length * config.letterSpacing);
			};

			// 🚀 核心修复 3：强化正则！兼容用户只写 `文字#BB9955` 而漏掉 `{}` 的情况
			const parseMixedText = (rawText: string, defaultColor: string, fontSize: number) => {
				const result = [];
				
				// 优先检查无大括号的后缀写法，如 "Mary Magdelene#BB9955"
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

			const finalData = { maxTime, lines: parsedLines };
			const executor = new Function('data', 'options', `${currentTemplate.code}\nreturn buildAMLLScript(data, options);`);
			const jsxContent = executor(finalData, { enableEffects, config });

			const blob = new Blob([jsxContent], { type: 'text/plain;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a'); a.href = url; a.download = `AMLL_Effect_Lyrics_${Date.now()}.jsx`;
			document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
			toast.success(t('ae.exportSuccess', '🎉 JSX 脚本生成并下载成功！请在 AE 中运行。'));
		} catch (error) { toast.error(t('ae.exportError', '模板执行失败: ') + (error instanceof Error ? error.message : String(error))); }
	};

	const processImportedFile = useCallback((file: File) => {
		const reader = new FileReader();
		reader.onload = (evt) => {
			const code = evt.target?.result as string;
			if (!code.includes('buildAMLLScript')) { toast.error(t('ae.importFormatError', '导入失败：该文件不符合模板规范！')); return; }
			const newTemplate: AETemplate = { id: uid(), name: file.name.replace(/\.[^/.]+$/, ''), description: t('ae.userImported', '用户导入自定义模板'), code: code, isDefault: false };
			setTemplates((prev) => [...prev, newTemplate]); setSelectedId(newTemplate.id);
			toast.success(t('ae.importSuccess', `🎉 模板 "{{name}}" 导入安装成功！`, { name: newTemplate.name }));
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
		toast.success(t('ae.templateExportSuccess', `🎉 模板 "${template.name}" 导出成功！`));
	};

	return (
		<Flex direction="column" gap="4" style={{ flex: '0 0 500px', width: '500px' }}>
			{/* ... 其余 UI 渲染部分保持不变 ... */}
			<Card size="3" variant="surface">
				<Flex direction="column" gap="4">
					<Text weight="bold" size="3">{t('ae.selectTemplate', '1. 选择特效模板')}</Text>
					<Flex direction="column" gap="3">
						<Flex gap="3" align="center">
							<Select.Root value={selectedId} onValueChange={setSelectedId}>
								<Select.Trigger style={{ minWidth: '300px' }} />
								<Select.Content>{templates.map((tpl) => (<Select.Item key={tpl.id} value={tpl.id}>{tpl.name}</Select.Item>))}</Select.Content>
							</Select.Root>
							<Button size="2" color="jade" variant="solid" style={{ cursor: 'pointer', flex: 1 }} onClick={handleGenerate}>
								⚡ {t('ae.exportJSX', '导出 JSX')}
							</Button>
						</Flex>
						<Flex gap="2" align="center">
							<Switch size="1" color="indigo" checked={enableEffects} onCheckedChange={setEnableEffects} style={{ cursor: 'pointer' }} />
							<Text size="2" color="gray" style={{ userSelect: 'none' }}>✨ {t('ae.enableEffectsToggle', '附带内置特效渲染 (高斯模糊/全局发光)')}</Text>
						</Flex>
					</Flex>
				</Flex>
			</Card>

			<Card size="3" variant="surface" style={{ flex: 1 }}>
				<Text weight="bold" size="3" mb="3">{t('ae.templateManager', '2. 模板管理区')}</Text>
				<Box 
					onDrop={handleDropLocal} onDragOver={handleDragOverLocal} onDragLeave={handleDragLeaveLocal} onClick={handleFileClick}
					style={{ cursor: 'pointer', border: `2px dashed ${isDragging ? 'var(--accent-9)' : 'var(--gray-7)'}`, borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: isDragging ? 'var(--accent-3)' : 'transparent', transition: 'all 0.2s', marginBottom: '15px' }}
				>
					<Text size="2" color={isDragging ? 'jade' : 'gray'}>{isDragging ? t('ae.dropToImport', '松开鼠标即可导入...') : t('ae.clickOrDropToImport', '点击此处 或 拖拽 .js / .txt 到此处安装')}</Text>
				</Box>
				<ScrollArea style={{ height: '120px' }} type="auto" scrollbars="vertical">
					<Flex direction="column" gap="2">
						{templates.map((tpl) => (
							<Flex key={tpl.id} justify="between" align="center" p="2" style={{ backgroundColor: 'var(--gray-3)', borderRadius: '6px' }}>
								<Box><Text size="2" weight="bold">{tpl.name}</Text></Box>
								<Flex gap="2">
									<Button size="1" color="cyan" variant="soft" onClick={() => handleExportTemplate(tpl)} style={{ cursor: 'pointer' }}>{t('ae.export', '导出')}</Button>
									{!tpl.isDefault && (<Button size="1" color="red" variant="soft" onClick={() => { setTemplates((prev) => prev.filter((t) => t.id !== tpl.id)); if (selectedId === tpl.id) setSelectedId(templates[0]?.id || ''); }} style={{ cursor: 'pointer' }}>{t('ae.delete', '删除')}</Button>)}
								</Flex>
							</Flex>
						))}
					</Flex>
				</ScrollArea>
			</Card>
		</Flex>
	);
}