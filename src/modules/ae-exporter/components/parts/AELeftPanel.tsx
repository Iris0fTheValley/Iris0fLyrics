// 文件路径：src/modules/ae-exporter/components/parts/AELeftPanel.tsx
import { Box, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { useAtom } from 'jotai';

import { aeConfigAtom } from '$/states/aeConfig';

type ExtendedConfig = {
	width?: number;
	height?: number;
	visibleDuration?: number;
	renderThreshold?: number;
	animDuration?: number;
	layoutMode?: 'horizontal' | 'vertical'; // 🌟 剔除 diagonal
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

	const handleNumChange = (key: string, value: string) => {
		const parsed = parseFloat(value);
		if (!Number.isNaN(parsed)) {
			updateConfig(key, parsed);
		} else if (value === '') {
			updateConfig(key, '');
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
					value={config.animDuration || 0.6} 
					onChange={(e) => handleNumChange('animDuration', e.target.value)} 
				/>
			</Box>

			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>👁️ 单行可视存活时间 (秒)</Text>
				<TextField.Root 
					type="number" step="0.5" 
					value={config.visibleDuration || 5.0} 
					onChange={(e) => handleNumChange('visibleDuration', e.target.value)} 
				/>
			</Box>

			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>🔲 视野渲染阈值 (距离中心)</Text>
				<TextField.Root 
					type="number" step="100" 
					value={config.renderThreshold || 2000} 
					onChange={(e) => handleNumChange('renderThreshold', e.target.value)} 
				/>
			</Box>
		</Flex>
	);
}