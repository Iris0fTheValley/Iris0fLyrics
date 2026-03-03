// 文件路径：src/modules/ae-exporter/components/parts/AENodeToolbar.tsx
import { useState, useEffect } from 'react';
import { Box, Card, Flex, Text, TextField, SegmentedControl, Slider, Button, Tooltip } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { activeTrackIdAtom, activeNodeIdAtom, spatialDataAtom, type SpatialNode } from '$/states/spatial';

export default function AENodeToolbar() {
	const [data, setData] = useAtom(spatialDataAtom);
	const [activeTrackId, setActiveTrackId] = useAtom(activeTrackIdAtom);
	const [activeNodeId, setActiveNodeId] = useAtom(activeNodeIdAtom); 
	const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

	const currentTrack = data[activeTrackId];
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const themeColor = { main: '#7799CC', sub: '#FFDD88', ruby: '#779977' }[activeTrackId]!;

	useEffect(() => {
		if (activeNodeId) setExpandedNodes(prev => ({ ...prev, [activeNodeId]: true }));
	}, [activeNodeId]);

	const handleDragStart = (e: React.DragEvent, nodeType: string) => {
		e.dataTransfer.setData('application/amll-node-type', nodeType);
		e.dataTransfer.effectAllowed = 'copy';
	};

	const resetCurrentTrack = () => {
		setData(prev => {
			const isMain = activeTrackId === 'main';
			const defaultY = isMain ? 50 : activeTrackId === 'sub' ? 60 : 40;
			const prefix = isMain ? '主歌词' : activeTrackId === 'sub' ? '翻译' : '音译';
			return {
				...prev,
				[activeTrackId]: {
					visible: true, bindPos: !isMain, bindRot: !isMain,
					in: null, preFocus: [], postFocus: [], out: null,
					focus: { id: 'focus', x: 50, y: defaultY, rot: 0, width: 140, height: 36, text: `${prefix}定点焦点` }
				}
			};
		});
		setActiveNodeId('focus');
		setExpandedNodes({ focus: true });
	};

	// 🌟 修复：智能节点对齐法
	const alignToMainTrack = (id: string) => {
		const mainTrack = data.main;
		let targetNode: SpatialNode | null = null;
		
		if (id === 'in') targetNode = mainTrack.in;
		else if (id === 'focus') targetNode = mainTrack.focus;
		else if (id === 'out') targetNode = mainTrack.out;
		else {
			// 通过序列号寻找目标！
			const preIdx = currentTrack.preFocus.findIndex(n => n.id === id);
			if (preIdx !== -1) targetNode = mainTrack.preFocus[preIdx] || null;
			
			const postIdx = currentTrack.postFocus.findIndex(n => n.id === id);
			if (postIdx !== -1) targetNode = mainTrack.postFocus[postIdx] || null;
		}

		if (!targetNode) return;

		const yOffset = activeTrackId === 'sub' ? 10 : -10; 
		mutateNode(id, 'x', targetNode.x);
		mutateNode(id, 'y', Number(targetNode.y) + yOffset);
		mutateNode(id, 'rot', targetNode.rot);
		mutateNode(id, 'width', targetNode.width);
		mutateNode(id, 'height', targetNode.height);
	};

	const mutateNode = (id: string, field: keyof SpatialNode, value: string | number) => {
		setData(prev => {
			let parsed = value;
			if (field !== 'text' && typeof value === 'string') {
				if (value === '' || value === '-') parsed = value; 
				else { parsed = parseFloat(value); if (Number.isNaN(parsed)) return prev; }
			}
			const next = { ...prev };
			const track = { ...next[activeTrackId] };
			
			if (id === 'in' && track.in) track.in = { ...track.in, [field]: parsed };
			else if (id === 'focus' && track.focus) track.focus = { ...track.focus, [field]: parsed };
			else if (id === 'out' && track.out) track.out = { ...track.out, [field]: parsed };
			else {
				track.preFocus = track.preFocus.map(n => n.id === id ? { ...n, [field]: parsed } : n);
				track.postFocus = track.postFocus.map(n => n.id === id ? { ...n, [field]: parsed } : n);
			}
			return { ...next, [activeTrackId]: track };
		});
	};

	const removeNode = (id: string) => {
		setData(prev => {
			const track = { ...prev[activeTrackId] };
			if (id === 'in') track.in = null;
			else if (id === 'focus') track.focus = null;
			else if (id === 'out') track.out = null;
			else {
				track.preFocus = track.preFocus.filter(n => n.id !== id);
				track.postFocus = track.postFocus.filter(n => n.id !== id);
			}
			return { ...prev, [activeTrackId]: track };
		});
	};

	const clickToAdd = (type: 'preFocus' | 'postFocus') => {
		const id = `${type}_${Date.now()}`;
		const trackPrefix = activeTrackId === 'main' ? '主歌词' : activeTrackId === 'sub' ? '翻译' : '音译';
		const count = type === 'preFocus' ? currentTrack.preFocus.length + 1 : currentTrack.postFocus.length + 1;
		const text = `${trackPrefix}${type === 'preFocus' ? '先焦点' : '次焦点'} (${count})`;

		const newNode: SpatialNode = { id, x: 50, y: {main:50,sub:60,ruby:40}[activeTrackId], rot: 0, width: 140, height: 36, text };
		setData(prev => {
			const track = { ...prev[activeTrackId] };
			if (type === 'preFocus') track.preFocus = [...track.preFocus, newNode];
			if (type === 'postFocus') track.postFocus = [...track.postFocus, newNode];
			return { ...prev, [activeTrackId]: track };
		});
		setActiveNodeId(id);
	};

	const renderCard = (id: string, label: string, nodeData: SpatialNode | null, dragType: string) => {
		const isUsed = nodeData !== null;
		const isExpanded = isUsed && expandedNodes[id];
		
		// 🌟 只有当主轨道上 真正存在 对应的顺位节点时，才显示对齐按钮
		let canAlign = false;
		if (activeTrackId !== 'main') {
			if (id === 'in') canAlign = !!data.main.in;
			else if (id === 'focus') canAlign = !!data.main.focus;
			else if (id === 'out') canAlign = !!data.main.out;
			else {
				const preIdx = currentTrack.preFocus.findIndex(n => n.id === id);
				if (preIdx !== -1) canAlign = !!data.main.preFocus[preIdx];
				const postIdx = currentTrack.postFocus.findIndex(n => n.id === id);
				if (postIdx !== -1) canAlign = !!data.main.postFocus[postIdx];
			}
		}

		return (
			<Card style={{ backgroundColor: `color-mix(in srgb, ${themeColor} 5%, var(--gray-2))`, border: `1px solid ${themeColor}80` }}>
				<Flex justify="between" align="center" 
					draggable={!isUsed} onDragStart={(e) => !isUsed && handleDragStart(e, dragType)}
					onClick={() => { if (isUsed) { setActiveNodeId(id); setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] })); } }}
					style={{ cursor: !isUsed ? 'grab' : 'pointer', opacity: 1, padding: '4px' }}
				>
					<Flex align="center" gap="3">
						{isUsed && <Text size="2" color="gray" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block', userSelect: 'none' }}>▶</Text>}
						<Box style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: themeColor }} />
						<Text size="2" weight="bold">{label}</Text>
					</Flex>
					{!isUsed && <Text size="1" color="gray">按住拖入画布</Text>}
					{isUsed && <Text size="1" color="red" style={{cursor: 'pointer', zIndex: 10}} onClick={(e) => { e.stopPropagation(); removeNode(id); }}>🗑️ 移除</Text>}
				</Flex>

				{isExpanded && (
					<Flex direction="column" gap="3" mt="3" pl="3" style={{ borderLeft: `2px solid ${themeColor}` }}>
						<TextField.Root size="1" value={nodeData.text} onChange={(e) => mutateNode(id, 'text', e.target.value)} />
						<Flex gap="3" align="center"><Text size="1" color="gray" style={{ width: 30 }}>X轴</Text><Slider size="1" min={-20} max={120} step={1} value={[Number(nodeData.x)||50]} onValueChange={([v]) => mutateNode(id, 'x', v)} style={{ flex: 1 }} /><TextField.Root size="1" value={nodeData.x} onChange={(e) => mutateNode(id, 'x', e.target.value)} style={{ width: 50 }} /></Flex>
						<Flex gap="3" align="center"><Text size="1" color="gray" style={{ width: 30 }}>Y轴</Text><Slider size="1" min={-20} max={120} step={1} value={[Number(nodeData.y)||50]} onValueChange={([v]) => mutateNode(id, 'y', v)} style={{ flex: 1 }} /><TextField.Root size="1" value={nodeData.y} onChange={(e) => mutateNode(id, 'y', e.target.value)} style={{ width: 50 }} /></Flex>
						<Flex gap="3" align="center"><Text size="1" color="gray" style={{ width: 30 }}>宽</Text><Slider size="1" min={20} max={600} step={1} value={[Number(nodeData.width)||100]} onValueChange={([v]) => mutateNode(id, 'width', v)} style={{ flex: 1 }} /><TextField.Root size="1" value={nodeData.width} onChange={(e) => mutateNode(id, 'width', e.target.value)} style={{ width: 50 }} /></Flex>
						<Flex gap="3" align="center"><Text size="1" color="gray" style={{ width: 30 }}>角度</Text><Slider size="1" min={-180} max={180} step={1} value={[Number(nodeData.rot)||0]} onValueChange={([v]) => mutateNode(id, 'rot', v)} style={{ flex: 1 }} /><TextField.Root size="1" value={nodeData.rot} onChange={(e) => mutateNode(id, 'rot', e.target.value)} style={{ width: 50 }} /></Flex>
						
						{/* 🌟 一对一吸附按钮 */}
						{canAlign && (
							<Button size="1" variant="soft" color="blue" onClick={() => alignToMainTrack(id)}>
								🧲 吸附对齐主歌词
							</Button>
						)}
					</Flex>
				)}
			</Card>
		);
	};

	return (
		<Flex direction="column" gap="4">
			<Box>
				<Flex justify="between" align="center" mb="2">
					<Text size="2" weight="bold">🎯 控制轨道</Text>
					<Button size="1" variant="soft" color="gray" onClick={resetCurrentTrack}>🔄 重置本轨道</Button>
				</Flex>
				<SegmentedControl.Root value={activeTrackId} onValueChange={(v) => setActiveTrackId(v as 'main'|'sub'|'ruby')} size="2">
					<SegmentedControl.Item value="main">主歌词</SegmentedControl.Item>
					<SegmentedControl.Item value="sub">翻译</SegmentedControl.Item>
					<SegmentedControl.Item value="ruby">音译</SegmentedControl.Item>
				</SegmentedControl.Root>
			</Box>

			<Flex direction="column" gap="4">
				{renderCard('in', '入场点 (In)', currentTrack.in, 'in')}

				<Box>
					<Flex align="center" justify="between" mb="2">
						<Flex align="center" gap="2">
							<Text size="2" weight="bold" color="gray">先焦点 (Pre-Focus)</Text>
							<Tooltip content="先焦点：尚未播放，从入场处向当前焦点移动的过渡停靠状态（可叠加多个构建复杂漫游路径）">
								<Text color="gray" style={{ cursor: 'help', fontWeight: 'bold' }}>ⓘ</Text>
							</Tooltip>
						</Flex>
						<Button size="1" variant="soft" color="gray" onClick={() => clickToAdd('preFocus')}>+ 增加</Button>
					</Flex>
					<Flex direction="column" gap="2">
						<Text size="1" color="gray" style={{display: currentTrack.preFocus.length === 0 ? 'block' : 'none'}}>拖拽 + 号或点击以生成...</Text>
						<div draggable onDragStart={(e) => handleDragStart(e, 'preFocus')} style={{ width:'100%', padding: '8px', border: '1px dashed var(--gray-7)', borderRadius: '6px', textAlign: 'center', cursor: 'grab', display: currentTrack.preFocus.length === 0 ? 'block' : 'none' }}>
							<Text size="1" color="gray">✋ 拖动我至画布</Text>
						</div>
						{currentTrack.preFocus.map((n, i) => <div key={n.id}>{renderCard(n.id, `先焦点 [${i+1}]`, n, 'none')}</div>)}
					</Flex>
				</Box>

				{renderCard('focus', '定点焦点 (Focus)', currentTrack.focus, 'focus')}

				<Box>
					<Flex align="center" justify="between" mb="2">
						<Flex align="center" gap="2">
							<Text size="2" weight="bold" color="gray">次焦点 (Post-Focus)</Text>
							<Tooltip content="次焦点：已经播放完毕，从当前焦点向离场处移动的过渡停靠状态">
								<Text color="gray" style={{ cursor: 'help', fontWeight: 'bold' }}>ⓘ</Text>
							</Tooltip>
						</Flex>
						<Button size="1" variant="soft" color="gray" onClick={() => clickToAdd('postFocus')}>+ 增加</Button>
					</Flex>
					<Flex direction="column" gap="2">
						<Text size="1" color="gray" style={{display: currentTrack.postFocus.length === 0 ? 'block' : 'none'}}>拖拽 + 号或点击以生成...</Text>
						<div draggable onDragStart={(e) => handleDragStart(e, 'postFocus')} style={{ width:'100%', padding: '8px', border: '1px dashed var(--gray-7)', borderRadius: '6px', textAlign: 'center', cursor: 'grab', display: currentTrack.postFocus.length === 0 ? 'block' : 'none' }}>
							<Text size="1" color="gray">✋ 拖动我至画布</Text>
						</div>
						{currentTrack.postFocus.map((n, i) => <div key={n.id}>{renderCard(n.id, `次焦点 [${i+1}]`, n, 'none')}</div>)}
					</Flex>
				</Box>

				{renderCard('out', '离场点 (Out)', currentTrack.out, 'out')}
			</Flex>
		</Flex>
	);
}