// 文件路径：src/modules/ae-exporter/components/AEModePanel.tsx
import { Box, Card, Flex, Slider, Text } from '@radix-ui/themes';
import { useAtom, useSetAtom } from 'jotai';
import { useState, useMemo } from 'react';
import { aeTemplatesAtom, selectedAETemplateIdAtom } from '$/states/aeTemplates';
import { isGlobalFileDraggingAtom } from '$/states/main';

// 引入拆分好的模块
import AEHeader from './parts/AEHeader';
import AETemplateSelect from './parts/AETemplateSelect';
import AEPreviewBoard from './parts/AEPreviewBoard';
import AEParamLab from './parts/AEParamLab';
import AEPromptStation from './parts/AEPromptStation';

const customStyles = `
	@keyframes aeFadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
	@keyframes aePopIn { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
	.custom-scrollbar::-webkit-scrollbar { width: 6px; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--gray-6); border-radius: 4px; }
`;

export default function AEModePanel() {
	const [templates] = useAtom(aeTemplatesAtom);
	const [selectedId] = useAtom(selectedAETemplateIdAtom);
	const setIsGlobalDragging = useSetAtom(isGlobalFileDraggingAtom);

	// 全局共享的状态 (因为组件间需要联动)
	const [enableEffects, setEnableEffects] = useState(true);
	const [userDescription, setUserDescription] = useState('');
	
	// 左上角静态分析的专属状态
	const [upperTimeProgress, setUpperTimeProgress] = useState<number>(15);

	// 解析静态模板参数
	const parsedTemplateParams = useMemo(() => {
		const currentTemplate = templates.find((t) => t.id === selectedId) || templates[0];
		const code = currentTemplate?.code || '';
		let spacing = 220; let life = 15; let fov = 1200;
		const spacingMatch = code.match(/lineSpacing\s*=\s*(\d+)/);
		const hardcodedSpacingMatch = code.match(/\*\s*(\d{2,3})/);
		if (spacingMatch) spacing = parseInt(spacingMatch[1]); else if (hardcodedSpacingMatch) spacing = parseInt(hardcodedSpacingMatch[1]);
		const lifeMatch = code.match(/line\.start\s*-\s*([\d.]+)/);
		if (lifeMatch) life = parseFloat(lifeMatch[1]);
		const fovMatch = code.match(/dist\s*>\s*(\d+)/);
		if (fovMatch) fov = parseInt(fovMatch[1]);
		const isStandardArchitecture = code.includes('cur_x =') && code.includes('relX');
		return { spacing, life, fov, isStandardArchitecture };
	}, [selectedId, templates]);

	return (
		<Box 
			style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }} className="custom-scrollbar"
			onDragEnter={(e) => { e.stopPropagation(); setIsGlobalDragging(false); }}
			onDragOver={(e) => { e.stopPropagation(); setIsGlobalDragging(false); }}
			onDrop={(e) => { e.stopPropagation(); setIsGlobalDragging(false); }}
		>
			<style>{customStyles}</style>
			<Flex direction="column" align="center" style={{ padding: '20px', paddingBottom: '100px', width: '100%' }}>
				
				{/* 顶部标题与指南 */}
				<AEHeader />

				<Flex gap="4" align="stretch" style={{ width: '100%', maxWidth: '1600px', marginBottom: '30px' }}>
					{/* 左上静态空间分析模块 (因逻辑较少，直接内嵌在此作为骨架的一部分) */}
					<Card size="3" variant="surface" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
						<Flex justify="between" align="center" mb="3">
							<Text weight="bold" size="3">当前模板静态空间分析</Text>
							<Text size="1" color="gray">读取底层排版参数，无渲染拖拽</Text>
						</Flex>
						<Box style={{ flex: '1', backgroundColor: '#111113', borderRadius: '8px', border: '1px solid var(--gray-6)', position: 'relative', overflow: 'hidden', minHeight: '350px' }}>
							{!parsedTemplateParams.isStandardArchitecture && (
								<Box style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, backgroundColor: 'rgba(30, 20, 0, 0.8)', border: '1px solid var(--amber-8)', padding: '6px 12px', borderRadius: '6px', backdropFilter: 'blur(4px)', width: '80%', textAlign: 'center' }}>
									<Text size="1" color="amber" weight="bold">⚠️ 检测到高度自定义模板，当前仅展示基础的时间轴寿命预览。</Text>
								</Box>
							)}
							<Flex align="center" justify="center" style={{ height: '100%', position: 'relative' }}>
								<AEPreviewBoard
									activeIdxFloat={upperTimeProgress} spacing={parsedTemplateParams.spacing} fov={parsedTemplateParams.fov}
									life={parsedTemplateParams.life} useEffects={false} motionType="none" totalLines={30} scale={0.25} isStandard={parsedTemplateParams.isStandardArchitecture}
								/>
							</Flex>
						</Box>
						<Flex align="center" gap="3" mt="4">
							<Text size="2" color="gray" style={{ whiteSpace: 'nowrap' }}>时间轴滑动</Text>
							<Slider value={[upperTimeProgress]} onValueChange={(v) => setUpperTimeProgress(v[0])} min={0} max={29} step={0.1} style={{ flex: '1' }} />
							<Text size="2" weight="bold" style={{ minWidth: '35px', textAlign: 'right' }}>{upperTimeProgress.toFixed(1)}</Text>
						</Flex>
					</Card>

					{/* 模板选择与管理引擎 */}
					<AETemplateSelect enableEffects={enableEffects} setEnableEffects={setEnableEffects} />
				</Flex>

				{/* 动效与特效参数实验室 */}
				<AEParamLab enableEffects={enableEffects} />

				{/* AI 提示词生成工作台 */}
				<AEPromptStation userDescription={userDescription} setUserDescription={setUserDescription} enableEffects={enableEffects} setEnableEffects={setEnableEffects} />

			</Flex>
		</Box>
	);
}