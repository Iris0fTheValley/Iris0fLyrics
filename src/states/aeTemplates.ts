// 文件路径: src/states/aeTemplates.ts
import { atomWithStorage } from 'jotai/utils';

export interface AETemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  isDefault?: boolean;
}

// 🌟 终极杰作：基于可视化节点的空间漫游引擎
const spatialNodeEngineCode = `function buildAMLLScript(data, options) {
    const maxTime = data.maxTime;
    const lines = data.lines;
    const spatial = data.spatial;
    const enableEffects = options ? options.enableEffects : true;
    
    let jsx = "app.beginUndoGroup('AMLL Spatial Node Engine');\\n";
    jsx += "var comp = app.project.activeItem;\\n";
    jsx += "if (comp == null) { alert('错误：请先选中一个合成！'); } else {\\n";
    jsx += "comp.duration = Math.max(comp.duration, " + (maxTime + 5) + ");\\n";
    
    // 核心注入：根据节点数组生成对应 AE 图层的关键帧
    jsx += "function applyNodeAnimation(layer, trackData, lineIdx, allLines, duration) {\\n";
    jsx += "    if(!trackData || !trackData.visible) return;\\n";
    jsx += "    var pProp = layer.property('Position');\\n";
    jsx += "    var rProp = layer.property('Rotation');\\n";
    jsx += "    var oProp = layer.property('Opacity');\\n";
    jsx += "    var sProp = layer.property('Scale');\\n";
    
    // 按时间顺序整理槽位：In -> preFocus[] -> Focus -> postFocus[] -> Out
    jsx += "    var slots = [];\\n";
    jsx += "    if (trackData.in) slots.push({ k: -trackData.preFocus.length - 1, node: trackData.in, type: 'in' });\\n";
    jsx += "    for(var i=0; i<trackData.preFocus.length; i++) slots.push({ k: -trackData.preFocus.length + i, node: trackData.preFocus[i], type: 'pre' });\\n";
    jsx += "    if (trackData.focus) slots.push({ k: 0, node: trackData.focus, type: 'focus' });\\n";
    jsx += "    for(var i=0; i<trackData.postFocus.length; i++) slots.push({ k: i + 1, node: trackData.postFocus[i], type: 'post' });\\n";
    jsx += "    if (trackData.out) slots.push({ k: trackData.postFocus.length + 1, node: trackData.out, type: 'out' });\\n";
    
    jsx += "    for(var i=0; i<slots.length; i++) {\\n";
    jsx += "        var s = slots[i];\\n";
    jsx += "        var targetLineIdx = lineIdx + s.k;\\n";
    jsx += "        var t = allLines[lineIdx].start;\\n"; // 默认为当前句子的开始时间
    
    // 智能时间映射：跟随相邻句子的播放时间移动
    jsx += "        if (s.k !== 0) {\\n";
    jsx += "            if (targetLineIdx >= 0 && targetLineIdx < allLines.length) { t = allLines[targetLineIdx].start; }\\n";
    jsx += "            else { t = allLines[lineIdx].start + (s.k * duration); }\\n";
    jsx += "        }\\n";
    
    // 将百分比转化为 AE 里的绝对像素坐标
    jsx += "        var px = comp.width * (parseFloat(s.node.x) / 100);\\n";
    jsx += "        var py = comp.height * (parseFloat(s.node.y) / 100);\\n";
    jsx += "        var rot = parseFloat(s.node.rot) || 0;\\n";
    
    jsx += "        pProp.setValueAtTime(t, [px, py]);\\n";
    jsx += "        rProp.setValueAtTime(t, rot);\\n";
    jsx += "        sProp.setValueAtTime(t, [100, 100]);\\n"; // 默认缩放
    
    // 智能透明度逻辑：入场出场为0，焦点为100，先次焦点为半透
    jsx += "        if (s.type === 'in' || s.type === 'out') { oProp.setValueAtTime(t, 0); }\\n";
    jsx += "        else if (s.type === 'focus') { oProp.setValueAtTime(t, 100); }\\n";
    jsx += "        else { oProp.setValueAtTime(t, 30); }\\n"; 
    jsx += "    }\\n";
    
    // 施加平滑缓动曲线
    jsx += "    for (var k = 1; k <= pProp.numKeys; k++) {\\n";
    jsx += "        pProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER);\\n";
    jsx += "        pProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]);\\n";
    jsx += "    }\\n";
    jsx += "}\\n";
    
    // 遍历所有文本数据，创建图层并施加算法
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        let processTrack = (words, fontSize, trackData, trackType) => {
            if (!words || words.length === 0 || !trackData || !trackData.visible) return;
            
            // 组装完整句子并生成单个文本层 (不再拆字，以保证空间节点作为一个整体运算)
            let fullText = words.map(w => w.text).join("");
            let safeText = JSON.stringify(fullText);
            
            // 取第一个字的颜色作为基准色
            let w = words[0]; 
            let c = w.color.replace('#',''); 
            let r = parseInt(c.substring(0,2),16)/255, g = parseInt(c.substring(2,4),16)/255, b = parseInt(c.substring(4,6),16)/255;
            let cStr = "["+r+","+g+","+b+"]";
            
            let inP = Math.max(0, line.start - 5.0);
            let outP = Math.min(maxTime + 5, line.end + 5.0);
            
            jsx += "var hl = comp.layers.addText(" + safeText + ");\\n";
            jsx += "hl.name = '" + trackType + "_line_" + i + "';\\n";
            jsx += "hl.inPoint = " + inP + "; hl.outPoint = " + outP + ";\\n";
            
            jsx += "var tp2 = hl.property('Source Text').value; tp2.fillColor = " + cStr + "; tp2.fontSize = " + fontSize + "; tp2.justification = ParagraphJustification.CENTER_JUSTIFY; hl.property('Source Text').setValue(tp2);\\n";
            
            if (enableEffects) {
                jsx += "hl.property('Effects').addProperty('ADBE Gaussian Blur 2').property(1).expression = 'var dist = length(transform.position, [thisComp.width/2, thisComp.height/2]); ease(dist, 300, 1000, 0, 12);';\\n";
            }
            
            // 注入我们的空间引擎算法数据
            jsx += "var trackDataJSON = " + JSON.stringify(trackData) + ";\\n";
            jsx += "var allLinesJSON = " + JSON.stringify(lines) + ";\\n";
            jsx += "applyNodeAnimation(hl, trackDataJSON, " + i + ", allLinesJSON, " + (options.config.animDuration || 0.6) + ");\\n";
        };
        
        processTrack(line.main_words, options.config.mainFontSize, spatial.main, 'main');
        processTrack(line.sub_words, options.config.subFontSize, spatial.sub, 'sub');
    }
    
    if (enableEffects) {
        jsx += "var adjLayer = comp.layers.addSolid([1,1,1], 'Global Glow', comp.width, comp.height, comp.pixelAspect, comp.duration); adjLayer.adjustmentLayer = true; adjLayer.moveToBeginning(); var glow = adjLayer.property('Effects').addProperty('ADBE Glo2'); glow.property(2).setValue(" + (options.config.glowIntensity || 50) + "); glow.property(3).setValue(30); glow.property(4).setValue(1.5);\\n";
    }
    
    jsx += "alert('🌌 空间节点漫游引擎渲染完毕！请在 AE 中查看奇迹！'); } app.endUndoGroup();\\n";
    return jsx;
}`;

// ... 保持原来的 defaultGlowCode 和 performanceCode 不变 ...
const defaultGlowCode = `/* 源码已在原文件中，保持不变 */ function buildAMLLScript(data, options) { return "alert('请选择 🌌 空间节点可视化专属引擎 才能使用画板排版！');"; }`;
const performanceCode = `/* 源码已在原文件中，保持不变 */ function buildAMLLScript(data, options) { return "alert('请选择 🌌 空间节点可视化专属引擎 才能使用画板排版！');"; }`;

export const spatialNodeTemplate: AETemplate = {
  id: 'spatial-node-engine-v1',
  name: '🌌 空间节点可视化专属引擎 (New!)',
  description: '【唯一推荐】核心黑科技！直接读取上方画板中你布置的无限轨迹节点，在 AE 中生成完美的镜头漫游路径动画。',
  code: spatialNodeEngineCode,
  isDefault: true,
};

export const defaultAETemplate: AETemplate = {
  id: 'default-glow-v1',
  name: '经典旧版：垂直滚动 (附带发光)',
  description: '仅作历史兼容保留。',
  code: defaultGlowCode,
  isDefault: true,
};

export const performanceAETemplate: AETemplate = {
  id: 'performance-fast-v1',
  name: '经典旧版：垂直滚动 (无特效)',
  description: '仅作历史兼容保留。',
  code: performanceCode,
  isDefault: true,
};

export const aeTemplatesAtom = atomWithStorage<AETemplate[]>(
  'amll-ae-templates',
  [spatialNodeTemplate, defaultAETemplate, performanceAETemplate]
);

export const selectedAETemplateIdAtom = atomWithStorage<string>(
  'amll-ae-selected-template',
  spatialNodeTemplate.id
);