// 文件路径：src/modules/ae-exporter/components/parts/AEHeader.tsx
import { Box, Button, Dialog, Flex, Heading, ScrollArea } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

// 这里存放原本在 AEModePanel 里的巨长文本
// const HUMAN_GUIDE_TEXT = `📄 文档一：AMLL AE 特效模板开发指南...（请替换为完整文本）`; // 已国际化

export default function AEHeader() {
	const { t } = useTranslation();
	const humanGuideText = t('ae.humanGuideText');

	const handleCopy = (text: string, title: string) => {
		navigator.clipboard.writeText(text)
			.then(() => toast.success(t('ae.copySuccess', `🎉 ${title} 已成功复制！`)))
			.catch(() => toast.error(t('ae.copyFailed', '复制失败，请手动选择文本进行复制。')));
	};

	return (
		<Flex justify="between" align="center" style={{ width: '100%', maxWidth: '1600px', marginBottom: '20px' }}>
			{/* 左侧：开发者指南（被包裹在一个固定宽度的盒子里） */}
			<Box style={{ width: '150px' }}>
				<Dialog.Root>
					<Dialog.Trigger><Button variant="soft" color="indigo" style={{ cursor: 'pointer' }}>📖 {t('ae.humanGuideBtn', '开发者指南')}</Button></Dialog.Trigger>
					<Dialog.Content style={{ maxWidth: 800 }}>
						<Dialog.Title>{t('ae.humanGuideTitle', 'AMLL AE 特效模板开发指南')}</Dialog.Title>
						<ScrollArea style={{ height: '60vh', marginTop: '10px', marginBottom: '20px', backgroundColor: 'var(--gray-2)', padding: '15px', borderRadius: '8px' }}>
							<pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'inherit', margin: 0, fontSize: '13px' }}>{humanGuideText}</pre>
						</ScrollArea>
						<Flex justify="end" gap="3">
							<Dialog.Close><Button variant="soft" color="gray" style={{ cursor: 'pointer' }}>{t('ae.close', '关闭')}</Button></Dialog.Close>
							<Button color="jade" onClick={() => handleCopy(humanGuideText, t('ae.humanGuideBtn', '开发者指南'))} style={{ cursor: 'pointer' }}>📋 {t('ae.copyBtn', '一键复制')}</Button>
						</Flex>
					</Dialog.Content>
				</Dialog.Root>
			</Box>

			{/* 中间：标题 */}
			<Heading size="6" style={{ textAlign: 'center', margin: 0, flex: 1 }}>✨ {t('ae.mainTitle', 'AE 特效字幕导出中心')}</Heading>

			{/* 右侧：用一个一模一样宽度的隐形空气墙，把标题稳稳顶在正中间 */}
			<Box style={{ width: '150px' }} />
		</Flex>
	);
}