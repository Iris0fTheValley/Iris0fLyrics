import React, { useMemo } from 'react';

// 🚀 独立导出的数学引擎：专门处理方程解析、坐标系转换和切线计算
export const MathEngine = {
	_cache: { expr: '', fn: null as Function | null },

	compile: (rawExpr: string): Function | null => {
		if (!rawExpr || rawExpr.trim() === '') return null;
		if (MathEngine._cache.expr === rawExpr) return MathEngine._cache.fn;
		let expr = rawExpr.trim().replace(/^(?:y|f\(x\))\s*=\s*/i, '').replace(/\^/g, '**');
		expr = expr.replace(/(\d)\s*(?=\(|x|[a-zA-Z])/gi, '$1*').replace(/\)\s*(?=\(|x|\d|[a-zA-Z])/gi, ')*');
		try {
			const fn = new Function('x', `const { sin, cos, tan, abs, sqrt, pow, PI, E, max, min, round, floor, ceil } = Math; return ${expr};`);
			fn(50); 
			MathEngine._cache.expr = rawExpr; MathEngine._cache.fn = fn;
			return fn;
		} catch (e) { return null; }
	},

	evalY: (expr: string, x: number): number | null => {
		const fn = MathEngine.compile(expr);
		if (!fn) return null;
		try {
			const y = fn(x);
			return typeof y === 'number' && !Number.isNaN(y) && Number.isFinite(y) ? y : null;
		} catch (e) { return null; }
	},

	getTangentRot: (expr: string, x: number): number => {
		const y1 = MathEngine.evalY(expr, x - 0.1), y2 = MathEngine.evalY(expr, x + 0.1);
		if (y1 === null || y2 === null) return 0;
		return Math.atan2(y2 - y1, 0.2) * (180 / Math.PI);
	},

	// 🌟 空间魔法：把鼠标全局坐标，逆向扣除偏移量后再卷曲回局部坐标系
	globalToLocal: (gx: number, gy: number, scale: number, rot: number, ox: number = 0, oy: number = 0) => {
		const rad = -rot * (Math.PI / 180), dx = gx - (50 + ox), dy = gy - (50 + oy);
		const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
		const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
		return [rx / scale + 50, ry / scale + 50];
	},

	// 🌟 空间魔法：把吸附好的局部点，舒展放大后再叠加偏移量弹回全局坐标系
	localToGlobal: (lx: number, ly: number, scale: number, rot: number, ox: number = 0, oy: number = 0) => {
		const rad = rot * (Math.PI / 180), dx = (lx - 50) * scale, dy = (ly - 50) * scale;
		const gx = dx * Math.cos(rad) - dy * Math.sin(rad);
		const gy = dx * Math.sin(rad) + dy * Math.cos(rad);
		return [gx + 50 + ox, gy + 50 + oy];
	}
};

// 🌟 新增 offsetX 和 offsetY
interface AEMathTrajectoryProps { equation?: string; scale?: number; rot?: number; offsetX?: number; offsetY?: number; }

export default function AEMathTrajectory({ equation, scale = 1, rot = 0, offsetX = 0, offsetY = 0 }: AEMathTrajectoryProps) {
	const pathD = useMemo(() => {
		if (!equation) return '';
		let d = '', isPenDown = false;
		for (let x = -150; x <= 250; x += 0.5) {
			const y = MathEngine.evalY(equation, x);
			if (y === null || y < -150 || y > 250) {
				isPenDown = false;
				continue;
			}
			if (!isPenDown) {
				d += `M ${x} ${y} `;
				isPenDown = true;
			} else {
				d += `L ${x} ${y} `;
			}
		}
		return d;
	}, [equation]);

	if (!pathD) return null;

	return (
		<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
			{/* 🌟 核心：在 transform 中加入 offsetX 和 offsetY 的物理平移 */}
			<g transform={`translate(${50 + offsetX}, ${50 + offsetY}) rotate(${rot}) scale(${scale}) translate(-50, -50)`}>
				<path 
					d={pathD} 
					fill="none" 
					stroke="var(--jade-10, #00cc99)" 
					strokeWidth={2} 
					strokeDasharray={`${0.8 / scale} ${0.8 / scale}`} 
					opacity={0.8} 
					vectorEffect="non-scaling-stroke" 
					style={{ pointerEvents: 'none' }} 
				/>
			</g>
		</svg>
	);
}