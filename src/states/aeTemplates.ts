// 文件路径: src/states/aeTemplates.ts
import { atomWithStorage } from 'jotai/utils';

export interface AETemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  isDefault?: boolean;
}

// 🌟 纯净骨架引擎：引入 AI 钩子 (Hooks) 架构
const spatialNodeEngineCode = `function buildAMLLScript(data, options) {
    const maxTime = data.maxTime;
    const lines = data.lines;
    const spatial = data.spatial;
    const config = options ? options.config : {};
    const aiCode = options ? options.aiCode : ""; // 接收前端传来的 AI 插件代码
    
    let jsx = "/* ==========================================\\n";
    jsx += "   AMLL 空间节点物理引擎 (AI 插件版)\\n";
    jsx += "========================================== */\\n";
    jsx += "var CONFIG = {\\n";
    jsx += "    width: " + (config.width || 1920) + ",\\n";
    jsx += "    height: " + (config.height || 1080) + ",\\n";
    jsx += "    animDuration: " + (config.animDuration || 0.6) + ",\\n";
    jsx += "    visibleDuration: " + (config.visibleDuration || 5.0) + ",\\n";
    jsx += "    renderThreshold: " + (config.renderThreshold || 2000) + ",\\n";
    jsx += "    layoutMode: '" + (config.layoutMode || 'horizontal') + "'\\n";
    jsx += "};\\n\\n";
    
    jsx += "app.beginUndoGroup('AMLL Spatial Node Engine (AI Powered)');\\n";
    jsx += "var comp = app.project.activeItem;\\n";
    jsx += "if (comp == null) { alert('错误：请先选中一个合成！'); } else {\\n";
    
    // 🌟 核心防线：注入 AI 生成的函数，或者提供空函数防止报错
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
    
    // 🌟 调用 AI 动效钩子 (如果有)
    jsx += "    if (typeof ai_custom_easing === 'function') {\\n";
    jsx += "        try { ai_custom_easing(xProp, yProp, rProp, oProp, CONFIG); } catch(e) {}\\n";
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
            jsx += "var tp2 = textProp.value; tp2.fillColor = " + cStr + "; tp2.fontSize = " + fontSize + "; tp2.font = '" + (config.fontFamily || 'Arial') + "'; tp2.tracking = " + (config.letterSpacing || 0) + "; tp2.justification = ParagraphJustification.CENTER_JUSTIFY; textProp.setValue(tp2);\\n";
            
            let trackDataJSON = JSON.stringify(trackData);
            jsx += "var trackDataObj = " + trackDataJSON + ";\\n";
            jsx += "applyResponsiveNodeAnim(hl, trackDataObj, " + line.start + ", " + line.end + ");\\n";
            
            // 🌟 调用 AI 特效钩子 (如果有)
            jsx += "    if (typeof ai_custom_effects === 'function') {\\n";
            jsx += "        try { ai_custom_effects(hl, CONFIG); } catch(e) {}\\n";
            jsx += "    }\\n";
        };
        
        processTrack(line.main_words, config.mainFontSize || 80, spatial.main, 'main');
        processTrack(line.sub_words, config.subFontSize || 40, spatial.sub, 'sub');
    }
    
    jsx += "comp.duration = Math.max(comp.duration, " + maxTime + " + (CONFIG.animDuration * 5));\\n";
    jsx += "alert('🌌 空间物理引擎 (AI 插件版) 已成功注入！\\\\n排版、特效与动效编译完成。'); } app.endUndoGroup();\\n";
    return jsx;
}`;

// ...保留老模板...
const defaultGlowCode = `function buildAMLLScript(data, options) { return "alert('请在 github 中找回并粘贴原代码');"; }`;
const performanceCode = `function buildAMLLScript(data, options) { return "alert('请在 github 中找回并粘贴原代码');"; }`;

export const spatialNodeTemplate: AETemplate = {
  id: 'spatial-node-engine-pure',
  name: '🌌 纯净版：基础时空轨迹引擎 (支持 AI 插件注入)',
  description: '【最强底座】包含钩子函数架构，可完美解析 AI 生成的动效与特效片段，而不破坏坐标阵列。',
  code: spatialNodeEngineCode,
  isDefault: true,
};

export const defaultAETemplate: AETemplate = { id: 'default-glow-v1', name: '经典旧版：垂直滚动 (满血附带发光)', description: '原汁原味的垂直滚动模板。', code: defaultGlowCode, isDefault: true };
export const performanceAETemplate: AETemplate = { id: 'performance-fast-v1', name: '经典旧版：垂直滚动 (性能超频版)', description: '轻量级历史兼容版。', code: performanceCode, isDefault: true };

export const aeTemplatesAtom = atomWithStorage<AETemplate[]>('amll-ae-templates', [spatialNodeTemplate, defaultAETemplate, performanceAETemplate]);
export const selectedAETemplateIdAtom = atomWithStorage<string>('amll-ae-selected-template', spatialNodeTemplate.id);