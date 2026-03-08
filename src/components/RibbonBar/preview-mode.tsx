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

import { Checkbox, Grid, Text, TextField, Flex, SegmentedControl, Button } from "@radix-ui/themes";
import { useAtom } from "jotai";
import { forwardRef, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
	hideObsceneWordsAtom,
	lyricWordFadeWidthAtom,
	showRomanLinesAtom,
	showTranslationLinesAtom,
} from "$/modules/settings/states/preview";
import { previewModeAtom, spatialBgMediaAtom } from "$/states/previewMode";
import { RibbonFrame, RibbonSection } from "./common";

export const PreviewModeRibbonBar = forwardRef<HTMLDivElement>(
	(_props, ref) => {
		const [showTranslationLine, setShowTranslationLine] = useAtom(
			showTranslationLinesAtom,
		);
		const [showRomanLine, setShowRomanLine] = useAtom(showRomanLinesAtom);
		const [hideObsceneWords, setHideObsceneWords] =
			useAtom(hideObsceneWordsAtom);
		const [lyricWordFadeWidth, setLyricWordFadeWidth] = useAtom(
			lyricWordFadeWidthAtom,
		);
		const { t } = useTranslation();

		// 🌟 监视器与底片状态
		const [previewMode, setPreviewMode] = useAtom(previewModeAtom);
		const [bgMedia, setBgMedia] = useAtom(spatialBgMediaAtom);
		const fileInputRef = useRef<HTMLInputElement>(null);

		const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			const url = URL.createObjectURL(file);
			const type = file.type.startsWith('video/') ? 'video' : 'image';
			setBgMedia({ type, url });
			// 清除 input 值，保证用户重复上传同一张图片时也能触发 onChange
			e.target.value = '';
		};

		return (
			<RibbonFrame ref={ref}>
				<RibbonSection label={t("ribbonBar.previewMode.lyrics", "歌词")}>
					<Grid columns="0fr 0fr" gap="2" gapY="1" flexGrow="1" align="center">
						<Text wrap="nowrap" size="1">
							{t("ribbonBar.previewMode.showTranslation", "显示翻译")}
						</Text>
						<Checkbox
							checked={showTranslationLine}
							onCheckedChange={(v) => setShowTranslationLine(!!v)}
						/>
						<Text wrap="nowrap" size="1">
							{t("ribbonBar.previewMode.showRoman", "显示音译")}
						</Text>
						<Checkbox
							checked={showRomanLine}
							onCheckedChange={(v) => setShowRomanLine(!!v)}
						/>
						<Text wrap="nowrap" size="1">
							{t("ribbonBar.previewMode.maskObsceneWords", "屏蔽不雅用语")}
						</Text>
						<Checkbox
							checked={hideObsceneWords}
							onCheckedChange={(v) => setHideObsceneWords(!!v)}
						/>
					</Grid>
				</RibbonSection>

				{/* 🌟 核心改动：把监视器和垫图控制台集成在这里 */}
				<RibbonSection label="监视器模式">
					<Flex align="center" gap="3" px="2" style={{ height: '100%' }}>
						<SegmentedControl.Root value={previewMode} onValueChange={(v: any) => setPreviewMode(v)}>
							<SegmentedControl.Item value="classic">🎵 经典滚动</SegmentedControl.Item>
							<SegmentedControl.Item value="spatial">🌌 空间漫游</SegmentedControl.Item>
						</SegmentedControl.Root>

						{/* 只有在空间模式下才显示垫图按钮，保持界面极度整洁 */}
						{previewMode === 'spatial' && (
							<Flex gap="2" align="center">
								<Button variant="soft" size="1" onClick={() => fileInputRef.current?.click()}>
									🖼️ 垫入底片
								</Button>
								{bgMedia && (
									<Button variant="soft" color="red" size="1" onClick={() => setBgMedia(null)}>
										🗑️ 清除
									</Button>
								)}
								<input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" style={{ display: 'none' }} />
							</Flex>
						)}
					</Flex>
				</RibbonSection>

				<RibbonSection label={t("ribbonBar.previewMode.word", "单词")}>
					<Grid columns="0fr 0fr" gap="2" gapY="1" flexGrow="1" align="center">
						<Text wrap="nowrap" size="1">
							{t("ribbonBar.previewMode.fadeWidth", "过渡宽度")}
						</Text>
						<TextField.Root
							min={0}
							step={0}
							size="1"
							style={{
								width: "4em",
							}}
							defaultValue={lyricWordFadeWidth}
							onBlur={(e) => {
								const value = Number.parseFloat(e.target.value);
								if (Number.isFinite(value)) {
									setLyricWordFadeWidth(value);
								}
							}}
						/>
					</Grid>
				</RibbonSection>
			</RibbonFrame>
		);
	},
);

export default PreviewModeRibbonBar;