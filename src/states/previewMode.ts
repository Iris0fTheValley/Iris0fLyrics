// src/states/previewMode.ts
import { atom } from 'jotai';

// 定义对讲机频道：默认是 'classic' (经典滚动)，也可以切到 'spatial' (空间漫游)
export const previewModeAtom = atom<'classic' | 'spatial'>('classic');

// 🌟 新增：全局背景媒体状态，让顶部菜单和画板共享
export const spatialBgMediaAtom = atom<{ type: 'image' | 'video', url: string } | null>(null);