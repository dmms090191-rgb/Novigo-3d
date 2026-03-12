export interface GridSettings {
  gridName?: string;
  gridWidthMeters: number;
  gridLengthMeters: number;
  cellSize: number;
  blockSize: number;
  wallHeight: number;
  wallThickness: number;
  wallType: 'exterior' | 'interior';
}

export interface Wall {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  height: number;
  thickness: number;
}

export interface Block {
  id: string;
  gridX: number;
  gridZ: number;
  height: number;
  imageUrl?: string;
}

export interface Brick {
  id: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
}

export type TerrainType = 'grass' | 'dirt' | 'sand' | 'concrete' | 'gravel' | 'water' | 'asphalt';

export interface TerrainCell {
  id: string;
  gridX: number;
  gridZ: number;
  type: TerrainType;
  elevation: number;
}

export interface SceneData {
  walls: Wall[];
  blocks: Block[];
  bricks: Brick[];
  terrainCells: TerrainCell[];
  gridSettings: GridSettings;
}
