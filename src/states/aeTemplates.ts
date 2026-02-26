// 文件路径: src/states/aeTemplates.ts
import { atomWithStorage } from 'jotai/utils';

export interface AETemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  isDefault?: boolean;
}

// ---------------- 模板 1：默认满血版 (支持纯净模式拦截) ----------------
const defaultGlowCode = `function buildAMLLScript(data, options) {
    const maxTime = data.maxTime;
    const lines = data.lines;
    const enableEffects = options ? options.enableEffects : true;
    
    let jsx = "app.beginUndoGroup('AMLL Lyrics Build');\\n";
    jsx += "var comp = app.project.activeItem;\\n";
    jsx += "if (comp == null) { alert('错误：请先选中一个合成！'); } else {\\n";
    jsx += "comp.duration = Math.max(comp.duration, " + (maxTime + 5) + ");\\n";
    jsx += "var scrollNull = comp.layers.addNull(); scrollNull.name = 'ScrollControl';\\n";
    jsx += "var posProp = scrollNull.property('Position');\\n";
    const lineSpacing = 220;
    
    for (let i = 0; i < lines.length; i++) {
        let tFocus = lines[i].start;
        let tScrollStart = Math.max(0, tFocus - 1.2);
        if (i === 0) { jsx += "posProp.setValueAtTime(0, [0, 0]);\\n"; } 
        else {
            jsx += "posProp.setValueAtTime(" + tScrollStart + ", [0, " + (-(i - 1) * lineSpacing) + "]);\\n";
            jsx += "posProp.setValueAtTime(" + tFocus + ", [0, " + (-i * lineSpacing) + "]);\\n";
        }
    }
    jsx += "for (var k = 1; k <= posProp.numKeys; k++) { posProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER); posProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]); }\\n";
    
    jsx += "var exprScale = 'var dist = Math.abs(transform.position[1] + thisLayer.parent.transform.position[1] - (thisComp.height / 2)); if(dist>1200){[95,95]}else{ease(dist, 0, 400, [100,100], [95,95]);};';\\n";
    jsx += "var exprOpacity = 'var dist = Math.abs(transform.position[1] + thisLayer.parent.transform.position[1] - (thisComp.height / 2)); if(dist>1200){0}else if(dist>900){ease(dist, 900, 1200, 20, 0);}else{ease(dist, 0, 400, 100, 20);};';\\n";
    
    if (enableEffects) {
        jsx += "var exprBlur = 'var dist = Math.abs(transform.position[1] + thisLayer.parent.transform.position[1] - (thisComp.height / 2)); if(dist>1200){8}else{ease(dist, 0, 400, 0, 8);};';\\n";
    }
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let processWords = (words, fontSize, yOffset) => {
            if (!words || words.length === 0) return;
            jsx += "var cur_x = (comp.width - " + (fontSize === 80 ? line.total_main_w : line.total_sub_w) + ") / 2;\\n";
            let relX = 0;
            for (let j = 0; j < words.length; j++) {
                let w = words[j];
                
                let safeText = JSON.stringify(w.text); 
                
                let c = w.color.replace('#',''); let r = parseInt(c.substring(0,2),16)/255, g = parseInt(c.substring(2,4),16)/255, b = parseInt(c.substring(4,6),16)/255;
                let cStr = "["+r+","+g+","+b+"]";
                
                let inP = Math.max(0, line.start - 15.0);
                let outP = Math.min(maxTime + 5, line.end + 15.0);
                
                // 🚀 核心修复：把 (i * lineSpacing + yOffset) 放在外层计算完再拼接到字符串里
                jsx += "var hl = comp.layers.addText(" + safeText + "); hl.parent = scrollNull; hl.inPoint = " + inP + "; hl.outPoint = " + outP + "; hl.property('Position').setValue([cur_x + " + relX + " + " + (w.width/2) + ", comp.height/2 + " + (i * lineSpacing + yOffset) + "]); var tp2 = hl.property('Source Text').value; tp2.fillColor = " + cStr + "; tp2.fontSize = " + fontSize + "; tp2.justification = ParagraphJustification.CENTER_JUSTIFY; hl.property('Source Text').setValue(tp2); hl.property('Scale').expression = exprScale; hl.property('Opacity').expression = exprOpacity;\\n";
                
                if (enableEffects) {
                    jsx += "hl.property('Effects').addProperty('ADBE Gaussian Blur 2').property(1).expression = exprBlur;\\n";
                }
                
                relX += w.width;
            }
        };
        processWords(line.main_words, 80, 0);
        processWords(line.sub_words, 45, 75);
    }
    
    if (enableEffects) {
        jsx += "var adjLayer = comp.layers.addSolid([1,1,1], 'Global Glow', comp.width, comp.height, comp.pixelAspect, comp.duration); adjLayer.adjustmentLayer = true; adjLayer.moveToBeginning(); var glow = adjLayer.property('Effects').addProperty('ADBE Glo2'); glow.property(2).setValue(50); glow.property(3).setValue(30); glow.property(4).setValue(1.5);\\n";
    }
    
    jsx += "alert(enableEffects ? '✨ 满血视觉版 (三段式景深+直接上色) 构建完毕！' : '✨ 纯净模式排版构建完毕！'); } app.endUndoGroup();\\n";
    return jsx;
}`;

// ---------------- 模板 2：性能超频版 ----------------
const performanceCode = `function buildAMLLScript(data, options) {
    const maxTime = data.maxTime;
    const lines = data.lines;
    let jsx = "app.beginUndoGroup('AMLL Lyrics Build Fast');\\n";
    jsx += "var comp = app.project.activeItem;\\n";
    jsx += "if (comp == null) { alert('错误：请先选中一个合成！'); } else {\\n";
    jsx += "comp.duration = Math.max(comp.duration, " + (maxTime + 5) + ");\\n";
    jsx += "var scrollNull = comp.layers.addNull(); scrollNull.name = 'ScrollControl';\\n";
    jsx += "var posProp = scrollNull.property('Position');\\n";
    const lineSpacing = 220;
    
    for (let i = 0; i < lines.length; i++) {
        let tFocus = lines[i].start;
        let tScrollStart = Math.max(0, tFocus - 1.2);
        if (i === 0) { jsx += "posProp.setValueAtTime(0, [0, 0]);\\n"; } 
        else {
            jsx += "posProp.setValueAtTime(" + tScrollStart + ", [0, " + (-(i - 1) * lineSpacing) + "]);\\n";
            jsx += "posProp.setValueAtTime(" + tFocus + ", [0, " + (-i * lineSpacing) + "]);\\n";
        }
    }
    jsx += "for (var k = 1; k <= posProp.numKeys; k++) { posProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER); posProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]); }\\n";
    
    jsx += "var exprScale = 'var dist = Math.abs(transform.position[1] + thisLayer.parent.transform.position[1] - (thisComp.height / 2)); if(dist>1200){[85,85]}else{ease(dist, 0, 400, [100,100], [85,85]);};';\\n";
    jsx += "var exprOpacity = 'var dist = Math.abs(transform.position[1] + thisLayer.parent.transform.position[1] - (thisComp.height / 2)); if(dist>1200){0}else if(dist>900){ease(dist, 900, 1200, 15, 0);}else{ease(dist, 0, 400, 100, 15);};';\\n";
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let processWordsFast = (words, fontSize, yOffset) => {
            if (!words || words.length === 0) return;
            jsx += "var cur_x = (comp.width - " + (fontSize === 80 ? line.total_main_w : line.total_sub_w) + ") / 2;\\n";
            let relX = 0;
            for (let j = 0; j < words.length; j++) {
                let w = words[j];
                
                let safeText = JSON.stringify(w.text); 
                
                let c = w.color.replace('#',''); let r = parseInt(c.substring(0,2),16)/255, g = parseInt(c.substring(2,4),16)/255, b = parseInt(c.substring(4,6),16)/255;
                let cStr = "["+r+","+g+","+b+"]";
                
                let inP = Math.max(0, line.start - 15.0);
                let outP = Math.min(maxTime + 5, line.end + 15.0);
                
                // 🚀 同步修复：把 (i * lineSpacing + yOffset) 放在外层计算完再拼接
                jsx += "var hl = comp.layers.addText(" + safeText + "); hl.parent = scrollNull; hl.inPoint = " + inP + "; hl.outPoint = " + outP + "; hl.property('Position').setValue([cur_x + " + relX + " + " + (w.width/2) + ", comp.height/2 + " + (i * lineSpacing + yOffset) + "]); var tp2 = hl.property('Source Text').value; tp2.fillColor = " + cStr + "; tp2.fontSize = " + fontSize + "; tp2.justification = ParagraphJustification.CENTER_JUSTIFY; hl.property('Source Text').setValue(tp2); hl.property('Scale').expression = exprScale; hl.property('Opacity').expression = exprOpacity;\\n";
                
                relX += w.width;
            }
        };
        processWordsFast(line.main_words, 80, 0);
        processWordsFast(line.sub_words, 45, 75);
    }
    
    jsx += "alert('⚡ 性能超频版 (平滑消隐+直接上色) 构建完毕！'); } app.endUndoGroup();\\n";
    return jsx;
}`;

export const defaultAETemplate: AETemplate = {
  id: 'default-glow-v1',
  name: '默认满血版 (高斯模糊+全局发光, 三段景深)',
  description: '完整的动态景深模糊和发光。存活时间提升至 15 秒，引入三段式平滑消隐，杜绝突兀闪现。',
  code: defaultGlowCode,
  isDefault: true,
};

export const performanceAETemplate: AETemplate = {
  id: 'performance-fast-v1',
  name: '⚡ 性能超频版 (平滑消隐, 推荐日常使用)',
  description: '【强烈推荐】无高斯模糊。保留 15 秒广角视野与三段式平滑消隐，完全剔除灰色背景层，性能依旧拉满！',
  code: performanceCode,
  isDefault: true,
};

export const aeTemplatesAtom = atomWithStorage<AETemplate[]>(
  'amll-ae-templates',
  [defaultAETemplate, performanceAETemplate]
);

export const selectedAETemplateIdAtom = atomWithStorage<string>(
  'amll-ae-selected-template',
  performanceAETemplate.id
);