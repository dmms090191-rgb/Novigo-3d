import React, { useRef, useEffect, useState } from 'react';
import { Loader2, Pause, Play, Box, Rotate3d, SkipForward, RefreshCw, RotateCcw, Pipette, Plus, X, Save, Trash2, ChevronUp, ChevronDown, Grid3x3, Hammer, Ruler, Square, Palette } from 'lucide-react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

interface Animation3DViewerProps {
  isPlaying: boolean;
  onComplete?: () => void;
  onPlay?: () => void;
}

const SPEED_OPTIONS = [
  { label: 'x1', value: 1 },
  { label: 'x2', value: 2 },
  { label: 'x4', value: 4 },
  { label: 'x8', value: 8 },
];

interface SavedColor {
  r: number;
  g: number;
  b: number;
  hex: string;
}

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 200, g: 200, b: 200 };
};

const generateArmoirePoints = (lengthCm: number, widthCm: number, heightCm: number): Point3D[] => {
  const baseWidth = 140;
  const baseLength = 60;
  const baseHeight = 200;
  const scaleX = widthCm / baseWidth;
  const scaleZ = lengthCm / baseLength;
  const scaleY = heightCm / baseHeight;

  const basePoints: Point3D[] = [
    { x: -0.7, y: -0.9, z: -0.3 },
    { x: 0.7, y: -0.9, z: -0.3 },
    { x: 0.7, y: -0.9, z: 0.3 },
    { x: -0.7, y: -0.9, z: 0.3 },
    { x: -0.7, y: 0.9, z: -0.3 },
    { x: 0.7, y: 0.9, z: -0.3 },
    { x: 0.7, y: 0.9, z: 0.3 },
    { x: -0.7, y: 0.9, z: 0.3 },
    { x: -0.75, y: 0.9, z: -0.35 },
    { x: 0.75, y: 0.9, z: -0.35 },
    { x: 0.75, y: 0.9, z: 0.35 },
    { x: -0.75, y: 0.9, z: 0.35 },
    { x: -0.75, y: 0.95, z: -0.35 },
    { x: 0.75, y: 0.95, z: -0.35 },
    { x: 0.75, y: 0.95, z: 0.35 },
    { x: -0.75, y: 0.95, z: 0.35 },
    { x: -0.72, y: -0.9, z: -0.32 },
    { x: 0.72, y: -0.9, z: -0.32 },
    { x: 0.72, y: -0.9, z: 0.32 },
    { x: -0.72, y: -0.9, z: 0.32 },
    { x: -0.72, y: -0.95, z: -0.32 },
    { x: 0.72, y: -0.95, z: -0.32 },
    { x: 0.72, y: -0.95, z: 0.32 },
    { x: -0.72, y: -0.95, z: 0.32 },
    { x: -0.65, y: -0.95, z: -0.25 },
    { x: -0.65, y: -1.0, z: -0.25 },
    { x: 0.65, y: -0.95, z: -0.25 },
    { x: 0.65, y: -1.0, z: -0.25 },
    { x: -0.65, y: -0.95, z: 0.25 },
    { x: -0.65, y: -1.0, z: 0.25 },
    { x: 0.65, y: -0.95, z: 0.25 },
    { x: 0.65, y: -1.0, z: 0.25 },
    { x: 0.0, y: 0.87, z: -0.29 },
    { x: 0.0, y: -0.87, z: -0.29 },
    { x: 0.0, y: 0.87, z: 0.29 },
    { x: 0.0, y: -0.87, z: 0.29 },
    { x: -0.67, y: 0.4, z: -0.28 },
    { x: -0.03, y: 0.4, z: -0.28 },
    { x: -0.03, y: 0.4, z: 0.28 },
    { x: -0.67, y: 0.4, z: 0.28 },
    { x: 0.03, y: 0.4, z: -0.28 },
    { x: 0.67, y: 0.4, z: -0.28 },
    { x: 0.67, y: 0.4, z: 0.28 },
    { x: 0.03, y: 0.4, z: 0.28 },
    { x: -0.67, y: -0.2, z: -0.28 },
    { x: -0.03, y: -0.2, z: -0.28 },
    { x: -0.03, y: -0.2, z: 0.28 },
    { x: -0.67, y: -0.2, z: 0.28 },
    { x: 0.03, y: -0.2, z: -0.28 },
    { x: 0.67, y: -0.2, z: -0.28 },
    { x: 0.67, y: -0.2, z: 0.28 },
    { x: 0.03, y: -0.2, z: 0.28 },
    { x: -0.67, y: 0.87, z: -0.30 },
    { x: -0.03, y: 0.87, z: -0.30 },
    { x: -0.03, y: -0.87, z: -0.30 },
    { x: -0.67, y: -0.87, z: -0.30 },
    { x: -0.63, y: 0.80, z: -0.31 },
    { x: -0.07, y: 0.80, z: -0.31 },
    { x: -0.07, y: 0.20, z: -0.31 },
    { x: -0.63, y: 0.20, z: -0.31 },
    { x: -0.63, y: 0.10, z: -0.31 },
    { x: -0.07, y: 0.10, z: -0.31 },
    { x: -0.07, y: -0.80, z: -0.31 },
    { x: -0.63, y: -0.80, z: -0.31 },
    { x: 0.03, y: 0.87, z: -0.30 },
    { x: 0.67, y: 0.87, z: -0.30 },
    { x: 0.67, y: -0.87, z: -0.30 },
    { x: 0.03, y: -0.87, z: -0.30 },
    { x: 0.07, y: 0.80, z: -0.31 },
    { x: 0.63, y: 0.80, z: -0.31 },
    { x: 0.63, y: 0.20, z: -0.31 },
    { x: 0.07, y: 0.20, z: -0.31 },
    { x: 0.07, y: 0.10, z: -0.31 },
    { x: 0.63, y: 0.10, z: -0.31 },
    { x: 0.63, y: -0.80, z: -0.31 },
    { x: 0.07, y: -0.80, z: -0.31 },
    { x: -0.10, y: 0.10, z: -0.33 },
    { x: -0.10, y: -0.10, z: -0.33 },
    { x: -0.08, y: 0.10, z: -0.35 },
    { x: -0.08, y: -0.10, z: -0.35 },
    { x: 0.10, y: 0.10, z: -0.33 },
    { x: 0.10, y: -0.10, z: -0.33 },
    { x: 0.08, y: 0.10, z: -0.35 },
    { x: 0.08, y: -0.10, z: -0.35 },
    { x: -0.68, y: 0.88, z: -0.29 },
    { x: -0.68, y: 0.88, z: 0.29 },
    { x: -0.68, y: -0.88, z: 0.29 },
    { x: -0.68, y: -0.88, z: -0.29 },
    { x: 0.68, y: 0.88, z: -0.29 },
    { x: 0.68, y: 0.88, z: 0.29 },
    { x: 0.68, y: -0.88, z: 0.29 },
    { x: 0.68, y: -0.88, z: -0.29 },
    { x: -0.69, y: 0.88, z: 0.29 },
    { x: 0.69, y: 0.88, z: 0.29 },
    { x: 0.69, y: -0.88, z: 0.29 },
    { x: -0.69, y: -0.88, z: 0.29 },
    { x: -0.60, y: 0.75, z: -0.20 },
    { x: -0.60, y: 0.75, z: 0.20 },
    { x: 0.60, y: 0.75, z: -0.20 },
    { x: 0.60, y: 0.75, z: 0.20 },
  ];

  return basePoints.map(p => ({
    x: p.x * scaleX,
    y: p.y * scaleY,
    z: p.z * scaleZ
  }));
};

const Animation3DViewer: React.FC<Animation3DViewerProps> = ({
  isPlaying,
  onComplete,
  onPlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const drawProgressRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const trailPointsRef = useRef<Array<{ x: number; y: number; alpha: number }>>([]);
  const isErasingRef = useRef(false);
  const pauseTimerRef = useRef(0);
  const rotationAtCompleteRef = useRef(0);
  const waitingForRotationRef = useRef(false);
  const hasStartedRef = useRef(false);
  const speedRef = useRef(1);

  const [isSceneReady, setIsSceneReady] = useState(false);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const [selectedSpeed, setSelectedSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [isFreeRotation, setIsFreeRotation] = useState(false);
  const isFreeRotationRef = useRef(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const isAutoRotatingRef = useRef(true);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const isAnimationCompleteRef = useRef(false);
  const frontFacingRotationRef = useRef(0);
  const manualRotationRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const zoomRef = useRef(1);
  const [isMaterialized, setIsMaterialized] = useState(false);
  const isMaterializedRef = useRef(false);
  const [currentColor, setCurrentColor] = useState({ r: 200, g: 200, b: 200 });
  const currentColorRef = useRef({ r: 200, g: 200, b: 200 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [savedColors, setSavedColors] = useState<(SavedColor | null)[]>([null, null, null]);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [isBottomBarCollapsed, setIsBottomBarCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<'armoireColor' | 'dimension' | 'interior' | 'exterior' | 'background' | null>(null);
  const [armoireDimensions, setArmoireDimensions] = useState({ length: 60, width: 140, height: 200 });
  const armoireDimensionsRef = useRef({ length: 60, width: 140, height: 200 });
  const [dimensionInputs, setDimensionInputs] = useState({ length: '60', width: '140', height: '200' });
  const [interiorLineColor, setInteriorLineColor] = useState('#6B7280');
  const interiorLineColorRef = useRef('#6B7280');
  const [interiorLineWidth, setInteriorLineWidth] = useState(1);
  const interiorLineWidthRef = useRef(1);
  const [interiorSavedColors, setInteriorSavedColors] = useState<(SavedColor | null)[]>([null, null, null]);
  const interiorColorInputRef = useRef<HTMLInputElement>(null);

  const [exteriorLineColor, setExteriorLineColor] = useState('#64748B');
  const exteriorLineColorRef = useRef('#64748B');
  const [exteriorLineWidth, setExteriorLineWidth] = useState(1);
  const exteriorLineWidthRef = useRef(1);
  const [exteriorSavedColors, setExteriorSavedColors] = useState<(SavedColor | null)[]>([null, null, null]);
  const exteriorColorInputRef = useRef<HTMLInputElement>(null);
  const [backgroundColor, setBackgroundColor] = useState('#050a15');
  const backgroundColorRef = useRef('#050a15');
  const [backgroundSavedColors, setBackgroundSavedColors] = useState<(SavedColor | null)[]>([null, null, null]);
  const backgroundColorInputRef = useRef<HTMLInputElement>(null);

  const initialBaseScaleRef = useRef<number | null>(null);
  const initialCenterRef = useRef<{ x: number; y: number } | null>(null);
  const initialCanvasSizeRef = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (width > 0 && height > 0) {
          dimensionsRef.current = { width, height };
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(containerRef.current);

    setIsSceneReady(true);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      zoomRef.current = Math.max(0.3, Math.min(3, zoomRef.current + delta));
    };

    canvas.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheelEvent);
    };
  }, []);

  useEffect(() => {
    if (!isSceneReady || !isPlaying || hasStartedRef.current) return;
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    if (containerWidth === 0 || containerHeight === 0) return;

    hasStartedRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!initialCanvasSizeRef.current) {
      initialCanvasSizeRef.current = { width: containerWidth, height: containerHeight };
    }
    if (!initialCenterRef.current) {
      initialCenterRef.current = { x: containerWidth / 2, y: containerHeight / 2 };
    }

    const fixedWidth = initialCanvasSizeRef.current.width;
    const fixedHeight = initialCanvasSizeRef.current.height;
    const fixedBaseScale = 150;

    canvas.width = fixedWidth;
    canvas.height = fixedHeight;

    const getDimensions = () => {
      return {
        width: fixedWidth,
        height: fixedHeight,
        centerX: fixedWidth / 2,
        centerY: fixedHeight / 2,
        baseScale: fixedBaseScale
      };
    };

    const getArmoirePoints = () => generateArmoirePoints(
      armoireDimensionsRef.current.length,
      armoireDimensionsRef.current.width,
      armoireDimensionsRef.current.height
    );

    const continuousPath = [
      // Structure principale - base
      0, 1, 2, 3, 0,
      // Piliers verticaux
      -1, 0, 4,
      -1, 1, 5,
      -1, 2, 6,
      -1, 3, 7,
      // Haut
      -1, 4, 5, 6, 7, 4,

      // Corniche haute
      -1, 8, 9, 10, 11, 8,
      -1, 12, 13, 14, 15, 12,
      -1, 8, 12,
      -1, 9, 13,
      -1, 10, 14,
      -1, 11, 15,

      // Plinthe basse
      -1, 16, 17, 18, 19, 16,
      -1, 20, 21, 22, 23, 20,
      -1, 16, 20,
      -1, 17, 21,
      -1, 18, 22,
      -1, 19, 23,

      // Pieds
      -1, 24, 25,
      -1, 26, 27,
      -1, 28, 29,
      -1, 30, 31,

      // Separation centrale
      -1, 32, 33,
      -1, 34, 35,
      -1, 32, 34,
      -1, 33, 35,

      // Etagere haute gauche
      -1, 36, 37, 38, 39, 36,
      -1, 37, 38,

      // Etagere haute droite
      -1, 40, 41, 42, 43, 40,
      -1, 41, 42,

      // Etagere basse gauche
      -1, 44, 45, 46, 47, 44,
      -1, 45, 46,

      // Etagere basse droite
      -1, 48, 49, 50, 51, 48,
      -1, 49, 50,

      // Porte gauche cadre
      -1, 52, 53, 54, 55, 52,
      // Porte gauche panneau haut
      -1, 56, 57, 58, 59, 56,
      // Porte gauche panneau bas
      -1, 60, 61, 62, 63, 60,

      // Porte droite cadre
      -1, 64, 65, 66, 67, 64,
      // Porte droite panneau haut
      -1, 68, 69, 70, 71, 68,
      // Porte droite panneau bas
      -1, 72, 73, 74, 75, 72,

      // Poignee gauche
      -1, 76, 77,
      -1, 78, 79,
      -1, 76, 78,
      -1, 77, 79,

      // Poignee droite
      -1, 80, 81,
      -1, 82, 83,
      -1, 80, 82,
      -1, 81, 83,

      // Panneau lateral gauche
      -1, 84, 85, 86, 87, 84,

      // Panneau lateral droit
      -1, 88, 89, 90, 91, 88,

      // Fond
      -1, 92, 93, 94, 95, 92,

      // Tringle gauche
      -1, 96, 97,

      // Tringle droite
      -1, 98, 99,
    ];

    const interiorPointIndices = new Set([
      32, 33, 34, 35,
      36, 37, 38, 39,
      40, 41, 42, 43,
      44, 45, 46, 47,
      48, 49, 50, 51,
      96, 97, 98, 99,
    ]);

    drawProgressRef.current = 0;
    particlesRef.current = [];
    trailPointsRef.current = [];
    isErasingRef.current = false;
    pauseTimerRef.current = 0;
    rotationAtCompleteRef.current = 0;
    waitingForRotationRef.current = false;
    timeRef.current = 0;

    const rotateY = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x * cos - point.z * sin,
        y: point.y,
        z: point.x * sin + point.z * cos,
      };
    };

    const rotateX = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x,
        y: point.y * cos - point.z * sin,
        z: point.y * sin + point.z * cos,
      };
    };

    const project = (point: Point3D, currentScale: number, centerX: number, centerY: number): { x: number; y: number; depth: number } => {
      const perspective = 3;
      const factor = perspective / (perspective + point.z);
      return {
        x: centerX + point.x * currentScale * factor,
        y: centerY - point.y * currentScale * factor,
        depth: point.z,
      };
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = () => {
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const { width, height, centerX, centerY, baseScale } = getDimensions();

      const speedMultiplier = speedRef.current;
      timeRef.current += 0.004 * speedMultiplier;
      const time = timeRef.current;

      ctx.fillStyle = backgroundColorRef.current;
      ctx.fillRect(0, 0, width, height);

      let baseRotationY: number;
      let baseRotationX: number;

      if (isFreeRotationRef.current) {
        baseRotationY = manualRotationRef.current.y;
        baseRotationX = manualRotationRef.current.x;
      } else if (isAnimationCompleteRef.current && !isAutoRotatingRef.current) {
        baseRotationY = frontFacingRotationRef.current;
        baseRotationX = -0.12;
      } else {
        baseRotationY = time * 0.12;
        baseRotationX = Math.sin(time * 0.08) * 0.08 - 0.12;
      }

      const currentScale = baseScale * zoomRef.current;

      const armoirePoints = getArmoirePoints();
      const transformedPoints = armoirePoints.map((point) => {
        const rotatedY = rotateY(point, baseRotationY);
        const rotatedXY = rotateX(rotatedY, baseRotationX);
        return rotatedXY;
      });

      const projectedPoints = transformedPoints.map((point) => project(point, currentScale, centerX, centerY));

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const totalSegments = continuousPath.length - 1;
      const baseDrawSpeed = 0.015;
      const baseEraseSpeed = 0.025;
      const drawSpeed = baseDrawSpeed * speedMultiplier;
      const eraseSpeed = baseEraseSpeed * speedMultiplier;

      const isDrawingCompleteCheck = drawProgressRef.current >= totalSegments;
      const isErasingComplete = drawProgressRef.current <= 0;
      const currentRotation = time * 0.12;

      if (!isDrawingCompleteCheck) {
        drawProgressRef.current = Math.min(drawProgressRef.current + drawSpeed, totalSegments);
      } else if (!isAnimationCompleteRef.current) {
        isAnimationCompleteRef.current = true;
        setIsAnimationComplete(true);
        const currentAngle = currentRotation % (Math.PI * 2);
        const targetAngle = Math.round(currentAngle / (Math.PI / 2)) * (Math.PI / 2);
        frontFacingRotationRef.current = targetAngle;
        isAutoRotatingRef.current = false;
        setIsAutoRotating(false);
      }

      const currentProgress = drawProgressRef.current;
      const completedSegments = Math.floor(currentProgress);
      const segmentProgress = easeInOutCubic(currentProgress - completedSegments);

      trailPointsRef.current = trailPointsRef.current.filter((point) => {
        point.alpha -= 0.012;
        return point.alpha > 0;
      });

      const faces = [
        { points: [0, 1, 5, 4], normal: { x: 0, y: 0, z: -1 } },
        { points: [2, 3, 7, 6], normal: { x: 0, y: 0, z: 1 } },
        { points: [3, 0, 4, 7], normal: { x: -1, y: 0, z: 0 } },
        { points: [1, 2, 6, 5], normal: { x: 1, y: 0, z: 0 } },
        { points: [4, 5, 6, 7], normal: { x: 0, y: 1, z: 0 } },
        { points: [0, 3, 2, 1], normal: { x: 0, y: -1, z: 0 } },
        { points: [8, 9, 13, 12], normal: { x: 0, y: 0, z: -1 } },
        { points: [10, 11, 15, 14], normal: { x: 0, y: 0, z: 1 } },
        { points: [11, 8, 12, 15], normal: { x: -1, y: 0, z: 0 } },
        { points: [9, 10, 14, 13], normal: { x: 1, y: 0, z: 0 } },
        { points: [12, 13, 14, 15], normal: { x: 0, y: 1, z: 0 } },
        { points: [8, 11, 10, 9], normal: { x: 0, y: -1, z: 0 } },
        { points: [16, 17, 21, 20], normal: { x: 0, y: 0, z: -1 } },
        { points: [18, 19, 23, 22], normal: { x: 0, y: 0, z: 1 } },
        { points: [19, 16, 20, 23], normal: { x: -1, y: 0, z: 0 } },
        { points: [17, 18, 22, 21], normal: { x: 1, y: 0, z: 0 } },
        { points: [16, 19, 18, 17], normal: { x: 0, y: 1, z: 0 } },
        { points: [20, 21, 22, 23], normal: { x: 0, y: -1, z: 0 } },
        { points: [52, 53, 54, 55], normal: { x: 0, y: 0, z: -1 } },
        { points: [56, 57, 58, 59], normal: { x: 0, y: 0, z: -1 } },
        { points: [60, 61, 62, 63], normal: { x: 0, y: 0, z: -1 } },
        { points: [64, 65, 66, 67], normal: { x: 0, y: 0, z: -1 } },
        { points: [68, 69, 70, 71], normal: { x: 0, y: 0, z: -1 } },
        { points: [72, 73, 74, 75], normal: { x: 0, y: 0, z: -1 } },
        { points: [36, 37, 38, 39], normal: { x: 0, y: 1, z: 0 } },
        { points: [40, 41, 42, 43], normal: { x: 0, y: 1, z: 0 } },
        { points: [44, 45, 46, 47], normal: { x: 0, y: 1, z: 0 } },
        { points: [48, 49, 50, 51], normal: { x: 0, y: 1, z: 0 } },
        { points: [84, 85, 86, 87], normal: { x: -1, y: 0, z: 0 } },
        { points: [88, 89, 90, 91], normal: { x: 1, y: 0, z: 0 } },
        { points: [92, 93, 94, 95], normal: { x: 0, y: 0, z: 1 } },
      ];

      if (isMaterializedRef.current) {
        const rotateNormal = (normal: { x: number; y: number; z: number }) => {
          const cosY = Math.cos(baseRotationY);
          const sinY = Math.sin(baseRotationY);
          const cosX = Math.cos(baseRotationX);
          const sinX = Math.sin(baseRotationX);

          const y1 = normal.x * cosY - normal.z * sinY;
          const z1 = normal.x * sinY + normal.z * cosY;

          const y2 = normal.y * cosX - z1 * sinX;
          const z2 = normal.y * sinX + z1 * cosX;

          return { x: y1, y: y2, z: z2 };
        };

        const lightDir = { x: 0.3, y: 0.5, z: -0.8 };
        const lightLen = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
        lightDir.x /= lightLen;
        lightDir.y /= lightLen;
        lightDir.z /= lightLen;

        const sortedFaces = faces.map((face, index) => {
          const avgZ = face.points.reduce((sum, idx) => sum + transformedPoints[idx].z, 0) / face.points.length;
          return { ...face, avgZ, index };
        }).sort((a, b) => b.avgZ - a.avgZ);

        sortedFaces.forEach((face) => {
          const rotatedNormal = rotateNormal(face.normal);
          const dot = rotatedNormal.x * lightDir.x + rotatedNormal.y * lightDir.y + rotatedNormal.z * lightDir.z;

          if (rotatedNormal.z > 0.1) return;

          const ambient = 0.4;
          const diffuse = Math.max(0, dot) * 0.6;
          const brightness = Math.min(1, ambient + diffuse);

          const baseR = Math.floor(currentColorRef.current.r * (0.6 + brightness * 0.4));
          const baseG = Math.floor(currentColorRef.current.g * (0.6 + brightness * 0.4));
          const baseB = Math.floor(currentColorRef.current.b * (0.6 + brightness * 0.4));

          ctx.beginPath();
          const firstPoint = projectedPoints[face.points[0]];
          ctx.moveTo(firstPoint.x, firstPoint.y);

          for (let i = 1; i < face.points.length; i++) {
            const point = projectedPoints[face.points[i]];
            ctx.lineTo(point.x, point.y);
          }
          ctx.closePath();

          ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
          ctx.fill();

          const strokeR = Math.floor(currentColorRef.current.r * 0.5);
          const strokeG = Math.floor(currentColorRef.current.g * 0.5);
          const strokeB = Math.floor(currentColorRef.current.b * 0.5);
          ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, 0.5)`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });

        const exteriorColor = hexToRgb(exteriorLineColorRef.current);
        ctx.strokeStyle = `rgba(${exteriorColor.r}, ${exteriorColor.g}, ${exteriorColor.b}, 0.5)`;
        ctx.lineWidth = exteriorLineWidthRef.current;
        ctx.beginPath();
        let isFirstPoint = true;

        for (let i = 0; i < continuousPath.length; i++) {
          const idx = continuousPath[i];

          if (idx === -1) {
            isFirstPoint = true;
            continue;
          }

          if (interiorPointIndices.has(idx)) {
            isFirstPoint = true;
            continue;
          }

          const point = projectedPoints[idx];
          if (isFirstPoint) {
            ctx.moveTo(point.x, point.y);
            isFirstPoint = false;
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
        ctx.stroke();

        const interiorColor = hexToRgb(interiorLineColorRef.current);
        ctx.strokeStyle = `rgba(${interiorColor.r}, ${interiorColor.g}, ${interiorColor.b}, 0.6)`;
        ctx.lineWidth = interiorLineWidthRef.current;
        ctx.beginPath();
        isFirstPoint = true;
        let lastWasInterior = false;

        for (let i = 0; i < continuousPath.length; i++) {
          const idx = continuousPath[i];

          if (idx === -1) {
            if (lastWasInterior) {
              ctx.stroke();
              ctx.beginPath();
            }
            isFirstPoint = true;
            lastWasInterior = false;
            continue;
          }

          if (!interiorPointIndices.has(idx)) {
            if (lastWasInterior) {
              ctx.stroke();
              ctx.beginPath();
            }
            isFirstPoint = true;
            lastWasInterior = false;
            continue;
          }

          const point = projectedPoints[idx];
          if (isFirstPoint) {
            ctx.moveTo(point.x, point.y);
            isFirstPoint = false;
          } else {
            ctx.lineTo(point.x, point.y);
          }
          lastWasInterior = true;
        }
        ctx.stroke();

      } else if (completedSegments > 0) {
        trailPointsRef.current.forEach((point) => {
          const trailGlow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 10);
          trailGlow.addColorStop(0, `rgba(150, 220, 255, ${point.alpha * 0.5})`);
          trailGlow.addColorStop(0.5, `rgba(80, 160, 255, ${point.alpha * 0.2})`);
          trailGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = trailGlow;
          ctx.fill();
        });

        const drawPathWithJumps = (glowAlpha: number, glowWidth: number) => {
          ctx.beginPath();
          let isFirstPoint = true;

          for (let i = 0; i <= completedSegments && i < continuousPath.length; i++) {
            const idx = continuousPath[i];

            if (idx === -1) {
              isFirstPoint = true;
              continue;
            }

            const point = projectedPoints[idx];
            if (isFirstPoint) {
              ctx.moveTo(point.x, point.y);
              isFirstPoint = false;
            } else {
              ctx.lineTo(point.x, point.y);
            }
          }

          if (segmentProgress > 0 && completedSegments < totalSegments) {
            const fromIdx = continuousPath[completedSegments];
            const toIdx = continuousPath[completedSegments + 1];

            if (fromIdx !== -1 && toIdx !== -1) {
              const fromPoint = projectedPoints[fromIdx];
              const toPoint = projectedPoints[toIdx];
              const currentX = lerp(fromPoint.x, toPoint.x, segmentProgress);
              const currentY = lerp(fromPoint.y, toPoint.y, segmentProgress);
              ctx.lineTo(currentX, currentY);
            }
          }

          ctx.strokeStyle = `rgba(80, 180, 255, ${glowAlpha})`;
          ctx.lineWidth = glowWidth;
          ctx.stroke();
        };

        for (let glow = 5; glow >= 0; glow--) {
          const glowAlpha = 0.1 - glow * 0.015;
          const glowWidth = 18 - glow * 2.5;
          drawPathWithJumps(glowAlpha, glowWidth);
        }

        ctx.beginPath();
        let isFirstPoint = true;

        for (let i = 0; i <= completedSegments && i < continuousPath.length; i++) {
          const idx = continuousPath[i];

          if (idx === -1) {
            isFirstPoint = true;
            continue;
          }

          const point = projectedPoints[idx];
          if (isFirstPoint) {
            ctx.moveTo(point.x, point.y);
            isFirstPoint = false;
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }

        if (segmentProgress > 0 && completedSegments < totalSegments) {
          const fromIdx = continuousPath[completedSegments];
          const toIdx = continuousPath[completedSegments + 1];

          if (fromIdx !== -1 && toIdx !== -1) {
            const fromPoint = projectedPoints[fromIdx];
            const toPoint = projectedPoints[toIdx];
            const currentX = lerp(fromPoint.x, toPoint.x, segmentProgress);
            const currentY = lerp(fromPoint.y, toPoint.y, segmentProgress);
            ctx.lineTo(currentX, currentY);
          }
        }

        const lineGradient = ctx.createLinearGradient(
          centerX - currentScale,
          centerY - currentScale,
          centerX + currentScale,
          centerY + currentScale
        );
        lineGradient.addColorStop(0, 'rgba(120, 200, 255, 0.95)');
        lineGradient.addColorStop(0.5, 'rgba(200, 240, 255, 1)');
        lineGradient.addColorStop(1, 'rgba(120, 200, 255, 0.95)');

        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      if (!isMaterializedRef.current) {
        const visitedPoints = new Set<number>();
        for (let i = 0; i <= completedSegments && i < continuousPath.length; i++) {
          if (continuousPath[i] !== -1) {
            visitedPoints.add(continuousPath[i]);
          }
        }

        visitedPoints.forEach((index) => {
          const point = projectedPoints[index];
          const depthFactor = Math.max(0.5, 1 - (point.depth + 1) * 0.25);
          const pulse = 1 + Math.sin(time * 4 + index * 0.5) * 0.15;
          const size = 2.5 * depthFactor * pulse;

          for (let ring = 3; ring >= 0; ring--) {
            const ringSize = size * (3 - ring * 0.6);
            const ringAlpha = (0.25 - ring * 0.05) * depthFactor;

            const nodeGlow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, ringSize);
            nodeGlow.addColorStop(0, `rgba(200, 240, 255, ${ringAlpha})`);
            nodeGlow.addColorStop(0.4, `rgba(100, 180, 255, ${ringAlpha * 0.5})`);
            nodeGlow.addColorStop(1, 'rgba(60, 120, 200, 0)');

            ctx.beginPath();
            ctx.arc(point.x, point.y, ringSize, 0, Math.PI * 2);
            ctx.fillStyle = nodeGlow;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(point.x, point.y, size * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${depthFactor * 0.9})`;
          ctx.fill();
        });
      }

      const isAnimating =
        (!isErasingRef.current && currentProgress < totalSegments) ||
        (isErasingRef.current && currentProgress > 0);

      if (isAnimating) {
        let fromIdx: number, toIdx: number;
        let fromPoint, toPoint;
        let actualSegmentProgress: number;

        if (isErasingRef.current) {
          const eraseSegment = Math.floor(currentProgress);
          actualSegmentProgress = currentProgress - eraseSegment;
          fromIdx = continuousPath[Math.min(eraseSegment + 1, continuousPath.length - 1)];
          toIdx = continuousPath[eraseSegment];

          if (fromIdx === -1 || toIdx === -1) {
            let validIdx = toIdx !== -1 ? toIdx : fromIdx;
            if (validIdx === -1) {
              for (let i = eraseSegment - 1; i >= 0; i--) {
                if (continuousPath[i] !== -1) {
                  validIdx = continuousPath[i];
                  break;
                }
              }
            }
            fromPoint = projectedPoints[validIdx];
            toPoint = projectedPoints[validIdx];
          } else {
            fromPoint = projectedPoints[fromIdx];
            toPoint = projectedPoints[toIdx];
          }
          actualSegmentProgress = 1 - actualSegmentProgress;
        } else {
          fromIdx = continuousPath[completedSegments];
          toIdx = continuousPath[Math.min(completedSegments + 1, continuousPath.length - 1)];

          if (fromIdx === -1 || toIdx === -1) {
            let validIdx = toIdx !== -1 ? toIdx : fromIdx;
            if (validIdx === -1) {
              for (let i = completedSegments + 2; i < continuousPath.length; i++) {
                if (continuousPath[i] !== -1) {
                  validIdx = continuousPath[i];
                  break;
                }
              }
            }
            fromPoint = projectedPoints[validIdx];
            toPoint = projectedPoints[validIdx];
          } else {
            fromPoint = projectedPoints[fromIdx];
            toPoint = projectedPoints[toIdx];
          }
          actualSegmentProgress = segmentProgress;
        }

        const starX = lerp(fromPoint.x, toPoint.x, actualSegmentProgress);
        const starY = lerp(fromPoint.y, toPoint.y, actualSegmentProgress);

        if (time % 0.02 < 0.016) {
          trailPointsRef.current.push({
            x: starX,
            y: starY,
            alpha: 1,
          });
        }

        const starPulse = 1 + Math.sin(time * 20) * 0.3;

        for (let i = 0; i < 3; i++) {
          const trailOffset = (i + 1) * 10;
          const dx = toPoint.x - fromPoint.x;
          const dy = toPoint.y - fromPoint.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const trailX = starX - (dx / len) * trailOffset;
          const trailY = starY - (dy / len) * trailOffset;
          const trailAlpha = 0.5 - i * 0.15;

          const trailGlow = ctx.createRadialGradient(trailX, trailY, 0, trailX, trailY, 18 - i * 4);
          trailGlow.addColorStop(0, `rgba(150, 220, 255, ${trailAlpha})`);
          trailGlow.addColorStop(0.5, `rgba(100, 180, 255, ${trailAlpha * 0.5})`);
          trailGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.arc(trailX, trailY, 18 - i * 4, 0, Math.PI * 2);
          ctx.fillStyle = trailGlow;
          ctx.fill();
        }

        for (let ring = 6; ring >= 0; ring--) {
          const ringSize = (50 - ring * 7) * starPulse;
          const ringAlpha = 0.4 - ring * 0.05;

          const starGlow = ctx.createRadialGradient(starX, starY, 0, starX, starY, ringSize);
          starGlow.addColorStop(0, `rgba(255, 255, 255, ${ringAlpha})`);
          starGlow.addColorStop(0.15, `rgba(200, 240, 255, ${ringAlpha * 0.8})`);
          starGlow.addColorStop(0.4, `rgba(100, 180, 255, ${ringAlpha * 0.4})`);
          starGlow.addColorStop(0.7, `rgba(60, 120, 200, ${ringAlpha * 0.2})`);
          starGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.arc(starX, starY, ringSize, 0, Math.PI * 2);
          ctx.fillStyle = starGlow;
          ctx.fill();
        }

        ctx.save();
        ctx.translate(starX, starY);
        ctx.rotate(time * 3);

        const rayLength = 30 * starPulse;
        const rayCount = 4;

        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2;
          ctx.save();
          ctx.rotate(angle);

          const rayGradient = ctx.createLinearGradient(0, 0, rayLength, 0);
          rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          rayGradient.addColorStop(0.3, 'rgba(150, 220, 255, 0.5)');
          rayGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(rayLength, -2.5);
          ctx.lineTo(rayLength * 1.2, 0);
          ctx.lineTo(rayLength, 2.5);
          ctx.closePath();
          ctx.fillStyle = rayGradient;
          ctx.fill();

          ctx.restore();
        }

        ctx.restore();

        ctx.beginPath();
        ctx.arc(starX, starY, 5 * starPulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fill();

        if (Math.random() < 0.8) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkSpeed = 2 + Math.random() * 4;
          particlesRef.current.push({
            x: starX,
            y: starY,
            vx: Math.cos(sparkAngle) * sparkSpeed,
            vy: Math.sin(sparkAngle) * sparkSpeed,
            life: 1,
            maxLife: 1,
            size: 0.8 + Math.random() * 2,
            hue: 200 + Math.random() * 20,
          });
        }
      }

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.97;
        particle.vy *= 0.97;
        particle.life -= 0.03;

        if (particle.life <= 0) return false;

        const alpha = Math.pow(particle.life, 2);
        const particleGlow = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 6
        );
        particleGlow.addColorStop(0, `hsla(${particle.hue}, 80%, 90%, ${alpha})`);
        particleGlow.addColorStop(0.4, `hsla(${particle.hue}, 70%, 70%, ${alpha * 0.5})`);
        particleGlow.addColorStop(1, `hsla(${particle.hue}, 60%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 6, 0, Math.PI * 2);
        ctx.fillStyle = particleGlow;
        ctx.fill();

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isSceneReady, isPlaying, onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      hasStartedRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      drawProgressRef.current = 0;
      timeRef.current = 0;
      particlesRef.current = [];
      trailPointsRef.current = [];
      isErasingRef.current = false;
      pauseTimerRef.current = 0;
      rotationAtCompleteRef.current = 0;
      waitingForRotationRef.current = false;
      manualRotationRef.current = { x: 0, y: 0 };
      zoomRef.current = 1;
      setIsPaused(false);
      isPausedRef.current = false;
      setIsFreeRotation(false);
      isFreeRotationRef.current = false;
      setIsAnimationComplete(false);
      isAnimationCompleteRef.current = false;
      setIsAutoRotating(true);
      isAutoRotatingRef.current = true;
      setIsMaterialized(false);
      isMaterializedRef.current = false;
    }
  }, [isPlaying]);

  const handleSpeedChange = (value: number) => {
    setSelectedSpeed(value);
    speedRef.current = value;
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    isPausedRef.current = !isPausedRef.current;
  };

  const toggleFreeRotation = () => {
    const newValue = !isFreeRotation;
    setIsFreeRotation(newValue);
    isFreeRotationRef.current = newValue;
    if (newValue) {
      manualRotationRef.current = { x: -0.12, y: 0 };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFreeRotationRef.current) return;
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !isFreeRotationRef.current) return;
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    manualRotationRef.current.y += deltaX * 0.01;
    manualRotationRef.current.x -= deltaY * 0.01;
    manualRotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, manualRotationRef.current.x));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const skipToEnd = () => {
    drawProgressRef.current = 999;
  };

  const restartAnimation = () => {
    drawProgressRef.current = 0;
    timeRef.current = 0;
    particlesRef.current = [];
    trailPointsRef.current = [];
    isErasingRef.current = false;
    pauseTimerRef.current = 0;
    rotationAtCompleteRef.current = 0;
    waitingForRotationRef.current = false;
    manualRotationRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    setIsPaused(false);
    isPausedRef.current = false;
    setIsFreeRotation(false);
    isFreeRotationRef.current = false;
    setIsAnimationComplete(false);
    isAnimationCompleteRef.current = false;
    setIsAutoRotating(true);
    isAutoRotatingRef.current = true;
    setIsMaterialized(false);
    isMaterializedRef.current = false;
  };

  const toggleAutoRotation = () => {
    const newValue = !isAutoRotating;
    setIsAutoRotating(newValue);
    isAutoRotatingRef.current = newValue;
  };

  const toggleMaterialization = () => {
    const newValue = !isMaterialized;
    setIsMaterialized(newValue);
    isMaterializedRef.current = newValue;
  };

  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: number) => {
    const clampedValue = Math.max(1, value);
    const newDimensions = { ...armoireDimensions, [dimension]: clampedValue };
    setArmoireDimensions(newDimensions);
    armoireDimensionsRef.current = newDimensions;
  };

  return (
    <div ref={containerRef} className="absolute inset-0 flex flex-col">
      {/* Top Toolbar - always visible */}
      <div
        className={`absolute inset-x-0 top-0 z-20 transition-all duration-500 ease-out ${
          isToolbarCollapsed ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="h-12 bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-transparent backdrop-blur-sm border-b border-cyan-500/20">
          <div className="h-full flex items-center justify-center gap-2 px-4">
            {onPlay && (
              <button
                onClick={onPlay}
                className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all duration-200 mr-3"
                title="Construire"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Hammer className="w-5 h-5 text-white" />
              </button>
            )}

            <div className="w-px h-6 bg-slate-600/50 mr-2" />

            <div className="flex items-center gap-1 mr-4">
              <div className={`w-2 h-2 rounded-full ${isAnimationComplete ? 'bg-red-500' : isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className={`text-[10px] font-mono uppercase tracking-wider ${isAnimationComplete ? 'text-red-400' : isPlaying ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isAnimationComplete ? 'Termine' : isPlaying ? 'Construction en cours' : 'En attente'}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setActivePanel(activePanel === 'armoireColor' ? null : 'armoireColor')}
                disabled={!isMaterialized}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  activePanel === 'armoireColor'
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    : isMaterialized
                      ? 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-cyan-400 hover:border-cyan-500/30'
                      : 'bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed'
                }`}
                title="Couleur de l'armoire"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Couleur</span>
                <div
                  className="w-4 h-4 rounded border border-white/20"
                  style={{ backgroundColor: `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})` }}
                />
              </button>

              {activePanel === 'armoireColor' && isMaterialized && (
                <div className="absolute top-full mt-2 left-0 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-4 shadow-2xl z-50 min-w-[260px]">
                  <div className="mb-4">
                    <span className="text-sm font-semibold text-cyan-400">Couleur de l'armoire</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                        Couleur
                      </label>

                      <input
                        ref={colorInputRef}
                        type="color"
                        value={rgbToHex(currentColor.r, currentColor.g, currentColor.b)}
                        onChange={(e) => {
                          const rgb = hexToRgb(e.target.value);
                          setCurrentColor(rgb);
                          currentColorRef.current = rgb;
                        }}
                        className="sr-only"
                      />

                      <button
                        onClick={() => colorInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors mb-3"
                      >
                        <Pipette className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-white">Pipette</span>
                        <div
                          className="ml-auto w-6 h-6 rounded border-2 border-white/20"
                          style={{ backgroundColor: `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})` }}
                        />
                      </button>

                      <div className="text-[10px] text-slate-500 mb-2">Couleur actuelle</div>
                      <div className="flex items-center gap-2 mb-4 px-2 py-1.5 rounded-lg bg-slate-900/50">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-white/20"
                          style={{ backgroundColor: `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})` }}
                        />
                        <span className="text-xs text-slate-300 font-mono">
                          {rgbToHex(currentColor.r, currentColor.g, currentColor.b).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] text-slate-500">Couleurs enregistrees (3 max)</div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const emptyIndex = savedColors.findIndex(c => c === null);
                              if (emptyIndex !== -1) {
                                const newSavedColors = [...savedColors];
                                newSavedColors[emptyIndex] = {
                                  ...currentColor,
                                  hex: rgbToHex(currentColor.r, currentColor.g, currentColor.b)
                                };
                                setSavedColors(newSavedColors);
                              }
                            }}
                            disabled={!savedColors.some(c => c === null)}
                            className={`p-1.5 rounded-lg transition-colors ${savedColors.some(c => c === null) ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400' : 'bg-slate-700/30 text-slate-600 cursor-not-allowed'}`}
                            title="Enregistrer la couleur actuelle"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSavedColors([null, null, null])}
                            disabled={!savedColors.some(c => c !== null)}
                            className={`p-1.5 rounded-lg transition-colors ${savedColors.some(c => c !== null) ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-slate-700/30 text-slate-600 cursor-not-allowed'}`}
                            title="Supprimer toutes les couleurs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {savedColors.map((savedColor, index) => (
                          <div key={index} className="relative group/slot">
                            {savedColor ? (
                              <button
                                onClick={() => {
                                  setCurrentColor({ r: savedColor.r, g: savedColor.g, b: savedColor.b });
                                  currentColorRef.current = { r: savedColor.r, g: savedColor.g, b: savedColor.b };
                                }}
                                className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-lg transition-all duration-200 hover:scale-110 hover:border-cyan-400"
                                style={{ backgroundColor: `rgb(${savedColor.r}, ${savedColor.g}, ${savedColor.b})` }}
                                title={savedColor.hex}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center"
                              >
                                <span className="text-slate-600 text-xs">{index + 1}</span>
                              </div>
                            )}
                            {savedColor && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSavedColors = [...savedColors];
                                  newSavedColors[index] = null;
                                  setSavedColors(newSavedColors);
                                }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentColor({ r: 200, g: 200, b: 200 });
                        currentColorRef.current = { r: 200, g: 200, b: 200 };
                      }}
                      className="w-full mt-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-cyan-500/30 rounded-lg text-xs text-slate-300 hover:text-cyan-400 transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reinitialiser</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setActivePanel(activePanel === 'dimension' ? null : 'dimension')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activePanel === 'dimension'
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-cyan-400'
                }`}
                title="Modifier les dimensions"
              >
                <Ruler className="w-4 h-4" />
                <span>Dimensions</span>
              </button>

              {activePanel === 'dimension' && (
                <div className="absolute top-full mt-2 left-0 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-4 shadow-2xl z-50 min-w-[220px]">
                  <div className="mb-4">
                    <span className="text-sm font-semibold text-cyan-400">Dimensions (cm)</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">
                        Longueur
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={dimensionInputs.length}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setDimensionInputs(prev => ({ ...prev, length: val }));
                          }}
                          onBlur={() => {
                            const val = parseInt(dimensionInputs.length);
                            if (!isNaN(val) && val > 0) {
                              handleDimensionChange('length', val);
                              setDimensionInputs(prev => ({ ...prev, length: val.toString() }));
                            } else {
                              setDimensionInputs(prev => ({ ...prev, length: armoireDimensions.length.toString() }));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white text-sm font-mono focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors text-center"
                          placeholder="60"
                        />
                        <span className="text-xs text-slate-500 font-mono w-6">cm</span>
                      </div>
                      <div className="text-[9px] text-slate-600 mt-1">0 = garder actuel</div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">
                        Largeur
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={dimensionInputs.width}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setDimensionInputs(prev => ({ ...prev, width: val }));
                          }}
                          onBlur={() => {
                            const val = parseInt(dimensionInputs.width);
                            if (!isNaN(val) && val > 0) {
                              handleDimensionChange('width', val);
                              setDimensionInputs(prev => ({ ...prev, width: val.toString() }));
                            } else {
                              setDimensionInputs(prev => ({ ...prev, width: armoireDimensions.width.toString() }));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white text-sm font-mono focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors text-center"
                          placeholder="140"
                        />
                        <span className="text-xs text-slate-500 font-mono w-6">cm</span>
                      </div>
                      <div className="text-[9px] text-slate-600 mt-1">0 = garder actuel</div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">
                        Hauteur
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={dimensionInputs.height}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setDimensionInputs(prev => ({ ...prev, height: val }));
                          }}
                          onBlur={() => {
                            const val = parseInt(dimensionInputs.height);
                            if (!isNaN(val) && val > 0) {
                              handleDimensionChange('height', val);
                              setDimensionInputs(prev => ({ ...prev, height: val.toString() }));
                            } else {
                              setDimensionInputs(prev => ({ ...prev, height: armoireDimensions.height.toString() }));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white text-sm font-mono focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors text-center"
                          placeholder="200"
                        />
                        <span className="text-xs text-slate-500 font-mono w-6">cm</span>
                      </div>
                      <div className="text-[9px] text-slate-600 mt-1">0 = garder actuel</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Dimensions actuelles:</span>
                      <span className="text-cyan-400 font-mono">
                        {armoireDimensions.length} x {armoireDimensions.width} x {armoireDimensions.height} cm
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-slate-500">En metres:</span>
                      <span className="text-slate-300 font-mono">
                        {(armoireDimensions.length / 100).toFixed(2)} x {(armoireDimensions.width / 100).toFixed(2)} x {(armoireDimensions.height / 100).toFixed(2)} m
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const defaultDimensions = { length: 140, width: 60, height: 200 };
                        setArmoireDimensions(defaultDimensions);
                        armoireDimensionsRef.current = defaultDimensions;
                        setDimensionInputs({ length: '140', width: '60', height: '200' });
                      }}
                      className="w-full mt-3 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-cyan-500/30 rounded-lg text-xs text-slate-300 hover:text-cyan-400 transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reinitialiser</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isAnimationComplete && isMaterialized && (
              <div className="relative">
                <button
                  onClick={() => setActivePanel(activePanel === 'exterior' ? null : 'exterior')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    activePanel === 'exterior'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-cyan-400 hover:border-cyan-500/30'
                  }`}
                  title="Traits exterieurs"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Exterieur</span>
                </button>

                {activePanel === 'exterior' && (
                  <div className="absolute top-full mt-2 left-0 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-4 shadow-2xl z-50 min-w-[260px]">
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-cyan-400">Traits exterieurs</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                          Couleur
                        </label>

                        <input
                          ref={exteriorColorInputRef}
                          type="color"
                          value={exteriorLineColor}
                          onChange={(e) => {
                            setExteriorLineColor(e.target.value);
                            exteriorLineColorRef.current = e.target.value;
                          }}
                          className="sr-only"
                        />

                        <button
                          onClick={() => exteriorColorInputRef.current?.click()}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors mb-3"
                        >
                          <Pipette className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-white">Pipette</span>
                          <div
                            className="ml-auto w-6 h-6 rounded border-2 border-white/20"
                            style={{ backgroundColor: exteriorLineColor }}
                          />
                        </button>

                        <div className="text-[10px] text-slate-500 mb-2">Couleur actuelle</div>
                        <div className="flex items-center gap-2 mb-4 px-2 py-1.5 rounded-lg bg-slate-900/50">
                          <div
                            className="w-8 h-8 rounded-lg border-2 border-white/20"
                            style={{ backgroundColor: exteriorLineColor }}
                          />
                          <span className="text-xs text-slate-300 font-mono">
                            {exteriorLineColor.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[10px] text-slate-500">Couleurs enregistrees (3 max)</div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const emptyIndex = exteriorSavedColors.findIndex(c => c === null);
                                if (emptyIndex !== -1) {
                                  const rgb = hexToRgb(exteriorLineColor);
                                  const newSavedColors = [...exteriorSavedColors];
                                  newSavedColors[emptyIndex] = {
                                    ...rgb,
                                    hex: exteriorLineColor
                                  };
                                  setExteriorSavedColors(newSavedColors);
                                }
                              }}
                              disabled={!exteriorSavedColors.some(c => c === null)}
                              className={`p-1.5 rounded-lg transition-colors ${exteriorSavedColors.some(c => c === null) ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400' : 'bg-slate-700/30 text-slate-600 cursor-not-allowed'}`}
                              title="Enregistrer la couleur actuelle"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setExteriorSavedColors([null, null, null])}
                              disabled={!exteriorSavedColors.some(c => c !== null)}
                              className={`p-1.5 rounded-lg transition-colors ${exteriorSavedColors.some(c => c !== null) ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-slate-700/30 text-slate-600 cursor-not-allowed'}`}
                              title="Supprimer toutes les couleurs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {exteriorSavedColors.map((savedColor, index) => (
                            <div key={index} className="relative group/slot">
                              {savedColor ? (
                                <button
                                  onClick={() => {
                                    setExteriorLineColor(savedColor.hex);
                                    exteriorLineColorRef.current = savedColor.hex;
                                  }}
                                  className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-lg transition-all duration-200 hover:scale-110 hover:border-cyan-400"
                                  style={{ backgroundColor: `rgb(${savedColor.r}, ${savedColor.g}, ${savedColor.b})` }}
                                  title={savedColor.hex}
                                />
                              ) : (
                                <div
                                  className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center"
                                >
                                  <span className="text-slate-600 text-xs">{index + 1}</span>
                                </div>
                              )}
                              {savedColor && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newSavedColors = [...exteriorSavedColors];
                                    newSavedColors[index] = null;
                                    setExteriorSavedColors(newSavedColors);
                                  }}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                          Epaisseur: {exteriorLineWidth}px
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0.5"
                            max="5"
                            step="0.5"
                            value={exteriorLineWidth}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setExteriorLineWidth(val);
                              exteriorLineWidthRef.current = val;
                            }}
                            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                          <input
                            type="text"
                            value={exteriorLineWidth}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0.5 && val <= 10) {
                                setExteriorLineWidth(val);
                                exteriorLineWidthRef.current = val;
                              }
                            }}
                            className="w-14 px-2 py-1 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white text-sm font-mono text-center focus:border-cyan-500/50 focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1">
                          <span>Fin</span>
                          <span>Epais</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setExteriorLineColor('#64748B');
                          exteriorLineColorRef.current = '#64748B';
                          setExteriorLineWidth(1);
                          exteriorLineWidthRef.current = 1;
                        }}
                        className="w-full mt-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-cyan-500/30 rounded-lg text-xs text-slate-300 hover:text-cyan-400 transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reinitialiser</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAnimationComplete && isMaterialized && (
              <div className="relative">
                <button
                  onClick={() => setActivePanel(activePanel === 'interior' ? null : 'interior')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    activePanel === 'interior'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-amber-400 hover:border-amber-500/30'
                  }`}
                  title="Traits interieurs"
                >
                  <Grid3x3 className="w-3.5 h-3.5" />
                  <span>Interieur</span>
                </button>

                {activePanel === 'interior' && (
                  <div className="absolute top-full mt-2 left-0 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-amber-500/30 p-4 shadow-2xl z-50 min-w-[260px]">
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-amber-400">Traits interieurs</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                          Couleur
                        </label>

                        <input
                          ref={interiorColorInputRef}
                          type="color"
                          value={interiorLineColor}
                          onChange={(e) => {
                            setInteriorLineColor(e.target.value);
                            interiorLineColorRef.current = e.target.value;
                          }}
                          className="sr-only"
                        />

                        <button
                          onClick={() => interiorColorInputRef.current?.click()}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors mb-3"
                        >
                          <Pipette className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-white">Pipette</span>
                          <div
                            className="ml-auto w-6 h-6 rounded border-2 border-white/20"
                            style={{ backgroundColor: interiorLineColor }}
                          />
                        </button>

                        <div className="text-[10px] text-slate-500 mb-2">Couleur actuelle</div>
                        <div className="flex items-center gap-2 mb-4 px-2 py-1.5 rounded-lg bg-slate-900/50">
                          <div
                            className="w-8 h-8 rounded-lg border-2 border-white/20"
                            style={{ backgroundColor: interiorLineColor }}
                          />
                          <span className="text-xs text-slate-300 font-mono">
                            {interiorLineColor.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[10px] text-slate-500">Couleurs enregistrees (3 max)</div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const emptyIndex = interiorSavedColors.findIndex(c => c === null);
                                if (emptyIndex !== -1) {
                                  const rgb = hexToRgb(interiorLineColor);
                                  const newSavedColors = [...interiorSavedColors];
                                  newSavedColors[emptyIndex] = {
                                    ...rgb,
                                    hex: interiorLineColor
                                  };
                                  setInteriorSavedColors(newSavedColors);
                                }
                              }}
                              disabled={!interiorSavedColors.some(c => c === null)}
                              className={`p-1.5 rounded-lg transition-colors ${interiorSavedColors.some(c => c === null) ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400' : 'bg-slate-700/30 text-slate-600 cursor-not-allowed'}`}
                              title="Enregistrer la couleur actuelle"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setInteriorSavedColors([null, null, null])}
                              disabled={!interiorSavedColors.some(c => c !== null)}
                              className={`p-1.5 rounded-lg transition-colors ${interiorSavedColors.some(c => c !== null) ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-slate-700/30 text-slate-600 cursor-not-allowed'}`}
                              title="Supprimer toutes les couleurs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {interiorSavedColors.map((savedColor, index) => (
                            <div key={index} className="relative group/slot">
                              {savedColor ? (
                                <button
                                  onClick={() => {
                                    setInteriorLineColor(savedColor.hex);
                                    interiorLineColorRef.current = savedColor.hex;
                                  }}
                                  className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-lg transition-all duration-200 hover:scale-110 hover:border-amber-400"
                                  style={{ backgroundColor: `rgb(${savedColor.r}, ${savedColor.g}, ${savedColor.b})` }}
                                  title={savedColor.hex}
                                />
                              ) : (
                                <div
                                  className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center"
                                >
                                  <span className="text-slate-600 text-xs">{index + 1}</span>
                                </div>
                              )}
                              {savedColor && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newSavedColors = [...interiorSavedColors];
                                    newSavedColors[index] = null;
                                    setInteriorSavedColors(newSavedColors);
                                  }}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                          Epaisseur: {interiorLineWidth}px
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0.5"
                            max="5"
                            step="0.5"
                            value={interiorLineWidth}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setInteriorLineWidth(val);
                              interiorLineWidthRef.current = val;
                            }}
                            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                          <input
                            type="text"
                            value={interiorLineWidth}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0.5 && val <= 10) {
                                setInteriorLineWidth(val);
                                interiorLineWidthRef.current = val;
                              }
                            }}
                            className="w-14 px-2 py-1 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white text-sm font-mono text-center focus:border-amber-500/50 focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1">
                          <span>Fin</span>
                          <span>Epais</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setInteriorLineColor('#6B7280');
                          interiorLineColorRef.current = '#6B7280';
                          setInteriorLineWidth(1);
                          interiorLineWidthRef.current = 1;
                        }}
                        className="w-full mt-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-amber-500/30 rounded-lg text-xs text-slate-300 hover:text-amber-400 transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reinitialiser</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setActivePanel(activePanel === 'background' ? null : 'background')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  activePanel === 'background'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-emerald-400 hover:border-emerald-500/30'
                }`}
                title="Arriere-plan"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Fond</span>
              </button>

              {activePanel === 'background' && (
                <div className="absolute top-full mt-2 left-0 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-emerald-500/30 p-4 shadow-2xl z-50 min-w-[260px]">
                  <div className="mb-4">
                    <span className="text-sm font-semibold text-emerald-400">Arriere-plan</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                        Couleur
                      </label>

                      <input
                        ref={backgroundColorInputRef}
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => {
                          setBackgroundColor(e.target.value);
                          backgroundColorRef.current = e.target.value;
                        }}
                        className="sr-only"
                      />

                      <button
                        onClick={() => backgroundColorInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors mb-3"
                      >
                        <Pipette className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-white">Pipette</span>
                        <div
                          className="ml-auto w-6 h-6 rounded border-2 border-white/20"
                          style={{ backgroundColor: backgroundColor }}
                        />
                      </button>

                      <div className="text-[10px] text-slate-500 mb-2">Couleur actuelle</div>
                      <div className="flex items-center gap-2 mb-4 px-2 py-1.5 rounded-lg bg-slate-900/50">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-white/20"
                          style={{ backgroundColor: backgroundColor }}
                        />
                        <span className="text-xs text-slate-300 font-mono">
                          {backgroundColor.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] text-slate-500">Couleurs enregistrees (3 max)</div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const emptyIndex = backgroundSavedColors.findIndex(c => c === null);
                              if (emptyIndex !== -1) {
                                const rgb = hexToRgb(backgroundColor);
                                const newSavedColors = [...backgroundSavedColors];
                                newSavedColors[emptyIndex] = {
                                  ...rgb,
                                  hex: backgroundColor
                                };
                                setBackgroundSavedColors(newSavedColors);
                              }
                            }}
                            disabled={!backgroundSavedColors.some(c => c === null)}
                            className={`p-1.5 rounded-lg transition-colors ${backgroundSavedColors.some(c => c === null) ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400' : 'bg-slate-700/30 text-slate-600 cursor-not-allowed'}`}
                            title="Enregistrer la couleur actuelle"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setBackgroundSavedColors([null, null, null])}
                            disabled={!backgroundSavedColors.some(c => c !== null)}
                            className={`p-1.5 rounded-lg transition-colors ${backgroundSavedColors.some(c => c !== null) ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-slate-700/30 text-slate-600 cursor-not-allowed'}`}
                            title="Supprimer toutes les couleurs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {backgroundSavedColors.map((savedColor, index) => (
                          <div key={index} className="relative group/slot">
                            {savedColor ? (
                              <button
                                onClick={() => {
                                  setBackgroundColor(savedColor.hex);
                                  backgroundColorRef.current = savedColor.hex;
                                }}
                                className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-lg transition-all duration-200 hover:scale-110 hover:border-emerald-400"
                                style={{ backgroundColor: `rgb(${savedColor.r}, ${savedColor.g}, ${savedColor.b})` }}
                                title={savedColor.hex}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center"
                              >
                                <span className="text-slate-600 text-xs">{index + 1}</span>
                              </div>
                            )}
                            {savedColor && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSavedColors = [...backgroundSavedColors];
                                  newSavedColors[index] = null;
                                  setBackgroundSavedColors(newSavedColors);
                                }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setBackgroundColor('#050a15');
                        backgroundColorRef.current = '#050a15';
                      }}
                      className="w-full mt-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-emerald-500/30 rounded-lg text-xs text-slate-300 hover:text-emerald-400 transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reinitialiser</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">
                {isMaterialized ? 'Mode Solid' : 'Mode Wireframe'}
              </span>
              <div
                className="w-3 h-3 rounded border border-white/30"
                style={{ backgroundColor: `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toggle button for toolbar */}
      <button
        onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
        className={`absolute z-30 left-1/2 -translate-x-1/2 transition-all duration-500 ${
          isToolbarCollapsed ? 'top-0' : 'top-12'
        }`}
      >
        <div className="flex items-center gap-1 px-3 py-1 bg-slate-800/90 backdrop-blur-sm rounded-b-lg border border-t-0 border-cyan-500/30 hover:border-cyan-400/50 transition-colors group">
          {isToolbarCollapsed ? (
            <ChevronDown className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
          ) : (
            <ChevronUp className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
          )}
          <span className="text-[10px] text-cyan-400/70 group-hover:text-cyan-300 font-mono">
            {isToolbarCollapsed ? 'Outils' : 'Reduire'}
          </span>
        </div>
      </button>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden" style={{ background: backgroundColor }}>
        <canvas
          ref={canvasRef}
          className={`${isFreeRotation ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ background: backgroundColor }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {!isSceneReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="text-cyan-400 font-mono">Loading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Toggle button for bottom bar */}
      <button
        onClick={() => setIsBottomBarCollapsed(!isBottomBarCollapsed)}
        className={`absolute z-30 left-1/2 -translate-x-1/2 transition-all duration-500 ${
          isBottomBarCollapsed ? 'bottom-0' : 'bottom-14'
        }`}
      >
        <div className="flex items-center gap-1 px-3 py-1 bg-slate-800/90 backdrop-blur-sm rounded-t-lg border border-b-0 border-cyan-500/30 hover:border-cyan-400/50 transition-colors group">
          {isBottomBarCollapsed ? (
            <ChevronUp className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
          )}
          <span className="text-[10px] text-cyan-400/70 group-hover:text-cyan-300 font-mono">
            {isBottomBarCollapsed ? 'Controles' : 'Reduire'}
          </span>
        </div>
      </button>

      {/* Bottom Bar - positioned absolutely */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 transition-all duration-500 ease-out ${
          isBottomBarCollapsed ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="h-14 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 border-t border-cyan-500/30 flex items-center justify-center gap-2 px-4">
          <span className="text-cyan-400/70 text-xs font-mono mr-2">VITESSE</span>
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSpeedChange(option.value)}
              className={`
                px-4 py-2 rounded font-mono text-sm font-semibold transition-all duration-200
                ${selectedSpeed === option.value
                  ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/40'
                  : 'bg-slate-700/50 text-cyan-400 hover:bg-slate-600/50 border border-cyan-500/30 hover:border-cyan-400/50'
                }
              `}
            >
              {option.label}
            </button>
          ))}

          <div className="w-px h-8 bg-cyan-500/30 mx-3" />

          <button
            onClick={restartAnimation}
            className="p-2 rounded-lg font-mono text-sm font-semibold transition-all duration-200 mr-2 bg-slate-700/50 text-cyan-400 hover:bg-slate-600/50 border border-cyan-500/30 hover:border-cyan-400/50"
            title="Relancer l'animation"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={skipToEnd}
            className="p-2 rounded-lg font-mono text-sm font-semibold transition-all duration-200 mr-2 bg-slate-700/50 text-cyan-400 hover:bg-slate-600/50 border border-cyan-500/30 hover:border-cyan-400/50"
            title="Aller a la fin"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={toggleAutoRotation}
            className={`
              p-2 rounded-lg font-mono text-sm font-semibold transition-all duration-200 mr-2
              ${isAutoRotating
                ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/40 hover:bg-cyan-400'
                : 'bg-slate-700/50 text-cyan-400 hover:bg-slate-600/50 border border-cyan-500/30 hover:border-cyan-400/50'
              }
            `}
            title={isAutoRotating ? 'Arreter le pivotement' : 'Activer le pivotement'}
          >
            <RotateCcw className={`w-5 h-5 ${isAutoRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          </button>

          <button
            onClick={toggleFreeRotation}
            className={`
              p-2 rounded-lg font-mono text-sm font-semibold transition-all duration-200 mr-2
              ${isFreeRotation
                ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/40 hover:bg-cyan-400'
                : 'bg-slate-700/50 text-cyan-400 hover:bg-slate-600/50 border border-cyan-500/30 hover:border-cyan-400/50'
              }
            `}
            title={isFreeRotation ? 'Desactiver rotation libre' : 'Activer rotation libre'}
          >
            <Rotate3d className={`w-5 h-5 ${isFreeRotation ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          </button>

          <button
            onClick={togglePause}
            className={`
              p-2 rounded-lg font-mono text-sm font-semibold transition-all duration-200
              ${isPaused
                ? 'bg-green-500 text-slate-900 shadow-lg shadow-green-500/40 hover:bg-green-400'
                : 'bg-orange-500 text-slate-900 shadow-lg shadow-orange-500/40 hover:bg-orange-400'
              }
            `}
            title={isPaused ? 'Reprendre' : 'Pause'}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>

          <div className="ml-auto pl-6 border-l border-cyan-500/20 flex items-center gap-3">
            <button
              onClick={toggleMaterialization}
              disabled={!isAnimationComplete}
              className={`group relative px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 overflow-hidden ${isMaterialized ? 'ring-2 ring-white/50' : ''} ${!isAnimationComplete ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${!isAnimationComplete ? 'from-gray-500 via-gray-600 to-gray-500' : isMaterialized ? 'from-white via-gray-200 to-white' : 'from-cyan-500 via-blue-500 to-cyan-500'} opacity-90 ${isAnimationComplete ? 'group-hover:opacity-100' : ''} transition-opacity`} />
              <div className={`absolute inset-0 bg-gradient-to-r ${!isAnimationComplete ? 'from-gray-500 via-gray-600 to-gray-500' : isMaterialized ? 'from-white via-gray-200 to-white' : 'from-cyan-400 via-blue-400 to-cyan-400'} opacity-0 ${isAnimationComplete ? 'group-hover:opacity-100' : ''} blur-xl transition-opacity`} />
              <div className={`absolute inset-[1px] ${isMaterialized ? 'bg-slate-800/90' : 'bg-slate-900/80'} rounded-[10px] ${isAnimationComplete ? 'group-hover:bg-slate-900/60' : ''} transition-colors`} />
              <div className={`relative flex items-center gap-2.5 ${!isAnimationComplete ? 'text-gray-400' : isMaterialized ? 'text-white' : 'text-cyan-100'} ${isAnimationComplete ? 'group-hover:text-white' : ''} transition-colors`}>
                <Box className={`w-4 h-4 transition-transform duration-300 ${isMaterialized ? 'rotate-12' : isAnimationComplete ? 'group-hover:rotate-12' : ''}`} />
                <span className="tracking-wide">{isMaterialized ? 'Retour Wireframe' : 'Materialiser l\'objet'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Animation3DViewer;
