// 文件路径：src/modules/ae-exporter/components/parts/AEParamLab.tsx
import { Box, Button, Card, Flex, ScrollArea, Select, Separator, Slider, Switch, Text } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type AEExportConfig, aeConfigAtom, defaultAEConfig } from '$/states/aeConfig';
import AEPreviewBoard from './AEPreviewBoard';

interface AEParamLabProps {
	enableEffects: boolean;
}

export default function AEParamLab({ enableEffects }: AEParamLabProps) {
	const { t } = useTranslation();
	const [config, setConfig] = useAtom(aeConfigAtom);
	const updateConfig = (key: keyof AEExportConfig, value: any) => setConfig(prev => ({ ...prev, [key]: value }));

	// --- 预览画板循环播放逻辑 ---
	const [lowerActiveIdx, setLowerActiveIdx] = useState(2);
	useEffect(() => {
		let direction = 1;
		let currentIdx = Math.floor(config.previewLines / 2);
		setLowerActiveIdx(currentIdx);
		const timer = setInterval(() => {
			currentIdx += direction;
			if (currentIdx >= config.previewLines - 2) { direction = -1; currentIdx = config.previewLines - 3; }
			else if (currentIdx <= 1) { direction = 1; currentIdx = 2; }
			setLowerActiveIdx(currentIdx);
		}, 1800); 
		return () => clearInterval(timer);
	}, [config.previewLines]);

	// --- 预设管理与恢复默认 ---
	const handleResetLab = () => {
		if (confirm(t('ae.confirmResetLab', '确定要将实验室的所有参数恢复为默认值吗？'))) {
			setConfig(defaultAEConfig);
			toast.success(t('ae.resetLabSuccess', '实验室参数已恢复默认！'));
		}
	};
	const handleExportPreset = () => {
		const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href = url; a.download = `AMLL_AE_Preset_${Date.now()}.json`;
		document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
		toast.success(t('ae.exportPresetSuccess', '🎉 参数预设已成功导出！'));
	};
	const handleImportPreset = () => {
		const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (evt) => {
					try {
						const parsed = JSON.parse(evt.target?.result as string);
						setConfig({ ...defaultAEConfig, ...parsed });
						toast.success(t('ae.importPresetSuccess', '🎉 预设参数导入成功！'));
					} catch (err) { toast.error(t('ae.importPresetError', '导入失败：文件格式不正确。')); }
				};
				reader.readAsText(file);
			}
		};
		input.click();
	};

	const numberInputStyle = { width: '65px', padding: '4px', borderRadius: '4px', border: '1px solid var(--gray-6)', backgroundColor: 'var(--gray-3)', color: 'var(--gray-12)', textAlign: 'center' as const, fontSize: '12px', outline: 'none' };

	return (
		<Card size="3" variant="surface" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1600px', marginBottom: '20px' }}>
			<Flex justify="between" align="center" mb="4">
				<Text weight="bold" size="3">{t('ae.labTitle', '🧪 动效与特效参数实验室')}</Text>
				<Flex gap="3">
					<Button size="1" variant="soft" color="gray" onClick={handleResetLab} style={{ cursor: 'pointer' }}>🔄 {t('ae.resetDefault', '恢复默认')}</Button>
					<Button size="1" variant="soft" color="indigo" onClick={handleExportPreset} style={{ cursor: 'pointer' }}>📤 {t('ae.exportPreset', '导出预设')}</Button>
					<Button size="1" variant="soft" color="cyan" onClick={handleImportPreset} style={{ cursor: 'pointer' }}>📥 {t('ae.importPreset', '导入预设')}</Button>
				</Flex>
			</Flex>
			
			<Flex gap="4" align="stretch" style={{ minHeight: '600px' }}>
				{/* --- 左侧：硬核参数控制台 --- */}
				<ScrollArea type="auto" scrollbars="vertical" style={{ flex: '0 0 500px', width: '500px', height: '600px', paddingRight: '15px' }}>
					<Flex direction="column" gap="4">
						
						{/* 🌟 新增：0. 画布合成设置 🌟 */}
						<Box><Text size="2" weight="bold" color="indigo">{t('ae.canvasSettings', '0. 画布与合成边界设置')}</Text></Box>
						<Flex gap="3" align="center">
							<Box style={{ flex: 1 }}>
								<Text size="1" color="gray" mb="1" as="div">{t('ae.resolutionPreset', '分辨率快捷预设')}</Text>
								<Select.Root 
									value={`${config.compWidth}x${config.compHeight}`} 
									onValueChange={(v) => {
										const [w, h] = v.split('x').map(Number);
										updateConfig('compWidth', w);
										updateConfig('compHeight', h);
									}}
								>
									<Select.Trigger style={{ width: '100%' }} placeholder="自定义分辨率" />
									<Select.Content>
										<Select.Item value="1920x1080">1920 × 1080 (16:9 横屏)</Select.Item>
										<Select.Item value="1080x1920">1080 × 1920 (9:16 竖屏)</Select.Item>
										<Select.Item value="2560x1440">2560 × 1440 (2K 横屏)</Select.Item>
										<Select.Item value="3840x2160">3840 × 2160 (4K 横屏)</Select.Item>
										<Select.Item value="1080x1080">1080 × 1080 (1:1 方形)</Select.Item>
									</Select.Content>
								</Select.Root>
							</Box>
							<Box>
								<Text size="1" color="gray" mb="1" as="div">{t('ae.compWidth', '宽度 (px)')}</Text>
								<input type="number" value={config.compWidth} onChange={(e) => updateConfig('compWidth', Number(e.target.value))} style={numberInputStyle} />
							</Box>
							<Box>
								<Text size="1" color="gray" mb="1" as="div">{t('ae.compHeight', '高度 (px)')}</Text>
								<input type="number" value={config.compHeight} onChange={(e) => updateConfig('compHeight', Number(e.target.value))} style={numberInputStyle} />
							</Box>
						</Flex>

						<Separator size="4" my="2" />

						{/* 1. 视觉排版样式 */}
						<Box><Text size="2" weight="bold" color="indigo">{t('ae.visualStyle', '1. 视觉排版样式')}</Text></Box>
						<Flex gap="3">
							<Box style={{ flex: 1 }}>
								<Flex justify="between" mb="1"><Text size="1" color="gray">{t('ae.mainFontSize', '主歌词字号')}</Text><Text size="1">{config.mainFontSize}</Text></Flex>
								<Slider value={[config.mainFontSize]} onValueChange={(v) => updateConfig('mainFontSize', v[0])} min={40} max={150} />
							</Box>
							<Box style={{ flex: 1 }}>
								<Flex justify="between" mb="1"><Text size="1" color="gray">{t('ae.subFontSize', '翻译字号')}</Text><Text size="1">{config.subFontSize}</Text></Flex>
								<Slider value={[config.subFontSize]} onValueChange={(v) => updateConfig('subFontSize', v[0])} min={20} max={100} />
							</Box>
						</Flex>
						<Flex gap="3">
							<Box style={{ flex: 1 }}>
								<Flex justify="between" mb="1"><Text size="1" color="gray">{t('ae.letterSpacing', '字间距 (Tracking)')}</Text><Text size="1">{config.letterSpacing}</Text></Flex>
								<Slider value={[config.letterSpacing]} onValueChange={(v) => updateConfig('letterSpacing', v[0])} min={0} max={20} step={1} />
							</Box>
							<Box style={{ flex: 1 }}>
								<Flex justify="between" mb="1"><Text size="1" color="gray">{t('ae.verticalOffset', '翻译 Y 轴偏移')}</Text><Text size="1">{config.verticalOffset}px</Text></Flex>
								<Slider value={[config.verticalOffset]} onValueChange={(v) => updateConfig('verticalOffset', v[0])} min={0} max={200} />
							</Box>
						</Flex>
						<Flex gap="4" align="center" mt="1">
							<Flex gap="2" align="center">
								<Switch size="1" checked={config.enableStroke} onCheckedChange={(v) => updateConfig('enableStroke', v)} style={{ cursor: 'pointer' }} />
								<Text size="2" color="gray">{t('ae.enableStroke', '文字描边')}</Text>
							</Flex>
							{config.enableStroke && (
								<Box style={{ flex: 1 }}>
									<Slider value={[config.strokeWidth]} onValueChange={(v) => updateConfig('strokeWidth', v[0])} min={1} max={10} />
								</Box>
							)}
						</Flex>

						<Separator size="4" my="2" />

						{/* 2. 动画与空间 */}
						<Box>
							<Flex justify="between" align="center">
								<Text size="2" weight="bold" color="indigo">{t('ae.animationSpace', '2. 动画与空间系统')}</Text>
								{config.isGodMode && <Text size="1" color="amber" weight="bold">⚠️ {t('ae.godModeActive', '上帝模式接管中')}</Text>}
							</Flex>
						</Box>
						<Box style={{ opacity: config.isGodMode ? 0.3 : 1, pointerEvents: config.isGodMode ? 'none' : 'auto', transition: 'all 0.3s' }}>
							<Box mb="4">
								<Flex justify="between" mb="2" align="center"><Text size="2" color="gray">{t('ae.lineSpacing', '上下行间距')}</Text><input type="number" value={config.lineSpacing} onChange={(e) => updateConfig('lineSpacing', Number(e.target.value))} style={numberInputStyle} /></Flex>
								<Slider value={[config.lineSpacing]} onValueChange={(v) => updateConfig('lineSpacing', v[0])} min={50} max={600} step={1} />
							</Box>
							<Box mb="4">
								<Flex justify="between" mb="2" align="center"><Text size="2" color="gray">{t('ae.lifeTime', '单行可视存活时间(秒)')}</Text><input type="number" value={config.lifeTime} onChange={(e) => updateConfig('lifeTime', Number(e.target.value))} style={numberInputStyle} /></Flex>
								<Slider value={[config.lifeTime]} onValueChange={(v) => updateConfig('lifeTime', v[0])} min={5} max={60} step={1} />
							</Box>
							<Box mb="4">
								<Flex justify="between" mb="2" align="center"><Text size="2" color="gray">{t('ae.fovThreshold', '视野渲染阈值(距离中心)')}</Text><input type="number" value={config.fovThreshold} onChange={(e) => updateConfig('fovThreshold', Number(e.target.value))} style={numberInputStyle} /></Flex>
								<Slider value={[config.fovThreshold]} onValueChange={(v) => updateConfig('fovThreshold', v[0])} min={200} max={3000} step={10} />
							</Box>
							<Flex gap="3" mb="4">
								<Box style={{ flex: 1 }}>
									<Text size="1" color="gray" mb="1" as="div">{t('ae.baseMotionType', '基础出入场动效')}</Text>
									<Select.Root value={config.baseMotionType} onValueChange={(v) => updateConfig('baseMotionType', v)}>
										<Select.Trigger style={{ width: '100%' }} />
										<Select.Content>
											<Select.Item value="none">{t('ae.motionNone', '直接出现')}</Select.Item>
											<Select.Item value="fade-up">{t('ae.motionFadeUp', '向上浮出')}</Select.Item>
											<Select.Item value="pop-in">{t('ae.motionPopIn', '缩放弹出')}</Select.Item>
										</Select.Content>
									</Select.Root>
								</Box>
								<Box style={{ flex: 1 }}>
									<Text size="1" color="gray" mb="1" as="div">{t('ae.easingCurve', '缓动曲线')}</Text>
									<Select.Root value={config.easingCurve} onValueChange={(v) => updateConfig('easingCurve', v)}>
										<Select.Trigger style={{ width: '100%' }} />
										<Select.Content>
											<Select.Item value="ease-out">Ease Out</Select.Item>
											<Select.Item value="ease-in-out">Ease In Out</Select.Item>
											<Select.Item value="cubic-bezier(0.175, 0.885, 0.32, 1.275)">Bounce</Select.Item>
										</Select.Content>
									</Select.Root>
								</Box>
							</Flex>
							<Flex gap="3">
								<Box style={{ flex: 1 }}>
									<Flex justify="between" mb="1"><Text size="1" color="gray">{t('ae.animDuration', '动画时长 (秒)')}</Text><Text size="1">{config.animDuration}</Text></Flex>
									<Slider value={[config.animDuration]} onValueChange={(v) => updateConfig('animDuration', v[0])} min={0.1} max={3} step={0.1} />
								</Box>
								<Box style={{ flex: 1 }}>
									<Flex justify="between" mb="1"><Text size="1" color="gray">{t('ae.charDelay', '逐字出现延迟 (秒)')}</Text><Text size="1">{config.charDelay}</Text></Flex>
									<Slider value={[config.charDelay]} onValueChange={(v) => updateConfig('charDelay', v[0])} min={0} max={0.5} step={0.01} />
								</Box>
							</Flex>
						</Box>

						<Separator size="4" my="2" />

						{/* 3. 特效参数 */}
						<Box><Text size="2" weight="bold" color={enableEffects ? "indigo" : "gray"}>{t('ae.globalEffects', '3. 全局视觉特效 (开启特效生效)')}</Text></Box>
						<Box style={{ opacity: enableEffects ? 1 : 0.4, pointerEvents: enableEffects ? 'auto' : 'none' }}>
							<Box mb="4">
								<Flex justify="between" mb="1"><Text size="1" color="gray">{t('ae.glowIntensity', '发光强度')}</Text><Text size="1">{config.glowIntensity}</Text></Flex>
								<Slider value={[config.glowIntensity]} onValueChange={(v) => updateConfig('glowIntensity', v[0])} min={0} max={100} />
							</Box>
							<Box>
								<Flex justify="between" mb="1"><Text size="1" color="gray">{t('ae.blurRadius', '高斯模糊最大半径')}</Text><Text size="1">{config.blurRadius}px</Text></Flex>
								<Slider value={[config.blurRadius]} onValueChange={(v) => updateConfig('blurRadius', v[0])} min={0} max={50} />
							</Box>
						</Box>
					</Flex>
				</ScrollArea>

				{/* --- 右侧：预览画板 --- */}
				<Box style={{ flex: '1', backgroundColor: '#111113', backgroundImage: config.showGrid ? 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)' : 'none', backgroundSize: '20px 20px', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
					{config.isGodMode && (
						<Box style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, opacity: 0.1 }}>
							<Text size="9" weight="bold" style={{ color: 'var(--jade-9)', whiteSpace: 'nowrap' }}>GOD MODE</Text>
						</Box>
					)}
					<Flex align="center" justify="center" style={{ height: '100%', position: 'relative', zIndex: 1 }}>
						<AEPreviewBoard
							activeIdxFloat={lowerActiveIdx} spacing={config.lineSpacing} fov={config.fovThreshold}
							life={config.lifeTime} useEffects={enableEffects} motionType={config.baseMotionType}
							totalLines={config.previewLines} scale={config.previewScale} isStandard={true}
						/>
					</Flex>
					<Flex gap="4" align="center" style={{ position: 'absolute', bottom: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '6px', backdropFilter: 'blur(4px)', zIndex: 2 }}>
						<Flex gap="2" align="center">
							<Switch size="1" checked={config.showGrid} onCheckedChange={(v) => updateConfig('showGrid', v)} />
							<Text size="1" color="gray">{t('ae.grid', '网格')}</Text>
						</Flex>
						<Box style={{ width: '80px' }}>
							<Slider value={[config.previewScale]} onValueChange={(v) => updateConfig('previewScale', v[0])} min={0.1} max={1} step={0.05} />
						</Box>
						<Text size="1" color="gray">{t('ae.scale', '比例')}: {config.previewScale.toFixed(2)}</Text>
					</Flex>
					<Box style={{ position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', zIndex: 2 }}>
						<Flex align="center" gap="2">
							<Text size="1" color="gray">{t('ae.previewLines', '预览行数')}</Text>
							<input type="number" value={config.previewLines} onChange={(e) => updateConfig('previewLines', Number(e.target.value))} style={{ ...numberInputStyle, width: '50px', padding: '0', backgroundColor: 'transparent', border: 'none', color: 'white' }} />
						</Flex>
					</Box>
				</Box>
			</Flex>
		</Card>
	);
}