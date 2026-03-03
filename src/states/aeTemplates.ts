// 文件路径: src/states/aeTemplates.ts
import { atomWithStorage } from 'jotai/utils';

export interface AETemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  isDefault?: boolean;
}

// 🌟 纯净骨架引擎：仅保留横排与古文竖排
const spatialNodeEngineCode = `function buildAMLLScript(data, options) {
    const maxTime = data.maxTime;
    const lines = data.lines;
    const spatial = data.spatial;
    const config = options ? options.config : {};
    
    let jsx = "/* ==========================================\\n";
    jsx += "   AMLL 空间节点物理引擎 (纯净版)\\n";
    jsx += "========================================== */\\n";
    jsx += "var CONFIG = {\\n";
    jsx += "    width: " + (config.width || 1920) + ",\\n";
    jsx += "    height: " + (config.height || 1080) + ",\\n";
    jsx += "    animDuration: " + (config.animDuration || 0.6) + ",\\n";
    jsx += "    visibleDuration: " + (config.visibleDuration || 5.0) + ",\\n";
    jsx += "    renderThreshold: " + (config.renderThreshold || 2000) + ",\\n";
    jsx += "    layoutMode: '" + (config.layoutMode || 'horizontal') + "'\\n";
    jsx += "};\\n\\n";
    
    jsx += "app.beginUndoGroup('AMLL Spatial Node Engine (Pure)');\\n";
    jsx += "var comp = app.project.activeItem;\\n";
    jsx += "if (comp == null) { alert('错误：请先选中一个合成！'); } else {\\n";
    
    jsx += "function applyResponsiveNodeAnim(layer, trackData, lineStart, lineEnd) {\\n";
    jsx += "    if(!trackData || !trackData.visible) return;\\n";
    jsx += "    var fx = layer.property('ADBE Effect Parade');\\n";
    jsx += "    var xCtrl = fx.addProperty('ADBE Slider Control');\\n";
    jsx += "    xCtrl.name = 'AMLL_X_Pct';\\n";
    jsx += "    var yCtrl = fx.addProperty('ADBE Slider Control');\\n";
    jsx += "    yCtrl.name = 'AMLL_Y_Pct';\\n";
    
    jsx += "    var xProp = fx.property('AMLL_X_Pct').property(1);\\n";
    jsx += "    var yProp = fx.property('AMLL_Y_Pct').property(1);\\n";
    
    jsx += "    var aProp = layer.property('ADBE Transform Group').property('ADBE Anchor Point');\\n";
    jsx += "    aProp.expression = \\"var box = sourceRectAtTime(time, false); [box.left + box.width/2, box.top + box.height/2];\\";\\n";
    
    jsx += "    var pProp = layer.property('ADBE Transform Group').property('ADBE Position');\\n";
    jsx += "    pProp.expression = \\"var px = effect('AMLL_X_Pct')(1); var py = effect('AMLL_Y_Pct')(1); [thisComp.width * (px/100), thisComp.height * (py/100)];\\";\\n";
    
    jsx += "    var rProp = layer.property('ADBE Transform Group').property('ADBE Rotate Z');\\n";
    jsx += "    var oProp = layer.property('ADBE Transform Group').property('ADBE Opacity');\\n";
    
    jsx += "    var nodes = [];\\n";
    jsx += "    if (trackData.in) nodes.push({ type: 'in', node: trackData.in });\\n";
    jsx += "    for(var i=0; i<trackData.preFocus.length; i++) nodes.push({ type: 'pre', node: trackData.preFocus[i] });\\n";
    jsx += "    if (trackData.focus) nodes.push({ type: 'focus', node: trackData.focus });\\n";
    jsx += "    for(var i=0; i<trackData.postFocus.length; i++) nodes.push({ type: 'post', node: trackData.postFocus[i] });\\n";
    jsx += "    if (trackData.out) nodes.push({ type: 'out', node: trackData.out });\\n";
    
    jsx += "    var focusIdx = -1;\\n";
    jsx += "    for(var i=0; i<nodes.length; i++) if(nodes[i].type === 'focus') focusIdx = i;\\n";
    
    jsx += "    for(var i=0; i<nodes.length; i++) {\\n";
    jsx += "        var item = nodes[i];\\n";
    jsx += "        var t = lineStart;\\n";
    jsx += "        if (focusIdx !== -1) {\\n";
    jsx += "             var offset = i - focusIdx;\\n";
    jsx += "             if (offset < 0) t = lineStart + (offset * CONFIG.animDuration);\\n"; 
    jsx += "             else if (offset > 0) t = lineEnd + ((offset - 1) * CONFIG.animDuration);\\n"; 
    jsx += "        }\\n";
    
    jsx += "        var px = parseFloat(item.node.x) || 50;\\n";
    jsx += "        var py = parseFloat(item.node.y) || 50;\\n";
    jsx += "        var rot = parseFloat(item.node.rot) || 0;\\n";
    
    jsx += "        xProp.setValueAtTime(t, px);\\n";
    jsx += "        yProp.setValueAtTime(t, py);\\n";
    jsx += "        rProp.setValueAtTime(t, rot);\\n";
    
    jsx += "        var op = 100;\\n";
    jsx += "        if (item.type === 'in' || item.type === 'out') op = 0;\\n";
    jsx += "        else if (item.type !== 'focus') op = 40;\\n";
    jsx += "        oProp.setValueAtTime(t, op);\\n";
    jsx += "    }\\n";
    jsx += "}\\n";
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        let processTrack = (words, fontSize, trackData, trackType) => {
            if (!words || words.length === 0 || !trackData || !trackData.visible) return;
            
            let rawText = words.map(w => w.text).join("");
            
            if (config.layoutMode === 'vertical') {
                rawText = Array.from(rawText).join("\\r");
            }
            
            let safeText = JSON.stringify(rawText); 
            
            let w = words[0]; 
            let c = w.color.replace('#',''); 
            let r = parseInt(c.substring(0,2),16)/255, g = parseInt(c.substring(2,4),16)/255, b = parseInt(c.substring(4,6),16)/255;
            let cStr = "["+r+","+g+","+b+"]";
            
            let preCount = trackData.preFocus.length + (trackData.in ? 1 : 0);
            let postCount = trackData.postFocus.length + (trackData.out ? 1 : 0);
            
            let exactInP = line.start - (preCount * config.animDuration);
            let exactOutP = Math.max(line.end + (postCount * config.animDuration), line.start + (config.visibleDuration || 5.0));
            
            jsx += "var hl = comp.layers.addText(" + safeText + ");\\n";
            jsx += "hl.name = '" + trackType + "_line_" + i + "';\\n";
            jsx += "hl.inPoint = " + exactInP + "; hl.outPoint = " + exactOutP + ";\\n";
            
            jsx += "var textProp = hl.property('ADBE Text Properties').property('ADBE Text Document');\\n";
            jsx += "var tp2 = textProp.value; tp2.fillColor = " + cStr + "; tp2.fontSize = " + fontSize + "; tp2.justification = ParagraphJustification.CENTER_JUSTIFY; textProp.setValue(tp2);\\n";
            
            let trackDataJSON = JSON.stringify(trackData);
            jsx += "var trackDataObj = " + trackDataJSON + ";\\n";
            jsx += "applyResponsiveNodeAnim(hl, trackDataObj, " + line.start + ", " + line.end + ");\\n";
        };
        
        processTrack(line.main_words, config.mainFontSize || 80, spatial.main, 'main');
        processTrack(line.sub_words, config.subFontSize || 40, spatial.sub, 'sub');
    }
    
    jsx += "comp.duration = Math.max(comp.duration, " + maxTime + " + (CONFIG.animDuration * 5));\\n";
    jsx += "alert('🌌 空间物理引擎 (纯净版) 已成功注入！\\\\n排版结构与动态锚点计算完毕。'); } app.endUndoGroup();\\n";
    return jsx;
}`;

// ---------------- 模板 2：原版默认满血版 ----------------
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

// ---------------- 模板 3：原版性能超频版 ----------------
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

export const spatialNodeTemplate: AETemplate = {
  id: 'spatial-node-engine-pure',
  name: '🌌 纯净版：基础时空轨迹引擎 (Data Only)',
  description: '【底座架构】仅处理节点百分比坐标与原始运动时间点。无特效且不篡改 AE 合成尺寸。',
  code: spatialNodeEngineCode,
  isDefault: true,
};

export const defaultAETemplate: AETemplate = {
  id: 'default-glow-v1',
  name: '经典旧版：垂直滚动 (满血附带发光)',
  description: '原汁原味的垂直滚动模板，无视画板排版，仅按照旧有逻辑运行。',
  code: defaultGlowCode,
  isDefault: true,
};

export const performanceAETemplate: AETemplate = {
  id: 'performance-fast-v1',
  name: '经典旧版：垂直滚动 (性能超频版)',
  description: '轻量级历史兼容版。',
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