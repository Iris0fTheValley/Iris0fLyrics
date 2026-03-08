import "@applemusic-like-lyrics/core/style.css";
import { LyricPlayer, type LyricPlayerRef } from "@applemusic-like-lyrics/react";
import { Card } from "@radix-ui/themes";
import structuredClone from "@ungap/structured-clone";
import classNames from "classnames";
import { useAtomValue } from "jotai";
import { memo, useEffect, useMemo, useRef } from "react";
import { audioEngine } from "$/modules/audio/audio-engine";
import { audioPlayingAtom, currentTimeAtom } from "$/modules/audio/states";
import {
	lyricWordFadeWidthAtom,
	showRomanLinesAtom,
	showTranslationLinesAtom,
} from "$/modules/settings/states/preview";
import { isDarkThemeAtom, lyricLinesAtom } from "$/states/main.ts";
import { enableColorFeaturesAtom } from "$/modules/settings/states";
import { useLyricColorizer } from "../../hooks/useLyricColorizer";
import { previewModeAtom } from "$/states/previewMode"; // 🌟 引入对讲机
import { AESpatialPreview } from "$/modules/ae-exporter/components/parts/AESpatialPreview"; // 🌟 引入透明投影板
import styles from "./index.module.css";

export const AMLLWrapper = memo(() => {
  const previewMode = useAtomValue(previewModeAtom); // 🌟 监听当前模式
  const originalLyricLines = useAtomValue(lyricLinesAtom);
  const currentTime = useAtomValue(currentTimeAtom);
  const isPlaying = useAtomValue(audioPlayingAtom);
  const darkMode = useAtomValue(isDarkThemeAtom);
  const showTranslationLines = useAtomValue(showTranslationLinesAtom);
  const showRomanLines = useAtomValue(showRomanLinesAtom);
  const wordFadeWidth = useAtomValue(lyricWordFadeWidthAtom);
  const enableColorFeatures = useAtomValue(enableColorFeaturesAtom);
  const playerRef = useRef<LyricPlayerRef>(null);

  // 传入 showRomanLines
  useLyricColorizer(originalLyricLines, showTranslationLines, showRomanLines, enableColorFeatures);

  const lyricLines = useMemo(() => {
    return structuredClone(
      originalLyricLines.lyricLines.map((line) => {
        const words = line.words.map((w) => ({
          ...w,
          word: w.word.split('#')[0],
        }));
        const translatedLyric = showTranslationLines
          ? (line.translatedLyric?.replace(/\{[^}]*#[0-9A-Fa-f]{6}[^}]*\}/g, (match) => {
              const inner = match.slice(1, -1);
              const hashIndex = inner.lastIndexOf('#');
              return hashIndex > 0 ? inner.slice(0, hashIndex) : inner;
            }) ?? '')
          : '';
        const romanLyric = showRomanLines
          ? (line.romanLyric?.replace(/\{[^}]*#[0-9A-Fa-f]{6}[^}]*\}/g, (match) => {
              const inner = match.slice(1, -1);
              const hashIndex = inner.lastIndexOf('#');
              return hashIndex > 0 ? inner.slice(0, hashIndex) : inner;
            }) ?? '')
          : '';
        return {
          ...line,
          words,
          translatedLyric,
          romanLyric,
        };
      })
    );
  }, [originalLyricLines, showTranslationLines, showRomanLines]);

 useEffect(() => {
    setTimeout(() => {
      playerRef.current?.lyricPlayer?.calcLayout(true);
    }, 1500);
  }, []);

  // 🌟 核心分流：如果是空间漫游模式，原版的滚动歌词彻底隐身，挂上我们的画布！
  if (previewMode === 'spatial') {
    return (
      <Card className={classNames(styles.amllWrapper, darkMode && styles.isDark)} style={{ padding: 0, overflow: 'hidden' }}>
        <AESpatialPreview />
      </Card>
    );
  }

  return (
    <Card className={classNames(styles.amllWrapper, darkMode && styles.isDark)}>
      <LyricPlayer
        style={{ height: "100%", boxSizing: "content-box" }}
        onLyricLineClick={(evt) => {
          playerRef.current?.lyricPlayer?.resetScroll();
          audioEngine.seekMusic(evt.line.getLine().startTime / 1000);
        }}
        lyricLines={lyricLines}
        currentTime={currentTime}
        playing={isPlaying}
        wordFadeWidth={wordFadeWidth}
        ref={playerRef}
      />
    </Card>
  );
});

export default AMLLWrapper;