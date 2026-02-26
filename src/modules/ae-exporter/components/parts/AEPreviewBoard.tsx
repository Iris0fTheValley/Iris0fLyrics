// 文件路径：src/modules/ae-exporter/components/parts/AEPreviewBoard.tsx
import { Box, Text } from '@radix-ui/themes';
import { useAtomValue } from 'jotai';
import { aeConfigAtom } from '$/states/aeConfig';

export interface AEPreviewBoardProps {
	activeIdxFloat: number;
	spacing: number;
	fov: number;
	life: number;
	useEffects: boolean;
	motionType: string;
	totalLines: number;
	scale?: number;
	isStandard?: boolean;
}

export default function AEPreviewBoard({
	activeIdxFloat, spacing, fov, life, useEffects, motionType, totalLines, scale = 0.25, isStandard = true
}: AEPreviewBoardProps) {
	const config = useAtomValue(aeConfigAtom);
	const linesArr = Array.from({ length: totalLines }, (_, i) => i);
	const activeIdxRound = Math.round(activeIdxFloat);

	return (
		<Box style={{
			position: 'absolute', top: '50%', left: '50%', width: '100%',
			transform: `translate(-50%, calc(-50% - ${activeIdxFloat * spacing * scale}px))`,
			transition: useEffects ? `transform ${config.animDuration}s cubic-bezier(0.25, 1, 0.5, 1)` : 'none'
		}}>
			{linesArr.map(idx => {
				const isActive = idx === activeIdxRound;
				const dist = Math.abs(idx - activeIdxFloat) * spacing;
				const isFovCutoff = dist > fov;
				const timeDiff = Math.abs(idx - activeIdxFloat) * 1.8;
				const isTimeCutoff = timeDiff > life;
				const isCulled = isFovCutoff || isTimeCutoff;
				const opacity = isCulled ? 0 : 1 - (dist / fov) * 0.8;
				const itemScale = isCulled ? 0.8 : 1 - (dist / fov) * 0.2;

				const renderStyle = isStandard ? { backgroundColor: isActive ? 'var(--jade-9)' : 'var(--gray-8)', border: config.enableStroke ? `1px solid var(--gray-12)` : 'none' }
				: { backgroundColor: isActive ? 'rgba(41, 163, 131, 0.2)' : 'transparent', border: isActive ? '2px dashed var(--jade-9)' : '1px dashed var(--gray-8)' };

				return (
					<Box key={idx} style={{
						position: 'absolute', left: '50%', top: `${idx * spacing * scale}px`,
						transform: `translateX(-50%) scale(${itemScale})`, opacity: isActive ? 1 : opacity,
						transition: useEffects ? `opacity 0.3s, transform 0.3s` : 'none',
						width: isActive ? '55%' : '40%', height: `${Math.max(24, config.mainFontSize * scale)}px`, pointerEvents: 'none'
					}}>
						<Box style={{
							width: '100%', height: '100%', borderRadius: '12px', ...renderStyle,
							boxShadow: isActive && useEffects && isStandard ? `0 0 ${config.glowIntensity / 3}px var(--jade-8)` : 'none',
							filter: !isActive && useEffects && isStandard ? `blur(${Math.min(dist / 200, config.blurRadius / 3)}px)` : 'none',
							animation: isActive && motionType !== 'none' && useEffects && isStandard
								? (motionType === 'fade-up' ? `aeFadeUp ${config.animDuration}s ${config.easingCurve}` : `aePopIn ${config.animDuration}s ${config.easingCurve}`)
								: 'none',
							display: 'flex', justifyContent: 'center', alignItems: 'center'
						}}>
							<Text size="1" style={{ color: isActive ? (isStandard ? 'white' : 'var(--jade-11)') : 'transparent', userSelect: 'none', letterSpacing: `${config.letterSpacing}px` }}>
								{isActive ? '当前正在演唱的行...' : ''}
							</Text>
						</Box>
					</Box>
				);
			})}
		</Box>
	);
}