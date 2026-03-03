// 文件路径：src/components/RibbonBar/AERibbonBar.tsx
import { Button, Checkbox, Flex, Grid, Text } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { useCallback } from 'react';

import { RibbonFrame, RibbonSection } from '$/components/RibbonBar/common';
import { lockSubNodeDragAtom, spatialDataAtom, type SpatialNode } from '$/states/spatial';

export default function AERibbonBar() {
	const [spatialData, setSpatialData] = useAtom(spatialDataAtom);
	const [lockSubNodeDrag, setLockSubNodeDrag] = useAtom(lockSubNodeDragAtom);

	// 1. 全局一键吸附主歌词
	const globalAlignToMain = useCallback(() => {
		setSpatialData(prev => {
			const next = { ...prev };
			const alignNode = (mainNode: SpatialNode | null, targetNode: SpatialNode | null, yOffset: number) => {
				if (!mainNode || !targetNode) return targetNode;
				return { ...targetNode, x: mainNode.x, y: Number(mainNode.y) + yOffset, rot: mainNode.rot, width: mainNode.width, height: mainNode.height };
			};
			const alignTrack = (trackId: 'sub' | 'ruby', yOffset: number) => {
				const track = { ...next[trackId] };
				const main = next.main;
				track.in = alignNode(main.in, track.in, yOffset);
				track.focus = alignNode(main.focus, track.focus, yOffset);
				track.out = alignNode(main.out, track.out, yOffset);
				
				// 🌟 修复 TS 报错：使用 as SpatialNode 断言，明确告诉 TS 这里的映射结果绝不为空
				track.preFocus = track.preFocus.map((n, i) => alignNode(main.preFocus[i] || null, n, yOffset) as SpatialNode);
				track.postFocus = track.postFocus.map((n, i) => alignNode(main.postFocus[i] || null, n, yOffset) as SpatialNode);
				
				next[trackId] = track;
			};
			alignTrack('sub', 10);
			alignTrack('ruby', -10);
			return next;
		});
	}, [setSpatialData]);

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