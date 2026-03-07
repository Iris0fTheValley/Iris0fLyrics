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

// 文件路径：src/types/ttml.ts
import type {
	LyricLine as AMLLLyricLine,
	LyricWord as AMLLLyricWord,
} from "@applemusic-like-lyrics/lyric";
import { uid } from "uid";

export interface TTMLMetadata {
	key: string;
	value: string[];
	error?: boolean;
}

export interface TTMLLyric {
	metadata: TTMLMetadata[];
	lyricLines: LyricLine[];
}

export interface LyricWord extends AMLLLyricWord {
	id: string;
	obscene: boolean;
	emptyBeat: number;
	romanWarning?: boolean;
}

export const newLyricWord = (): LyricWord => ({
	id: uid(),
	startTime: 0,
	endTime: 0,
	word: "",
	obscene: false,
	emptyBeat: 0,
	romanWord: "",
});

export interface LyricLine extends AMLLLyricLine {
	id: string;
	words: LyricWord[];
	ignoreSync: boolean;
	// 🌟 新增：多角色系统标识符，告诉系统这句词是谁唱的
	role: string; 
}

export const newLyricLine = (): LyricLine => ({
	id: uid(),
	words: [],
	translatedLyric: "",
	romanLyric: "",
	isBG: false,
	isDuet: false, // 保留是为了旧文件解析不报错
	startTime: 0,
	endTime: 0,
	ignoreSync: false,
	// 🌟 默认将新创建的歌词行分配给角色 1
	role: "1", 
});
