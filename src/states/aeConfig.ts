// 文件路径: src/states/aeConfig.ts
import { atomWithStorage } from 'jotai/utils';

export interface AEExportConfig {
	isGodMode: boolean;
	compWidth: number;   // 🌟 新增：画布宽度
	compHeight: number;  // 🌟 新增：画布高度
	lineSpacing: number;
	lifeTime: number;
	fovThreshold: number;
	previewLines: number;
	baseMotionType: string;
	mainFontSize: number;
	subFontSize: number;
	letterSpacing: number;
	verticalOffset: number;
	enableStroke: boolean;
	strokeWidth: number;
	animDuration: number;
	easingCurve: string;
	charDelay: number;
	glowIntensity: number;
	blurRadius: number;
	previewScale: number;
	showGrid: boolean;
}

export const defaultAEConfig: AEExportConfig = {
	isGodMode: false,
	compWidth: 1920,     // 🌟 默认 1080p 横屏
	compHeight: 1080,
	lineSpacing: 220, lifeTime: 15, fovThreshold: 1200, previewLines: 15, baseMotionType: 'fade-up',
	mainFontSize: 80, subFontSize: 45, letterSpacing: 0, verticalOffset: 75,
	enableStroke: false, strokeWidth: 2, animDuration: 0.6, easingCurve: 'ease-out', charDelay: 0,
	glowIntensity: 50, blurRadius: 12, previewScale: 0.25, showGrid: true
};

export const aeConfigAtom = atomWithStorage<AEExportConfig>('amll-ae-config', defaultAEConfig);