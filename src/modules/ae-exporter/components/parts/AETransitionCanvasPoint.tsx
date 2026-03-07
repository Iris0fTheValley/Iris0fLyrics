// 文件路径：src/modules/ae-exporter/components/parts/AETransitionCanvasPoint.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Popover, Flex, Text, Select } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { spatialDataAtom, type SpatialNode } from '$/states/spatial';

interface Props {
	trackId: 'main' | 'sub' | 'ruby'; // 🌟 核心修复 1：强制传入轨道身份
	targetNodeId: string;
	startPos: { x: number; y: number };
	endPos: { x: number; y: number };
	color: string;
	isActive: boolean;
	stageRef: React.RefObject<HTMLDivElement | null>;
}

export default function AETransitionCanvasPoint({ trackId, targetNodeId, startPos, endPos, color, isActive, stageRef }: Props) {
	const [data, setData] = useAtom(spatialDataAtom);
	const track = data[trackId]; // 🌟 核心修复 2：只读取属于自己的轨道数据，拒绝做克隆傀儡！

	let targetNode: SpatialNode | null = null;
	if (track.focus?.id === targetNodeId) targetNode = track.focus;
	else if (track.out?.id === targetNodeId) targetNode = track.out;
	else targetNode = track.preFocus.find(n => n.id === targetNodeId) || track.postFocus.find(n => n.id === targetNodeId) || null;

	const transition = targetNode?.transition || { type: 'follow', ratio: 50 };
	
	const [isDragging, setIsDragging] = useState(false);
	const [localRatio, setLocalRatio] = useState(transition.ratio);
	
	const [popoverOpen, setPopoverOpen] = useState(false);
	const hasDraggedRef = useRef(false);

	useEffect(() => { if (!isDragging) setLocalRatio(transition.ratio); }, [transition.ratio, isDragging]);

	const updateTransition = (key: 'type' | 'ratio', value: string | number) => {
		setData(prev => {
			const next = { ...prev };
			const t = next[trackId];
			let nodeRole = '';
			let nodeIndex = -1;
			
			if (t.in?.id === targetNodeId) nodeRole = 'in';
			else if (t.focus?.id === targetNodeId) nodeRole = 'focus';
			else if (t.out?.id === targetNodeId) nodeRole = 'out';
			else {
				nodeIndex = t.preFocus.findIndex(n => n.id === targetNodeId);
				if (nodeIndex !== -1) nodeRole = 'preFocus';
				else {
					nodeIndex = t.postFocus.findIndex(n => n.id === targetNodeId);
					if (nodeIndex !== -1) nodeRole = 'postFocus';
				}
			}

			const applyToTrack = (trackData: any) => {
				const tr = { ...trackData };
				const applyToNode = (n: SpatialNode | null) => n ? { ...n, transition: { ...(n.transition || {type:'follow',ratio:50}), [key]: value } } : n;
				
				if (nodeRole === 'in' && tr.in) tr.in = applyToNode(tr.in);
				if (nodeRole === 'focus' && tr.focus) tr.focus = applyToNode(tr.focus);
				if (nodeRole === 'out' && tr.out) tr.out = applyToNode(tr.out);
				if (nodeRole === 'preFocus' && tr.preFocus[nodeIndex]) {
					tr.preFocus = [...tr.preFocus]; 
					tr.preFocus[nodeIndex] = applyToNode(tr.preFocus[nodeIndex]);
				}
				if (nodeRole === 'postFocus' && tr.postFocus[nodeIndex]) {
					tr.postFocus = [...tr.postFocus]; 
					tr.postFocus[nodeIndex] = applyToNode(tr.postFocus[nodeIndex]);
				}
				return tr;
			};

			next[trackId] = applyToTrack(next[trackId]);

			// 🌟 核心修复 3：严谨判定 !== false，兼容旧数据的 undefined 状态
			if (trackId === 'main') {
				if (next.sub.bindTransition !== false) next.sub = applyToTrack(next.sub);
				if (next.ruby.bindTransition !== false) next.ruby = applyToTrack(next.ruby);
			}
			return next;
		});
	};

	const handlePointerDown = (e: React.PointerEvent) => {
		if (e.button !== 0 || !isActive) return;
		e.stopPropagation();
		e.currentTarget.setPointerCapture(e.pointerId);
		hasDraggedRef.current = false;
		setIsDragging(true);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!isDragging || !stageRef.current) return;
		hasDraggedRef.current = true;
		const rect = stageRef.current.getBoundingClientRect();
		const mx = ((e.clientX - rect.left) / rect.width) * 100;
		const my = ((e.clientY - rect.top) / rect.height) * 100;

		const vx = endPos.x - startPos.x;
		const vy = endPos.y - startPos.y;
		const wx = mx - startPos.x;
		const wy = my - startPos.y;
		const proj = (wx * vx + wy * vy) / (vx * vx + vy * vy);
		
		const clamped = Math.max(0.1, Math.min(0.9, proj));
		setLocalRatio(clamped * 100);
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		if (!isDragging) return;
		e.currentTarget.releasePointerCapture(e.pointerId);
		setIsDragging(false);
		updateTransition('ratio', localRatio);
	};

	const handleClick = (e: React.MouseEvent) => {
		if (hasDraggedRef.current) {
			e.preventDefault();
			hasDraggedRef.current = false;
		} else {
			setPopoverOpen(true);
		}
	};

	if (!isActive || transition.type !== 'delay') return null;

	const px = startPos.x + (endPos.x - startPos.x) * (localRatio / 100);
	const py = startPos.y + (endPos.y - startPos.y) * (localRatio / 100);

	return (
		<Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
			<Popover.Trigger>
				<div
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onClick={handleClick}
					style={{
						position: 'absolute', left: `${px}%`, top: `${py}%`,
						width: '16px', height: '16px', transform: 'translate(-50%, -50%)',
						backgroundColor: 'var(--gray-1)', border: `3px solid ${color}`, borderRadius: '50%',
						cursor: isDragging ? 'grabbing' : 'pointer', zIndex: 10,
						boxShadow: isDragging ? `0 0 12px ${color}` : `0 0 4px rgba(0,0,0,0.5)`,
						transition: isDragging ? 'none' : 'box-shadow 0.2s'
					}}
				/>
			</Popover.Trigger>
			<Popover.Content width="200px">
				<Flex direction="column" gap="2">
					<Text size="2" weight="bold">转场节点控制</Text>
					<Select.Root value={transition.type} onValueChange={(v) => updateTransition('type', v)}>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="follow">🌊 全局跟随 (丝滑)</Select.Item>
							<Select.Item value="hold">⚡ 机械折角 (突变)</Select.Item>
							<Select.Item value="delay">⏳ 延迟漂移 (空中变)</Select.Item>
						</Select.Content>
					</Select.Root>
					<Text size="1" color="gray">在此点之前保持原态，越过此点开始执行过渡动作。</Text>
				</Flex>
			</Popover.Content>
		</Popover.Root>
	);
}