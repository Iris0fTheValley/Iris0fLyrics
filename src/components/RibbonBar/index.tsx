/*
 * Copyright 2023-2025 Steve Xiao (stevexmh@qq.com) and contributors.
 *
 * 本源代码文件是属于 AMLL TTML Tool 项目的一部分。
 * This source code file is a part of AMLL TTML Tool project.
 * 本项目的源代码的使用受到 GNU GENERAL PUBLIC LICENSE version 3 许可证的约束，具体可以参阅以下链接。
 * Use of this source code is governed by the GNU GPLv3 license that can be found through the following link.
 *
 * https://github.com/Steve-xmh/amll-ttml-tool/blob/main/LICENSE
 */
// 文件路径：src/components/RibbonBar/index.tsx
import { Card, Inset } from "@radix-ui/themes";
import { AnimatePresence } from "framer-motion";
import { useAtomValue } from "jotai";
import { forwardRef, lazy, memo } from "react";

import SuspensePlaceHolder from "$/components/SuspensePlaceHolder";
import { ToolMode, toolModeAtom } from "$/states/main.ts";

const EditModeRibbonBar = lazy(() => import("./edit-mode"));
const SyncModeRibbonBar = lazy(() => import("./sync-mode"));
const PreviewModeRibbonBar = lazy(() => import("./preview-mode"));

// 🌟 修复：路径改回同级目录，对应你真实的存放位置
const AEModeRibbonBar = lazy(() => import("./AERibbonBar"));

export const RibbonBar = memo(
	forwardRef<HTMLDivElement>((_props, ref) => {
		const toolMode = useAtomValue(toolModeAtom);

		return (
			<Card
				m="2"
				mb="0"
				style={{
					minHeight: "fit-content",
					flexShrink: "0",
				}}
				ref={ref}
			>
				<Inset>
					<div
						style={{
							height: "130px",
							overflowY: "clip",
						}}
					>
						<AnimatePresence mode="wait">
							{toolMode === ToolMode.Edit && (
								<SuspensePlaceHolder key="edit">
									<EditModeRibbonBar />
								</SuspensePlaceHolder>
							)}
							{toolMode === ToolMode.Sync && (
								<SuspensePlaceHolder key="sync">
									<SyncModeRibbonBar />
								</SuspensePlaceHolder>
							)}
							{toolMode === ToolMode.Preview && (
								<SuspensePlaceHolder key="preview">
									<PreviewModeRibbonBar />
								</SuspensePlaceHolder>
							)}
							{/* 渲染 AE 专属的顶部工具栏 */}
							{toolMode === ToolMode.AE && (
								<SuspensePlaceHolder key="ae">
									<AEModeRibbonBar />
								</SuspensePlaceHolder>
							)}
						</AnimatePresence>
					</div>
				</Inset>
			</Card>
		);
	}),
);

export default RibbonBar;