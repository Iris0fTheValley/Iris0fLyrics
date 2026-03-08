// src/modules/ae-exporter/components/parts/AESpatialPreview.tsx
import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { currentTimeAtom } from '$/modules/audio/states/index';
import { spatialDataMapAtom, emptyRoleData } from '$/states/spatial'; 
import { lyricLinesAtom } from '$/states/main';
import { spatialBgMediaAtom } from '$/states/previewMode';
import type { TrackSpatial, SpatialNode } from '$/states/spatial';
import type { LyricWord } from '$/types/ttml';

// ==========================================
// 🎨 纯数据驱动：歌词色彩解析器
// ==========================================
function parseMixedText(text: string) {
  if (!text) return [];
  const regex = /\{([^}]*?)#([0-9A-Fa-f]{6})([^}]*?)\}/g;
  
  // 🌟 修复: 强制返回唯一 id，抛弃 idx 索引，满足 React 性能要求
  const parts: { text: string; color: string | null; id: string }[] = [];
  let lastIndex = 0;

  // 🌟 修复: 拆解条件表达式内的赋值 (noAssignInExpressions)
  while (true) {
    const match = regex.exec(text);
    if (match === null) break;

    if (match.index > lastIndex) {
      parts.push({ 
        text: text.slice(lastIndex, match.index), 
        color: null, 
        id: `txt-${lastIndex}` 
      });
    }
    parts.push({ 
      text: match[1] + match[3], 
      color: '#' + match[2], 
      id: `col-${match.index}` 
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push({ 
      text: text.slice(lastIndex), 
      color: null, 
      id: `txt-${lastIndex}` 
    });
  }
  return parts;
}

function parseMainWords(words: LyricWord[]) {
  return words.map((w, i) => {
    const raw = w.word || '';
    const text = raw.split('#')[0];
    const colorMatch = raw.match(/(#[0-9a-fA-F]{6})/);
    return { id: w.id || String(i), text, color: colorMatch ? colorMatch[1] : null };
  });
}

// ==========================================
// 🧠 核心物理算子：分离轴 GPS 导航仪
// ==========================================
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
const getNum = (val: number | string, fallback = 0) => {
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val as string);
  return isNaN(parsed) ? fallback : parsed;
};

function useSpatialMath(track: TrackSpatial, timePct: number) {
  return useMemo(() => {
    const nodes = [track.in, ...track.preFocus, track.focus, ...track.postFocus, track.out].filter(Boolean) as SpatialNode[];
    
    if (nodes.length === 0) return { x: 50, y: 50, rot: 0 };
    if (nodes.length === 1 || timePct <= 0) return { x: getNum(nodes[0].x, 50), y: getNum(nodes[0].y, 50), rot: getNum(nodes[0].rot, 0) };
    if (timePct >= 1) {
      const last = nodes[nodes.length - 1];
      return { x: getNum(last.x, 50), y: getNum(last.y, 50), rot: getNum(last.rot, 0) };
    }

    const segmentCount = nodes.length - 1;
    const totalScaled = timePct * segmentCount;
    const currentIndex = Math.floor(totalScaled);
    const segmentPct = totalScaled - currentIndex;

    const nodeA = nodes[currentIndex];
    const nodeB = nodes[currentIndex + 1];

    const ax = getNum(nodeA.x, 50), ay = getNum(nodeA.y, 50), arot = getNum(nodeA.rot, 0);
    const bx = getNum(nodeB.x, 50), by = getNum(nodeB.y, 50), brot = getNum(nodeB.rot, 0);

    const currentX = lerp(ax, bx, segmentPct);
    const currentY = lerp(ay, by, segmentPct);

    let currentRot = arot;
    const transType = nodeB.transition?.type || 'follow';
    const transRatio = (nodeB.transition?.ratio || 0) / 100;

    if (transType === 'follow') {
      currentRot = lerp(arot, brot, segmentPct);
    } else if (transType === 'delay') {
      if (segmentPct < transRatio) {
        currentRot = arot;
      } else {
        const safeRemain = 1 - transRatio;
        const mappedPct = safeRemain > 0 ? (segmentPct - transRatio) / safeRemain : 1;
        currentRot = lerp(arot, brot, mappedPct);
      }
    } else if (transType === 'hold') {
      currentRot = arot;
    }

    return { x: currentX, y: currentY, rot: currentRot };
  }, [track, timePct]);
}

// ==========================================
// 👻 舞台组件：沉浸式监视器
// ==========================================
export const AESpatialPreview: React.FC = () => {
  const currentTime = useAtomValue(currentTimeAtom);
  const spatialDataMap = useAtomValue(spatialDataMapAtom); 
  const { lyricLines } = useAtomValue(lyricLinesAtom);
  const bgMedia = useAtomValue(spatialBgMediaAtom);

  const activeLine = lyricLines.find(line => currentTime >= line.startTime && currentTime <= line.endTime);
  
  let timePct = 0;
  if (activeLine) {
    const duration = activeLine.endTime - activeLine.startTime;
    if (duration > 0) {
      timePct = (currentTime - activeLine.startTime) / duration;
    }
  }

  const activeRoleId = activeLine?.role || '1';
  const spatialData = spatialDataMap[activeRoleId] || emptyRoleData();

  const mainPos = useSpatialMath(spatialData.main, timePct);
  const subPos = useSpatialMath(spatialData.sub, timePct);
  const rubyPos = useSpatialMath(spatialData.ruby, timePct);

  const stageStyle: React.CSSProperties = {
    position: 'relative', width: '100%', height: '100%', 
    backgroundColor: '#0a0a0a', borderRadius: '8px', overflow: 'hidden'
  };

  const parsedMainWords = activeLine ? parseMainWords(activeLine.words) : [];
  const parsedSubWords = activeLine && activeLine.translatedLyric ? parseMixedText(activeLine.translatedLyric) : [];
  const parsedRubyWords = activeLine && activeLine.romanLyric ? parseMixedText(activeLine.romanLyric) : [];

  return (
    <div style={stageStyle}>
      {/* 🖼️ 全局共享底片层 */}
      {bgMedia && bgMedia.type === 'image' && (
        <img src={bgMedia.url} alt="background" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', opacity: 0.4, zIndex: 1 }} />
      )}
      {bgMedia && bgMedia.type === 'video' && (
        <video src={bgMedia.url} autoPlay loop muted style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', opacity: 0.4, zIndex: 1 }} />
      )}

      {/* 如果没词，显示待机 */}
      {!activeLine && (
        <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <h1 style={{ color: '#00ffcc', fontFamily: 'monospace', textShadow: '0 0 10px #00ffcc', opacity: bgMedia ? 0.2 : 0.5 }}>
            🌌 空间物理漫游引擎 - 等待歌词入场...
          </h1>
        </div>
      )}

      {/* 🟢 主轨道演员 (zIndex: 10) */}
      {activeLine && spatialData.main.visible && (
        <div style={{
          position: 'absolute', left: `${mainPos.x}%`, top: `${mainPos.y}%`,
          transform: `translate(-50%, -50%) rotate(${mainPos.rot}deg)`, 
          transition: 'transform 0.05s linear',
          fontSize: '2.5rem', fontWeight: 'bold', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
          filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.3))'
        }}>
          {parsedMainWords.map((word) => (
            <span key={word.id} style={{
              color: word.color || 'white',
              textShadow: word.color ? `0 0 15px ${word.color}` : '0 0 15px rgba(255,255,255,0.6)',
            }}>{word.text}</span>
          ))}
        </div>
      )}

      {/* 🔵 副轨道(翻译)演员 (zIndex: 8) */}
      {activeLine && spatialData.sub.visible && parsedSubWords.length > 0 && (
        <div style={{
          position: 'absolute', left: `${subPos.x}%`, top: `${subPos.y}%`,
          transform: `translate(-50%, -50%) rotate(${subPos.rot}deg)`,
          transition: 'transform 0.05s linear',
          fontSize: '1.5rem', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 8
        }}>
          {/* 🌟 修复: 使用绝对唯一的 part.id */}
          {parsedSubWords.map((part) => (
            <span key={part.id} style={{
              color: part.color || '#00ffcc',
              textShadow: part.color ? `0 0 10px ${part.color}` : '0 0 10px rgba(0, 255, 204, 0.4)',
            }}>{part.text}</span>
          ))}
        </div>
      )}

      {/* 🟣 罗马音(音译)演员 (zIndex: 6) */}
      {activeLine && spatialData.ruby.visible && parsedRubyWords.length > 0 && (
        <div style={{
          position: 'absolute', left: `${rubyPos.x}%`, top: `${rubyPos.y}%`,
          transform: `translate(-50%, -50%) rotate(${rubyPos.rot}deg)`,
          transition: 'transform 0.05s linear',
          fontSize: '1.2rem', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 6
        }}>
          {/* 🌟 修复: 使用绝对唯一的 part.id */}
          {parsedRubyWords.map((part) => (
            <span key={part.id} style={{
              color: part.color || '#ffcc00', 
              textShadow: part.color ? `0 0 10px ${part.color}` : '0 0 10px rgba(255, 204, 0, 0.4)',
            }}>{part.text}</span>
          ))}
        </div>
      )}
    </div>
  );
};