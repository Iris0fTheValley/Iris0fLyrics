// 文件路径：src/modules/ae-exporter/components/parts/AELeftPanel.tsx
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { Box, Flex, Select, Text, TextField, Slider, Tooltip, Separator, Switch, Button } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { aeConfigAtom } from '$/states/aeConfig';

type ExtendedConfig = {
	width?: number;
	height?: number;
	visibleDuration?: number;
	renderThreshold?: number;
	animDuration?: number;
	layoutMode?: 'horizontal' | 'vertical';
	previewScale?: number | string;
	mathEquation?: string;
	enableMathSnap?: boolean;
	mathScale?: number;
	mathRot?: number;
	mathSnapFlip?: boolean;    // 🌟 新增：切换贴合基准边
	mathOffsetX?: number;      // 🌟 新增：X轴偏移
	mathOffsetY?: number;      // 🌟 新增：Y轴偏移
	mathSnapInvert?: boolean;
};

export default function AELeftPanel() {
	const [rawConfig, setConfig] = useAtom(aeConfigAtom);
	const { t } = useTranslation();
	const config = rawConfig as typeof rawConfig & ExtendedConfig;

	const updateConfig = (key: string, value: number | string | string) => {
		setConfig(prev => ({ ...prev, [key]: value } as unknown as typeof prev));
	};

	const handleResolutionChange = (val: string) => {
		const [w, h] = val.split('x').map(Number);
		setConfig(prev => ({ ...prev, width: w, height: h } as unknown as typeof prev));
	};

	// 🌟 完美处理清空框内的防卡死逻辑
	const handleNumChange = (key: string, value: string) => {
		if (value === '') {
			updateConfig(key, ''); // 允许为空，避免删不掉最后一个字
			return;
		}
		const parsed = parseFloat(value);
		if (!Number.isNaN(parsed)) {
			updateConfig(key, parsed);
		}
	};

	const getRatioText = (w: number, h: number) => {
		const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
		const divisor = gcd(w, h);
		return `${w / divisor}:${h / divisor}`;
	};

	const currentWidth = config.width || 1920;
	const currentHeight = config.height || 1080;

	return (
		<Flex direction="column" gap="4">
			<Box>
				<Flex justify="between" align="end" mb="1">
					<Text size="2" color="gray" style={{ display: 'block' }}>{t('ae.leftPanel.resolutionPreset')}</Text>
					<Text size="1" weight="bold" color="jade">{t('ae.leftPanel.ratio')} {getRatioText(currentWidth, currentHeight)}</Text>
				</Flex>
				<Tooltip content={t('ae.leftPanel.resolutionTooltip')}>
					<Select.Root value={`${currentWidth}x${currentHeight}`} onValueChange={handleResolutionChange}>
						<Select.Trigger style={{ width: '100%' }} />
						<Select.Content>
							<Select.Item value="1920x1080">{t('ae.leftPanel.preset1920x1080')}</Select.Item>
							<Select.Item value="1080x1920">{t('ae.leftPanel.preset1080x1920')}</Select.Item>
							<Select.Item value="3840x2160">{t('ae.leftPanel.preset3840x2160')}</Select.Item>
							<Select.Item value="2160x3840">{t('ae.leftPanel.preset2160x3840')}</Select.Item>
						</Select.Content>
					</Select.Root>
				</Tooltip>
			</Box>

			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>{t('ae.leftPanel.textLayout')}</Text>
				<Tooltip content={t('ae.leftPanel.textLayoutTooltip')}>
					<Select.Root value={config.layoutMode || 'horizontal'} onValueChange={(val) => updateConfig('layoutMode', val)}>
						<Select.Trigger style={{ width: '100%' }} />
						<Select.Content>
							<Select.Item value="horizontal">{t('ae.leftPanel.layoutHorizontal')}</Select.Item>
							<Select.Item value="vertical">竖向排布 (古风居中)</Select.Item>
						</Select.Content>
					</Select.Root>
				</Tooltip>
			</Box>

			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>⏱️ 动画时长 (秒)</Text>
				<Tooltip content="设置每句歌词进入和退出的动画时间（秒）">
					<TextField.Root
						type="number" step="0.1"
						value={config.animDuration !== undefined ? config.animDuration : 0.6}
						onChange={(e) => handleNumChange('animDuration', e.target.value)}
					/>
				</Tooltip>
			</Box>

			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>👁️ 单行可视存活时间 (秒)</Text>
				<Tooltip content="设置单行歌词在屏幕上可见的持续时间（秒）">
					<TextField.Root
						type="number" step="0.5"
						value={config.visibleDuration !== undefined ? config.visibleDuration : 5.0}
						onChange={(e) => handleNumChange('visibleDuration', e.target.value)}
					/>
				</Tooltip>
			</Box>

			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>🔲 视野渲染阈值 (距离中心)</Text>
				<Tooltip content="设置距离中心多远的节点会被渲染（像素）">
					<TextField.Root
						type="number" step="100"
						value={config.renderThreshold !== undefined ? config.renderThreshold : 2000}
						onChange={(e) => handleNumChange('renderThreshold', e.target.value)}
					/>
				</Tooltip>
			</Box>

			<Separator size="4" mt="2" mb="1" />

			{/* 🌟 核心视觉隔离区：纯本地辅助功能 */}
			<Tooltip content="调整中间空间画板的外延视野大小。仅用于辅助预览画面外的节点，绝对不会影响最终导出到 AE 里的实际排版位置！">
				<Box style={{
					backgroundColor: 'var(--blue-2)',
					padding: '12px',
					borderRadius: '8px',
					border: '1px dashed var(--blue-6)',
					cursor: 'help'
				}}>
					<Text size="2" color="blue" mb="2" weight="bold" style={{ display: 'block' }}>
						🔍 画板外延视野 (仅辅助预览)
					</Text>
					<Flex gap="3" align="center">
						<Slider
							size="1" min={20} max={100} step={1}
							value={[typeof config.previewScale === 'number' ? config.previewScale : 85]}
							onValueChange={([v]) => updateConfig('previewScale', v)}
							style={{ flex: 1 }}
						/>
						<TextField.Root
							size="1" type="number"
							value={config.previewScale !== undefined ? config.previewScale : 85}
							onChange={(e) => handleNumChange('previewScale', e.target.value)}
							style={{ width: '60px' }}
						/>
						<Text size="2" color="gray">%</Text>
					</Flex>
				</Box>
			</Tooltip>

			<Separator size="4" mt="1" mb="1" />

			{/* 🌟 进阶引擎：数学轨迹发生器 */}
			<Box style={{ backgroundColor: 'var(--jade-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--jade-6)' }}>

				{/* 🌟 修复：顶部恢复极简，只保留标题和磁吸开关 */}
				<Flex justify="between" align="end" mb="2">
					<Text size="2" color="jade" weight="bold" style={{ display: 'block' }}>📐 数学函数轨迹</Text>
					<Flex gap="2" align="center">
						<Text size="1" color="gray">开启磁吸</Text>
						<Tooltip content="启用/禁用数学函数轨迹的磁吸功能">
							<Switch size="1" color="jade" checked={config.enableMathSnap !== false} onCheckedChange={(v) => updateConfig('enableMathSnap' as any, v as any)} />
						</Tooltip>
					</Flex>
				</Flex>

				{/* 方程输入框 */}
				<Tooltip content="输入数学方程定义歌词位置轨迹，使用x变量（0-100）">
					<TextField.Root
						placeholder="例如: y=0.05(x-50)^2+20"
						value={config.mathEquation || ''}
						onChange={(e) => updateConfig('mathEquation', e.target.value)}
						style={{ fontFamily: 'monospace' }}
					/>
				</Tooltip>
				<Text size="1" color="gray" mt="1" style={{ display: 'block', lineHeight: 1.4 }}>
					兼容标准数学方程或 JS 语法，变量为 x (0~100)。<br/>
					抛物线: <code>y = 0.05(x-50)^2 + 20</code><br/>
					正弦波: <code>y = sin(x * 0.1) * 20 + 50</code>
				</Text>

				{/* 缩放、旋转、位移与基准边控制杆 */}
				<Flex direction="column" gap="2" mt="3" style={{ borderTop: '1px solid var(--jade-5)', paddingTop: '10px' }}>

					<Flex gap="3" align="center">
						<Text size="1" color="gray" style={{ width: 25 }}>X 轴</Text>
						<Tooltip content="调整轨迹在X轴方向的偏移量（百分比）">
							<Slider size="1" min={-100} max={100} step={1} value={[config.mathOffsetX || 0]} onValueChange={([v]) => updateConfig('mathOffsetX', v)} style={{ flex: 1 }} />
						</Tooltip>
						<Tooltip content="精确输入X轴偏移数值（百分比）">
							<TextField.Root size="1" type="number" step={1} value={config.mathOffsetX !== undefined ? config.mathOffsetX : 0} onChange={(e) => updateConfig('mathOffsetX', parseFloat(e.target.value))} style={{ width: '60px' }} />
						</Tooltip>
						<Text size="1" color="gray" style={{ width: 10 }}>%</Text>
					</Flex>

					<Flex gap="3" align="center">
						<Text size="1" color="gray" style={{ width: 25 }}>Y 轴</Text>
						<Tooltip content="调整轨迹在Y轴方向的偏移量（百分比）">
							<Slider size="1" min={-100} max={100} step={1} value={[config.mathOffsetY || 0]} onValueChange={([v]) => updateConfig('mathOffsetY', v)} style={{ flex: 1 }} />
						</Tooltip>
						<Tooltip content="精确输入Y轴偏移数值（百分比）">
							<TextField.Root size="1" type="number" step={1} value={config.mathOffsetY !== undefined ? config.mathOffsetY : 0} onChange={(e) => updateConfig('mathOffsetY', parseFloat(e.target.value))} style={{ width: '60px' }} />
						</Tooltip>
						<Text size="1" color="gray" style={{ width: 10 }}>%</Text>
					</Flex>

					<Flex gap="3" align="center">
						<Text size="1" color="gray" style={{ width: 25 }}>大小</Text>
						<Tooltip content="调整轨迹的整体缩放比例">
							<Slider size="1" min={0.1} max={5} step={0.1} value={[config.mathScale || 1]} onValueChange={([v]) => updateConfig('mathScale', v)} style={{ flex: 1 }} />
						</Tooltip>
						<Tooltip content="精确输入缩放比例数值">
							<TextField.Root size="1" type="number" step={0.1} value={config.mathScale !== undefined ? config.mathScale : 1} onChange={(e) => updateConfig('mathScale', parseFloat(e.target.value))} style={{ width: '60px' }} />
						</Tooltip>
						<Text size="1" color="gray" style={{ width: 10 }}>x</Text>
					</Flex>

					<Flex gap="3" align="center">
						<Text size="1" color="gray" style={{ width: 25 }}>旋转</Text>
						<Tooltip content="调整轨迹的旋转角度（-180°到180°）">
							<Slider size="1" min={-180} max={180} step={1} value={[config.mathRot || 0]} onValueChange={([v]) => updateConfig('mathRot', v)} style={{ flex: 1 }} />
						</Tooltip>
						<Tooltip content="精确输入旋转角度数值">
							<TextField.Root size="1" type="number" step={1} value={config.mathRot !== undefined ? config.mathRot : 0} onChange={(e) => updateConfig('mathRot', parseFloat(e.target.value))} style={{ width: '60px' }} />
						</Tooltip>
						<Text size="1" color="gray" style={{ width: 10 }}>°</Text>
					</Flex>

					<Flex gap="3" align="center" mt="2">
						<Text size="1" color="gray" style={{ width: 60 }}>贴合基准</Text>
						<Flex align="center" gap="2">
							<Text size="1" color={!config.mathSnapFlip ? 'jade' : 'gray'}>宽边(平行)</Text>
							<Tooltip content="切换贴合基准边：宽边（平行）或高边（穿透）">
								<Switch size="1" color="jade" checked={config.mathSnapFlip === true} onCheckedChange={(v) => updateConfig('mathSnapFlip' as any, v as any)} />
							</Tooltip>
							<Text size="1" color={config.mathSnapFlip ? 'jade' : 'gray'}>高边(穿透)</Text>
						</Flex>
					</Flex>

					{/* 🌟 新增：吸附方向（翻转 180 度） */}
					<Flex gap="3" align="center" mt="2">
						<Text size="1" color="gray" style={{ width: 60 }}>吸附方向</Text>
						<Flex align="center" gap="2">
							<Text size="1" color={!config.mathSnapInvert ? 'jade' : 'gray'}>正向</Text>
							<Tooltip content="切换吸附方向：正向或反向（翻转180°）">
								<Switch size="1" color="jade" checked={config.mathSnapInvert === true} onCheckedChange={(v) => updateConfig('mathSnapInvert' as any, v as any)} />
							</Tooltip>
							<Text size="1" color={config.mathSnapInvert ? 'jade' : 'gray'}>反向(翻转)</Text>
						</Flex>
					</Flex>

					<Tooltip content="重置所有数学轨迹设置为默认值">
						<Button size="2" variant="soft" color="jade" style={{ cursor: 'pointer', width: '100%', marginTop: '8px' }} onClick={() => {
							updateConfig('mathEquation', '');
							updateConfig('mathScale', 1);
							updateConfig('mathRot', 0);
							updateConfig('mathOffsetX', 0);
							updateConfig('mathOffsetY', 0);
							updateConfig('mathSnapFlip' as any, false);
							updateConfig('mathSnapInvert' as any, false); // 🌟 重置新增的翻转状态
							updateConfig('enableMathSnap' as any, true);
						}}>
							↺ 恢复默认设置
						</Button>
					</Tooltip>

				</Flex>
			</Box>

		</Flex>
	);
}