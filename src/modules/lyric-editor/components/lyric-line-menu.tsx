import { ContextMenu } from "@radix-ui/themes";
import { atom, useAtomValue } from "jotai";
import { useSetImmerAtom } from "jotai-immer";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { lyricLinesAtom, selectedLinesAtom } from "$/states/main";
import { roleSystemAtom } from "$/states/spatial"; // 🌟 核心：直接读取资产库大系统
import { type LyricLine, newLyricLine, newLyricWord } from "$/types/ttml";

const selectedLinesSizeAtom = atom((get) => get(selectedLinesAtom).size);

export const LyricLineMenu = ({ lineIndex }: { lineIndex: number }) => {
	const { t } = useTranslation();

	const selectedLinesSize = useAtomValue(selectedLinesSizeAtom);
	const selectedLines = useAtomValue(selectedLinesAtom);
	const editLyricLines = useSetImmerAtom(lyricLinesAtom);

	// 🌟 终极修复：直接从资产库大系统中精准解构出 数量 和 当前文件夹
	const roleSystem = useAtomValue(roleSystemAtom);
	const roleCount = roleSystem.slotCount;
	const activeFolder = roleSystem.folders.find(f => f.id === roleSystem.activeFolderId) || roleSystem.folders[0];

	const lineObjs = useAtomValue(lyricLinesAtom);
	const selectedLineObjs = lineObjs.lyricLines.filter((line) =>
		selectedLines.has(line.id),
	);

	const [Bgchecked, setBgChecked] = React.useState(() => {
		if (selectedLineObjs.every((line) => line.isBG)) return true;
		else if (selectedLineObjs.every((line) => !line.isBG)) return false;
		else return "indeterminate" as const;
	});

	const combineEnabled = (() => {
		if (selectedLinesSize < 2) return null;
		const lineIdxs = lineObjs.lyricLines
			.filter((line) => selectedLines.has(line.id))
			.map((line) => lineObjs.lyricLines.indexOf(line));
		const minIdx = Math.min(...lineIdxs);
		const maxIdx = Math.max(...lineIdxs);
		if (lineIdxs.length !== maxIdx - minIdx + 1) return null;
		for (let i = minIdx; i <= maxIdx; i++)
			if (!lineIdxs.includes(i)) return null;
		return { minIdx, maxIdx };
	})();

	function bgOnCheck(checked: boolean) {
		setBgChecked(checked);
		editLyricLines((state) => {
			const lines = state.lyricLines.filter((line) =>
				selectedLines.has(line.id),
			);
			for (const line of lines) line.isBG = checked;
		});
	}

	function setRole(roleId: string) {
		editLyricLines((state) => {
			const lines = state.lyricLines.filter((line) =>
				selectedLines.has(line.id),
			);
			for (const line of lines) {
				line.role = roleId;
				line.isDuet = roleId !== "1"; 
			}
		});
	}

	// 动态生成包含 1 到 N 的数组
	const roleIds = Array.from({ length: roleCount }, (_, i) => String(i + 1));

	return (
		<>
			<ContextMenu.CheckboxItem checked={Bgchecked} onCheckedChange={bgOnCheck}>
				{t("contextMenu.bgLyric", "背景歌词")}
			</ContextMenu.CheckboxItem>
			
			<ContextMenu.Sub>
				<ContextMenu.SubTrigger>👥 设置演唱角色</ContextMenu.SubTrigger>
				<ContextMenu.SubContent>
					{roleIds.map((roleId, index) => {
						const isChecked = selectedLineObjs.length > 0 && selectedLineObjs.every(l => (l.role || '1') === roleId);
						
						// 🌟 核心：直接从当前激活的文件夹中按索引获取名字，绝对不会脱节
						const customName = activeFolder.roles[index];
						const displayName = customName ? customName : (roleId === "1" ? "主唱" : `角色 ${roleId}`);
						
						return (
							<ContextMenu.CheckboxItem 
								key={roleId} 
								checked={isChecked} 
								onCheckedChange={() => setRole(roleId)}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: roleId === '1' ? 'var(--blue-9)' : 'var(--orange-9)' }} />
									{displayName}
								</div>
							</ContextMenu.CheckboxItem>
						);
					})}
				</ContextMenu.SubContent>
			</ContextMenu.Sub>

			<ContextMenu.Separator />
			<ContextMenu.Item
				onSelect={() => {
					editLyricLines((state) => {
						state.lyricLines.splice(lineIndex, 0, newLyricLine());
					});
				}}
			>
				{t("contextMenu.insertLineBefore", "在前插入空行")}
			</ContextMenu.Item>
			<ContextMenu.Item
				onSelect={() => {
					editLyricLines((state) => {
						state.lyricLines.splice(lineIndex + 1, 0, newLyricLine());
					});
				}}
			>
				{t("contextMenu.insertLineAfter", "在后插入空行")}
			</ContextMenu.Item>
			<ContextMenu.Item onSelect={copyLines} disabled={selectedLinesSize === 0}>
				{t("contextMenu.copyLine", {
					count: selectedLinesSize,
					defaultValue: "复制行",
				})}
			</ContextMenu.Item>
			<ContextMenu.Item onSelect={combineLines} disabled={!combineEnabled}>
				{t("contextMenu.combineLine", "合并行")}
			</ContextMenu.Item>
			<ContextMenu.Item
				onSelect={() => {
					editLyricLines((state) => {
						if (selectedLinesSize === 0) {
							state.lyricLines.splice(lineIndex, 1);
						} else {
							state.lyricLines = state.lyricLines.filter(
								(line) => !selectedLines.has(line.id),
							);
						}
					});
				}}
			>
				{t("contextMenu.deleteLine", {
					count: selectedLinesSize,
					defaultValue: "删除行",
				})}
			</ContextMenu.Item>
		</>
	);

	function combineLines() {
		editLyricLines((state) => {
			if (!combineEnabled) return;
			const { minIdx, maxIdx } = combineEnabled;
			const target = state.lyricLines[minIdx];
			for (let i = minIdx + 1; i <= maxIdx; i++) {
				const line = state.lyricLines[i];
				target.words.push(...line.words);
			}
			target.endTime = state.lyricLines[maxIdx].endTime;
			state.lyricLines.splice(minIdx + 1, maxIdx - minIdx);
		});
	}

	function copyLines() {
		editLyricLines((state) => {
			state.lyricLines = state.lyricLines.flatMap((line) => {
				if (!selectedLines.has(line.id)) return line;
				const newLine: LyricLine = {
					...line,
					id: newLyricLine().id,
					words: line.words.map((word) => ({
						...word,
						id: newLyricWord().id,
					})),
				};
				return [line, newLine];
			});
		});
	}
};