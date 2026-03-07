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

import {
	Button,
	Checkbox,
	Flex,
	Grid,
	RadioGroup,
	Text,
	TextField,
	Popover,
	Box,
	Select,
} from "@radix-ui/themes";
import { atom, useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import { useSetImmerAtom } from "jotai-immer";
import {
	type FC,
	forwardRef,
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
	LayoutMode,
	layoutModeAtom,
	showLineRomanizationAtom,
	showLineTranslationAtom,
	showWordRomanizationInputAtom,
} from "$/modules/settings/states";
import {
	editingTimeFieldAtom,
	lyricLinesAtom,
	requestFocusAtom,
	selectedLinesAtom,
	selectedWordsAtom,
} from "$/states/main.ts";
import { roleSystemAtom } from "$/states/spatial.ts"; // 🌟 改为引入大系统库
import { useCursorInjection } from "$/hooks/useCursorInjection";
import { roleNamesAtom, roleCountAtom } from "$/states/spatial.ts";
import { type LyricLine, type LyricWord, newLyricLine } from "$/types/ttml";
import { msToTimestamp, parseTimespan } from "$/utils/timestamp.ts";
import { RibbonFrame, RibbonSection } from "./common";

const MULTIPLE_VALUES = Symbol("multiple-values");

function EditField<
	L extends Word extends true ? LyricWord : LyricLine,
	F extends keyof L,
	Word extends boolean | undefined = undefined,
>({
	label,
	isWordField,
	fieldName,
	formatter,
	parser,
	textFieldStyle,
}: {
	label: string;
	isWordField?: Word;
	fieldName: F;
	formatter: (v: L[F]) => string;
	parser: (v: string) => L[F];
	textFieldStyle?: React.CSSProperties;
}) {
	const [fieldInput, setFieldInput] = useState<string | undefined>(undefined);
	const [fieldPlaceholder, setFieldPlaceholder] = useState<string>("");
	const itemAtom = useMemo(
		() => (isWordField ? selectedWordsAtom : selectedLinesAtom),
		[isWordField],
	);

	const editLyricLines = useSetImmerAtom(lyricLinesAtom);
	const { t } = useTranslation();
	const setEditingTimeField = useSetAtom(editingTimeFieldAtom);

	const [requestFocus, setRequestFocus] = useAtom(requestFocusAtom);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (requestFocus === fieldName && !isWordField && inputRef.current) {
			inputRef.current.focus();
			setRequestFocus(null);
		}
	}, [requestFocus, fieldName, isWordField, setRequestFocus]);

	const hasErrorAtom = useMemo(
		() =>
			atom((get) => {
				if (fieldName !== "startTime" && fieldName !== "endTime") {
					return false;
				}

				const selectedItems = get(itemAtom);
				if (selectedItems.size === 0) return false;

				const lyricLines = get(lyricLinesAtom);

				if (isWordField) {
					const selectedWords = selectedItems;
					for (const line of lyricLines.lyricLines) {
						for (const word of line.words) {
							if (selectedWords.has(word.id)) {
								if (word.startTime > word.endTime) {
									return true;
								}
							}
						}
					}
				} else {
					const selectedLines = selectedItems;
					for (const line of lyricLines.lyricLines) {
						if (selectedLines.has(line.id)) {
							if (line.startTime > line.endTime) {
								return true;
							}
						}
					}
				}
				return false;
			}),
		[fieldName, isWordField, itemAtom],
	);
	const hasError = useAtomValue(hasErrorAtom);

	const currentValueAtom = useMemo(
		() =>
			atom((get) => {
				const selectedItems = get(itemAtom);
				const lyricLines = get(lyricLinesAtom);
				if (selectedItems.size === 0) return undefined;

				if (isWordField) {
					const selectedWords = selectedItems as Set<string>;
					const values = new Set();
					for (const line of lyricLines.lyricLines) {
						for (const word of line.words) {
							if (selectedWords.has(word.id)) {
								values.add(word[fieldName as keyof LyricWord]);
							}
						}
					}
					if (values.size === 1)
						return formatter(values.values().next().value as L[F]);
					return MULTIPLE_VALUES;
				}
				const selectedLines = selectedItems as Set<string>;
				const values = new Set();
				for (const line of lyricLines.lyricLines) {
					if (selectedLines.has(line.id)) {
						values.add(line[fieldName as keyof LyricLine]);
					}
				}
				if (values.size === 1)
					return formatter(values.values().next().value as L[F]);
				return MULTIPLE_VALUES;
			}),
		[fieldName, formatter, isWordField, itemAtom],
	);
	const currentValue = useAtomValue(currentValueAtom);
	const store = useStore();

	const onInputFinished = useCallback(
		(rawValue: string) => {
			try {
				const selectedItems = store.get(itemAtom);
				const value = parser(rawValue);
				editLyricLines((state) => {
					for (const line of state.lyricLines) {
						if (isWordField) {
							for (const word of line.words) {
								if (selectedItems.has(word.id)) {
									(word as L)[fieldName] = value;
								}
							}
						} else {
							if (selectedItems.has(line.id)) {
								(line as L)[fieldName] = value;
							}
						}
					}
					return state;
				});
			} catch (_err) {
				if (typeof currentValue === "string") setFieldInput(currentValue);
			}
		},
		[
			itemAtom,
			store,
			editLyricLines,
			currentValue,
			fieldName,
			isWordField,
			parser,
		],
	);

	useLayoutEffect(() => {
		if (currentValue === MULTIPLE_VALUES) {
			setFieldInput("");
			setFieldPlaceholder(t("ribbonBar.editMode.multipleValues", "多个值..."));
		} else {
			setFieldInput(currentValue);
			setFieldPlaceholder("");
		}
	}, [currentValue, t]);

	return (
		<>
			<Text wrap="nowrap" size="1">
				{label}
			</Text>
			<TextField.Root
				ref={inputRef}
				size="1"
				color={hasError ? "red" : undefined}
				variant={hasError ? "soft" : undefined}
				style={{ width: "8em", ...textFieldStyle }}
				value={fieldInput ?? ""}
				placeholder={fieldPlaceholder}
				disabled={fieldInput === undefined}
				onChange={(evt) => setFieldInput(evt.currentTarget.value)}
				onKeyDown={(evt) => {
					if (evt.key !== "Enter") return;
					onInputFinished(evt.currentTarget.value);
				}}
				onFocus={() => {
					if (
						!isWordField &&
						(fieldName === "startTime" || fieldName === "endTime")
					) {
						setEditingTimeField({
							isWord: false,
							field: fieldName as "startTime" | "endTime",
						});
					}
				}}
				onBlur={(evt) => {
					setEditingTimeField(null);

					if (evt.currentTarget.value === currentValue) return;
					onInputFinished(evt.currentTarget.value);
				}}
			/>
		</>
	);
}

function CheckboxField<
	L extends Word extends true ? LyricWord : LyricLine,
	F extends keyof L,
	V extends L[F] extends boolean ? boolean : never,
	Word extends boolean | undefined = undefined,
>({
	label,
	isWordField,
	fieldName,
	defaultValue,
}: {
	label: string;
	isWordField: Word;
	fieldName: F;
	defaultValue: V;
}) {
	const itemAtom = useMemo(
		() => (isWordField ? selectedWordsAtom : selectedLinesAtom),
		[isWordField],
	);

	const editLyricLines = useSetImmerAtom(lyricLinesAtom);
	const store = useStore();

	const currentValueAtom = useMemo(
		() =>
			atom((get) => {
				const selectedItems = get(itemAtom);
				const lyricLines = get(lyricLinesAtom);
				if (selectedItems.size) {
					if (isWordField) {
						const selectedWords = selectedItems as Set<string>;
						const values = new Set();
						for (const line of lyricLines.lyricLines) {
							for (const word of line.words) {
								if (selectedWords.has(word.id)) {
									values.add(word[fieldName as keyof LyricWord]);
								}
							}
						}
						if (values.size === 1) return values.values().next().value as L[F];
						return MULTIPLE_VALUES;
					}
					const selectedLines = selectedItems as Set<string>;
					const values = new Set();
					for (const line of lyricLines.lyricLines) {
						if (selectedLines.has(line.id)) {
							values.add(line[fieldName as keyof LyricLine]);
						}
					}
					if (values.size === 1) return values.values().next().value as L[F];
					return MULTIPLE_VALUES;
				}
				return undefined;
			}),
		[itemAtom, fieldName, isWordField],
	);
	const currentValue = useAtomValue(currentValueAtom);
	const isDisabledAtom = useMemo(
		() => atom((get) => get(itemAtom).size === 0),
		[itemAtom],
	);
	const isDisabled = useAtomValue(isDisabledAtom);
	const checkboxId = useId();

	return (
		<>
			<Text wrap="nowrap" size="1">
				<label htmlFor={checkboxId}>{label}</label>
			</Text>
			<Checkbox
				disabled={isDisabled}
				id={checkboxId}
				checked={
					currentValue
						? currentValue === MULTIPLE_VALUES
							? "indeterminate"
							: (currentValue as boolean)
						: defaultValue
				}
				onCheckedChange={(value) => {
					if (value === "indeterminate") return;
					editLyricLines((state) => {
						const selectedItems = store.get(itemAtom);
						for (const line of state.lyricLines) {
							if (isWordField) {
								for (const word of line.words) {
									if (selectedItems.has(word.id)) {
										(word as L)[fieldName] = value as L[F];
									}
								}
							} else {
								if (selectedItems.has(line.id)) {
									(line as L)[fieldName] = value as L[F];
								}
							}
						}
						return state;
					});
				}}
			/>
		</>
	);
}

function EditModeField({
	simpleModeLabel = "简单模式",
	advanceModeLabel = "高级模式",
}) {
	const [layoutMode, setLayoutMode] = useAtom(layoutModeAtom);
	return (
		<RadioGroup.Root
			value={layoutMode}
			onValueChange={(v) => setLayoutMode(v as LayoutMode)}
			size="1"
		>
			<Flex gapY="3" direction="column">
				<Text wrap="nowrap" size="1">
					<RadioGroup.Item value={LayoutMode.Simple}>
						{simpleModeLabel}
					</RadioGroup.Item>
				</Text>
				<Text wrap="nowrap" size="1">
					<RadioGroup.Item value={LayoutMode.Advance}>
						{advanceModeLabel}
					</RadioGroup.Item>
				</Text>
			</Flex>
		</RadioGroup.Root>
	);
}
// function DropdownField<
// 	L extends Word extends true ? LyricWord : LyricLine,
// 	F extends keyof L,
// 	Word extends boolean | undefined = undefined,
// >({
// 	label,
// 	isWordField,
// 	fieldName,
// 	children,
// 	defaultValue,
// }: {
// 	label: string;
// 	isWordField: Word;
// 	fieldName: F;
// 	defaultValue: L[F];
// 	children?: ReactNode | undefined;
// }) {
// 	const itemAtom = useMemo(
// 		() => (isWordField ? selectedWordsAtom : selectedLinesAtom),
// 		[isWordField],
// 	);
// 	const selectedItems = useAtomValue(itemAtom);

// 	const [lyricLines, editLyricLines] = useAtom(currentLyricLinesAtom);

// 	const currentValue = useMemo(() => {
// 		if (selectedItems.size) {
// 			if (isWordField) {
// 				const selectedWords = selectedItems as Set<string>;
// 				const values = new Set();
// 				for (const line of lyricLines.lyricLines) {
// 					for (const word of line.words) {
// 						if (selectedWords.has(word.id)) {
// 							values.add(word[fieldName as keyof LyricWord]);
// 						}
// 					}
// 				}
// 				if (values.size === 1)
// 					return {
// 						multiplieValues: false,
// 						value: values.values().next().value as L[F],
// 					} as const;
// 				return {
// 					multiplieValues: true,
// 					value: "",
// 				} as const;
// 			}
// 			const selectedLines = selectedItems as Set<string>;
// 			const values = new Set();
// 			for (const line of lyricLines.lyricLines) {
// 				if (selectedLines.has(line.id)) {
// 					values.add(line[fieldName as keyof LyricLine]);
// 				}
// 			}
// 			if (values.size === 1)
// 				return {
// 					multiplieValues: false,
// 					value: values.values().next().value as L[F],
// 				} as const;
// 			return {
// 				multiplieValues: true,
// 				value: "",
// 			} as const;
// 		}
// 		return undefined;
// 	}, [selectedItems, fieldName, isWordField, lyricLines]);

// 	return (
// 		<>
// 			<Text wrap="nowrap" size="1">
// 				{label}
// 			</Text>
// 			<Select.Root
// 				size="1"
// 				disabled={selectedItems.size === 0}
// 				defaultValue={defaultValue as string}
// 				value={(currentValue?.value as string) ?? ""}
// 				onValueChange={(value) => {
// 					editLyricLines((state) => {
// 						for (const line of state.lyricLines) {
// 							if (isWordField) {
// 								for (const word of line.words) {
// 									if (selectedItems.has(word.id)) {
// 										(word as L)[fieldName] = value as L[F];
// 									}
// 								}
// 							} else {
// 								if (selectedItems.has(line.id)) {
// 									(line as L)[fieldName] = value as L[F];
// 								}
// 							}
// 						}
// 						return state;
// 					});
// 				}}
// 			>
// 				<Select.Trigger
// 					placeholder={selectedItems.size > 0 ? "多个值..." : undefined}
// 				/>
// 				<Select.Content>{children}</Select.Content>
// 			</Select.Root>
// 		</>
// 	);
// }

const AuxiliaryDisplayField: FC = () => {
	const [showTranslation, setShowTranslation] = useAtom(
		showLineTranslationAtom,
	);
	const [showRomanization, setShowRomanization] = useAtom(
		showLineRomanizationAtom,
	);
	const [showWordRomanizationInput, setShowWordRomanizationInput] = useAtom(
		showWordRomanizationInputAtom,
	);
	const { t } = useTranslation();

	const idTranslation = useId();
	const idRomanization = useId();
	const idPerWord = useId();

	return (
		<Grid columns="1fr auto" gapX="4" gapY="1" flexGrow="1" align="center">
			<Text size="1" asChild>
				<label htmlFor={idTranslation}>
					{t("ribbonBar.editMode.showTranslation", "显示翻译行")}
				</label>
			</Text>
			<Checkbox
				id={idTranslation}
				checked={showTranslation}
				onCheckedChange={(c) => setShowTranslation(Boolean(c))}
			/>
			<Text size="1" asChild>
				<label htmlFor={idRomanization}>
					{t("ribbonBar.editMode.showRomanization", "显示音译行")}
				</label>
			</Text>
			<Checkbox
				id={idRomanization}
				checked={showRomanization}
				onCheckedChange={(c) => setShowRomanization(Boolean(c))}
			/>
			<Text size="1" asChild>
				<label htmlFor={idPerWord}>
					{t("ribbonBar.editMode.showWordRomanizationInput", "显示逐字音译")}
				</label>
			</Text>
			<Checkbox
				id={idPerWord}
				checked={showWordRomanizationInput}
				onCheckedChange={(c) => setShowWordRomanizationInput(Boolean(c))}
			/>
		</Grid>
	);
};

const RoleAssetManager: FC = () => {
	const [system, setSystem] = useAtom(roleSystemAtom);
	const { insertAtCursor } = useCursorInjection();
	const [tempCount, setTempCount] = useState(system.slotCount.toString());

	const activeFolder = system.folders.find(f => f.id === system.activeFolderId) || system.folders[0];

	const handleCountChange = (val: string) => {
		setTempCount(val);
		const num = parseInt(val, 10);
		if (isNaN(num)) return;
		if (num > 20) {
			if (window.confirm(`⚠️ 确定要启用 ${num} 个角色吗？过多的轨道可能导致 AE 渲染极其卡顿！`)) {
				setSystem(s => ({ ...s, slotCount: num }));
			} else {
				setTempCount(system.slotCount.toString());
			}
		} else if (num >= 2) {
			setSystem(s => ({ ...s, slotCount: num }));
		}
	};

	const handleCountBlur = () => {
		const num = parseInt(tempCount, 10);
		if (isNaN(num) || num < 2) {
			setTempCount(Math.max(2, system.slotCount).toString());
			if (num < 2) setSystem(s => ({ ...s, slotCount: 2 }));
		}
	};

	const handleAddFolder = () => {
		const name = window.prompt("输入新企划(分类)名称：", "新企划");
		if (!name) return;
		const newId = Date.now().toString();
		setSystem(s => ({
			...s,
			folders: [...s.folders, { id: newId, name, roles: [] }],
			activeFolderId: newId
		}));
	};

	const handleRenameFolder = () => {
		const name = window.prompt("重命名当前企划：", activeFolder.name);
		if (!name) return;
		setSystem(s => ({
			...s,
			folders: s.folders.map(f => f.id === s.activeFolderId ? { ...f, name } : f)
		}));
	};

	const handleDeleteFolder = () => {
		if (system.folders.length <= 1) return window.alert("至少需要保留一个企划分类！");
		if (window.confirm(`确定要删除企划 "${activeFolder.name}" 吗？此操作不可逆。`)) {
			setSystem(s => {
				const remaining = s.folders.filter(f => f.id !== s.activeFolderId);
				return { ...s, folders: remaining, activeFolderId: remaining[0].id };
			});
		}
	};

	const updateRoleName = (idx: number, val: string) => {
		setSystem(s => {
			const fIdx = s.folders.findIndex(f => f.id === s.activeFolderId);
			if (fIdx === -1) return s;
			
			const newFolders = [...s.folders]; // 1. 生成全新文件夹数组引用
			const newRoles = [...newFolders[fIdx].roles]; // 2. 生成全新名字数组引用
			newRoles[idx] = val;
			
			newFolders[fIdx] = { ...newFolders[fIdx], roles: newRoles }; // 3. 组装
			return { ...s, folders: newFolders }; // 4. 触发极速刷新
		});
	};
	const roleIds = Array.from({ length: system.slotCount }, (_, i) => String(i + 1));

	return (
		<Flex direction="column" gap="3" style={{ width: '310px' }}>
			<Text size="2" weight="bold">自定义演唱角色资产库</Text>
			
			{/* 文件夹管理区 */}
			<Flex align="center" gap="2" style={{ backgroundColor: 'var(--gray-3)', padding: '6px', borderRadius: '6px' }}>
				<Select.Root size="1" value={system.activeFolderId} onValueChange={(val) => setSystem(s => ({...s, activeFolderId: val}))}>
					<Select.Trigger style={{ flex: 1 }} />
					<Select.Content>
						{system.folders.map(f => <Select.Item key={f.id} value={f.id}>{f.name}</Select.Item>)}
					</Select.Content>
				</Select.Root>
				<Button size="1" variant="soft" onClick={handleAddFolder} title="新建企划分类">+</Button>
				<Button size="1" variant="soft" color="orange" onClick={handleRenameFolder} title="重命名">✏️</Button>
				<Button size="1" variant="soft" color="red" onClick={handleDeleteFolder} title="删除">🗑️</Button>
			</Flex>

			{/* 数量控制器 */}
			<Flex align="center" justify="between" style={{ backgroundColor: 'var(--gray-2)', padding: '6px', borderRadius: '6px' }}>
				<Text size="1" color="gray">当前激活轨道数量</Text>
				<TextField.Root
					size="1" type="number" min="2"
					value={tempCount}
					onChange={(e) => handleCountChange(e.target.value)}
					onBlur={handleCountBlur}
					style={{ width: '60px' }}
				/>
			</Flex>

			{/* 动态滚动表单区 */}
			<div style={{ maxHeight: '260px', overflowY: 'auto', paddingRight: '8px' }}>
				<Flex direction="column" gap="2">
					{roleIds.map((roleId, index) => {
						const currentName = activeFolder.roles[index] || '';
						return (
							<Flex key={roleId} align="center" gap="2">
								<Box style={{ width: '8px', height: '8px', minWidth: '8px', borderRadius: '50%', backgroundColor: roleId === '1' ? 'var(--blue-9)' : 'var(--orange-9)' }} />
								<Text size="1" color="gray" style={{ width: '45px' }}>角色 {roleId}</Text>
								<TextField.Root
									size="1"
									value={currentName}
									onChange={(e) => updateRoleName(index, e.target.value)}
									placeholder={roleId === '1' ? '主唱' : `角色 ${roleId}`}
									style={{ flex: 1 }}
								/>
								{/* 🌟 核心：一键插入光标按钮 */}
								<Button size="1" variant="ghost" color="indigo" style={{ cursor: 'pointer', padding: '0 6px' }} title="一键插入名字到编辑光标处" onClick={() => {
									if (currentName) insertAtCursor(currentName);
								}}>
									↙️
								</Button>
							</Flex>
						);
					})}
				</Flex>
			</div>
		</Flex>
	);
};

export const EditModeRibbonBar: FC = forwardRef<HTMLDivElement>(
	(_props, ref) => {
		const editLyricLines = useSetImmerAtom(lyricLinesAtom);
		const { t } = useTranslation();

		return (
			<RibbonFrame ref={ref}>
				<RibbonSection label={t("ribbonBar.editMode.new", "新建")}>
					<Grid columns="1" gap="1" gapY="1" flexGrow="1" align="center">
						<Button
							size="1"
							variant="soft"
							onClick={() =>
								editLyricLines((draft) => {
									draft.lyricLines.push(newLyricLine());
								})
							}
						>
							{t("ribbonBar.editMode.lyricLine", "歌词行")}
						</Button>
					</Grid>
				</RibbonSection>
				<RibbonSection label={t("ribbonBar.editMode.lineTiming", "行时间戳")}>
					<Grid columns="0fr 1fr" gap="2" gapY="1" flexGrow="1" align="center">
						<EditField
							label={t("ribbonBar.editMode.startTime", "起始时间")}
							fieldName="startTime"
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
						<EditField
							label={t("ribbonBar.editMode.endTime", "结束时间")}
							fieldName="endTime"
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
					</Grid>
				</RibbonSection>
				<RibbonSection label={t("ribbonBar.editMode.lineProperties", "行属性")}>
					<Grid columns="0fr 0fr" gap="4" gapY="1" flexGrow="1" align="center">
						<CheckboxField
							label={t("ribbonBar.editMode.bgLyric", "背景歌词")}
							defaultValue={false}
							isWordField={false}
							fieldName="isBG"
						/>
						
					
						<CheckboxField
							label={t("ribbonBar.editMode.ignoreSync", "忽略打轴")}
							isWordField={false}
							fieldName="ignoreSync"
							defaultValue={false}
						/>
					</Grid>
				</RibbonSection>
				<RibbonSection label={t("ribbonBar.editMode.wordTiming", "词时间戳")}>
					<Grid columns="0fr 1fr" gap="2" gapY="1" flexGrow="1" align="center">
						<EditField
							label={t("ribbonBar.editMode.startTime", "起始时间")}
							fieldName="startTime"
							isWordField
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
						<EditField
							label={t("ribbonBar.editMode.endTime", "结束时间")}
							fieldName="endTime"
							isWordField
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
						<EditField
							label={t("ribbonBar.editMode.emptyBeatCount", "空拍数量")}
							fieldName="emptyBeat"
							isWordField
							parser={(v) => {
								const parsed = Number.parseInt(v, 10);
								return Number.isNaN(parsed) ? 0 : parsed;
							}}
							formatter={String}
						/>
					</Grid>
				</RibbonSection>
				<RibbonSection
					label={t("ribbonBar.editMode.wordProperties", "单词属性")}
				>
					<Grid columns="0fr 1fr" gap="2" gapY="1" flexGrow="1" align="center">
						<EditField
							label={t("ribbonBar.editMode.wordContent", "单词内容")}
							fieldName="word"
							isWordField
							parser={(v) => v}
							formatter={(v) => v}
						/>
						<EditField
							label={t("ribbonBar.editMode.romanWord", "单词音译")}
							fieldName="romanWord"
							isWordField
							parser={(v) => v}
							formatter={(v) => v || ""}
						/>
						<CheckboxField
							label={t("ribbonBar.editMode.obscene", "不雅用语")}
							isWordField
							fieldName="obscene"
							defaultValue={false}
						/>
					</Grid>
				</RibbonSection>
				<RibbonSection
					label={t("ribbonBar.editMode.secondaryContent", "次要内容")}
				>
					<Grid columns="0fr 1fr" gap="2" gapY="1" flexGrow="1" align="center">
						<EditField
							label={t("ribbonBar.editMode.translatedLyric", "翻译歌词")}
							fieldName="translatedLyric"
							parser={(v) => v}
							formatter={(v) => v}
							textFieldStyle={{ width: "20em" }}
						/>
						<EditField
							label={t("ribbonBar.editMode.romanLyric", "音译歌词")}
							fieldName="romanLyric"
							parser={(v) => v}
							formatter={(v) => v}
							textFieldStyle={{ width: "20em" }}
						/>
					</Grid>
				</RibbonSection>
				<RibbonSection label={t("ribbonBar.editMode.layoutMode", "布局模式")}>
					<EditModeField
						simpleModeLabel={t(
							"settings.common.layoutModeOptions.simple",
							"简单模式",
						)}
						advanceModeLabel={t(
							"settings.common.layoutModeOptions.advance",
							"高级模式",
						)}
					/>
				</RibbonSection>
				<RibbonSection
					label={t("ribbonBar.editMode.auxiliaryLineDisplay", "辅助行显示")}
				>
					<AuxiliaryDisplayField />
				</RibbonSection>

				{/* 🌟 新增：高级角色名管理面板 (气泡悬浮窗) */}
				<RibbonSection label="角色管理">
					<Grid columns="1" gap="1" flexGrow="1" align="center">
						<Popover.Root>
							<Popover.Trigger>
								<Button size="1" variant="soft" color="indigo" style={{ cursor: 'pointer' }}>
									👥 角色库
								</Button>
							</Popover.Trigger>
							<Popover.Content>
								<RoleAssetManager />
							</Popover.Content>
						</Popover.Root>
					</Grid>
				</RibbonSection>

			</RibbonFrame>
		);
	},
);

export default EditModeRibbonBar;
