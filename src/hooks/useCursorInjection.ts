// 文件路径: src/hooks/useCursorInjection.ts
import { useCallback, useEffect, useRef } from 'react';

export const useCursorInjection = () => {
  const lastInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const lastCursorPosRef = useRef<number>(0);

  useEffect(() => {
    const trackInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target.type !== 'color') {
        lastInputRef.current = target;
        lastCursorPosRef.current = target.selectionStart ?? 0;
      }
    };

    window.addEventListener('mouseup', trackInput);
    window.addEventListener('keyup', trackInput);

    return () => {
      window.removeEventListener('mouseup', trackInput);
      window.removeEventListener('keyup', trackInput);
    };
  }, []);

  const insertAtCursor = useCallback((textToInsert: string) => {
    const input = lastInputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    const originalValue = input.value;
    let newValue: string;
    let newCursorPos: number;

    const isColorCode = /^#[0-9A-Fa-f]{6}$/i.test(textToInsert);

    if (isColorCode && start === end) {
      // 场景 1：没有选中文本，连续拖拽颜色拾取器或连续点击单色
      const textBeforeCursor = originalValue.substring(0, start);
      const textAfterCursor = originalValue.substring(start);

      // 嗅探 1：光标恰好在带括号的颜色标签的右侧 (例如 {文字#FF0000}| )
      const matchAfterTag = textBeforeCursor.match(/(\{[^}]+?)(#[0-9A-Fa-f]{6})(\})$/i);
      // 嗅探 2：光标在颜色代码和右侧大括号之间 (例如 {文字#FF0000|} )
      const matchInsideTag = textBeforeCursor.match(/(\{[^}]+?)(#[0-9A-Fa-f]{6})$/i);
      // 🌟 核心嗅探 3：光标前是不是刚刚才插入的一个裸颜色代码？(解决你提出的“单次拖拽刷新文本”问题)
      const matchRawColorBefore = textBeforeCursor.match(/(#[0-9A-Fa-f]{6})$/i);

      if (matchAfterTag) {
        const newTextBefore = textBeforeCursor.substring(0, matchAfterTag.index) + matchAfterTag[1] + textToInsert + matchAfterTag[3];
        newValue = newTextBefore + textAfterCursor;
        newCursorPos = newTextBefore.length;
      } else if (matchInsideTag && textAfterCursor.startsWith('}')) {
        const newTextBefore = textBeforeCursor.substring(0, matchInsideTag.index) + matchInsideTag[1] + textToInsert;
        newValue = newTextBefore + textAfterCursor;
        newCursorPos = newTextBefore.length;
      } else if (matchRawColorBefore) {
        // 智能原地替换：将旧的 #FF0000 替换成新的颜色，绝不追加！
        const newTextBefore = textBeforeCursor.substring(0, matchRawColorBefore.index) + textToInsert;
        newValue = newTextBefore + textAfterCursor;
        newCursorPos = newTextBefore.length;
      } else {
        // 全新插入
        newValue = originalValue.substring(0, start) + textToInsert + originalValue.substring(end);
        newCursorPos = start + textToInsert.length;
      }

    } else if (isColorCode && end > start) {
      // 场景 2：有文本被选中 (例如拖拽第一下发生的事情)
      const selectedText = originalValue.substring(start, end);
      const strippedText = selectedText.replace(/\{([^}]+)#[0-9A-Fa-f]{6}\}/gi, '$1');
      
      newValue = originalValue.substring(0, start) + `{${strippedText}${textToInsert}}` + originalValue.substring(end);
      newCursorPos = start + strippedText.length + textToInsert.length + 2; 

    } else {
      // 普通字符插入
      newValue = originalValue.substring(0, start) + textToInsert + originalValue.substring(end);
      newCursorPos = start + textToInsert.length;
    }

    const prototype = input.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(input, newValue);
      
      // 🌟 性能防线：由于移除了 setTimeout 防抖，事件可能 1 秒触发 60 次
      // 必须在这里同步立刻设置光标，否则下一次事件触发时光标会迷失导致正则判断全乱
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 保持 UI 焦点稳定
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  }, []);

  const wrapSelection = useCallback((before: string, after: string) => {
    const input = lastInputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    const originalValue = input.value;
    let newValue: string;
    let newCursorPos: number;

    if (start !== end) {
      const selectedText = originalValue.substring(start, end);
      newValue = originalValue.substring(0, start) + before + selectedText + after + originalValue.substring(end);
      newCursorPos = end + before.length + after.length;
    } else {
      newValue = originalValue.substring(0, start) + before + after + originalValue.substring(end);
      newCursorPos = start + before.length;
    }

    const prototype = input.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(input, newValue);
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  }, []);

  return { insertAtCursor, wrapSelection };
};

export default useCursorInjection;