// 文件路径：src/states/spatial.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils'; // 引入本地持久化存储

export type TransitionType = 'follow' | 'hold' | 'delay';

export interface TransitionConfig {
  type: TransitionType;
  ratio: number; // 0 到 100，表示在虚线上的百分比位置
}

export interface SpatialNode {
  id: string; 
  x: number | string;
  y: number | string;
  rot: number | string;
  text: string;
  width: number | string;
  height: number | string;
  transition?: TransitionConfig; // 🌟 新增：记录从上一个节点到当前节点的过渡方式
}

export interface TrackSpatial {
  visible: boolean;
  bindPos: boolean;
  bindRot: boolean;
  bindTransition?: boolean; // 🌟 修复：改为可选属性，完美兼容本地旧存档数据
  in: SpatialNode | null;
  preFocus: SpatialNode[];  
  focus: SpatialNode | null; 
  postFocus: SpatialNode[]; 
  out: SpatialNode | null;
}

// 🌟 多角色空间数据接口
export interface RoleSpatialData {
  main: TrackSpatial;
  sub: TrackSpatial;
  ruby: TrackSpatial;
}

const emptyTrack = (bindPos: boolean): TrackSpatial => ({
  visible: true, bindPos, bindRot: bindPos, bindTransition: bindPos,
  in: null, preFocus: [], focus: null, postFocus: [], out: null
});

// 生成干净的单角色房间
export const emptyRoleData = (): RoleSpatialData => ({
  main: emptyTrack(false),
  sub: emptyTrack(true),
  ruby: emptyTrack(true)
});

// ==========================================
// 🚀 多角色资产库引擎 (支持本地持久化、文件夹分类)
// ==========================================

export interface RoleFolder {
  id: string;
  name: string;
  roles: string[];
}

export interface RoleSystemData {
  folders: RoleFolder[];
  activeFolderId: string;
  slotCount: number;
}

const defaultRoleSystem: RoleSystemData = {
  folders: [{
    id: 'default',
    name: '默认企划',
    roles: ['主唱', '角色 2', '角色 3', '角色 4', '角色 5']
  }],
  activeFolderId: 'default',
  slotCount: 5
};

export const roleSystemAtom = atomWithStorage<RoleSystemData>('amll-role-assets', defaultRoleSystem);

export const roleCountAtom = atom(
  (get) => get(roleSystemAtom).slotCount,
  (get, set, newCount: number) => set(roleSystemAtom, { ...get(roleSystemAtom), slotCount: newCount })
);

export const roleNamesAtom = atom(
  (get) => {
    const sys = get(roleSystemAtom);
    const folder = sys.folders.find(f => f.id === sys.activeFolderId) || sys.folders[0];
    const record: Record<string, string> = {};
    for (let i = 0; i < sys.slotCount; i++) {
      record[String(i + 1)] = folder.roles[i] || `角色 ${i + 1}`;
    }
    return record;
  }
);

// ==========================================
// 🚀 多角色平行宇宙坐标引擎
// ==========================================

// 1. 字典大楼：包含所有角色轨迹的“大字典” (Map)
export const spatialDataMapAtom = atom<Record<string, RoleSpatialData>>({
  '1': emptyRoleData()
});

// 2. 电梯：当前在空间面板里，用户正在编辑的是哪个角色？
export const activeRoleIdAtom = atom<string>('1');

// 3. 代理拦截器：让其他旧组件无需修改就能读写当前角色的坐标
export const spatialDataAtom = atom(
  (get) => {
    const map = get(spatialDataMapAtom);
    const roleId = get(activeRoleIdAtom);
    return map[roleId] || emptyRoleData();
  },
  (get, set, update: React.SetStateAction<RoleSpatialData>) => {
    const map = get(spatialDataMapAtom);
    const roleId = get(activeRoleIdAtom);
    const current = map[roleId] || emptyRoleData();
    const next = typeof update === 'function' ? update(current) : update;
    set(spatialDataMapAtom, { ...map, [roleId]: next });
  }
);

export const activeTrackIdAtom = atom<'main' | 'sub' | 'ruby'>('main');
export const activeNodeIdAtom = atom<string | null>(null);
export const lockSubNodeDragAtom = atom<boolean>(true);