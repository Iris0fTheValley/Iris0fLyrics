// 文件路径：src/states/spatial.ts
import { atom } from 'jotai';

export interface SpatialNode {
  id: string; // 🌟 必须：用于在无限数组中精准定位节点
  x: number | string;
  y: number | string;
  rot: number | string;
  text: string;
  width: number | string;
  height: number | string;
}

export interface TrackSpatial {
  visible: boolean;
  bindPos: boolean;
  bindRot: boolean;
  in: SpatialNode | null;
  preFocus: SpatialNode[];  // 🌟 新增：先焦点数组（不设上限）
  focus: SpatialNode | null; // 🌟 修改：主焦点也允许初始为空
  postFocus: SpatialNode[]; // 🌟 新增：次焦点数组（不设上限）
  out: SpatialNode | null;
}

export interface SpatialData {
  main: TrackSpatial;
  sub: TrackSpatial;
  ruby: TrackSpatial;
}

// 🌟 画布初始化：彻底干干净净，将控制权完全交给用户！
const emptyTrack = (bindPos: boolean): TrackSpatial => ({
  visible: true, bindPos, bindRot: bindPos,
  in: null, preFocus: [], focus: null, postFocus: [], out: null
});

export const spatialDataAtom = atom<SpatialData>({
  main: emptyTrack(false),
  sub: emptyTrack(true),
  ruby: emptyTrack(true)
});

export const activeTrackIdAtom = atom<'main' | 'sub' | 'ruby'>('main');
export const activeNodeIdAtom = atom<string | null>(null); // 🌟 动态ID支持
export const lockSubNodeDragAtom = atom<boolean>(true);