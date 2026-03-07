// 文件路径：src/modules/ae-exporter/components/parts/AELeftPanel.tsx
import { Box, Flex, Select, Text, TextField, Slider, Tooltip, Separator } from '@radix-ui/themes';
import { useAtom } from 'jotai';

import { aeConfigAtom } from '$/states/aeConfig';

type ExtendedConfig = {
	width?: number;
	height?: number;
	visibleDuration?: number;
	renderThreshold?: number;
	animDuration?: number;
	layoutMode?: 'horizontal' | 'vertical'; 
	previewScale?: number | string; // 🌟 新增：画板外延视野缩放比例 (允许 string 是为了防卡死)
};

export default function AELeftPanel() {
	const [rawConfig, setConfig] = useAtom(aeConfigAtom);
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
					<Text size="2" color="gray" style={{ display: 'block' }}>🖥️ 分辨率快捷预设</Text>
					<Text size="1" weight="bold" color="jade">比例 {getRatioText(currentWidth, currentHeight)}</Text>
				</Flex>
				<Select.Root value={`${currentWidth}x${currentHeight}`} onValueChange={handleResolutionChange}>
					<Select.Trigger style={{ width: '100%' }} />
					<Select.Content>
						<Select.Item value="1920x1080">1920 x 1080 (横屏 1080p)</Select.Item>
						<Select.Item value="1080x1920">1080 x 1920 (竖屏 1080p)</Select.Item>
						<Select.Item value="3840x2160">3840 x 2160 (横屏 4K)</Select.Item>
						<Select.Item value="2160x3840">2160 x 3840 (竖屏 4K)</Select.Item>
					</Select.Content>
				</Select.Root>
			</Box>

			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>🔤 文本排版架构</Text>
				<Select.Root value={config.layoutMode || 'horizontal'} onValueChange={(val) => updateConfig('layoutMode', val)}>
					<Select.Trigger style={{ width: '100%' }} />
					<Select.Content>
						<Select.Item value="horizontal">横向排布 (默认)</Select.Item>
						<Select.Item value="vertical">竖向排布 (古风居中)</Select.Item>
					</Select.Content>
				</Select.Root>
			</Box>

			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>⏱️ 动画时长 (秒)</Text>
				<TextField.Root 
					type="number" step="0.1" 
					value={config.animDuration !== undefined ? config.animDuration : 0.6} 
					onChange={(e) => handleNumChange('animDuration', e.target.value)} 
				/>
			</Box>

			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>👁️ 单行可视存活时间 (秒)</Text>
				<TextField.Root 
					type="number" step="0.5" 
					value={config.visibleDuration !== undefined ? config.visibleDuration : 5.0} 
					onChange={(e) => handleNumChange('visibleDuration', e.target.value)} 
				/>
			</Box>

			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>🔲 视野渲染阈值 (距离中心)</Text>
				<TextField.Root 
					type="number" step="100" 
					value={config.renderThreshold !== undefined ? config.renderThreshold : 2000} 
					onChange={(e) => handleNumChange('renderThreshold', e.target.value)} 
				/>
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

		</Flex>
	);
}