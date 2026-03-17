// 文件路径：src/modules/ae-exporter/components/parts/AENodeToolbar.tsx
import { useState, useEffect } from 'react';
import { Box, Card, Flex, Text, TextField, SegmentedControl, Slider, Button, Tooltip, Switch, Popover, Select } from '@radix-ui/themes';
import { useAtom, useAtomValue } from 'jotai';
import { activeTrackIdAtom, activeNodeIdAtom, lockSubNodeDragAtom, spatialDataAtom, spatialDataMapAtom, activeRoleIdAtom, roleSystemAtom, type SpatialNode, type TrackSpatial } from '$/states/spatial';
import { aeConfigAtom } from '$/states/aeConfig'; // 🌟 新增：引入画板配置获取长宽比例
import AETransitionToolbarCard from './AETransitionToolbarCard';

export const getRoleColors = (roleId: string) => {
	const palettes: Record<string, { main: string; sub: string; ruby: string }> = {
		'1': { main: '#7799CC', sub: '#FFDD88', ruby: '#779977' }, 
		'2': { main: '#CC7799', sub: '#B288FF', ruby: '#DD9977' }, 
		'3': { main: '#77CCAA', sub: '#FF88AA', ruby: '#9977CC' }, 
		'4': { main: '#CCAA77', sub: '#88CCFF', ruby: '#777799' }, 
		'5': { main: '#99CC77', sub: '#FFB288', ruby: '#CC7777' }, 
	};
	const key = String(((parseInt(roleId, 10) - 1) % 5) + 1);
	return palettes[key] || palettes['1'];
};

export default function AENodeToolbar() {
	const [data, setData] = useAtom(spatialDataAtom);
	const dataMap = useAtomValue(spatialDataMapAtom); 
	const aeConfig = useAtomValue(aeConfigAtom); // 🌟 新增：读取画板分辨率配置

	const [activeTrackId, setActiveTrackId] = useAtom(activeTrackIdAtom);
	const [, setActiveNodeId] = useAtom(activeNodeIdAtom); 
	const [lockSubNodeDrag, setLockSubNodeDrag] = useAtom(lockSubNodeDragAtom); 
	
	const [activeRoleId] = useAtom(activeRoleIdAtom);
	const roleSystem = useAtomValue(roleSystemAtom);
	const roleIds = Array.from({ length: roleSystem.slotCount }, (_, i) => String(i + 1));
	const activeFolder = roleSystem.folders.find(f => f.id === roleSystem.activeFolderId) || roleSystem.folders[0];

	const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
	
	const [magicSourceRole, setMagicSourceRole] = useState<string>('1');
	const [globalRot, setGlobalRot] = useState<number>(180);

	const currentTrack = data[activeTrackId];
	const themeColor = getRoleColors(activeRoleId)[activeTrackId];

	useEffect(() => {
		if (magicSourceRole === activeRoleId) {
			const nextRole = roleIds.find(id => id !== activeRoleId) || '1';
			setMagicSourceRole(nextRole);
		}
	}, [activeRoleId, roleIds, magicSourceRole]);

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
		setExpandedNodes({}); 
	};

	const mutateTrackProperty = (key: 'bindPos' | 'bindRot' | 'bindTransition', value: boolean) => {
		setData(prev => {
			const next = { ...prev };
			const t = { ...next[activeTrackId], [key]: value };
			
			// 🌟 当开启引流阀同步时，立即将主歌词的引流阀状态吸附过来
			if (key === 'bindTransition' && value === true && activeTrackId !== 'main') {
				const mainTrack = next.main;
				const syncTrans = (n: SpatialNode | null, mainN: SpatialNode | null): SpatialNode | null => {
					if (!n || !mainN) return n;
					return { ...n, transition: mainN.transition };
				};
				t.in = syncTrans(t.in, mainTrack.in);
				t.focus = syncTrans(t.focus, mainTrack.focus);
				t.out = syncTrans(t.out, mainTrack.out);
				t.preFocus = t.preFocus.map((n, i) => syncTrans(n, mainTrack.preFocus[i] || null) || n);
				t.postFocus = t.postFocus.map((n, i) => syncTrans(n, mainTrack.postFocus[i] || null) || n);
			}
			
			next[activeTrackId] = t;
			return next;
		});
	};

	const alignToMainTrack = (id: string) => {
		const mainTrack = data.main;
		let targetNode: SpatialNode | null = null;
		
		if (id === 'in') targetNode = mainTrack.in;
		else if (id === 'focus') targetNode = mainTrack.focus;
		else if (id === 'out') targetNode = mainTrack.out;
		else {
			const preIdx = currentTrack.preFocus.findIndex(n => n.id === id);
			if (preIdx !== -1) targetNode = mainTrack.preFocus[preIdx] || null;
			const postIdx = currentTrack.postFocus.findIndex(n => n.id === id);
			if (postIdx !== -1) targetNode = mainTrack.postFocus[postIdx] || null;
		}

		if (!targetNode) return;

		setData(prev => {
			const next = { ...prev };
			const track = { ...next[activeTrackId] };
			
			const updateNode = (n: SpatialNode) => {
				if (n.id !== id) return n;
				
				// 1. 计算边框完美贴合所需的中心物理距离 (像素)
				const gapPx = 0; // 0 表示边缘完全贴合。如果想要缝隙，可以改为 4 或 8
				const centerDistPx = (Number(targetNode.height) / 2) + (Number(n.height) / 2) + gapPx;
				
				// 2. 根据轨道类型决定方向 (sub 在主歌词下方，ruby 在上方)
				const offsetPx = activeTrackId === 'sub' ? centerDistPx : -centerDistPx;
				
				// 3. 三角函数：将垂直方向的偏移，按照主歌词的旋转角度分解为真实的 X 和 Y 像素偏移
				const rad = Number(targetNode.rot) * (Math.PI / 180);
				const globalDxPx = -offsetPx * Math.sin(rad);
				const globalDyPx = offsetPx * Math.cos(rad);
				
				// 4. 将真实的像素偏移转换回画板的百分比坐标
				const dxPercent = (globalDxPx / aeConfig.compWidth) * 100;
				const dyPercent = (globalDyPx / aeConfig.compHeight) * 100;

				return { 
					...n, 
					x: Number(targetNode.x) + dxPercent, 
					y: Number(targetNode.y) + dyPercent, 
					rot: targetNode.rot, 
					// 🌟 注意：我们删除了对 width 和 height 的强行覆盖，让子节点保留自己的大小
					transition: targetNode.transition 
				};
			};

			if (track.in) track.in = updateNode(track.in);
			if (track.focus) track.focus = updateNode(track.focus);
			if (track.out) track.out = updateNode(track.out);
			track.preFocus = track.preFocus.map(updateNode);
			track.postFocus = track.postFocus.map(updateNode);
			next[activeTrackId] = track;
			return next;
		});
	};

	// 🌟 新增：全局吸附主轨道 (一键同步所有坐标、角度与引流阀)
	const syncAllFromMain = () => {
		setData(prev => {
			const mainTrack = prev.main;
			const targetTrack = prev[activeTrackId];
			
			const syncNode = (n: SpatialNode | null, mainN: SpatialNode | null): SpatialNode | null => {
				if (!n || !mainN) return n;
				
				const gapPx = 0; // 边缘贴合间隙
				const centerDistPx = (Number(mainN.height) / 2) + (Number(n.height) / 2) + gapPx;
				const offsetPx = activeTrackId === 'sub' ? centerDistPx : -centerDistPx;
				
				const rad = Number(mainN.rot) * (Math.PI / 180);
				const globalDxPx = -offsetPx * Math.sin(rad);
				const globalDyPx = offsetPx * Math.cos(rad);
				
				const dxPercent = (globalDxPx / aeConfig.compWidth) * 100;
				const dyPercent = (globalDyPx / aeConfig.compHeight) * 100;

				return { 
					...n, 
					x: Number(mainN.x) + dxPercent, 
					y: Number(mainN.y) + dyPercent, 
					rot: mainN.rot, 
					transition: mainN.transition 
				};
			};

			return {
				...prev,
				[activeTrackId]: {
					...targetTrack,
					in: syncNode(targetTrack.in, mainTrack.in),
					focus: syncNode(targetTrack.focus, mainTrack.focus),
					out: syncNode(targetTrack.out, mainTrack.out),
					preFocus: targetTrack.preFocus.map((n, i) => syncNode(n, mainTrack.preFocus[i] || null) || n),
					postFocus: targetTrack.postFocus.map((n, i) => syncNode(n, mainTrack.postFocus[i] || null) || n)
				}
			};
		});
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

	// 🌟 新增：专属的固定节点“一键加入”逻辑
	const handleAddUniqueNode = (type: 'in' | 'focus' | 'out') => {
		const trackPrefix = activeTrackId === 'main' ? '主歌词' : activeTrackId === 'sub' ? '翻译' : '音译';
		const typeName = type === 'in' ? '入场点' : type === 'out' ? '离场点' : '定点焦点';
		const text = `${trackPrefix}${typeName}`;
		const defaultY = activeTrackId === 'main' ? 50 : activeTrackId === 'sub' ? 60 : 40;

		const newNode: SpatialNode = { id: type, x: 50, y: defaultY, rot: 0, width: 140, height: 36, text };
		setData(prev => {
			const next = { ...prev };
			const track = { ...next[activeTrackId] };
			track[type] = newNode;
			return { ...next, [activeTrackId]: track };
		});
		setActiveNodeId(type);
		setExpandedNodes(prev => ({ ...prev, [type]: true })); // 🌟 自动展开面板方便编辑
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

	const applyMagic = (magicType: 'clone' | 'mirrorX' | 'mirrorY' | 'rotate') => {
		const sourceData = dataMap[magicSourceRole];
		if (!sourceData) return;

		const sName = activeFolder.roles[parseInt(magicSourceRole, 10)-1] || `角色 ${magicSourceRole}`;
		if (!window.confirm(`⚠️ 将提取 [${sName}] 的轨迹数据并应用魔法。\n这将会覆盖当前画板所有现有轨迹！确定吗？`)) return;

		const processNode = (node: SpatialNode | null): SpatialNode | null => {
			if (!node) return null;
			let newX = Number(node.x);
			let newY = Number(node.y);
			let newRot = Number(node.rot);

			if (magicType === 'mirrorX') {
				newX = 100 - newX;
				newRot = -newRot;
			} else if (magicType === 'mirrorY') {
				newY = 100 - newY;
				newRot = -newRot;
			} else if (magicType === 'rotate') {
				const rad = globalRot * (Math.PI / 180);
				const cos = Math.cos(rad);
				const sin = Math.sin(rad);
				const dx = newX - 50;
				const dy = newY - 50;
				
				newX = 50 + (dx * cos - dy * sin);
				newY = 50 + (dx * sin + dy * cos);
				newRot = newRot + globalRot;
			}

			return { 
				...node, 
				x: Math.round(newX * 100) / 100, 
				y: Math.round(newY * 100) / 100, 
				rot: Math.round(newRot * 100) / 100 
			};
		};

		const processTrack = (track: TrackSpatial): TrackSpatial => ({
			...track,
			in: processNode(track.in),
			preFocus: track.preFocus.map(processNode) as SpatialNode[],
			focus: processNode(track.focus),
			postFocus: track.postFocus.map(processNode) as SpatialNode[],
			out: processNode(track.out),
		});

		setData({
			main: processTrack(sourceData.main),
			sub: processTrack(sourceData.sub),
			ruby: processTrack(sourceData.ruby),
		});
	};

	const renderCard = (id: string, label: string, nodeData: SpatialNode | null, dragType: string) => {
		const isUsed = nodeData !== null;
		const isExpanded = isUsed && expandedNodes[id];
		
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

		// 🌟 修复 4：修复了 forEach 语法警告
		const validNodes: string[] = [];
		if (currentTrack.in) validNodes.push(currentTrack.in.id);
		currentTrack.preFocus.forEach(n => { validNodes.push(n.id); });
		if (currentTrack.focus) validNodes.push(currentTrack.focus.id);
		currentTrack.postFocus.forEach(n => { validNodes.push(n.id); });
		if (currentTrack.out) validNodes.push(currentTrack.out.id);
		
		const myIndex = validNodes.indexOf(id);
		const hasPreviousNode = myIndex > 0;

		return (
			<Flex direction="column">
				{isUsed && hasPreviousNode && <AETransitionToolbarCard targetNodeId={id} color={themeColor} />}
				
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
						
						{/* 🌟 修改：当节点不存在时，显示拖入提示和一键加入按钮 */}
						{!isUsed && (
							<Flex align="center" gap="2">
								<Text size="1" color="gray">按住拖入或</Text>
								<Tooltip content="将此节点添加到当前轨道，开始编辑其位置和属性">
									<Button size="1" variant="soft" color="jade" style={{ cursor: 'pointer', zIndex: 10 }} onClick={(e) => { e.stopPropagation(); handleAddUniqueNode(id as 'in' | 'focus' | 'out'); }}>
										+ 加入
									</Button>
								</Tooltip>
							</Flex>
						)}

						{isUsed && <Text size="1" color="red" style={{cursor: 'pointer', zIndex: 10}} onClick={(e) => { e.stopPropagation(); removeNode(id); }}>🗑️ 移除</Text>}
					</Flex>
					{isExpanded && (
						<Flex direction="column" gap="3" mt="3" pl="3" style={{ borderLeft: `2px solid ${themeColor}` }}>
							<TextField.Root size="1" value={nodeData.text} onChange={(e) => mutateNode(id, 'text', e.target.value)} />
							<Flex gap="3" align="center"><Text size="1" color="gray" style={{ width: 30 }}>X轴</Text><Slider size="1" min={-20} max={120} step={1} value={[Number(nodeData.x)||50]} onValueChange={([v]) => mutateNode(id, 'x', v)} style={{ flex: 1 }} /><TextField.Root size="1" value={nodeData.x} onChange={(e) => mutateNode(id, 'x', e.target.value)} style={{ width: 50 }} /></Flex>
							<Flex gap="3" align="center"><Text size="1" color="gray" style={{ width: 30 }}>Y轴</Text><Slider size="1" min={-20} max={120} step={1} value={[Number(nodeData.y)||50]} onValueChange={([v]) => mutateNode(id, 'y', v)} style={{ flex: 1 }} /><TextField.Root size="1" value={nodeData.y} onChange={(e) => mutateNode(id, 'y', e.target.value)} style={{ width: 50 }} /></Flex>
							<Flex gap="3" align="center"><Text size="1" color="gray" style={{ width: 30 }}>宽</Text><Slider size="1" min={20} max={600} step={1} value={[Number(nodeData.width)||100]} onValueChange={([v]) => mutateNode(id, 'width', v)} style={{ flex: 1 }} /><TextField.Root size="1" value={nodeData.width} onChange={(e) => mutateNode(id, 'width', e.target.value)} style={{ width: 50 }} /></Flex>
							<Flex gap="3" align="center"><Text size="1" color="gray" style={{ width: 30 }}>角度</Text><Slider size="1" min={-180} max={180} step={1} value={[Number(nodeData.rot)||0]} onValueChange={([v]) => mutateNode(id, 'rot', v)} style={{ flex: 1 }} /><TextField.Root size="1" value={nodeData.rot} onChange={(e) => mutateNode(id, 'rot', e.target.value)} style={{ width: 50 }} /></Flex>
							
							{canAlign && (
								<Tooltip content="将此节点的位置、尺寸和角度与主歌词轨道的对应节点对齐">
									<Button size="1" variant="soft" color="blue" onClick={() => alignToMainTrack(id)}>
										🧲 吸附对齐主歌词
									</Button>
								</Tooltip>
							)}
						</Flex>
					)}
				</Card>
			</Flex> // 🌟 修复 5：补上了这个致命遗漏的 Flex 闭合标签，彻底解决文件报错！
		);
	};

	return (
		<Flex direction="column" gap="4">
			<Box>
				<Flex justify="between" align="center" mb="2">
					<Text size="2" weight="bold" style={{ color: themeColor }}>🎯 编排: {activeFolder.roles[parseInt(activeRoleId, 10)-1] || `角色 ${activeRoleId}`}</Text>
					
					<Flex gap="2">
						<Popover.Root>
							<Popover.Trigger>
								<Tooltip content="克隆其他角色的轨迹数据，并进行镜像、旋转等矩阵变换">
									<Button size="1" variant="soft" color="violet" style={{ cursor: 'pointer' }}>🪄 轨迹魔法</Button>
								</Tooltip>
							</Popover.Trigger>
							<Popover.Content width="260px">
								<Flex direction="column" gap="3">
									<Text size="2" weight="bold">🪄 轨迹克隆与矩阵变换</Text>
									<Text size="1" color="gray">提取其他角色的空间排版，进行矩阵变换后覆盖当前画板。</Text>
									
									<Flex align="center" gap="2" style={{ backgroundColor: 'var(--gray-3)', padding: '6px', borderRadius: '6px' }}>
										<Text size="1" color="gray">源数据:</Text>
										<Select.Root value={magicSourceRole} onValueChange={setMagicSourceRole} size="1">
											<Select.Trigger style={{ flex: 1 }} />
											<Select.Content>
												{roleIds.map(id => (
													<Select.Item key={id} value={id} disabled={id === activeRoleId}>
														{activeFolder.roles[parseInt(id, 10)-1] || `角色 ${id}`}
													</Select.Item>
												))}
											</Select.Content>
										</Select.Root>
									</Flex>

									<Flex direction="column" gap="2" mt="1">
										<Tooltip content="精确复制选定角色的所有轨迹节点，覆盖当前画板">
											<Button size="1" variant="soft" color="blue" style={{ cursor: 'pointer' }} onClick={() => applyMagic('clone')}>
												📄 1:1 绝对克隆 (Copy)
											</Button>
										</Tooltip>
										<Tooltip content="将选定角色的轨迹水平镜像（左右翻转）后应用到当前画板">
											<Button size="1" variant="soft" color="orange" style={{ cursor: 'pointer' }} onClick={() => applyMagic('mirrorX')}>
												↔️ 左右对称镜像 (Flip X)
											</Button>
										</Tooltip>
										<Tooltip content="将选定角色的轨迹垂直镜像（上下翻转）后应用到当前画板">
											<Button size="1" variant="soft" color="green" style={{ cursor: 'pointer' }} onClick={() => applyMagic('mirrorY')}>
												↕️ 上下对称镜像 (Flip Y)
											</Button>
										</Tooltip>
										
										<Flex align="center" gap="2" mt="1">
											<Tooltip content="将选定角色的轨迹绕中心点旋转指定角度后应用到当前画板">
												<Button size="1" variant="soft" color="violet" style={{ flex: 1, cursor: 'pointer' }} onClick={() => applyMagic('rotate')}>
													🔄 中心环绕旋转
												</Button>
											</Tooltip>
											<TextField.Root size="1" type="number" style={{ width: '60px' }} value={globalRot} onChange={e => setGlobalRot(Number(e.target.value) || 0)} />
											<Text size="1" color="gray">度</Text>
										</Flex>
									</Flex>
								</Flex>
							</Popover.Content>
						</Popover.Root>

						<Popover.Root>
							<Popover.Trigger>
								<Tooltip content="设置子轨道是否跟随主轨道移动、旋转，以及锁定子轨道拖拽">
									<Button size="1" variant="soft" color="indigo" style={{ cursor: 'pointer' }}>⚙️ 联动锁</Button>
								</Tooltip>
							</Popover.Trigger>
							<Popover.Content width="260px">
								<Flex direction="column" gap="3">
									<Text size="2" weight="bold">轨道联动与防呆锁</Text>
									{activeTrackId !== 'main' && (
										<>
											<Flex justify="between" align="center">
												<Text size="2" color="gray" weight="bold">跟随主轨道移动</Text>
												<Switch size="1" checked={currentTrack.bindPos} onCheckedChange={(v) => mutateTrackProperty('bindPos', v)} />
											</Flex>
											<Flex justify="between" align="center">
												<Text size="2" color="gray" weight="bold">跟随主轨道旋转</Text>
												<Switch size="1" checked={currentTrack.bindRot} onCheckedChange={(v) => mutateTrackProperty('bindRot', v)} />
											</Flex>
											<Flex justify="between" align="center">
												<Text size="2" color="gray" weight="bold">跟随主引流阀动效</Text>
												<Switch size="1" checked={currentTrack.bindTransition} onCheckedChange={(v) => mutateTrackProperty('bindTransition', v)} />
											</Flex>
										</>
									)}
									<Flex justify="between" align="center">
										<Tooltip content="打开此锁时，已经开启联动的子轨道将无法在画布中用鼠标直接拖拽，防止误触。">
											<Text size="2" color="ruby" weight="bold" style={{ cursor: 'help' }}>🔒 锁定子轨道拖拽</Text>
										</Tooltip>
										<Switch size="1" color="ruby" checked={lockSubNodeDrag} onCheckedChange={setLockSubNodeDrag} />
									</Flex>
								</Flex>
							</Popover.Content>
						</Popover.Root>

						{activeTrackId !== 'main' && (
							<Tooltip content="将本轨道所有节点的位置与主歌词轨道对应节点对齐">
								<Button size="1" variant="soft" color="blue" style={{ cursor: 'pointer' }} onClick={syncAllFromMain}>🧲 全局吸附</Button>
							</Tooltip>
						)}
						<Tooltip content="清空当前轨道所有节点，恢复为默认初始状态">
							<Button size="1" variant="soft" color="gray" style={{ cursor: 'pointer' }} onClick={resetCurrentTrack}>🔄 重置</Button>
						</Tooltip>
					</Flex>
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
							<Tooltip content="尚未播放，从入场处向当前焦点移动的过渡停靠状态">
								<Text color="gray" style={{ cursor: 'help', fontWeight: 'bold' }}>ⓘ</Text>
							</Tooltip>
						</Flex>
						<Tooltip content="在焦点之前添加一个过渡节点，用于入场到焦点的动画">
							<Button size="1" variant="soft" color="gray" style={{ cursor: 'pointer' }} onClick={() => clickToAdd('preFocus')}>+ 增加</Button>
						</Tooltip>
					</Flex>
					<Flex direction="column" gap="2">
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
							<Tooltip content="已经播放完毕，从当前焦点向离场处移动的过渡停靠状态">
								<Text color="gray" style={{ cursor: 'help', fontWeight: 'bold' }}>ⓘ</Text>
							</Tooltip>
						</Flex>
						<Tooltip content="在焦点之后添加一个过渡节点，用于焦点到离场的动画">
							<Button size="1" variant="soft" color="gray" style={{ cursor: 'pointer' }} onClick={() => clickToAdd('postFocus')}>+ 增加</Button>
						</Tooltip>
					</Flex>
					<Flex direction="column" gap="2">
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