import React, { useRef, useEffect, useState } from 'react';
import { Loader2, Pause, Play, Box, Rotate3d, SkipForward, RefreshCw, RotateCcw, Pipette, Plus, X, Save, Trash2 } from 'lucide-react';

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
}

const SPEED_OPTIONS = [
  { label: 'x1', value: 1 },
  { label: 'x2', value: 2 },
  { label: 'x4', value: 4 },
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

const Animation3DViewer: React.FC<Animation3DViewerProps> = ({
  isPlaying,
  onComplete,
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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
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

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    setIsSceneReady(true);

    return () => {
      window.removeEventListener('resize', updateDimensions);
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
  }, [dimensions]);

  useEffect(() => {
    if (!isSceneReady || !isPlaying || hasStartedRef.current) return;
    if (dimensions.width === 0 || dimensions.height === 0) return;

    hasStartedRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseScale = Math.min(width, height) * 0.28;

    const armoirePoints: Point3D[] = [
      // Structure principale - cadre exterieur (0-7)
      { x: -0.7, y: -0.9, z: -0.3 },  // 0: bas avant gauche
      { x: 0.7, y: -0.9, z: -0.3 },   // 1: bas avant droit
      { x: 0.7, y: -0.9, z: 0.3 },    // 2: bas arriere droit
      { x: -0.7, y: -0.9, z: 0.3 },   // 3: bas arriere gauche
      { x: -0.7, y: 0.9, z: -0.3 },   // 4: haut avant gauche
      { x: 0.7, y: 0.9, z: -0.3 },    // 5: haut avant droit
      { x: 0.7, y: 0.9, z: 0.3 },     // 6: haut arriere droit
      { x: -0.7, y: 0.9, z: 0.3 },    // 7: haut arriere gauche

      // Corniche haute (8-15)
      { x: -0.75, y: 0.9, z: -0.35 },  // 8
      { x: 0.75, y: 0.9, z: -0.35 },   // 9
      { x: 0.75, y: 0.9, z: 0.35 },    // 10
      { x: -0.75, y: 0.9, z: 0.35 },   // 11
      { x: -0.75, y: 0.95, z: -0.35 }, // 12
      { x: 0.75, y: 0.95, z: -0.35 },  // 13
      { x: 0.75, y: 0.95, z: 0.35 },   // 14
      { x: -0.75, y: 0.95, z: 0.35 },  // 15

      // Plinthe basse (16-23)
      { x: -0.72, y: -0.9, z: -0.32 },  // 16
      { x: 0.72, y: -0.9, z: -0.32 },   // 17
      { x: 0.72, y: -0.9, z: 0.32 },    // 18
      { x: -0.72, y: -0.9, z: 0.32 },   // 19
      { x: -0.72, y: -0.95, z: -0.32 }, // 20
      { x: 0.72, y: -0.95, z: -0.32 },  // 21
      { x: 0.72, y: -0.95, z: 0.32 },   // 22
      { x: -0.72, y: -0.95, z: 0.32 },  // 23

      // Pieds (24-31)
      { x: -0.65, y: -0.95, z: -0.25 }, // 24
      { x: -0.65, y: -1.0, z: -0.25 },  // 25
      { x: 0.65, y: -0.95, z: -0.25 },  // 26
      { x: 0.65, y: -1.0, z: -0.25 },   // 27
      { x: -0.65, y: -0.95, z: 0.25 },  // 28
      { x: -0.65, y: -1.0, z: 0.25 },   // 29
      { x: 0.65, y: -0.95, z: 0.25 },   // 30
      { x: 0.65, y: -1.0, z: 0.25 },    // 31

      // Separation centrale verticale (32-35)
      { x: 0.0, y: 0.87, z: -0.29 },   // 32
      { x: 0.0, y: -0.87, z: -0.29 },  // 33
      { x: 0.0, y: 0.87, z: 0.29 },    // 34
      { x: 0.0, y: -0.87, z: 0.29 },   // 35

      // Etagere haute interieur gauche (36-39)
      { x: -0.67, y: 0.4, z: -0.28 },  // 36
      { x: -0.03, y: 0.4, z: -0.28 },  // 37
      { x: -0.03, y: 0.4, z: 0.28 },   // 38
      { x: -0.67, y: 0.4, z: 0.28 },   // 39

      // Etagere haute interieur droite (40-43)
      { x: 0.03, y: 0.4, z: -0.28 },   // 40
      { x: 0.67, y: 0.4, z: -0.28 },   // 41
      { x: 0.67, y: 0.4, z: 0.28 },    // 42
      { x: 0.03, y: 0.4, z: 0.28 },    // 43

      // Etagere basse interieur gauche (44-47)
      { x: -0.67, y: -0.2, z: -0.28 }, // 44
      { x: -0.03, y: -0.2, z: -0.28 }, // 45
      { x: -0.03, y: -0.2, z: 0.28 },  // 46
      { x: -0.67, y: -0.2, z: 0.28 },  // 47

      // Etagere basse interieur droite (48-51)
      { x: 0.03, y: -0.2, z: -0.28 },  // 48
      { x: 0.67, y: -0.2, z: -0.28 },  // 49
      { x: 0.67, y: -0.2, z: 0.28 },   // 50
      { x: 0.03, y: -0.2, z: 0.28 },   // 51

      // Porte gauche - cadre (52-55)
      { x: -0.67, y: 0.87, z: -0.30 },  // 52
      { x: -0.03, y: 0.87, z: -0.30 },  // 53
      { x: -0.03, y: -0.87, z: -0.30 }, // 54
      { x: -0.67, y: -0.87, z: -0.30 }, // 55

      // Porte gauche - panneau decoratif haut (56-59)
      { x: -0.63, y: 0.80, z: -0.31 },  // 56
      { x: -0.07, y: 0.80, z: -0.31 },  // 57
      { x: -0.07, y: 0.20, z: -0.31 },  // 58
      { x: -0.63, y: 0.20, z: -0.31 },  // 59

      // Porte gauche - panneau decoratif bas (60-63)
      { x: -0.63, y: 0.10, z: -0.31 },  // 60
      { x: -0.07, y: 0.10, z: -0.31 },  // 61
      { x: -0.07, y: -0.80, z: -0.31 }, // 62
      { x: -0.63, y: -0.80, z: -0.31 }, // 63

      // Porte droite - cadre (64-67)
      { x: 0.03, y: 0.87, z: -0.30 },   // 64
      { x: 0.67, y: 0.87, z: -0.30 },   // 65
      { x: 0.67, y: -0.87, z: -0.30 },  // 66
      { x: 0.03, y: -0.87, z: -0.30 },  // 67

      // Porte droite - panneau decoratif haut (68-71)
      { x: 0.07, y: 0.80, z: -0.31 },   // 68
      { x: 0.63, y: 0.80, z: -0.31 },   // 69
      { x: 0.63, y: 0.20, z: -0.31 },   // 70
      { x: 0.07, y: 0.20, z: -0.31 },   // 71

      // Porte droite - panneau decoratif bas (72-75)
      { x: 0.07, y: 0.10, z: -0.31 },   // 72
      { x: 0.63, y: 0.10, z: -0.31 },   // 73
      { x: 0.63, y: -0.80, z: -0.31 },  // 74
      { x: 0.07, y: -0.80, z: -0.31 },  // 75

      // Poignee porte gauche (76-79)
      { x: -0.10, y: 0.10, z: -0.33 },  // 76
      { x: -0.10, y: -0.10, z: -0.33 }, // 77
      { x: -0.08, y: 0.10, z: -0.35 },  // 78
      { x: -0.08, y: -0.10, z: -0.35 }, // 79

      // Poignee porte droite (80-83)
      { x: 0.10, y: 0.10, z: -0.33 },   // 80
      { x: 0.10, y: -0.10, z: -0.33 },  // 81
      { x: 0.08, y: 0.10, z: -0.35 },   // 82
      { x: 0.08, y: -0.10, z: -0.35 },  // 83

      // Panneau lateral gauche interieur (84-87)
      { x: -0.68, y: 0.88, z: -0.29 },  // 84
      { x: -0.68, y: 0.88, z: 0.29 },   // 85
      { x: -0.68, y: -0.88, z: 0.29 },  // 86
      { x: -0.68, y: -0.88, z: -0.29 }, // 87

      // Panneau lateral droit interieur (88-91)
      { x: 0.68, y: 0.88, z: -0.29 },   // 88
      { x: 0.68, y: 0.88, z: 0.29 },    // 89
      { x: 0.68, y: -0.88, z: 0.29 },   // 90
      { x: 0.68, y: -0.88, z: -0.29 },  // 91

      // Fond armoire (92-95)
      { x: -0.69, y: 0.88, z: 0.29 },   // 92
      { x: 0.69, y: 0.88, z: 0.29 },    // 93
      { x: 0.69, y: -0.88, z: 0.29 },   // 94
      { x: -0.69, y: -0.88, z: 0.29 },  // 95

      // Tringle vetements gauche (96-97)
      { x: -0.60, y: 0.75, z: -0.20 },  // 96
      { x: -0.60, y: 0.75, z: 0.20 },   // 97

      // Tringle vetements droite (98-99)
      { x: 0.60, y: 0.75, z: -0.20 },   // 98
      { x: 0.60, y: 0.75, z: 0.20 },    // 99
    ];

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

    const project = (point: Point3D, currentScale: number): { x: number; y: number; depth: number } => {
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

      const speedMultiplier = speedRef.current;
      timeRef.current += 0.004 * speedMultiplier;
      const time = timeRef.current;

      ctx.fillStyle = '#050a15';
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

      const transformedPoints = armoirePoints.map((point) => {
        const rotatedY = rotateY(point, baseRotationY);
        const rotatedXY = rotateX(rotatedY, baseRotationX);
        return rotatedXY;
      });

      const projectedPoints = transformedPoints.map((point) => project(point, currentScale));

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

        ctx.strokeStyle = 'rgba(100, 100, 110, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        let isFirstPoint = true;

        for (let i = 0; i < continuousPath.length; i++) {
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
  }, [isSceneReady, isPlaying, dimensions, onComplete]);

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

  return (
    <div ref={containerRef} className="absolute inset-0 flex flex-col">
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height - 56}
          className={`absolute inset-0 ${isFreeRotation ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ background: '#050a15' }}
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
          <div className="relative">
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
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={!isMaterialized}
              className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${!isMaterialized ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-700/50'} bg-slate-800/80 border border-slate-600/50`}
              title="Selecteur de couleur"
            >
              <div
                className="w-6 h-6 rounded-lg border-2 border-white/30 shadow-inner"
                style={{ backgroundColor: `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})` }}
              />
            </button>

            {showColorPicker && isMaterialized && (
              <div className="absolute bottom-full mb-2 right-0 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-600/50 p-4 shadow-2xl z-50 min-w-[200px]">
                <div className="text-xs text-slate-400 mb-3 font-medium">Selecteur de couleur</div>

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
            )}
          </div>

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
  );
};

export default Animation3DViewer;
