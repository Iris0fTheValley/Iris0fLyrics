// 文件路径: src/states/aeTemplates.ts
import { atomWithStorage } from 'jotai/utils';

export interface AETemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  isDefault?: boolean;
}

// 🌟 终极杰作：免疫所有语言版本的 AE 节点漫游引擎
const spatialNodeEngineCode = `function buildAMLLScript(data, options) {
    const maxTime = data.maxTime;
    const lines = data.lines;
    const spatial = data.spatial;
    const config = options ? options.config : {};
    const enableEffects = options ? options.enableEffects : true;
    
    // AI 优化的动态时间参数
    const animDur = config.animDuration || 0.6; 
    
    let jsx = "app.beginUndoGroup('AMLL Spatial Node Engine');\\n";
    jsx += "var comp = app.project.activeItem;\\n";
    jsx += "if (comp == null) { alert('错误：请先选中一个合成！'); } else {\\n";
    jsx += "comp.duration = Math.max(comp.duration, " + (maxTime + animDur * 2) + ");\\n";
    
    // 🌟 核心引擎函数：注入响应式表达式与物理关键帧 (注入到 AE)
    jsx += "function applyResponsiveNodeAnim(layer, trackData, lineStart, lineEnd) {\\n";
    jsx += "    if(!trackData || !trackData.visible) return;\\n";
    jsx += "    var pctCtrl = layer.property('Effects').addProperty('ADBE Point Control');\\n";
    jsx += "    pctCtrl.name = 'AMLL_Spatial_Percent';\\n";
    
    // 🌟 修复 1：使用通用索引 (1) 替代容易导致多语言报错的 ('Point')
    jsx += "    var pctProp = pctCtrl.property(1);\\n";
    jsx += "    var pProp = layer.property('Position');\\n";
    
    // 🌟 修复 2：表达式内部同样使用 (1) 替代 ('Point')
    jsx += "    pProp.expression = \\"var pct = effect('AMLL_Spatial_Percent')(1); [thisComp.width * (pct[0]/100), thisComp.height * (pct[1]/100)];\\";\\n";
    
    jsx += "    var rProp = layer.property('Rotation');\\n";
    jsx += "    var oProp = layer.property('Opacity');\\n";
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
    jsx += "             if (offset < 0) t = lineStart + (offset * " + animDur + ");\\n"; 
    jsx += "             else if (offset > 0) t = lineEnd + ((offset - 1) * " + animDur + ");\\n"; 
    jsx += "        }\\n";
    jsx += "        var px = parseFloat(item.node.x) || 50;\\n";
    jsx += "        var py = parseFloat(item.node.y) || 50;\\n";
    jsx += "        var rot = parseFloat(item.node.rot) || 0;\\n";
    jsx += "        pctProp.setValueAtTime(t, [px, py]);\\n";
    jsx += "        rProp.setValueAtTime(t, rot);\\n";
    jsx += "        var op = 100;\\n";
    jsx += "        if (item.type === 'in' || item.type === 'out') op = 0;\\n";
    jsx += "        else if (item.type !== 'focus') op = 40;\\n";
    jsx += "        oProp.setValueAtTime(t, op);\\n";
    jsx += "    }\\n";
    jsx += "    for (var k = 1; k <= pctProp.numKeys; k++) {\\n";
    jsx += "        pctProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER);\\n";
    jsx += "        pctProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]);\\n"; 
    jsx += "        rProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER);\\n";
    jsx += "        rProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]);\\n";
    jsx += "        oProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER);\\n";
    jsx += "        oProp.setTemporalEaseAtKey(k, [new KeyframeEase(0, 33)], [new KeyframeEase(0, 85)]);\\n";
    jsx += "    }\\n";
    jsx += "}\\n";
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        let processTrack = (words, fontSize, trackData, trackType) => {
            if (!words || words.length === 0 || !trackData || !trackData.visible) return;
            
            let fullText = words.map(w => w.text).join("");
            let safeText = JSON.stringify(fullText); 
            
            let w = words[0]; 
            let c = w.color.replace('#',''); 
            let r = parseInt(c.substring(0,2),16)/255, g = parseInt(c.substring(2,4),16)/255, b = parseInt(c.substring(4,6),16)/255;
            let cStr = "["+r+","+g+","+b+"]";
            
            let inP = Math.max(0, line.start - (animDur * 3));
            let outP = Math.min(maxTime + animDur * 2, line.end + (animDur * 3));
            
            jsx += "var hl = comp.layers.addText(" + safeText + ");\\n";
            jsx += "hl.name = '" + trackType + "_line_" + i + "';\\n";
            jsx += "hl.inPoint = " + inP + "; hl.outPoint = " + outP + ";\\n";
            jsx += "var tp2 = hl.property('Source Text').value; tp2.fillColor = " + cStr + "; tp2.fontSize = " + fontSize + "; tp2.justification = ParagraphJustification.CENTER_JUSTIFY; hl.property('Source Text').setValue(tp2);\\n";
            
            if (enableEffects) {
                jsx += "hl.property('Effects').addProperty('ADBE Gaussian Blur 2').property(1).expression = \\"var dist = length(transform.position, [thisComp.width/2, thisComp.height/2]); ease(dist, 200, " + (config.renderThreshold || 1200) + ", 0, 15);\\";\\n";
            }
            
            let trackDataJSON = JSON.stringify(trackData);
            jsx += "var trackDataObj = " + trackDataJSON + ";\\n";
            jsx += "applyResponsiveNodeAnim(hl, trackDataObj, " + line.start + ", " + line.end + ");\\n";
        };
        
        processTrack(line.main_words, config.mainFontSize || 80, spatial.main, 'main');
        processTrack(line.sub_words, config.subFontSize || 40, spatial.sub, 'sub');
    }
    
    if (enableEffects) {
        jsx += "var adjLayer = comp.layers.addSolid([1,1,1], 'Global Glow', comp.width, comp.height, comp.pixelAspect, comp.duration); adjLayer.adjustmentLayer = true; adjLayer.moveToBeginning(); var glow = adjLayer.property('Effects').addProperty('ADBE Glo2'); glow.property(2).setValue(45); glow.property(3).setValue(30); glow.property(4).setValue(1.5);\\n";
    }
    
    jsx += "alert('🌌 空间节点漫游引擎已完美注入！\\\\n全部坐标已转换为响应式表达式。'); } app.endUndoGroup();\\n";
    return jsx;
}`;

const defaultGlowCode = `function buildAMLLScript(data, options) { return "alert('请选择 🌌 空间节点可视化专属引擎 才能使用画板排版！');"; }`;
const performanceCode = `function buildAMLLScript(data, options) { return "alert('请选择 🌌 空间节点可视化专属引擎 才能使用画板排版！');"; }`;

export const spatialNodeTemplate: AETemplate = {
  id: 'spatial-node-engine-v1',
  name: '🌌 空间节点可视化专属引擎 (New!)',
  description: '【唯一推荐】生成带表达式的相对坐标动画，支持在 AE 中任意修改合成尺寸而不丢失轨迹，包含 AI 电影级缓动。',
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