export interface DrawingPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface DrawingStroke {
  points: DrawingPoint[];
  color: string;
  width: number;
  startTime: number;
  endTime: number;
}

export interface DrawingData {
  strokes: DrawingStroke[];
  totalDuration: number;
  canvasWidth: number;
  canvasHeight: number;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface PlacementParams {
  snapToGrid: boolean;
  rotatable: boolean;
  scalable: boolean;
  defaultRotation?: number;
  anchorPoint?: 'center' | 'bottom-center' | 'top-left';
}

export interface LibraryElement {
  id: string;
  name: string;
  category: string;
  icon: string;
  drawing_data: DrawingData | null;
  preview_image: string | null;
  width: number;
  height: number;
  depth: number;
  placement_params: PlacementParams;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ScenePlacedElement {
  id: string;
  elementId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  isDrawing: boolean;
  drawingProgress: number;
}
