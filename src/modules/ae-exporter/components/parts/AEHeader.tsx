// 文件路径：src/modules/ae-exporter/components/parts/AEHeader.tsx
import { Button, Dialog, Flex, Heading, ScrollArea } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

// 这里存放原本在 AEModePanel 里的巨长文本
const HUMAN_GUIDE_TEXT = `📄 文档一：AMLL AE 特效模板开发指南...（请替换为完整文本）`;
const AI_PROMPT_TEXT = `你现在是一位资深的 After Effects ExtendScript 开发专家...（请替换为完整文本）`;

export default function AEHeader() {
	const { t } = useTranslation();

	const handleCopy = (text: string, title: string) => {
		navigator.clipboard.writeText(text)
			.then(() => toast.success(t('ae.copySuccess', `🎉 ${title} 已成功复制！`)))
			.catch(() => toast.error(t('ae.copyFailed', '复制失败，请手动选择文本进行复制。')));
	};

	return (
		<Flex justify="between" align="center" style={{ width: '100%', maxWidth: '1600px', marginBottom: '20px' }}>
			<Dialog.Root>
				<Dialog.Trigger><Button variant="soft" color="indigo" style={{ cursor: 'pointer' }}>📖 {t('ae.humanGuideBtn', '开发者指南')}</Button></Dialog.Trigger>
				<Dialog.Content style={{ maxWidth: 800 }}>
					<Dialog.Title>{t('ae.humanGuideTitle', 'AMLL AE 特效模板开发指南')}</Dialog.Title>
					<ScrollArea style={{ height: '60vh', marginTop: '10px', marginBottom: '20px', backgroundColor: 'var(--gray-2)', padding: '15px', borderRadius: '8px' }}>
						<pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'inherit', margin: 0, fontSize: '13px' }}>{HUMAN_GUIDE_TEXT}</pre>
					</ScrollArea>
					<Flex justify="end" gap="3">
						<Dialog.Close><Button variant="soft" color="gray" style={{ cursor: 'pointer' }}>{t('ae.close', '关闭')}</Button></Dialog.Close>
						<Button color="jade" onClick={() => handleCopy(HUMAN_GUIDE_TEXT, t('ae.humanGuideBtn', '开发者指南'))} style={{ cursor: 'pointer' }}>📋 {t('ae.copyBtn', '一键复制')}</Button>
					</Flex>
				</Dialog.Content>
			</Dialog.Root>

			<Heading size="6" style={{ textAlign: 'center', margin: 0 }}>✨ {t('ae.mainTitle', 'AE 特效字幕导出中心')}</Heading>

			<Dialog.Root>
				<Dialog.Trigger><Button variant="soft" color="cyan" style={{ cursor: 'pointer' }}>🤖 {t('ae.aiPromptBtn', '基础提示词')}</Button></Dialog.Trigger>
				<Dialog.Content style={{ maxWidth: 800 }}>
					<Dialog.Title>{t('ae.aiPromptTitle', 'AMLL AE 特效模板生成提示词')}</Dialog.Title>
					<ScrollArea style={{ height: '60vh', marginTop: '10px', marginBottom: '20px', backgroundColor: 'var(--gray-2)', padding: '15px', borderRadius: '8px' }}>
						<pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'inherit', margin: 0, fontSize: '13px' }}>{AI_PROMPT_TEXT}</pre>
					</ScrollArea>
					<Flex justify="end" gap="3">
						<Dialog.Close><Button variant="soft" color="gray" style={{ cursor: 'pointer' }}>{t('ae.close', '关闭')}</Button></Dialog.Close>
						<Button color="jade" onClick={() => handleCopy(AI_PROMPT_TEXT, t('ae.aiPromptBtn', '基础提示词'))} style={{ cursor: 'pointer' }}>📋 {t('ae.copyBtn', '一键复制')}</Button>
					</Flex>
				</Dialog.Content>
			</Dialog.Root>
		</Flex>
	);
}