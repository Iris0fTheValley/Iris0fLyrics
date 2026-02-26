// 文件路径：src/modules/ae-exporter/components/parts/AEPromptStation.tsx
import { Box, Button, Card, Flex, Switch, Text, TextArea, Tooltip } from '@radix-ui/themes';
import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { aeConfigAtom } from '$/states/aeConfig';

const INSPIRATION_CHIPS = [
	{ id: 'bamboo', icon: '📜', label: '古代竹简', text: '排版布局采用中国古代竹简的纵向书写格式，所有文字自上而下排列，从屏幕右侧向左水平滑动入场。' },
	{ id: 'physics', icon: '☄️', label: '物理抛物线', text: '让每个字幕像被抛起的硬币一样，从屏幕底部弹出，带有重力下坠感' },
	{ id: '3d', icon: '🌀', label: '3D环形缠绕', text: '开启3D层，让字幕形成一个环绕中心旋转的圆柱形阵列' },
	{ id: 'wave', icon: '🌊', label: '波浪浮动', text: '字幕像水波纹一样上下交错浮动，带有轻微的旋转' }
];

interface AEPromptStationProps {
	userDescription: string;
	setUserDescription: (val: string) => void;
	enableEffects: boolean;
	setEnableEffects: (val: boolean) => void;
}

export default function AEPromptStation({ userDescription, setUserDescription, enableEffects, setEnableEffects }: AEPromptStationProps) {
	const { t } = useTranslation();
	const [config, setConfig] = useAtom(aeConfigAtom);

	const handleResetPrompt = () => {
		if (confirm(t('ae.confirmResetPrompt', '确定要清空当前的灵感描述并关闭上帝模式吗？'))) {
			setUserDescription('');
			setConfig(prev => ({ ...prev, isGodMode: false }));
			toast.success(t('ae.resetPromptSuccess', 'AI 提示词工作台已重置！'));
		}
	};

	const handleCopy = (text: string, title: string) => {
		navigator.clipboard.writeText(text)
			.then(() => toast.success(t('ae.copySuccess', `🎉 ${title} 已成功复制！`)))
			.catch(() => toast.error(t('ae.copyFailed', '复制失败，请手动选择文本进行复制。')));
	};

	const handleChipClick = (text: string) => {
		setUserDescription(userDescription ? `${userDescription}，${text}` : text);
		if (enableEffects) { setEnableEffects(false); toast.info(t('ae.autoDisableEffects', '已自动关闭特效防止冲突！')); }
	};

	const dynamicPrompt = useMemo(() => {
		return `你现在是一位资深的 After Effects ExtendScript 开发专家。你的任务是编写一个在【浏览器前端】运行的代码生成器函数，将 TTML 歌词数据拼接成能在 AE (ES3) 中运行的脚本字符串。

==================================================
【模块一：双重运行环境与强制代码骨架 (最高指令)】
==================================================
❌ 绝对禁止：将传入的 \`data\` 数据硬编码 (如 \`var songData = {...}\`) 写死在生成的脚本里！
✅ 强制要求：你必须且只能输出以下结构的代码，在 "/// 你的创意逻辑 ///" 处填充通过 for 循环拼接字符串的代码。

\`\`\`javascript
function buildAMLLScript(data, options) {
    var maxTime = data.maxTime;
    var lines = data.lines;
    var enableEffects = options ? options.enableEffects : true;
    
    // 1. 初始化 AE 环境 (绝对禁止使用 addComp 新建合成，必须使用 activeItem！)
    var jsx = "app.beginUndoGroup('AMLL Lyrics Build');\\n";
    jsx += "var comp = app.project.activeItem;\\n";
    jsx += "if (comp == null) { alert('错误：请先选中一个合成！'); } else {\\n";
    
    // 2. 建立全局滚动控制器 (防堆叠核心)
    jsx += "var scrollNull = comp.layers.addNull(); scrollNull.name = 'ScrollControl';\\n";
    jsx += "var posProp = scrollNull.property('Position');\\n";
    
    // 3. 循环遍历数据，拼接 addText 字符串
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        
        /// ========================================== ///
        /// 你的创意逻辑：在此处拼接生成字幕图层的 jsx 字符串 
        /// 例如：
        /// jsx += "var hl = comp.layers.addText(" + JSON.stringify(w.text) + ");\\n";
        /// jsx += "hl.parent = scrollNull; hl.inPoint = " + ... + "; hl.outPoint = " + ... + ";\\n";
        /// ========================================== ///
    }
    
    jsx += "} app.endUndoGroup();\\n";
    return jsx;
}
\`\`\`

==================================================
【模块二：视觉排版与物理边界 (三层空间法则)】
==================================================
🌟 【目标合成画布尺寸】：宽 ${config.compWidth}px × 高 ${config.compHeight}px。以此作为 thisComp.width 和 thisComp.height 的物理推演边界。
🌟 【多语种 Y 轴基准】：(若存在) 主歌词偏移量=0，翻译=${config.verticalOffset}，音译=-45。

==================================================
【模块三：AE 脚本绝对红线 (避坑指南)】
==================================================
1. ✂️ [生命周期防堆叠]：拼接的每一个图层必须设置 \`hl.inPoint\` 和 \`hl.outPoint\`！如果不设，所有图层会永远堆叠在屏幕上。
2. 🔤 [转义语法]：注入文本必须用 \`JSON.stringify(word.text)\`，禁止手动正则替换引号！
3. 🧮 [数学拼接]：JS 变量拼接时，数学运算必须包裹括号。如：\`" + (i * ${config.lineSpacing} + yOffset) + "\`。
4. 📜 [AE 竖排文本终极解法]：如果用户要求**竖向排列/竹简**，AE (ES3) 正确的竖排设置代码必须这样拼接：
   \`jsx += "try { if (typeof TextDirection != 'undefined') { tp.direction = TextDirection.VERTICAL; } else { tp.direction = 2; } } catch(e) {}\\n";\`
5. 📜 [竖向滚动排版逻辑]：如果是“竹简/竖排”，你的排版轴应该发生翻转。X 轴变成了行间距（向左推移），Y 轴变成了单词宽度的累加（向下延伸）。\`scrollNull\` 应该在 X 轴上打关键帧进行向左的推移滚动。
6. ✨ [特效权限控制]：当前设定特效模式 = ${enableEffects}。若为 false，则 JSX 中**绝对禁止**挂载模糊 (Blur)、发光 (Glow) 等 Effects 插件，只允许操作 Transform。

==================================================
【模块四：✨ 用户创意动效描述】
==================================================
用户诉求：“${userDescription || '请实现基础排版与平滑的景深滚动模糊。'}”
当前行间距设置：${config.lineSpacing}px，视野渲染阈值(消隐距离)：${config.fovThreshold}px。

请先在 <thinking> 中核对你的代码结构是否与【模块一】的骨架完全一致，核对竖向排版是否正确翻转了 X/Y 轴。最后输出纯粹的 JS 函数代码。`;
	}, [config, userDescription, enableEffects]);

	return (
		<Card size="3" variant="surface" style={{ width: '100%', maxWidth: '1600px' }}>
			<Flex justify="between" align="center" mb="4">
				<Text weight="bold" size="3">🤖 {t('ae.aiPromptStation', 'AI 提示词生成工作台')}</Text>
				<Button size="1" variant="soft" color="gray" onClick={handleResetPrompt} style={{ cursor: 'pointer' }}>🔄 {t('ae.resetClear', '清空重置')}</Button>
			</Flex>
			
			<Box mb="4" p="3" style={{ backgroundColor: config.isGodMode ? 'rgba(41, 163, 131, 0.15)' : 'var(--gray-3)', borderRadius: '8px', border: config.isGodMode ? '1px solid var(--jade-8)' : '1px solid var(--gray-6)', transition: 'all 0.3s' }}>
				<Flex justify="between" align="center">
					<Box>
						<Text size="3" weight="bold" color={config.isGodMode ? "jade" : "gray"}>⚡ {t('ae.godModeTitle', 'AI 空间引擎完全接管 (上帝模式)')}</Text>
						<Text size="2" color="gray" as="div" mt="1">{t('ae.godModeDesc', '开启后，常规时间与空间滑块将被禁用。AI 将参考下方的自然语言描述，自由重构图层的三维坐标系与生命周期。')}</Text>
					</Box>
					<Tooltip content={t('ae.godModeTooltip', '将空间与时间的决定权完全交由 AI 处理')}>
						<Switch size="3" color="jade" checked={config.isGodMode} onCheckedChange={(v) => setConfig(prev => ({ ...prev, isGodMode: v }))} style={{ cursor: 'pointer' }} />
					</Tooltip>
				</Flex>
			</Box>

			<Flex gap="4" align="stretch">
				<Box style={{ flex: '1' }}>
					<Flex wrap="wrap" gap="2" mb="3" align="center">
						<Text size="2" weight="bold" color="indigo">💡 {t('ae.inspirationCapsule', '灵感胶囊：')}</Text>
						{INSPIRATION_CHIPS.map(chip => (
							<Button key={chip.id} size="1" variant="soft" color="indigo" onClick={() => handleChipClick(chip.text)} style={{ cursor: 'pointer', borderRadius: '12px' }}>
								{chip.icon} {t(`ae.chip_${chip.id}`, chip.label)}
							</Button>
						))}
					</Flex>
					<TextArea 
						placeholder={t('ae.promptPlaceholder', '例如：让每个字幕像被抛起的硬币一样，从屏幕底部弹出，带有重力下坠感...')}
						value={userDescription}
						onChange={(e) => { setUserDescription(e.target.value); if(e.target.value && enableEffects) { setEnableEffects(false); toast.info(t('ae.autoDisableEffects', '已自动关闭特效防止冲突！')); } }}
						style={{ height: '140px', resize: 'none' }}
					/>
				</Box>

				<Box style={{ flex: '1', position: 'relative' }}>
					<TextArea 
						readOnly value={dynamicPrompt} className="custom-scrollbar"
						style={{ height: '100%', minHeight: '180px', resize: 'none', backgroundColor: 'var(--gray-2)', fontSize: '11px', fontFamily: 'monospace' }} 
					/>
					<Button size="1" color="jade" variant="solid" onClick={() => handleCopy(dynamicPrompt, t('ae.copyPromptTarget', '专属 AI 提示词'))} style={{ position: 'absolute', top: 10, right: 10, cursor: 'pointer' }}>
						📋 {t('ae.copyBtn', '一键复制')}
					</Button>
				</Box>
			</Flex>
		</Card>
	);
}