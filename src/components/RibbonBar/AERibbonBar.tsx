// 文件路径：src/components/RibbonBar/AERibbonBar.tsx
import { Button, Checkbox, Flex, Grid, Text } from '@radix-ui/themes';
import { useAtom, useAtomValue } from 'jotai'; // 🌟 修改：引入 useAtomValue
import { useCallback } from 'react';

import { RibbonFrame, RibbonSection } from '$/components/RibbonBar/common';
import { lockSubNodeDragAtom, spatialDataAtom, type SpatialNode } from '$/states/spatial';
import { aeConfigAtom } from '$/states/aeConfig'; // 🌟 新增：引入画板配置

export default function AERibbonBar() {
	const [spatialData, setSpatialData] = useAtom(spatialDataAtom);
	const [lockSubNodeDrag, setLockSubNodeDrag] = useAtom(lockSubNodeDragAtom);
	const aeConfig = useAtomValue(aeConfigAtom); // 🌟 新增：读取画板配置

	// 1. 全局一键吸附主歌词 (带三角函数边缘贴合)
	const globalAlignToMain = useCallback(() => {
		setSpatialData(prev => {
			const next = { ...prev };
			
			// 传入 direction (1 代表向下，-1 代表向上)
			const alignNode = (mainNode: SpatialNode | null, targetNode: SpatialNode | null, direction: 1 | -1) => {
				if (!mainNode || !targetNode) return targetNode;
				
				const gapPx = 0;
				const centerDistPx = (Number(mainNode.height) / 2) + (Number(targetNode.height) / 2) + gapPx;
				const offsetPx = centerDistPx * direction;
				
				const rad = Number(mainNode.rot) * (Math.PI / 180);
				const globalDxPx = -offsetPx * Math.sin(rad);
				const globalDyPx = offsetPx * Math.cos(rad);
				
				const dxPercent = (globalDxPx / aeConfig.compWidth) * 100;
				const dyPercent = (globalDyPx / aeConfig.compHeight) * 100;

				return { 
					...targetNode, 
					x: Number(mainNode.x) + dxPercent, 
					y: Number(mainNode.y) + dyPercent, 
					rot: mainNode.rot 
				};
			};

			const alignTrack = (trackId: 'sub' | 'ruby', direction: 1 | -1) => {
				const track = { ...next[trackId] };
				const main = next.main;
				track.in = alignNode(main.in, track.in, direction);
				track.focus = alignNode(main.focus, track.focus, direction);
				track.out = alignNode(main.out, track.out, direction);
				
				track.preFocus = track.preFocus.map((n, i) => alignNode(main.preFocus[i] || null, n, direction) as SpatialNode);
				track.postFocus = track.postFocus.map((n, i) => alignNode(main.postFocus[i] || null, n, direction) as SpatialNode);
				
				next[trackId] = track;
			};

			alignTrack('sub', 1); // 翻译轨道向下对其
			alignTrack('ruby', -1); // 音译轨道向上对齐
			
			return next;
		});
	}, [setSpatialData, aeConfig.compWidth, aeConfig.compHeight]); // 🌟 将宽高加入依赖项，如果用户改了分辨率，吸附能自动响应

	// 2. 磁性联动全局开关
	const isGlobalBindPos = spatialData.sub.bindPos && spatialData.ruby.bindPos;
	const setGlobalBindPos = (val: boolean) => setSpatialData(prev => ({
		...prev, sub: { ...prev.sub, bindPos: val }, ruby: { ...prev.ruby, bindPos: val }
	}));

	const isGlobalBindRot = spatialData.sub.bindRot && spatialData.ruby.bindRot;
	const setGlobalBindRot = (val: boolean) => setSpatialData(prev => ({
		...prev, sub: { ...prev.sub, bindRot: val }, ruby: { ...prev.ruby, bindRot: val }
	}));

	// 3. 全局清空重置大招
	const globalResetSpatial = useCallback(() => {
		const createFocus = (y: number, text: string): SpatialNode => ({ id: 'focus', x: 50, y, rot: 0, width: 140, height: 36, text });
		setSpatialData(prev => ({
			main: { ...prev.main, visible: true, bindPos: false, bindRot: false, in: null, preFocus: [], focus: createFocus(50, '主歌词定点焦点'), postFocus: [], out: null },
			sub: { ...prev.sub, visible: true, bindPos: true, bindRot: true, in: null, preFocus: [], focus: createFocus(60, '翻译定点焦点'), postFocus: [], out: null },
			ruby: { ...prev.ruby, visible: true, bindPos: true, bindRot: true, in: null, preFocus: [], focus: createFocus(40, '音译定点焦点'), postFocus: [], out: null }
		}));
	}, [setSpatialData]);

	return (
		<RibbonFrame>
			{/* 左侧：全局排版对齐与锁死 */}
			<RibbonSection label="节点排版对齐">
				<Grid columns="1" gap="2" gapY="2" flexGrow="1" align="center" style={{ padding: '0 8px' }}>
					<Button size="1" variant="soft" color="blue" onClick={globalAlignToMain} style={{ cursor: 'pointer' }}>
						🧲 全局一键吸附主歌词
					</Button>
					<Text size="1" asChild>
						<label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
							<Checkbox checked={lockSubNodeDrag} onCheckedChange={(v) => setLockSubNodeDrag(Boolean(v))} />
							联动开启时锁死坐标 (禁止手拖)
						</label>
					</Text>
				</Grid>
			</RibbonSection>

			{/* 中间：全局磁性联动开关 */}
			<RibbonSection label="全局磁性联动 (子轨道)">
				<Grid columns="1" gap="2" gapY="2" flexGrow="1" align="center" style={{ padding: '0 8px' }}>
					<Text size="1" asChild>
						<label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
							<Checkbox checked={isGlobalBindPos} onCheckedChange={(v) => setGlobalBindPos(Boolean(v))} />
							全局锁定位置轨迹
						</label>
					</Text>
					<Text size="1" asChild>
						<label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
							<Checkbox checked={isGlobalBindRot} onCheckedChange={(v) => setGlobalBindRot(Boolean(v))} />
							全局锁定旋转角度
						</label>
					</Text>
				</Grid>
			</RibbonSection>

			<div style={{ flex: 1 }} /> {/* 弹簧占位 */}

			{/* 最右侧：全局危险重置 */}
			<RibbonSection label="危险操作">
				<Flex align="center" justify="center" height="100%" style={{ padding: '0 16px' }}>
					<Button size="2" variant="soft" color="red" onClick={globalResetSpatial} style={{ cursor: 'pointer' }}>
						🔄 全局清空重置
					</Button>
				</Flex>
			</RibbonSection>
		</RibbonFrame>
	);
}