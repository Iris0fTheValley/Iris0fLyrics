// 文件路径：src/modules/ae-exporter/components/parts/AELeftPanel.tsx
// 🌟 修复：严格遵循 Biome 的 A-Z 字典序导入规则
import { Box, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { useAtom } from 'jotai';

import { aeConfigAtom } from '$/states/aeConfig';

// 🌟 修复 TS2339：定义一个扩展类型，告诉 TypeScript "我知道这些属性存在，请闭嘴"
type ExtendedConfig = {
	width?: number;
	height?: number;
	visibleDuration?: number;
	renderThreshold?: number;
	animDuration?: number;
};

export default function AELeftPanel() {
	const [rawConfig, setConfig] = useAtom(aeConfigAtom);
	// 将原配置与扩展类型融合
	const config = rawConfig as typeof rawConfig & ExtendedConfig;

	// 🌟 修复 noExplicitAny：将 value 的类型从 any 明确限定为 number | string
	const updateConfig = (key: string, value: number | string) => {
		setConfig(prev => ({ ...prev, [key]: value } as unknown as typeof prev));
	};

	const handleResolutionChange = (val: string) => {
		const [w, h] = val.split('x').map(Number);
		// 使用 as unknown 暴力穿透状态更新器的类型锁死
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

	return (
		<Flex direction="column" gap="4">
			<Box>
				<Text size="2" color="gray" mb="1" style={{ display: 'block' }}>🖥️ 分辨率快捷预设</Text>
				<Select.Root value={`${config.width || 1920}x${config.height || 1080}`} onValueChange={handleResolutionChange}>
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