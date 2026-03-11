// src/components/ColorLibrary/index.tsx
import type React from "react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useColorAssets } from "../../hooks/useColorAssets";
import { useCursorInjection } from "../../hooks/useCursorInjection";

interface ColorLibraryProps {
	onClose?: () => void;
}

// 🌟 纯原生辅助：RGB 转 HEX
const rgbToHex = (r: number, g: number, b: number) => {
	return "#" + [r, g, b].map(x => {
		const hex = Math.max(0, Math.min(255, x)).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	}).join("").toUpperCase();
};

export const ColorLibrary: React.FC<ColorLibraryProps> = ({ onClose }) => {
	const { t } = useTranslation();
	const {
		system,
		saveColorToSlot,
		addFolder,
		addFolderWithColors, // 引入带资进组 Hook
		deleteFolder,
		renameFolder,
		setSlotCount,
		setOrientation,
		setActiveFolder,
		getActiveFolder,
	} = useColorAssets();
	const { insertAtCursor } = useCursorInjection();

	const activeFolder = getActiveFolder();
	
	// 🌟 图像上传引擎状态
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isExtracting, setIsExtracting] = useState(false);

	const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setActiveFolder(e.target.value);
	};

	const handleAddFolder = () => {
		const name = prompt("新文件夹名称");
		if (name) addFolder(name);
	};

	const handleRenameFolder = () => {
		if (!activeFolder) return;
		const name = prompt("重命名文件夹", activeFolder.name);
		if (name) renameFolder(activeFolder.id, name);
	};

	const handleDeleteFolder = () => {
		if (!activeFolder || system.folders.length <= 1) return;
		if (confirm(`确定删除文件夹 "${activeFolder.name}" 吗？`)) {
			deleteFolder(activeFolder.id);
		}
	};

	const handleSlotClick = (colorHex: string) => {
		if (colorHex) {
			insertAtCursor(colorHex);
		}
	};

	const handleSlotContextMenu = (e: React.MouseEvent, slotIndex: number) => {
		e.preventDefault();
		if (!activeFolder) return;
		const color = prompt("输入颜色代码（如 #FF0000）", activeFolder.colors[slotIndex] || "#FF0000");
		if (color) {
			saveColorToSlot(activeFolder.id, slotIndex, color.toUpperCase());
		}
	};

	// 🌟 核心算法：纯前端原生 Canvas 色彩降维提取 (0 依赖)
	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsExtracting(true);
		const imageUrl = URL.createObjectURL(file);
		const img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				setIsExtracting(false);
				return;
			}

			// 将图像压缩到 100x100 像素进行极速扫描，避免性能卡顿
			const MAX_SIZE = 100;
			let width = img.width;
			let height = img.height;
			if (width > height) {
				if (width > MAX_SIZE) {
					height *= MAX_SIZE / width;
					width = MAX_SIZE;
				}
			} else {
				if (height > MAX_SIZE) {
					width *= MAX_SIZE / height;
					height = MAX_SIZE;
				}
			}
			canvas.width = width;
			canvas.height = height;
			ctx.drawImage(img, 0, 0, width, height);

			const imageData = ctx.getImageData(0, 0, width, height).data;
			const colorMap = new Map<string, number>();

			// 极简色彩量化聚合 (将相近颜色合并到一个粗糙的色带中)
			for (let i = 0; i < imageData.length; i += 16) { // 每隔 4 个像素扫描一次，加速
				const r = Math.round(imageData[i] / 32) * 32;
				const g = Math.round(imageData[i + 1] / 32) * 32;
				const b = Math.round(imageData[i + 2] / 32) * 32;
				const a = imageData[i + 3];
				if (a < 128) continue; // 忽略透明像素

				const hex = rgbToHex(r, g, b);
				colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
			}

			// 按照颜色出现频率排序
			const sortedColors = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]);
			// 提取前 5 种最显眼的主色调
			const topColors = sortedColors.slice(0, 5).map(entry => entry[0]);

			// 以当前时间作为文件夹后缀，越权安全：绝对不覆盖已有数据！
			const timeString = new Date().toLocaleTimeString('zh-CN', { hour12: false });
			addFolderWithColors(`🖼️ 提取色板 (${timeString})`, topColors);

			URL.revokeObjectURL(imageUrl);
			setIsExtracting(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		};
		img.src = imageUrl;
	};

	return (
		<div
			style={{
				background: "#222",
				borderRadius: "12px",
				padding: "16px",
				boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
				width: "420px",
				border: "1px solid #444",
				display: "flex",
				flexDirection: "column",
				gap: "12px",
				color: "#fff",
				fontSize: "13px",
			}}
		>
			{/* 隐藏的文件上传器 */}
			<input 
				type="file" 
				ref={fileInputRef} 
				onChange={handleImageUpload} 
				accept="image/*" 
				style={{ display: "none" }} 
			/>

			{/* 头部：文件夹管理 */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<span style={{ color: "#aaa", fontWeight: "bold" }}>
					{t("colorLibrary.header", "色彩资产库")}
				</span>
				<div style={{ display: "flex", gap: "6px" }}>
					{/* 🌟 智能提取引擎按钮 */}
					<button 
						onClick={() => fileInputRef.current?.click()} 
						style={{ ...buttonStyle, background: "#006699", fontWeight: 'bold' }}
						disabled={isExtracting}
					>
						{isExtracting ? "正在提取..." : "🖼️ 提取图片色板"}
					</button>
					<button onClick={handleRenameFolder} style={buttonStyle}>
						{t("colorLibrary.renameButton", "重命名")}
					</button>
					<button
						onClick={handleDeleteFolder}
						style={{ ...buttonStyle, background: "#633" }}
					>
						{t("colorLibrary.deleteButton", "删除")}
					</button>
					<button
						onClick={handleAddFolder}
						style={{ ...buttonStyle, background: "#364" }}
					>
						{t("colorLibrary.addButton", "+ 文件夹")}
					</button>
				</div>
			</div>

			{/* 文件夹选择器 */}
			<select
				value={system.activeFolderId}
				onChange={handleFolderChange}
				style={{
					width: "100%",
					padding: "8px",
					background: "#111",
					color: "#fff",
					border: "1px solid #555",
					borderRadius: "6px",
					outline: "none",
				}}
			>
				{system.folders.map((f) => (
					<option key={f.id} value={f.id}>
						{f.name} ({f.colors.filter((c) => c).length} 种颜色)
					</option>
				))}
			</select>

			{/* 设置区 */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "8px",
					background: "#1a1a1a",
					padding: "10px 12px",
					borderRadius: "6px",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<span>{t("colorLibrary.slotCountLabel", "悬浮面板显示格子数:")}</span>
					<input
						type="number"
						min={3}
						max={20}
						value={system.slotCount}
						onChange={(e) => setSlotCount(parseInt(e.target.value, 10) || 5)}
						style={{
							width: "50px",
							background: "#333",
							color: "#fff",
							border: "1px solid #555",
							borderRadius: "4px",
							padding: "4px",
							textAlign: "center",
						}}
					/>
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<span>{t("colorLibrary.orientationLabel", "悬浮面板排版:")}</span>
					<select
						value={system.orientation}
						onChange={(e) =>
							setOrientation(e.target.value as "horizontal" | "vertical")
						}
						style={{
							background: "#333",
							color: "#fff",
							border: "1px solid #555",
							borderRadius: "4px",
							padding: "4px",
							outline: "none",
						}}
					>
						<option value="horizontal">
							{t("colorLibrary.orientationHorizontal", "水平")}
						</option>
						<option value="vertical">
							{t("colorLibrary.orientationVertical", "垂直")}
						</option>
					</select>
				</div>
			</div>

			<div style={{ height: "1px", background: "#444" }} />
			<span style={{ color: "#888", textAlign: "center", fontSize: "12px" }}>
				{t("colorLibrary.hint", "点击格子插入歌词，右键编辑颜色代码")}
			</span>

			{/* 100个格子的颜色矩阵 */}
			{activeFolder && (
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(10, 1fr)",
						gap: "6px",
						maxHeight: "220px",
						overflowY: "auto",
						paddingRight: "4px",
					}}
				>
					{activeFolder.colors.map((hex, idx) => {
						const isMainBarSlot = idx < system.slotCount;
						const uniqueKey = `slot-${idx}`; // 修复：直接用 idx 防止重复 key 报错
						return (
							<div
								key={uniqueKey}
								onClick={() => handleSlotClick(hex)}
								onContextMenu={(e) => handleSlotContextMenu(e, idx)}
								title={`格子 ${idx + 1}${isMainBarSlot ? " (显示在主面板)" : ""}\n${hex ? "左键插入 | 右键覆盖" : "右键存入当前颜色"}`}
								style={{
									width: "28px",
									height: "28px",
									borderRadius: "4px",
									background: hex || "#111",
									cursor: "pointer",
									border: `1px solid ${isMainBarSlot ? "#666" : "#333"}`,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: hex
										? "0 2px 4px rgba(0,0,0,0.5)"
										: "inset 0 2px 4px rgba(0,0,0,0.5)",
									position: "relative",
									transition: "all 0.1s",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = "scale(1.1)";
									e.currentTarget.style.border = "1px solid #fff";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = "scale(1)";
									e.currentTarget.style.border = `1px solid ${isMainBarSlot ? "#666" : "#333"}`;
								}}
							>
								{!hex && (
									<span style={{ color: "#444", fontSize: "14px" }}>+</span>
								)}
								{isMainBarSlot && (
									<div
										style={{
											position: "absolute",
											bottom: -2,
											right: -2,
											width: 6,
											height: 6,
											background: "#4CAF50",
											borderRadius: "50%",
										}}
									/>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

const buttonStyle: React.CSSProperties = {
	background: "#333",
	color: "#fff",
	border: "none",
	borderRadius: "4px",
	padding: "4px 8px",
	cursor: "pointer",
	fontSize: "12px",
	transition: "background 0.2s"
};