// 文件路径：src/modules/ae-exporter/components/parts/AESpatialStage.tsx
// 🌟 修复 4: 按照 Biome 的严格要求重新排序 import
import { Box, Flex, Text } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { useRef } from 'react';

import { activeNodeIdAtom, activeTrackIdAtom, spatialDataAtom, type SpatialNode } from '$/states/spatial';
import AENode from './AENode';

export default function AESpatialStage() {
	const [data, setData] = useAtom(spatialDataAtom);
	const [activeTrackId] = useAtom(activeTrackIdAtom);
	const [, setActiveNodeId] = useAtom(activeNodeIdAtom);
	const stageRef = useRef<HTMLDivElement>(null);

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const nodeType = e.dataTransfer.getData('application/amll-node-type');
		if (!nodeType || !stageRef.current) return;

		const rect = stageRef.current.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		const id = nodeType === 'preFocus' || nodeType === 'postFocus' ? `${nodeType}_${Date.now()}` : nodeType;

		setData(prev => {
			const track = { ...prev[activeTrackId] };
			
			const trackPrefix = activeTrackId === 'main' ? '主歌词' : activeTrackId === 'sub' ? '翻译' : '音译';
			let text = '';
			if (nodeType === 'in') text = `${trackPrefix}入场点`;
			else if (nodeType === 'out') text = `${trackPrefix}离场点`;
			else if (nodeType === 'focus') text = `${trackPrefix}定点焦点`;
			else if (nodeType === 'preFocus') text = `${trackPrefix}先焦点 (${track.preFocus.length + 1})`;
			else if (nodeType === 'postFocus') text = `${trackPrefix}次焦点 (${track.postFocus.length + 1})`;

			const newNode: SpatialNode = { id, x, y, rot: 0, width: 140, height: 36, text };

			if (nodeType === 'preFocus') {
				track.preFocus = [...track.preFocus, newNode];
			} else if (nodeType === 'postFocus') {
				track.postFocus = [...track.postFocus, newNode];
			} else {
				// 🌟 修复 3: 移除 as any，使用严格的类型限定，安抚 Biome
				const key = nodeType as 'in' | 'focus' | 'out';
				track[key] = newNode;
			}
			
			return { ...prev, [activeTrackId]: track };
		});
		setActiveNodeId(id);
	};

	const renderLines = (trackId: 'main' | 'sub' | 'ruby', color: string) => {
		const track = data[trackId];
		if (!track.visible) return null;

		const points: SpatialNode[] = [];
		if (track.in) points.push(track.in);
		points.push(...track.preFocus);
		if (track.focus) points.push(track.focus);
		points.push(...track.postFocus);
		if (track.out) points.push(track.out);

		const lines = [];
		for (let i = 0; i < points.length - 1; i++) {
			lines.push(
				<line 
					key={`${trackId}-line-${i}`} 
					x1={`${points[i].x}%`} y1={`${points[i].y}%`} 
					x2={`${points[i+1].x}%`} y2={`${points[i+1].y}%`} 
					stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity={0.6} 
				/>
			);
		}
		return <g>{lines}</g>;
	};

	const renderTrackNodes = (trackId: 'main' | 'sub' | 'ruby', color: string) => {
		const track = data[trackId];
		const nodes = [];
		
		// 🌟 修复 1: TypeScript 类型强转。明确告诉 TS 这里的 ref 绝对不是 null
		const ref = stageRef as React.RefObject<HTMLDivElement>;

		if (track.in) nodes.push(<AENode key="in" trackId={trackId} nodeId="in" color={color} stageRef={ref} />);
		
		// 🌟 修复 2: 放弃使用 forEach，改用 for...of 循环，彻底解决返回值警告
		for (const n of track.preFocus) {
			nodes.push(<AENode key={n.id} trackId={trackId} nodeId={n.id} color={color} stageRef={ref} />);
		}
		
		if (track.focus) nodes.push(<AENode key="focus" trackId={trackId} nodeId="focus" color={color} stageRef={ref} />);
		
		for (const n of track.postFocus) {
			nodes.push(<AENode key={n.id} trackId={trackId} nodeId={n.id} color={color} stageRef={ref} />);
		}
		
		if (track.out) nodes.push(<AENode key="out" trackId={trackId} nodeId="out" color={color} stageRef={ref} />);
		
		return nodes;
	};

	return (
		<Flex direction="column" gap="3" style={{ height: '100%' }}>
			<Box style={{ flex: 1, position: 'relative', backgroundColor: 'var(--gray-2)', borderRadius: '8px', border: '1px solid var(--gray-6)', overflow: 'hidden' }}>
				<div 
					ref={stageRef} style={{ position: 'absolute', inset: '10%', border: '1px dashed var(--gray-7)' }}
					onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
					onDrop={handleDrop}
				>
					<svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
						{renderLines('main', '#7799CC')}
						{renderLines('sub', '#FFDD88')}
						{renderLines('ruby', '#779977')}
					</svg>

					{renderTrackNodes('main', '#7799CC')}
					{renderTrackNodes('sub', '#FFDD88')}
					{renderTrackNodes('ruby', '#779977')}
				</div>
				{!data.main.focus && !data.main.in && (
					<Flex align="center" justify="center" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
						<Text size="3" color="gray" style={{ opacity: 0.5 }}>请从右侧工具箱拖入节点以开始编排</Text>
					</Flex>
				)}
			</Box>
		</Flex>
	);
}