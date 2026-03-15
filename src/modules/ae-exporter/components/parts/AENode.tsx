// 文件路径：src/modules/ae-exporter/components/parts/AENode.tsx
import { Text } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { useRef } from 'react';
import Moveable from 'react-moveable';
import { MathEngine } from './AEMathTrajectory'; // 🌟 引入数学引擎
import { aeConfigAtom } from '$/states/aeConfig';
import { activeNodeIdAtom, activeTrackIdAtom, lockSubNodeDragAtom, spatialDataAtom, type SpatialNode, type TrackSpatial } from '$/states/spatial';

interface AENodeProps {
	trackId: 'main' | 'sub' | 'ruby';
	nodeId: string;
	color: string;
	stageRef: React.RefObject<HTMLDivElement>;
}

interface StartStateNode { x?: number; y?: number; rot?: number; }
interface StartState { main: StartStateNode | null; sub: StartStateNode | null; ruby: StartStateNode | null; }

const findNode = (track: TrackSpatial, id: string): SpatialNode | null => {
	if (id === 'in') return track.in;
	if (id === 'focus') return track.focus;
	if (id === 'out') return track.out;
	return track.preFocus.find(n => n.id === id) || track.postFocus.find(n => n.id === id) || null;
};

const produceTrack = (track: TrackSpatial, id: string, updater: (n: SpatialNode) => SpatialNode): TrackSpatial => {
	const next = { ...track };
	if (id === 'in' && next.in) next.in = updater(next.in);
	else if (id === 'focus' && next.focus) next.focus = updater(next.focus);
	else if (id === 'out' && next.out) next.out = updater(next.out);
	else if (next.preFocus.find(n => n.id === id)) next.preFocus = next.preFocus.map(n => n.id === id ? updater(n) : n);
	else if (next.postFocus.find(n => n.id === id)) next.postFocus = next.postFocus.map(n => n.id === id ? updater(n) : n);
	return next;
};

const getCorrespondingNodeId = (targetTrack: TrackSpatial, sourceNodeId: string, sourceTrack: TrackSpatial): string | null => {
	if (sourceNodeId === 'in' || sourceNodeId === 'focus' || sourceNodeId === 'out') return sourceNodeId;
	const preIdx = sourceTrack.preFocus.findIndex(n => n.id === sourceNodeId);
	if (preIdx !== -1) return targetTrack.preFocus[preIdx]?.id || null;
	const postIdx = sourceTrack.postFocus.findIndex(n => n.id === sourceNodeId);
	if (postIdx !== -1) return targetTrack.postFocus[postIdx]?.id || null;
	return null;
};

export default function AENode({ trackId, nodeId, color, stageRef }: AENodeProps) {
	const [data, setData] = useAtom(spatialDataAtom);
	const [activeTrackId, setActiveTrackId] = useAtom(activeTrackIdAtom);
	const [activeNodeId, setActiveNodeId] = useAtom(activeNodeIdAtom);
	const targetRef = useRef<HTMLDivElement>(null);
	
	const startStateRef = useRef<StartState | null>(null);
	const [lockSubNodeDrag] = useAtom(lockSubNodeDragAtom);
	
	const [rawConfig] = useAtom(aeConfigAtom);
	const layoutMode = (rawConfig as any).layoutMode || 'horizontal';

	const track = data[trackId];
	const node = findNode(track, nodeId);

	if (!node || !track.visible) return null;
	const isActive = activeTrackId === trackId && activeNodeId === nodeId;

	// 🌟 判定当前图层是否被锁死：只在联动开启(bindPos) 且 锁定开关打开 时才锁定
	const isDragLocked = trackId !== 'main' && lockSubNodeDrag && track.bindPos;
	const isRotLocked = trackId !== 'main' && lockSubNodeDrag && track.bindRot;

	const subNodeId = trackId === 'main' ? getCorrespondingNodeId(data.sub, nodeId, data.main) : null;
	const rubyNodeId = trackId === 'main' ? getCorrespondingNodeId(data.ruby, nodeId, data.main) : null;

	let finalWidth = node.width;
	let finalHeight = node.height;
	let content = <Text size="1" weight="bold" style={{ color: 'white', textOverflow: 'ellipsis' }}>{node.text}</Text>;

	if (layoutMode === 'vertical') {
		finalWidth = 36;
		finalHeight = 140;
		content = <Text size="1" weight="bold" style={{ color: 'white', writingMode: 'vertical-rl', letterSpacing: '4px' }}>{node.text}</Text>;
	}

	return (
		<>
			<div
				ref={targetRef}
				className="amll-spatial-node"
				onPointerDown={(e) => { 
					e.stopPropagation(); 
					setActiveTrackId(trackId); 
					setActiveNodeId(nodeId); 
				}}
				style={{
					position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
					width: `${finalWidth}px`, height: `${finalHeight}px`,
					transform: `translate(-50%, -50%) rotate(${node.rot}deg)`,
					backgroundColor: color, 
					borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
					padding: '0 12px', overflow: 'hidden',
					border: isActive ? `3px solid white` : `1px solid rgba(255,255,255,0.3)`,
					boxShadow: isActive ? `0 0 20px ${color}` : `0 4px 6px rgba(0,0,0,0.3)`,
					zIndex: isActive ? 20 : (trackId === 'main' ? 10 : 5),
					cursor: isDragLocked ? 'not-allowed' : 'grab'
				}}
			>
				{content}
			</div>

			{isActive && stageRef.current && (
				<Moveable
					target={targetRef} container={stageRef.current}
					draggable={!isDragLocked} resizable={false} rotatable={!isRotLocked} origin={false} 
					snappable={!isDragLocked} snapCenter={true} snapElement={true} 
					// 🌟 魔法核心：显式开启自身和目标元素的水平、垂直中线磁吸响应！
					snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
					elementSnapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
					elementGuidelines={['.amll-spatial-node']} snapThreshold={10} 
					verticalGuidelines={stageRef.current ? [stageRef.current.clientWidth / 2] : []}
					horizontalGuidelines={stageRef.current ? [stageRef.current.clientHeight / 2] : []}
					
					onDragStart={(e) => {
						e.set([0, 0]); 
						// 🌟 终极修复：准确记录当前被拖拽图层自身的起点，解决子轨道被卡死的问题
						const state: StartState = { main: null, sub: null, ruby: null };
						state[trackId] = { x: Number(node.x), y: Number(node.y) };

						// 只有当你拖动 main 时，才去额外记录附属轨道的起点
						if (trackId === 'main') {
							if (subNodeId) {
								const sn = findNode(data.sub, subNodeId);
								if (sn) state.sub = { x: Number(sn.x), y: Number(sn.y) };
							}
							if (rubyNodeId) {
								const rn = findNode(data.ruby, rubyNodeId);
								if (rn) state.ruby = { x: Number(rn.x), y: Number(rn.y) };
							}
						}
						startStateRef.current = state;
					}}
					onDrag={(e) => {
						if (!stageRef.current || !startStateRef.current) return;
						const rect = stageRef.current.getBoundingClientRect();
						const dx = (e.beforeTranslate[0] / rect.width) * 100;
						let dy = (e.beforeTranslate[1] / rect.height) * 100;
						
						setData(prev => {
							const next = { ...prev };
							const selfState = startStateRef.current?.[trackId];
							
							if (selfState?.x !== undefined && selfState?.y !== undefined) {
								const sx = selfState.x;
								const sy = selfState.y;
								let targetX = sx + dx;
								let targetY = sy + dy;
								let targetRot = node.rot; // 默认不改变旋转

								// 🌟 核心：如果在设置里写了方程，且开启了磁吸，进入劫持逻辑
								const config = rawConfig as any;
								if (config.mathEquation && config.enableMathSnap !== false) {
									const mScale = config.mathScale || 1;
									const mRot = config.mathRot || 0;
									const mOffsetX = config.mathOffsetX || 0;
									const mOffsetY = config.mathOffsetY || 0;
									
									// 🌟 赋予用户绝对的控制权：一键翻转 90 度，彻底解决长宽边的认知分歧！
									let axisOffset = config.mathSnapFlip ? -90 : 0;
									
									// 🌟 新增：如果用户开启了反向(翻转)，直接暴力加上 180 度！
									if (config.mathSnapInvert) {
										axisOffset += 180;
									}

									// 1. 把鼠标坐标拉入带有偏移量补偿的数学局部空间
									const [localX, localY] = MathEngine.globalToLocal(targetX, targetY, mScale, mRot, mOffsetX, mOffsetY);
									const curveY = MathEngine.evalY(config.mathEquation, localX);

									if (curveY !== null && Math.abs(localY - curveY) < (6 / mScale)) {
										// 3. 吸附成功！把局部点带上偏移量弹射回全局真实空间
										const [snappedGX, snappedGY] = MathEngine.localToGlobal(localX, curveY, mScale, mRot, mOffsetX, mOffsetY);
										targetX = snappedGX;
										targetY = snappedGY;
										dy = targetY - sy; 

										const curveY1 = MathEngine.evalY(config.mathEquation, localX - 0.1);
										const curveY2 = MathEngine.evalY(config.mathEquation, localX + 0.1);
										
										if (curveY1 !== null && curveY2 !== null) {
											const [gx1, gy1] = MathEngine.localToGlobal(localX - 0.1, curveY1, mScale, mRot, mOffsetX, mOffsetY);
											const [gx2, gy2] = MathEngine.localToGlobal(localX + 0.1, curveY2, mScale, mRot, mOffsetX, mOffsetY);
											
											const pixelDx = (gx2 - gx1) * (rect.width / 100);
											const pixelDy = (gy2 - gy1) * (rect.height / 100);
											
											const visualRot = Math.atan2(pixelDy, pixelDx) * (180 / Math.PI);
											
											// 叠加基准轴偏移
											targetRot = Math.round((visualRot + axisOffset) * 10) / 10;
										}
									}
								}

								next[trackId] = produceTrack(next[trackId], nodeId, n => ({ ...n, x: targetX, y: targetY, rot: targetRot }));
							}
							
							// 如果当前拖拽的是主轨道，则带动已联动的子轨道
							if (trackId === 'main') {
								const startSub = startStateRef.current?.sub;
								if (next.sub.bindPos && subNodeId && startSub?.x !== undefined && startSub?.y !== undefined) {
									const subX = startSub.x;
									const subY = startSub.y;
									next.sub = produceTrack(next.sub, subNodeId, n => ({ ...n, x: subX + dx, y: subY + dy }));
								}
								const startRuby = startStateRef.current?.ruby;
								if (next.ruby.bindPos && rubyNodeId && startRuby?.x !== undefined && startRuby?.y !== undefined) {
									const rubX = startRuby.x;
									const rubY = startRuby.y;
									next.ruby = produceTrack(next.ruby, rubyNodeId, n => ({ ...n, x: rubX + dx, y: rubY + dy }));
								}
							}
							return next;
						});
					}}
					
					onRotateStart={(e) => {
						e.set(Number(node.rot)); 
						// 🌟 终极修复：准确记录自转起点
						const state: StartState = { main: null, sub: null, ruby: null };
						state[trackId] = { rot: Number(node.rot) };

						if (trackId === 'main') {
							if (subNodeId) {
								const sn = findNode(data.sub, subNodeId);
								if (sn) state.sub = { rot: Number(sn.rot) };
							}
							if (rubyNodeId) {
								const rn = findNode(data.ruby, rubyNodeId);
								if (rn) state.ruby = { rot: Number(rn.rot) };
							}
						}
						startStateRef.current = state;
					}}
					onRotate={(e) => {
						if (!startStateRef.current) return;
						const selfState = startStateRef.current[trackId];
						if (!selfState || selfState.rot === undefined) return;
						const dRot = e.beforeRotate - selfState.rot;
						setData(prev => {
							const next = { ...prev };
							next[trackId] = produceTrack(next[trackId], nodeId, n => ({ ...n, rot: Math.round(e.beforeRotate) }));
							if (trackId === 'main') {
								const startSub = startStateRef.current?.sub;
								if (next.sub.bindRot && subNodeId && startSub?.rot !== undefined) {
									const sRot = startSub.rot;
									next.sub = produceTrack(next.sub, subNodeId, n => ({ ...n, rot: Math.round(sRot + dRot) }));
								}
								const startRuby = startStateRef.current?.ruby;
								if (next.ruby.bindRot && rubyNodeId && startRuby?.rot !== undefined) {
									const rRot = startRuby.rot;
									next.ruby = produceTrack(next.ruby, rubyNodeId, n => ({ ...n, rot: Math.round(rRot + dRot) }));
								}
							}
							return next;
						});
					}}
				/>
			)}
		</>
	);
}