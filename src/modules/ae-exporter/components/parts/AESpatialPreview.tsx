// src/modules/ae-exporter/components/parts/AESpatialPreview.tsx
import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { currentTimeAtom } from '$/modules/audio/states/index';
import { spatialDataMapAtom, emptyRoleData } from '$/states/spatial'; 
import { lyricLinesAtom } from '$/states/main';
import { spatialBgMediaAtom } from '$/states/previewMode';
import type { TrackSpatial, SpatialNode } from '$/states/spatial';
import type { LyricWord } from '$/types/ttml';
import { aeConfigAtom } from '$/states/aeConfig';
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

// 🌟 彻底重构：精准计算单句歌词在指定时间戳处于哪一个轨道节点
function calculateTrackState(line: any, track: TrackSpatial, currentTime: number, animDurationMs: number, visibleDurMs: number) {
  if (!track || !track.visible) return null;
  
  // 按照入场、准备、演唱、退场重组所有节点
  const nodesInfo: { type: string; node: SpatialNode }[] = [];
  if (track.in) nodesInfo.push({ type: 'in', node: track.in });
  // biome-ignore lint/suspicious/useIterableCallbackReturn: <explanation>
  track.preFocus.forEach(n => nodesInfo.push({ type: 'pre', node: n }));
  if (track.focus) nodesInfo.push({ type: 'focus', node: track.focus });
  // biome-ignore lint/suspicious/useIterableCallbackReturn: <explanation>
  track.postFocus.forEach(n => nodesInfo.push({ type: 'post', node: n }));
  if (track.out) nodesInfo.push({ type: 'out', node: track.out });

  if (nodesInfo.length === 0) return null;

  let focusIdx = nodesInfo.findIndex(n => n.type === 'focus');
  if (focusIdx === -1) focusIdx = 0;

  // 严格复刻 AE 脚本：计算图层的进出场绝对时间
  const preCount = track.preFocus.length + (track.in ? 1 : 0);
  const postCount = track.postFocus.length + (track.out ? 1 : 0);
  const exactInP = line.startTime - (preCount * animDurationMs);
  const exactOutP = Math.max(line.endTime + (postCount * animDurationMs), line.startTime + visibleDurMs);

  // 如果当前时间完全不在该歌词的生命周期内，直接干掉（管理多句同屏）
  if (currentTime < exactInP || currentTime > exactOutP) return null;

  // 映射真实的关键帧
  const frames = nodesInfo.map((info, i) => {
    let t = line.startTime;
    const offset = i - focusIdx;
    if (offset < 0) t = line.startTime + (offset * animDurationMs);
    else if (offset > 0) t = line.endTime + ((offset - 1) * animDurationMs); // 焦点期间歌词停滞，唱完再动
    
    let op = 100;
    if (info.type === 'in' || info.type === 'out') op = 0;
    else if (info.type !== 'focus') op = 40; // 预备和退役字体的亮度

    return {
      t,
      x: getNum(info.node.x, 50),
      y: getNum(info.node.y, 50),
      rot: getNum(info.node.rot, 0),
      op,
      trans: info.node.transition || { type: 'follow', ratio: 50 },
    };
  });

  let idx = 0;
  while (idx < frames.length - 1 && currentTime >= frames[idx + 1].t) {
    idx++;
  }
  
  const isSinging = currentTime >= line.startTime && currentTime <= line.endTime;
  
  if (idx >= frames.length - 1) {
    const f = frames[frames.length - 1];
    return { x: f.x, y: f.y, rot: f.rot, op: isSinging ? 100 : f.op, isSinging };
  }

  const f1 = frames[idx];
  const f2 = frames[idx + 1];
  const segDuration = f2.t - f1.t;
  const pct = segDuration > 0 ? (currentTime - f1.t) / segDuration : 1;

  let currentX = lerp(f1.x, f2.x, pct);
  let currentY = lerp(f1.y, f2.y, pct);
  let currentRot = f1.rot;
  let currentOp = lerp(f1.op, f2.op, pct);

  const transType = f2.trans.type;
  const transRatio = (f2.trans.ratio || 0) / 100;

  if (transType === 'hold') {
    currentX = f1.x;
    currentY = f1.y;
    currentRot = f1.rot;
    currentOp = f1.op;
  } else if (transType === 'delay') {
    if (pct < transRatio) {
      currentRot = f1.rot;
      currentOp = f1.op;
    } else {
      const safeRemain = 1 - transRatio;
      const mappedPct = safeRemain > 0 ? (pct - transRatio) / safeRemain : 1;
      currentRot = lerp(f1.rot, f2.rot, mappedPct);
      currentOp = lerp(f1.op, f2.op, mappedPct);
    }
  } else {
    currentRot = lerp(f1.rot, f2.rot, pct);
  }

  // 如果正在被唱，强制满状态高亮
  if (isSinging) currentOp = 100;

  return { x: currentX, y: currentY, rot: currentRot, op: currentOp, isSinging };
}

// ==========================================
// 👻 舞台组件：沉浸式监视器
// ==========================================
export const AESpatialPreview: React.FC = () => {
  const currentTime = useAtomValue(currentTimeAtom);
  const spatialDataMap = useAtomValue(spatialDataMapAtom); 
  const { lyricLines } = useAtomValue(lyricLinesAtom);
  const bgMedia = useAtomValue(spatialBgMediaAtom);
  
  // 🌟 读取左侧控制面板里的动效时长
  const aeConfig = useAtomValue(aeConfigAtom) as any;
  const animDurationMs = (aeConfig.animDuration || 0.6) * 1000;
  const visibleDurMs = (aeConfig.visibleDuration || 5.0) * 1000;

  const stageStyle: React.CSSProperties = {
    position: 'relative', width: '100%', height: '100%', 
    backgroundColor: '#0a0a0a', borderRadius: '8px', overflow: 'hidden'
  };

  // 🌟 性能优化：只做一次文字解析，不把高频刷新的坐标放进缓存
  const parsedLines = useMemo(() => {
    return lyricLines.map(line => ({
       line,
       parsedMain: parseMainWords(line.words),
       parsedSub: line.translatedLyric ? parseMixedText(line.translatedLyric) : [],
       parsedRuby: line.romanLyric ? parseMixedText(line.romanLyric) : []
    }));
  }, [lyricLines]);

  // 🌟 核心突破：帧级驱动所有处于“存活期”的队列歌词
  const activeRenderData = [];
  for (let i = 0; i < parsedLines.length; i++) {
    const item = parsedLines[i];
    const roleId = item.line.role || '1';
    const spatialData = spatialDataMap[roleId] || emptyRoleData();
    
    const mainState = calculateTrackState(item.line, spatialData.main, currentTime, animDurationMs, visibleDurMs);
    const subState = calculateTrackState(item.line, spatialData.sub, currentTime, animDurationMs, visibleDurMs);
    const rubyState = calculateTrackState(item.line, spatialData.ruby, currentTime, animDurationMs, visibleDurMs);

    if (mainState || subState || rubyState) {
      activeRenderData.push({ ...item, mainState, subState, rubyState });
    }
  }

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
      {activeRenderData.length === 0 && (
        <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <h1 style={{ color: '#00ffcc', fontFamily: 'monospace', textShadow: '0 0 10px #00ffcc', opacity: bgMedia ? 0.2 : 0.5 }}>
            🌌 空间物理漫游引擎 - 等待歌词入场...
          </h1>
        </div>
      )}

      {/* 渲染所有还在生命周期内的歌词 */}
      {activeRenderData.map((item, index) => {
         const baseKey = item.line.id || item.line.startTime + '-' + index;
         return (
           <React.Fragment key={baseKey}>
              {/* 🟢 主轨道演员 */}
              {item.mainState && (
                <div style={{
                  position: 'absolute', left: `${item.mainState.x}%`, top: `${item.mainState.y}%`,
                  transform: `translate(-50%, -50%) rotate(${item.mainState.rot}deg)`, 
                  opacity: item.mainState.op / 100,
                  fontSize: '2.5rem', fontWeight: 'bold', whiteSpace: 'nowrap', pointerEvents: 'none', 
                  zIndex: item.mainState.isSinging ? 15 : 10,
                  filter: item.mainState.isSinging ? 'drop-shadow(0px 0px 8px rgba(255,255,255,0.6))' : 'drop-shadow(0px 0px 4px rgba(255,255,255,0.2))'
                }}>
                  {item.parsedMain.map((word) => (
                    <span key={word.id} style={{
                      color: word.color || 'white',
                      textShadow: word.color ? `0 0 15px ${word.color}` : '0 0 15px rgba(255,255,255,0.6)',
                    }}>{word.text}</span>
                  ))}
                </div>
              )}

              {/* 🔵 副轨道(翻译)演员 */}
              {item.subState && item.parsedSub.length > 0 && (
                <div style={{
                  position: 'absolute', left: `${item.subState.x}%`, top: `${item.subState.y}%`,
                  transform: `translate(-50%, -50%) rotate(${item.subState.rot}deg)`,
                  opacity: item.subState.op / 100,
                  fontSize: '1.5rem', whiteSpace: 'nowrap', pointerEvents: 'none', 
                  zIndex: item.subState.isSinging ? 13 : 8
                }}>
                  {item.parsedSub.map((part) => (
                    <span key={part.id} style={{
                      color: part.color || '#00ffcc',
                      textShadow: part.color ? `0 0 10px ${part.color}` : '0 0 10px rgba(0, 255, 204, 0.4)',
                    }}>{part.text}</span>
                  ))}
                </div>
              )}

              {/* 🟣 罗马音(音译)演员 */}
              {item.rubyState && item.parsedRuby.length > 0 && (
                <div style={{
                  position: 'absolute', left: `${item.rubyState.x}%`, top: `${item.rubyState.y}%`,
                  transform: `translate(-50%, -50%) rotate(${item.rubyState.rot}deg)`,
                  opacity: item.rubyState.op / 100,
                  fontSize: '1.2rem', whiteSpace: 'nowrap', pointerEvents: 'none', 
                  zIndex: item.rubyState.isSinging ? 11 : 6
                }}>
                  {item.parsedRuby.map((part) => (
                    <span key={part.id} style={{
                      color: part.color || '#ffcc00', 
                      textShadow: part.color ? `0 0 10px ${part.color}` : '0 0 10px rgba(255, 204, 0, 0.4)',
                    }}>{part.text}</span>
                  ))}
                </div>
              )}
           </React.Fragment>
         );
      })}
    </div>
  );
};