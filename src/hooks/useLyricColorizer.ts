import { useEffect } from 'react';
import type { TTMLLyric, LyricLine, LyricWord } from '../types/ttml';

function parseMixedText(text: string): { text: string; color: string | null }[] {
  const regex = /\{([^}]*?)#([0-9A-Fa-f]{6})([^}]*?)\}/g;
  const parts: { text: string; color: string | null }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while (true) {
    match = regex.exec(text);
    if (match === null) break;
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), color: null });
    }
    const innerText = match[1] + match[3];
    const color = '#' + match[2];
    parts.push({ text: innerText, color });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), color: null });
  }
  return parts;
}

function getMainText(line: LyricLine): string {
  return line.words.map((w: LyricWord) => w.word.split('#')[0]).join('');
}

function getCleanRoman(line: LyricLine): string {
  return line.romanLyric?.replace(/\{[^}]*#[0-9A-Fa-f]{6}[^}]*\}/g, (match) => {
    const inner = match.slice(1, -1);
    const hashIndex = inner.lastIndexOf('#');
    return hashIndex > 0 ? inner.slice(0, hashIndex) : inner;
  }) ?? '';
}

/**
 * 纯净版色彩注入引擎：彻底告别 setInterval
 * 采用 MutationObserver 被动监听模式，0 性能浪费
 */
export const useLyricColorizer = (
  originalLyricLines: TTMLLyric,
  showTranslation: boolean,
  showRoman: boolean,
  enabled: boolean
) => {
  useEffect(() => {
    if (!enabled || !originalLyricLines || !originalLyricLines.lyricLines) return;

    // 核心染色逻辑（完全保留了你对 main 和 sub 节点的精确匹配逻辑）
    const applyColors = () => {
      const mainLineNodes = Array.from(document.querySelectorAll('[class*="lyricMainLine"]')) as HTMLElement[];
      const subLineNodes = Array.from(document.querySelectorAll('[class*="lyricSubLine"]')) as HTMLElement[];

      originalLyricLines.lyricLines.forEach((lineData, index) => {
        const mainText = getMainText(lineData);

        let mainNode = mainLineNodes.find(node =>
          node.textContent?.trim().replace(/\s+/g, ' ') === mainText.trim().replace(/\s+/g, ' ')
        );
        if (!mainNode && index < mainLineNodes.length) {
          mainNode = mainLineNodes[index];
        }

        // --- 处理主歌词 ---
        if (mainNode) {
          const wordNodes = Array.from(mainNode.children) as HTMLElement[];

          if (lineData.words.length === 1) {
            const singleWord = lineData.words[0];
            const colorMatch = singleWord.word.match(/(#[0-9a-fA-F]{6})/);
            if (colorMatch) {
              const color = colorMatch[1];
              // 性能优化：只有颜色不一样时才触发重绘
              if (mainNode.style.color !== color) {
                mainNode.style.setProperty('color', color, 'important');
                mainNode.style.setProperty('text-shadow', `0 0 15px ${color}`, 'important');
                wordNodes.forEach(child => {
                  child.style.setProperty('color', color, 'important');
                  child.style.setProperty('text-shadow', `0 0 15px ${color}`, 'important');
                });
              }
            }
          } else {
            const unmatchedNodes = [...wordNodes];
            lineData.words.forEach((wordData) => {
              const cleanWord = wordData.word.split('#')[0];
              if (cleanWord.trim() === '') return;
              const nodeIndex = unmatchedNodes.findIndex(node =>
                node.textContent?.trim().replace(/\s+/g, ' ') === cleanWord.trim().replace(/\s+/g, ' ')
              );
              if (nodeIndex !== -1) {
                const targetNode = unmatchedNodes[nodeIndex];
                const colorMatch = wordData.word.match(/(#[0-9a-fA-F]{6})/);
                if (colorMatch && targetNode.style.color !== colorMatch[1]) {
                  targetNode.style.setProperty('color', colorMatch[1], 'important');
                  targetNode.style.setProperty('text-shadow', `0 0 15px ${colorMatch[1]}`, 'important');
                }
                unmatchedNodes.splice(nodeIndex, 1);
              }
            });
          }
        }

        // --- 处理翻译行 ---
        if (showTranslation && lineData.translatedLyric) {
          const transClean = parseMixedText(lineData.translatedLyric).map(p => p.text).join('');
          const subNode = subLineNodes.find(node =>
            node.textContent?.trim().replace(/\s+/g, ' ') === transClean.trim().replace(/\s+/g, ' ')
          );
          // 安全锁：如果已经被拆分过，坚决不重新渲染
          if (subNode && subNode.dataset.splitApplied !== 'true') {
            const parts = parseMixedText(lineData.translatedLyric);
            subNode.innerHTML = '';
            parts.forEach(part => {
              const span = document.createElement('span');
              span.textContent = part.text;
              if (part.color) {
                span.style.setProperty('color', part.color, 'important');
                span.style.setProperty('text-shadow', `0 0 10px ${part.color}`, 'important');
              }
              subNode.appendChild(span);
            });
            subNode.dataset.splitApplied = 'true';
          }
        }

        // --- 处理音译行 ---
        if (showRoman && lineData.romanLyric) {
          const romanClean = getCleanRoman(lineData);
          const subNode = subLineNodes.find(node =>
            node.textContent?.trim().replace(/\s+/g, ' ') === romanClean.trim().replace(/\s+/g, ' ')
          );
          // 安全锁：同理
          if (subNode && subNode.dataset.splitAppliedRoman !== 'true') { 
            const parts = parseMixedText(lineData.romanLyric);
            subNode.innerHTML = '';
            parts.forEach(part => {
              const span = document.createElement('span');
              span.textContent = part.text;
              if (part.color) {
                span.style.setProperty('color', part.color, 'important');
                span.style.setProperty('text-shadow', `0 0 10px ${part.color}`, 'important');
              }
              subNode.appendChild(span);
            });
            subNode.dataset.splitAppliedRoman = 'true';
          }
        }
      });
    };

    // 🌟 监听器核心：取代 setInterval
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const m of mutations) {
        // 只有在屏幕上真的出现了新歌词节点，或者文字发生了变动时，才去扫一次
        if (m.addedNodes.length > 0 || m.type === 'characterData') {
          shouldScan = true;
          break;
        }
      }
      
      if (shouldScan) {
        applyColors();
      }
    });

    // 第一次挂载时先主动渲染一次
    applyColors();

    // 绑定到 AMLL 播放器的最高层容器上 (注意：关闭了 attributes 监听以防止无限死循环)
    const targetNode = document.querySelector('.amll-wrapper') || document.body;
    if (targetNode) {
      observer.observe(targetNode, { 
        childList: true, 
        subtree: true, 
        characterData: true 
      });
    }

    return () => observer.disconnect();
  }, [originalLyricLines, showTranslation, showRoman, enabled]);
};