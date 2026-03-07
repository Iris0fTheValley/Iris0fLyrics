// 文件路径: src/states/aeTemplates.ts
import { atomWithStorage } from 'jotai/utils';

export interface AETemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  isDefault?: boolean;
}

// 🌟 模板 1：空间节点引擎 (多角色平行宇宙版)
const spatialNodeEngineCode = `function buildAMLLScript(data, options) {
    const maxTime = data.maxTime;
    const lines = data.lines;
    const spatialMap = data.spatialMap; // 🌟 接收平行宇宙字典
    const config = options ? options.config : {};
    const aiCode = options ? options.aiCode : ""; 
    
    let jsx = "/* ==========================================\\n";
    jsx += "   AMLL 空间节点物理引擎 (多角色平行宇宙版)\\n";
    jsx += "========================================== */\\n";
    jsx += "var CONFIG = {\\n";
    jsx += "    width: " + (config.width || 1920) + ",\\n";
    jsx += "    height: " + (config.height || 1080) + ",\\n";
    jsx += "    animDuration: " + (config.animDuration || 0.6) + ",\\n";
    jsx += "    visibleDuration: " + (config.visibleDuration || 5.0) + ",\\n";
    jsx += "    renderThreshold: " + (config.renderThreshold || 2000) + ",\\n";
    jsx += "    layoutMode: '" + (config.layoutMode || 'horizontal') + "'\\n";
    jsx += "};\\n\\n";
    
    jsx += "app.beginUndoGroup('AMLL Spatial Node Engine (Multiverse)');\\n";
    jsx += "var comp = app.project.activeItem;\\n";
    jsx += "if (comp == null) { alert('错误：请先选中一个合成！'); } else {\\n";
    
    if (aiCode && aiCode.trim() !== '') {
        jsx += "// --- AI INJECTED CODE START ---\\n";
        jsx += aiCode + "\\n";
        jsx += "// --- AI INJECTED CODE END ---\\n";
    } else {
        jsx += "function ai_custom_easing(xProp, yProp, rProp, oProp, config) {}\\n";
        jsx += "function ai_custom_effects(layer, config) {}\\n";
    }
    
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
    
    jsx += "    if (typeof ai_custom_easing === 'function') {\\n";
    jsx += "        try { ai_custom_easing(xProp, yProp, rProp, oProp, CONFIG); } catch(e) {}\\n";
    jsx += "    }\\n";
    jsx += "}\\n";
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let roleId = line.role || '1';
        // 🌟 精准匹配：读取该行歌词对应的专属角色空间数据
        let currentSpatial = spatialMap[roleId] || spatialMap['1']; 
        
        let processTrack = (words, fontSize, trackData, trackType) => {
            if (!words || words.length === 0 || !trackData || !trackData.visible) return;
            
            let rawText = words.map(w => w.text).join("");
            if (config.layoutMode === 'vertical') rawText = Array.from(rawText).join("\\r");
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
            // 🌟 导出时在 AE 图层名打上角色标记，极其清晰
            jsx += "hl.name = 'Role_" + roleId + "_" + trackType + "_line_" + i + "';\\n";
            jsx += "hl.inPoint = " + exactInP + "; hl.outPoint = " + exactOutP + ";\\n";
            
            jsx += "var textProp = hl.property('ADBE Text Properties').property('ADBE Text Document');\\n";
            jsx += "var tp2 = textProp.value; tp2.fillColor = " + cStr + "; tp2.fontSize = " + fontSize + "; tp2.font = '" + (config.fontFamily || 'Arial') + "'; tp2.tracking = " + (config.letterSpacing || 0) + "; tp2.justification = ParagraphJustification.CENTER_JUSTIFY; textProp.setValue(tp2);\\n";
            
            let trackDataJSON = JSON.stringify(trackData);
            jsx += "var trackDataObj = " + trackDataJSON + ";\\n";
            jsx += "applyResponsiveNodeAnim(hl, trackDataObj, " + line.start + ", " + line.end + ");\\n";
            
            jsx += "    if (typeof ai_custom_effects === 'function') {\\n";
            jsx += "        try { ai_custom_effects(hl, CONFIG); } catch(e) {}\\n";
            jsx += "    }\\n";
        };
        
        processTrack(line.main_words, config.mainFontSize || 80, currentSpatial.main, 'main');
        processTrack(line.sub_words, config.subFontSize || 40, currentSpatial.sub, 'sub');
    }
    
    jsx += "comp.duration = Math.max(comp.duration, " + maxTime + " + (CONFIG.animDuration * 5));\\n";
    jsx += "alert('🌌 多维空间物理引擎已成功注入！\\\\n支持无限角色的排版、特效与动效全部编译完成。'); } app.endUndoGroup();\\n";
    return jsx;
}`;

// ---------------- 模板 2：原版默认满血版 (🌟 升级为独立平行轨道！) ----------------
const defaultGlowCode = `function buildAMLLScript(data, options) {
    const maxTime = data.maxTime;
    const lines = data.lines;
    const enableEffects = options ? options.enableEffects : true;
    
    let jsx = "app.beginUndoGroup('AMLL Lyrics Build');\\n";
    jsx += "var comp = app.project.activeItem;\\n";
    jsx += "if (comp == null) { alert('错误：请先选中一个合成！'); } else {\\n";
    jsx += "comp.duration = Math.max(comp.duration, " + (maxTime + 5) + ");\\n";
    const lineSpacing = 220;
    
    // 🌟 为每一个登场的角色建立独立的 ScrollControl 空对象，彻底隔离休眠时间！
    jsx += "var scrollNulls = {};\\n";
    jsx += "var posProps = {};\\n";
    jsx += "var rolesCount = {};\\n";
    
    for (let i = 0; i < lines.length; i++) {
        let roleId = lines[i].role || '1';
        if (!rolesCount[roleId]) {
            jsx += "scrollNulls['" + roleId + "'] = comp.layers.addNull();\\n";
            jsx += "scrollNulls['" + roleId + "'].name = 'ScrollControl_Role_" + roleId + "';\\n";
            jsx += "posProps['" + roleId + "'] = scrollNulls['" + roleId + "'].property('Position');\\n";
            rolesCount[roleId] = 0;
        }
        let cIndex = rolesCount[roleId];
        let tFocus = lines[i].start;
        let tScrollStart = Math.max(0, tFocus - 1.2);
        
        if (cIndex === 0) {
            jsx += "posProps['" + roleId + "'].setValueAtTime(0, [0, 0]);\\n";
        } else {
            jsx += "posProps['" + roleId + "'].setValueAtTime(" + tScrollStart + ", [0, " + (-(cIndex - 1) * lineSpacing) + "]);\\n";
            jsx += "posProps['" + roleId + "'].setValueAtTime(" + tFocus + ", [0, " + (-cIndex * lineSpacing) + "]);\\n";
        }
        rolesCount[roleId]++;
    }
    
    jsx += "for (var rId in posProps) {\\n";
    jsx += "    var pProp = posProps[rId];\\n";
    jsx += "    for (var k = 1; k <= pProp.numKeys; k++) {\\n";
    jsx += "        pProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER);\\n";
    jsx += "        pProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]);\\n";
    jsx += "    }\\n";
    jsx += "}\\n";
    
    jsx += "var exprScale = 'var dist = Math.abs(transform.position[1] + thisLayer.parent.transform.position[1] - (thisComp.height / 2)); if(dist>1200){[95,95]}else{ease(dist, 0, 400, [100,100], [95,95]);};';\\n";
    jsx += "var exprOpacity = 'var dist = Math.abs(transform.position[1] + thisLayer.parent.transform.position[1] - (thisComp.height / 2)); if(dist>1200){0}else if(dist>900){ease(dist, 900, 1200, 20, 0);}else{ease(dist, 0, 400, 100, 20);};';\\n";
    
    if (enableEffects) {
        jsx += "var exprBlur = 'var dist = Math.abs(transform.position[1] + thisLayer.parent.transform.position[1] - (thisComp.height / 2)); if(dist>1200){8}else{ease(dist, 0, 400, 0, 8);};';\\n";
    }
    
    jsx += "var rolesCount2 = {};\\n";
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let roleId = line.role || '1';
        if (rolesCount2[roleId] === undefined) rolesCount2[roleId] = 0;
        let cIndex = rolesCount2[roleId];
        
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
                
                // 🌟 将生成出的图层精确地绑定给对应的专属 ScrollControl_RoleX
                jsx += "var hl = comp.layers.addText(" + safeText + "); hl.parent = scrollNulls['" + roleId + "']; hl.name = 'Role_" + roleId + "_line_" + i + "'; hl.inPoint = " + inP + "; hl.outPoint = " + outP + "; hl.property('Position').setValue([cur_x + " + relX + " + " + (w.width/2) + ", comp.height/2 + " + (cIndex * lineSpacing + yOffset) + "]); var tp2 = hl.property('Source Text').value; tp2.fillColor = " + cStr + "; tp2.fontSize = " + fontSize + "; tp2.justification = ParagraphJustification.CENTER_JUSTIFY; hl.property('Source Text').setValue(tp2); hl.property('Scale').expression = exprScale; hl.property('Opacity').expression = exprOpacity;\\n";
                
                if (enableEffects) jsx += "hl.property('Effects').addProperty('ADBE Gaussian Blur 2').property(1).expression = exprBlur;\\n";
                relX += w.width;
            }
        };
        processWords(line.main_words, 80, 0);
        processWords(line.sub_words, 45, 75);
        rolesCount2[roleId]++;
    }
    
    if (enableEffects) {
        jsx += "var adjLayer = comp.layers.addSolid([1,1,1], 'Global Glow', comp.width, comp.height, comp.pixelAspect, comp.duration); adjLayer.adjustmentLayer = true; adjLayer.moveToBeginning(); var glow = adjLayer.property('Effects').addProperty('ADBE Glo2'); glow.property(2).setValue(50); glow.property(3).setValue(30); glow.property(4).setValue(1.5);\\n";
    }
    
    jsx += "alert(enableEffects ? '✨ 满血多轨道版 (三段式景深+直接上色) 构建完毕！' : '✨ 纯净模式排版构建完毕！'); } app.endUndoGroup();\\n";
    return jsx;
}`;

// ---------------- 模板 3：原版性能超频版 (🌟 同样升维多轨道) ----------------
const performanceCode = `function buildAMLLScript(data, options) {
    const maxTime = data.maxTime;
    const lines = data.lines;
    let jsx = "app.beginUndoGroup('AMLL Lyrics Build Fast');\\n";
    jsx += "var comp = app.project.activeItem;\\n";
    jsx += "if (comp == null) { alert('错误：请先选中一个合成！'); } else {\\n";
    jsx += "comp.duration = Math.max(comp.duration, " + (maxTime + 5) + ");\\n";
    const lineSpacing = 220;
    
    jsx += "var scrollNulls = {};\\n";
    jsx += "var posProps = {};\\n";
    jsx += "var rolesCount = {};\\n";
    
    for (let i = 0; i < lines.length; i++) {
        let roleId = lines[i].role || '1';
        if (!rolesCount[roleId]) {
            jsx += "scrollNulls['" + roleId + "'] = comp.layers.addNull();\\n";
            jsx += "scrollNulls['" + roleId + "'].name = 'ScrollControl_Role_" + roleId + "';\\n";
            jsx += "posProps['" + roleId + "'] = scrollNulls['" + roleId + "'].property('Position');\\n";
            rolesCount[roleId] = 0;
        }
        let cIndex = rolesCount[roleId];
        let tFocus = lines[i].start;
        let tScrollStart = Math.max(0, tFocus - 1.2);
        if (cIndex === 0) { jsx += "posProps['" + roleId + "'].setValueAtTime(0, [0, 0]);\\n"; } 
        else {
            jsx += "posProps['" + roleId + "'].setValueAtTime(" + tScrollStart + ", [0, " + (-(cIndex - 1) * lineSpacing) + "]);\\n";
            jsx += "posProps['" + roleId + "'].setValueAtTime(" + tFocus + ", [0, " + (-cIndex * lineSpacing) + "]);\\n";
        }
        rolesCount[roleId]++;
    }
    jsx += "for (var rId in posProps) { var pProp = posProps[rId]; for (var k = 1; k <= pProp.numKeys; k++) { pProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER); pProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]); } }\\n";
    
    jsx += "var exprScale = 'var dist = Math.abs(transform.position[1] + thisLayer.parent.transform.position[1] - (thisComp.height / 2)); if(dist>1200){[85,85]}else{ease(dist, 0, 400, [100,100], [85,85]);};';\\n";
    jsx += "var exprOpacity = 'var dist = Math.abs(transform.position[1] + thisLayer.parent.transform.position[1] - (thisComp.height / 2)); if(dist>1200){0}else if(dist>900){ease(dist, 900, 1200, 15, 0);}else{ease(dist, 0, 400, 100, 15);};';\\n";
    
    jsx += "var rolesCount2 = {};\\n";
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let roleId = line.role || '1';
        if (rolesCount2[roleId] === undefined) rolesCount2[roleId] = 0;
        let cIndex = rolesCount2[roleId];
        
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
                
                jsx += "var hl = comp.layers.addText(" + safeText + "); hl.parent = scrollNulls['" + roleId + "']; hl.name = 'Role_" + roleId + "_line_" + i + "'; hl.inPoint = " + inP + "; hl.outPoint = " + outP + "; hl.property('Position').setValue([cur_x + " + relX + " + " + (w.width/2) + ", comp.height/2 + " + (cIndex * lineSpacing + yOffset) + "]); var tp2 = hl.property('Source Text').value; tp2.fillColor = " + cStr + "; tp2.fontSize = " + fontSize + "; tp2.justification = ParagraphJustification.CENTER_JUSTIFY; hl.property('Source Text').setValue(tp2); hl.property('Scale').expression = exprScale; hl.property('Opacity').expression = exprOpacity;\\n";
                relX += w.width;
            }
        };
        processWordsFast(line.main_words, 80, 0);
        processWordsFast(line.sub_words, 45, 75);
        rolesCount2[roleId]++;
    }
    
    jsx += "alert('⚡ 性能超频版 (多轨道交织) 构建完毕！'); } app.endUndoGroup();\\n";
    return jsx;
}`;

export const spatialNodeTemplate: AETemplate = {
  id: 'spatial-node-engine-pure',
  name: '🌌 纯粹空间动线 ',
  description: '支持无限角色画板空间漫游，支持读取 AI 特效插件，独立于下方的模块，仅仅能够导出空间动线和关键帧，为高级ae用户服务。',
  code: spatialNodeEngineCode,
  isDefault: true,
};

export const defaultAETemplate: AETemplate = {
  id: 'default-glow-v1',
  name: '复古版：垂直滚动 (满血发光+多轨道独立)',
  description: '无视空间画板，按照旧版逻辑为每个角色生成独立的滚动摄像机（ScrollControl）。',
  code: defaultGlowCode,
  isDefault: true,
};

export const performanceAETemplate: AETemplate = {
  id: 'performance-fast-v1',
  name: '复古版：垂直滚动 (性能超频+多轨道独立)',
  description: '轻量级、去模糊特效的多轨道兼容版。',
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