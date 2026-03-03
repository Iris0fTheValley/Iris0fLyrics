// 文件路径：src/modules/ae-exporter/components/parts/AESpatialStage.tsx
import { Box, Flex, Text } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { useRef } from 'react';

import { aeConfigAtom } from '$/states/aeConfig';
import { activeNodeIdAtom, activeTrackIdAtom, spatialDataAtom, type SpatialNode } from '$/states/spatial';
import AENode from './AENode';

type ExtendedConfig = { width?: number; height?: number; };

export default function AESpatialStage() {
	const [data, setData] = useAtom(spatialDataAtom);
	const [activeTrackId] = useAtom(activeTrackIdAtom);
	const [, setActiveNodeId] = useAtom(activeNodeIdAtom);
	
	const [rawConfig] = useAtom(aeConfigAtom);
	const config = rawConfig as typeof rawConfig & ExtendedConfig;
	const stageWidth = config.width || 1920;
	const stageHeight = config.height || 1080;
	const isLandscape = stageWidth >= stageHeight;

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

			if (nodeType === 'preFocus') track.preFocus = [...track.preFocus, newNode];
			else if (nodeType === 'postFocus') track.postFocus = [...track.postFocus, newNode];
			else {
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
		const ref = stageRef as React.RefObject<HTMLDivElement>;

		if (track.in) nodes.push(<AENode key="in" trackId={trackId} nodeId="in" color={color} stageRef={ref} />);
		for (const n of track.preFocus) nodes.push(<AENode key={n.id} trackId={trackId} nodeId={n.id} color={color} stageRef={ref} />);
		if (track.focus) nodes.push(<AENode key="focus" trackId={trackId} nodeId="focus" color={color} stageRef={ref} />);
		for (const n of track.postFocus) nodes.push(<AENode key={n.id} trackId={trackId} nodeId={n.id} color={color} stageRef={ref} />);
		if (track.out) nodes.push(<AENode key="out" trackId={trackId} nodeId="out" color={color} stageRef={ref} />);
		
		return nodes;
	};

	return (
		<Flex direction="column" gap="3" style={{ height: '100%' }}>
			<Box style={{ flex: 1, backgroundColor: 'var(--gray-2)', borderRadius: '8px', border: '1px solid var(--gray-6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflow: 'hidden' }}>
				<div 
					ref={stageRef} 
					style={{ 
						position: 'relative', 
						aspectRatio: `${stageWidth} / ${stageHeight}`,
						width: isLandscape ? '100%' : 'auto',
						height: isLandscape ? 'auto' : '100%',
						maxWidth: '100%',
						maxHeight: '100%',
						border: '2px solid var(--gray-8)',
						backgroundColor: 'var(--gray-3)',
						boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
						overflow: 'visible'
					}}
					onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
					onDrop={handleDrop}
				>
					<svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
						{/* 🌟 核心：绘制将画板分为 4 个象限的十字中心对齐辅助线 */}
						<line x1="50%" y1="0%" x2="50%" y2="100%" stroke="var(--accent-a7)" strokeWidth="1" strokeDasharray="6 6" />
						<line x1="0%" y1="50%" x2="100%" y2="50%" stroke="var(--accent-a7)" strokeWidth="1" strokeDasharray="6 6" />

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