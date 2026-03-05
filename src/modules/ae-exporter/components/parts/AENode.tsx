// 文件路径：src/modules/ae-exporter/components/parts/AENode.tsx
import { Text } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { useRef } from 'react';
import Moveable from 'react-moveable';

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
					elementGuidelines={['.amll-spatial-node']} snapThreshold={8} 
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
						const dy = (e.beforeTranslate[1] / rect.height) * 100;
						
						setData(prev => {
							const next = { ...prev };
							const selfState = startStateRef.current?.[trackId];
							// 刷新自身位置
							if (selfState?.x !== undefined && selfState?.y !== undefined) {
								const sx = selfState.x;
								const sy = selfState.y;
								next[trackId] = produceTrack(next[trackId], nodeId, n => ({ ...n, x: sx + dx, y: sy + dy }));
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