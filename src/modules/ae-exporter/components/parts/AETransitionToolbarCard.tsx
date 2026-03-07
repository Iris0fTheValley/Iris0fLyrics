// 文件路径：src/modules/ae-exporter/components/parts/AETransitionToolbarCard.tsx
import React, { useState } from 'react';
import { Flex, Text, Select, Slider, Box } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { spatialDataAtom, activeTrackIdAtom, type SpatialNode } from '$/states/spatial';

export default function AETransitionToolbarCard({ targetNodeId, color }: { targetNodeId: string, color: string }) {
	const [data, setData] = useAtom(spatialDataAtom);
	const [activeTrackId] = useAtom(activeTrackIdAtom);
	const track = data[activeTrackId];

	// 🌟 新增：控制卡片的折叠状态
	const [isExpanded, setIsExpanded] = useState(false);

	let targetNode: SpatialNode | null = null;
	if (track.focus?.id === targetNodeId) targetNode = track.focus;
	else if (track.out?.id === targetNodeId) targetNode = track.out;
	else targetNode = track.preFocus.find(n => n.id === targetNodeId) || track.postFocus.find(n => n.id === targetNodeId) || null;

	if (!targetNode) return null;
	const transition = targetNode.transition || { type: 'follow', ratio: 50 };

	const updateTransition = (key: 'type' | 'ratio', value: any) => {
		setData(prev => {
			const next = { ...prev };
			const t = { ...next[activeTrackId] };
			const updateNode = (n: SpatialNode) => n.id === targetNodeId ? { ...n, transition: { ...transition, [key]: value } } : n;
			if (t.focus) t.focus = updateNode(t.focus);
			if (t.out) t.out = updateNode(t.out);
			t.preFocus = t.preFocus.map(updateNode);
			t.postFocus = t.postFocus.map(updateNode);
			return { ...next, [activeTrackId]: t };
		});
	};

	const typeLabels: Record<string, string> = {
		'follow': '🌊 全局跟随',
		'hold': '⚡ 机械折角',
		'delay': '⏳ 延迟漂移'
	};

	return (
		<Flex direction="column" align="center" style={{ margin: '-4px 0', zIndex: 1, position: 'relative' }}>
			<Box style={{ width: '2px', height: '12px', backgroundColor: `${color}80` }} />
			
			{/* 🌟 默认的极简胶囊按钮，点击展开详细设置 */}
			<Flex 
				align="center" gap="2" 
				onClick={() => setIsExpanded(!isExpanded)}
				style={{ 
					backgroundColor: 'var(--gray-3)', padding: '4px 12px', borderRadius: '12px', 
					border: `1px solid ${color}60`, cursor: 'pointer', userSelect: 'none',
					boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'background-color 0.2s'
				}}
			>
				<Text size="1" color="gray" weight="bold">转场:</Text>
				<Text size="1" style={{ color: color }}>{typeLabels[transition.type]}</Text>
				<Text size="1" color="gray" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</Text>
			</Flex>

			{/* 🌟 展开后的控制面板 */}
			{isExpanded && (
				<Flex direction="column" gap="2" mt="2" style={{ backgroundColor: 'var(--gray-2)', padding: '8px 12px', borderRadius: '8px', border: `1px dashed ${color}80`, width: '85%' }}>
					<Flex justify="between" align="center">
						<Text size="1" color="gray" weight="bold">↳ 模式选择</Text>
						<Select.Root size="1" value={transition.type} onValueChange={(v) => updateTransition('type', v)}>
							<Select.Trigger style={{ width: '110px' }} />
							<Select.Content>
								<Select.Item value="follow">🌊 全局跟随</Select.Item>
								<Select.Item value="hold">⚡ 机械折角</Select.Item>
								<Select.Item value="delay">⏳ 延迟漂移</Select.Item>
							</Select.Content>
						</Select.Root>
					</Flex>
					
					{transition.type === 'delay' && (
						<Flex align="center" gap="3" mt="1">
							<Text size="1" color="gray">触发点</Text>
							<Slider size="1" min={10} max={90} step={1} value={[transition.ratio]} onValueChange={([v]) => updateTransition('ratio', v)} style={{ flex: 1 }} />
							<Text size="1" color="gray">{Math.round(transition.ratio)}%</Text>
						</Flex>
					)}
				</Flex>
			)}
			
			<Box style={{ width: '2px', height: '12px', backgroundColor: `${color}80` }} />
		</Flex>
	);
}