// 文件路径：src/modules/ae-exporter/components/parts/AESpatialStage.tsx
import { Box, Flex, Text, Button, Tooltip } from '@radix-ui/themes';
import { useAtom, useAtomValue } from 'jotai';
import React, { useRef } from 'react';

import { aeConfigAtom } from '$/states/aeConfig';
import { activeNodeIdAtom, activeTrackIdAtom, spatialDataAtom, spatialDataMapAtom, activeRoleIdAtom, roleSystemAtom, type SpatialNode, type TrackSpatial } from '$/states/spatial';
import AENode from './AENode';
import { getRoleColors } from './AENodeToolbar';
import AETransitionCanvasPoint from './AETransitionCanvasPoint'; // 🌟 引入新组件
import AEMathTrajectory from './AEMathTrajectory'; // 🌟 引入数学轨迹组件
type ExtendedConfig = { width?: number; height?: number; mathEquation?: string; mathScale?: number; mathRot?: number; mathOffsetX?: number; mathOffsetY?: number; };

export default function AESpatialStage() {
	const [data, setData] = useAtom(spatialDataAtom);
	const dataMap = useAtomValue(spatialDataMapAtom); 
	const [activeRoleId, setActiveRoleId] = useAtom(activeRoleIdAtom);
	const roleSystem = useAtomValue(roleSystemAtom);

	const [activeTrackId] = useAtom(activeTrackIdAtom);
	const [, setActiveNodeId] = useAtom(activeNodeIdAtom);
	
	const [rawConfig] = useAtom(aeConfigAtom);
	// 🌟 补上 previewScale 和 mathEquation 的类型定义
	const config = rawConfig as typeof rawConfig & ExtendedConfig & { previewScale?: number | string; mathEquation?: string; };
	const stageWidth = config.width || 1920;
	const stageHeight = config.height || 1080;
	const isLandscape = stageWidth >= stageHeight;

	// 🌟 安全地解析缩放比例，防空值或 NaN 卡死，默认 65
	const parsedScale = typeof config.previewScale === 'number' ? config.previewScale : 65;
	const safeScale = Math.max(10, Math.min(100, parsedScale || 65));
	const scaleStr = `${safeScale}%`;

	const stageRef = useRef<HTMLDivElement>(null);

	const activeFolder = roleSystem.folders.find(f => f.id === roleSystem.activeFolderId) || roleSystem.folders[0];
	const roleIds = Array.from({ length: roleSystem.slotCount }, (_, i) => String(i + 1));

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

	// 🌟 连线引擎升级：废除限制，让包括台后角色在内的所有虚线一起流动！
	const renderLines = (trackId: 'main' | 'sub' | 'ruby', track: TrackSpatial, color: string, isActiveRole: boolean) => {
		if (!track.visible) return null;
		const points: SpatialNode[] = [];
		if (track.in) points.push(track.in);
		points.push(...track.preFocus);
		if (track.focus) points.push(track.focus);
		points.push(...track.postFocus);
		if (track.out) points.push(track.out);

		const lines = [];
		for (let i = 0; i < points.length - 1; i++) {
			const startP = points[i];
			const endP = points[i+1];
			lines.push(
				<line 
					key={`line-${trackId}-${i}`}
					x1={`${startP.x}%`} y1={`${startP.y}%`} 
					x2={`${endP.x}%`} y2={`${endP.y}%`} 
					stroke={color} 
					strokeWidth={isActiveRole ? "2.5" : "1.5"} 
					strokeDasharray={isActiveRole ? "8 8" : "4 4"} 
					opacity={isActiveRole ? 1 : 0.6} 
					className="amll-flowing-line" 
				/>
			);
		}
		return <g>{lines}</g>;
	};

	// 🌟 独立的转场控制点渲染引擎 (生成 HTML 元素，绝对定位在 SVG 上层)
	const renderTransitionPoints = (trackId: 'main' | 'sub' | 'ruby', track: TrackSpatial, color: string, isActiveRole: boolean) => {
		if (!track.visible || !isActiveRole) return null; // 仅为当前活跃角色渲染控制点
		const points: SpatialNode[] = [];
		if (track.in) points.push(track.in);
		points.push(...track.preFocus);
		if (track.focus) points.push(track.focus);
		points.push(...track.postFocus);
		if (track.out) points.push(track.out);

		const nodes = [];
		for (let i = 0; i < points.length - 1; i++) {
			const startP = points[i];
			const endP = points[i+1];
			nodes.push(
				<AETransitionCanvasPoint 
					key={`tp-${trackId}-${i}`}
					trackId={trackId} // 🌟 发放身份牌：明确告诉控制点自己到底是哪条轨道的
					targetNodeId={endP.id} 
					startPos={{x: Number(startP.x), y: Number(startP.y)}}
					endPos={{x: Number(endP.x), y: Number(endP.y)}}
					color={color} isActive={isActiveRole} stageRef={stageRef as React.RefObject<HTMLDivElement>}
				/>
			);
		}
		return nodes;
	};

	// 🌟 残影引擎升级：加入实体底色和粗虚线，彻底杜绝重叠看不清的问题
	const renderInactiveNodes = (roleId: string, trackId: 'main' | 'sub' | 'ruby', track: TrackSpatial, color: string) => {
		if (!track.visible) return null;
		const points: SpatialNode[] = [];
		if (track.in) points.push(track.in);
		points.push(...track.preFocus);
		if (track.focus) points.push(track.focus);
		points.push(...track.postFocus);
		if (track.out) points.push(track.out);

		return points.map(n => (
			<div key={`inactive-${roleId}-${trackId}-${n.id}`} style={{
				position: 'absolute', left: `${n.x}%`, top: `${n.y}%`,
				width: `${n.width}px`, height: `${n.height}px`,
				transform: `translate(-50%, -50%) rotate(${n.rot}deg)`,
				backgroundColor: 'var(--gray-3)', // 🌟 实体底色，阻挡背后的网格线
				borderRadius: '8px',
				pointerEvents: 'none', // 绝对不可触摸
				display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', overflow: 'hidden',
				border: `2px dashed ${color}`, // 🌟 粗虚线边框
				opacity: 0.7, // 🌟 极高可见度
				zIndex: 2,
				boxShadow: `0 0 10px ${color}40` // 加入微光晕
			}}>
				<Text size="1" weight="bold" style={{ color: color, textOverflow: 'ellipsis' }}>{n.text}</Text>
			</div>
		));
	};

	const renderActiveTrackNodes = (trackId: 'main' | 'sub' | 'ruby', color: string) => {
		const track = data[trackId];
		const nodes = [];
		const ref = stageRef as React.RefObject<HTMLDivElement>;
		const prefix = `${activeRoleId}-${trackId}`;

		if (track.in) nodes.push(<AENode key={`${prefix}-in`} trackId={trackId} nodeId="in" color={color} stageRef={ref} />);
		for (const n of track.preFocus) nodes.push(<AENode key={`${prefix}-${n.id}`} trackId={trackId} nodeId={n.id} color={color} stageRef={ref} />);
		if (track.focus) nodes.push(<AENode key={`${prefix}-focus`} trackId={trackId} nodeId="focus" color={color} stageRef={ref} />);
		for (const n of track.postFocus) nodes.push(<AENode key={`${prefix}-${n.id}`} trackId={trackId} nodeId={n.id} color={color} stageRef={ref} />);
		if (track.out) nodes.push(<AENode key={`${prefix}-out`} trackId={trackId} nodeId="out" color={color} stageRef={ref} />);
		return nodes;
	};

	return (
		<Flex direction="column" gap="3" style={{ height: '100%', width: '100%', minWidth: 0, overflow: 'hidden' }}>
			<style>{`
				@keyframes amllFlowLine {
					from { stroke-dashoffset: 0; }
					to { stroke-dashoffset: -24; }
				}
				.amll-flowing-line {
					animation: amllFlowLine 1s linear infinite;
				}
			`}</style>

			{/* 🌟 终极布局绝杀：使用 Grid 魔法彻底斩断 Flex 宽度向外撑爆的诅咒 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', width: '100%', flexShrink: 0 }}>
				<div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin' }}>
					{roleIds.map(id => {
						const customName = activeFolder.roles[parseInt(id, 10)-1];
						const displayName = customName || (id === '1' ? '主唱' : `角色 ${id}`);
						const isActive = id === activeRoleId;
						const colors = getRoleColors(id);
						return (
							<Button
								key={id} size="2" variant={isActive ? "solid" : "soft"}
								onClick={() => setActiveRoleId(id)}
								style={{
									cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease',
									backgroundColor: isActive ? colors.main : undefined,
									color: isActive ? 'white' : colors.main,
									border: isActive ? 'none' : `1px solid ${colors.main}50`,
									boxShadow: isActive ? `0 2px 10px ${colors.main}50` : 'none'
								}}
							>
								<Tooltip content={`切换至画板：${displayName}`}>
									<Flex align="center" gap="2">
										<Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isActive ? 'white' : colors.main }} />
										{displayName}
									</Flex>
								</Tooltip>
							</Button>
						);
					})}
				</div>
			</div>
			
			<Box style={{ position: 'relative', flex: 1, minHeight: 0, backgroundColor: 'var(--gray-2)', borderRadius: '8px', border: '1px solid var(--gray-6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflow: 'hidden' }}>
				<div 
					ref={stageRef} 
					style={{ 
						position: 'relative', 
						aspectRatio: `${stageWidth} / ${stageHeight}`,
						// 🌟 核心：接入刚才计算好的动态 scaleStr
						width: isLandscape ? scaleStr : 'auto',
						height: isLandscape ? 'auto' : scaleStr,
						maxWidth: scaleStr,
						maxHeight: scaleStr,
						border: '2px solid var(--gray-8)',
						backgroundColor: 'var(--gray-3)',
						boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
						overflow: 'visible'
					}}
					onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
					onDrop={handleDrop}
				>
					<svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 0 }}>
						<line x1="50%" y1="0%" x2="50%" y2="100%" stroke="var(--accent-a7)" strokeWidth="1" strokeDasharray="6 6" />
						<line x1="0%" y1="50%" x2="100%" y2="50%" stroke="var(--accent-a7)" strokeWidth="1" strokeDasharray="6 6" />
						
						{/* 🌟 渲染数学公式轨迹 */}
						<AEMathTrajectory equation={config.mathEquation} scale={config.mathScale || 1} rot={config.mathRot || 0} offsetX={config.mathOffsetX || 0} offsetY={config.mathOffsetY || 0} />

						{Object.entries(dataMap).map(([rId, roleData]) => {
							const colors = getRoleColors(rId);
							const isActive = rId === activeRoleId;
							return (
								<g key={`lines-role-${rId}`}>
									{renderLines('main', roleData.main, colors.main, isActive)}
									{renderLines('sub', roleData.sub, colors.sub, isActive)}
									{renderLines('ruby', roleData.ruby, colors.ruby, isActive)}
								</g>
							);
						})}
					</svg>

					{Object.entries(dataMap).map(([rId, roleData]) => {
						if (rId === activeRoleId) return null;
						const colors = getRoleColors(rId);
						return (
							<React.Fragment key={`inactive-nodes-${rId}`}>
								{renderInactiveNodes(rId, 'main', roleData.main, colors.main)}
								{renderInactiveNodes(rId, 'sub', roleData.sub, colors.sub)}
								{renderInactiveNodes(rId, 'ruby', roleData.ruby, colors.ruby)}
							</React.Fragment>
						);
					})}

					{renderTransitionPoints('main', data.main, getRoleColors(activeRoleId).main, true)}
					{renderTransitionPoints('sub', data.sub, getRoleColors(activeRoleId).sub, true)}
					{renderTransitionPoints('ruby', data.ruby, getRoleColors(activeRoleId).ruby, true)}

					{/* 渲染当前主宇宙的物理实体 */}
					{renderActiveTrackNodes('main', getRoleColors(activeRoleId).main)}
					{renderActiveTrackNodes('sub', getRoleColors(activeRoleId).sub)}
					{renderActiveTrackNodes('ruby', getRoleColors(activeRoleId).ruby)}
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