// 文件路径：src/modules/ae-exporter/components/AEModePanel.tsx
import { Box, Flex, Separator, Text } from '@radix-ui/themes';
import { useSetAtom } from 'jotai';
import { useState } from 'react';

import { isGlobalFileDraggingAtom } from '$/states/main';

import AEHeader from './parts/AEHeader';
import AELeftPanel from './parts/AELeftPanel';
import AENodeToolbar from './parts/AENodeToolbar';
import AEPromptStation from './parts/AEPromptStation';
import AESpatialStage from './parts/AESpatialStage';
import AETemplateSelect from './parts/AETemplateSelect';

const customStyles = `
	.custom-scrollbar::-webkit-scrollbar { width: 6px; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--gray-6); border-radius: 4px; }
`;

export default function AEModePanel() {
	const setIsGlobalDragging = useSetAtom(isGlobalFileDraggingAtom);
	const [enableEffects, setEnableEffects] = useState(true);
	const [userDescription, setUserDescription] = useState('');

	return (
		<Box 
			// 🌟 恢复：打开全局垂直滚动条，允许页面流式滑动
			style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }} 
			className="custom-scrollbar"
			onDragEnter={(e) => { e.stopPropagation(); setIsGlobalDragging(false); }}
			onDragOver={(e) => { e.stopPropagation(); setIsGlobalDragging(false); }}
			onDrop={(e) => { e.stopPropagation(); setIsGlobalDragging(false); }}
		>
			<style>{customStyles}</style>
			
			<Flex direction="column" align="center" style={{ padding: '20px', width: '100%', height: 'max-content' }}>
				
				<AEHeader />

				{/* 🚀 【上】渲染与导出总控台 */}
				<Box mb="4" style={{ width: '100%', maxWidth: '1800px' }}>
					<AETemplateSelect enableEffects={enableEffects} setEnableEffects={setEnableEffects} />
				</Box>

				{/* 🚀 【中】空间编辑模块 (独占一屏的绝对巨无霸) */}
				<Flex 
					gap="4" align="stretch" 
					// 🌟 核心魔法：高度设定为屏幕高度减去边距 (calc(100vh - 40px))，
					// 这样用户滚到这里时，它会完美霸占整个屏幕视野，给画板最大的操作空间！
					style={{ width: '100%', maxWidth: '1900px', height: 'calc(80vh - 40px)', minHeight: '800px', marginBottom: '50px' }}
				>
					
					{/* 左：核心动效参数 (内部独立滚动) */}
					<Box style={{ width: '280px', backgroundColor: 'var(--gray-2)', borderRadius: '8px', border: '1px solid var(--gray-6)', padding: '16px', overflowY: 'auto' }} className="custom-scrollbar">
						<Text weight="bold" size="3" mb="4" style={{display: 'block'}}>🎛️ 核心动效参数</Text>
						<AELeftPanel />
					</Box>

					{/* 中：战区画板 (完全撑满当前区域) */}
					<Box style={{ flex: 1, backgroundColor: 'var(--gray-3)', borderRadius: '8px', border: '1px solid var(--gray-6)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
						<AESpatialStage />
					</Box>

					{/* 右：精密坐标工具箱 (内部独立滚动) */}
					<Box style={{ width: '340px', backgroundColor: 'var(--gray-2)', borderRadius: '8px', border: '1px solid var(--gray-6)', padding: '16px', overflowY: 'auto' }} className="custom-scrollbar">
						<AENodeToolbar />
					</Box>

				</Flex>

				<Separator size="4" style={{ width: '100%', maxWidth: '1800px', marginBottom: '40px' }} />

				{/* 🚀 【下】AI 提示词生成工作台 */}
				<Box style={{ width: '100%', maxWidth: '1800px', marginBottom: '60px' }}>
					<Text weight="bold" size="4" color="indigo" mb="3" style={{ display: 'block' }}>🤖 AI 提示词生成工作台</Text>
					{/* 解除高度限制，让它自由向下生长 */}
					<AEPromptStation userDescription={userDescription} setUserDescription={setUserDescription} enableEffects={enableEffects} setEnableEffects={setEnableEffects} />
				</Box>

			</Flex>
		</Box>
	);
}