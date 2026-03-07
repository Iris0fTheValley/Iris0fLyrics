// 文件路径：src/modules/ae-exporter/components/parts/AETransitionCanvasPoint.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Popover, Flex, Text, Select } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { spatialDataAtom, activeTrackIdAtom, type SpatialNode } from '$/states/spatial';

interface Props {
	targetNodeId: string;
	startPos: { x: number; y: number };
	endPos: { x: number; y: number };
	color: string;
	isActive: boolean;
	stageRef: React.RefObject<HTMLDivElement | null>;
}

export default function AETransitionCanvasPoint({ targetNodeId, startPos, endPos, color, isActive, stageRef }: Props) {
	const [data, setData] = useAtom(spatialDataAtom);
	const [activeTrackId] = useAtom(activeTrackIdAtom);
	const track = data[activeTrackId];

	let targetNode: SpatialNode | null = null;
	if (track.focus?.id === targetNodeId) targetNode = track.focus;
	else if (track.out?.id === targetNodeId) targetNode = track.out;
	else targetNode = track.preFocus.find(n => n.id === targetNodeId) || track.postFocus.find(n => n.id === targetNodeId) || null;

	const transition = targetNode?.transition || { type: 'follow', ratio: 50 };
	
	const [isDragging, setIsDragging] = useState(false);
	const [localRatio, setLocalRatio] = useState(transition.ratio);
	
	// 🌟 手动控制气泡状态与拖拽判定锁
	const [popoverOpen, setPopoverOpen] = useState(false);
	const hasDraggedRef = useRef(false);

	useEffect(() => { if (!isDragging) setLocalRatio(transition.ratio); }, [transition.ratio, isDragging]);

	const updateTransition = (key: 'type' | 'ratio', value: string | number) => {
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

	const handlePointerDown = (e: React.PointerEvent) => {
		if (e.button !== 0 || !isActive) return;
		e.stopPropagation();
		e.currentTarget.setPointerCapture(e.pointerId);
		hasDraggedRef.current = false; // 重置拖拽锁
		setIsDragging(true);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!isDragging || !stageRef.current) return;
		hasDraggedRef.current = true; // 只要移动了，就标记为已拖拽
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

	// 🌟 拦截点击事件，如果刚刚发生了拖拽，就阻止气泡打开
	const handleClick = (e: React.MouseEvent) => {
		if (hasDraggedRef.current) {
			e.preventDefault();
			hasDraggedRef.current = false;
		} else {
			setPopoverOpen(true);
		}
	};

	// 🌟 核心：只有当模式为 delay（延迟漂移）时，控制点才会出现在画布上
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