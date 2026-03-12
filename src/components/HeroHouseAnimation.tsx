import React, { useRef, useEffect } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: { r: number; g: number; b: number };
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
  type: 'spark' | 'trail' | 'glow';
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  color: { r: number; g: number; b: number; a: number };
  drift: number;
  driftSpeed: number;
}

interface HeroHouseAnimationProps {
  width: number;
  height: number;
  mouseX: number;
  mouseY: number;
}

const HeroHouseAnimation: React.FC<HeroHouseAnimationProps> = ({ width, height, mouseX, mouseY }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: width / 2, y: height / 2 });
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nebulaCloudsRef = useRef<NebulaCloud[]>([]);
  const drawProgressRef = useRef(0);
  const initializedRef = useRef(false);
  const shootingStarPosRef = useRef({ x: 0, y: 0 });
  const trailPointsRef = useRef<Array<{ x: number; y: number; alpha: number; time: number }>>([]);
  const isErasingRef = useRef(false);
  const pauseTimerRef = useRef(0);
  const rotationAtCompleteRef = useRef(0);
  const waitingForRotationRef = useRef(false);

  useEffect(() => {
    mouseRef.current = { x: mouseX, y: mouseY };
  }, [mouseX, mouseY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.22;

    if (!initializedRef.current) {
      initializedRef.current = true;

      starsRef.current = Array.from({ length: 300 }, () => {
        const color = { r: 255, g: 255, b: 255 };

        return {
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.pow(Math.random(), 3) * 1.2 + 0.2,
          brightness: Math.random() * 0.5 + 0.3,
          twinkleSpeed: Math.random() * 2 + 0.5,
          twinkleOffset: Math.random() * Math.PI * 2,
          color
        };
      });

      nebulaCloudsRef.current = [
        { x: width * 0.15, y: height * 0.3, radius: width * 0.5, color: { r: 15, g: 25, b: 45, a: 0.12 }, drift: 0, driftSpeed: 0.0003 },
        { x: width * 0.7, y: height * 0.6, radius: width * 0.45, color: { r: 25, g: 15, b: 40, a: 0.10 }, drift: Math.PI, driftSpeed: 0.0004 },
        { x: width * 0.5, y: height * 0.4, radius: width * 0.6, color: { r: 10, g: 20, b: 50, a: 0.08 }, drift: Math.PI / 2, driftSpeed: 0.0002 },
        { x: width * 0.2, y: height * 0.7, radius: width * 0.4, color: { r: 20, g: 10, b: 35, a: 0.10 }, drift: Math.PI * 1.5, driftSpeed: 0.0005 },
        { x: width * 0.8, y: height * 0.2, radius: width * 0.35, color: { r: 30, g: 20, b: 55, a: 0.09 }, drift: Math.PI * 0.7, driftSpeed: 0.0003 },
        { x: width * 0.4, y: height * 0.8, radius: width * 0.45, color: { r: 5, g: 15, b: 40, a: 0.11 }, drift: Math.PI * 1.2, driftSpeed: 0.0004 },
        { x: width * 0.9, y: height * 0.5, radius: width * 0.3, color: { r: 35, g: 15, b: 50, a: 0.08 }, drift: Math.PI * 0.3, driftSpeed: 0.0005 },
        { x: width * 0.1, y: height * 0.5, radius: width * 0.35, color: { r: 10, g: 25, b: 55, a: 0.10 }, drift: Math.PI * 1.8, driftSpeed: 0.0003 },
      ];

      drawProgressRef.current = 0;
      particlesRef.current = [];
      trailPointsRef.current = [];
      shootingStarPosRef.current = { x: 0, y: 0 };
      isErasingRef.current = false;
      pauseTimerRef.current = 0;
      rotationAtCompleteRef.current = 0;
      waitingForRotationRef.current = false;
    }

    const livingRoomPoints: Point3D[] = [
      { x: -1.3, y: 0.5, z: -1.0 },
      { x: 1.3, y: 0.5, z: -1.0 },
      { x: 1.3, y: 0.5, z: 1.0 },
      { x: -1.3, y: 0.5, z: 1.0 },
      { x: -1.3, y: -0.5, z: -1.0 },
      { x: 1.3, y: -0.5, z: -1.0 },
      { x: 1.3, y: -0.5, z: 1.0 },
      { x: -1.3, y: -0.5, z: 1.0 },

      // ===== LIT REALISTE (zone 2, tete contre mur droit x=1.3) =====
      // Pied avant-gauche (8-15)
      { x: 0.35, y: 0.50, z: -0.95 },
      { x: 0.41, y: 0.50, z: -0.95 },
      { x: 0.41, y: 0.50, z: -0.89 },
      { x: 0.35, y: 0.50, z: -0.89 },
      { x: 0.35, y: 0.32, z: -0.95 },
      { x: 0.41, y: 0.32, z: -0.95 },
      { x: 0.41, y: 0.32, z: -0.89 },
      { x: 0.35, y: 0.32, z: -0.89 },
      // Pied avant-droit (16-23)
      { x: 0.35, y: 0.50, z: -0.41 },
      { x: 0.41, y: 0.50, z: -0.41 },
      { x: 0.41, y: 0.50, z: -0.35 },
      { x: 0.35, y: 0.50, z: -0.35 },
      { x: 0.35, y: 0.32, z: -0.41 },
      { x: 0.41, y: 0.32, z: -0.41 },
      { x: 0.41, y: 0.32, z: -0.35 },
      { x: 0.35, y: 0.32, z: -0.35 },
      // Pied arriere-gauche (24-31)
      { x: 1.19, y: 0.50, z: -0.95 },
      { x: 1.25, y: 0.50, z: -0.95 },
      { x: 1.25, y: 0.50, z: -0.89 },
      { x: 1.19, y: 0.50, z: -0.89 },
      { x: 1.19, y: 0.32, z: -0.95 },
      { x: 1.25, y: 0.32, z: -0.95 },
      { x: 1.25, y: 0.32, z: -0.89 },
      { x: 1.19, y: 0.32, z: -0.89 },
      // Pied arriere-droit (32-39)
      { x: 1.19, y: 0.50, z: -0.41 },
      { x: 1.25, y: 0.50, z: -0.41 },
      { x: 1.25, y: 0.50, z: -0.35 },
      { x: 1.19, y: 0.50, z: -0.35 },
      { x: 1.19, y: 0.32, z: -0.41 },
      { x: 1.25, y: 0.32, z: -0.41 },
      { x: 1.25, y: 0.32, z: -0.35 },
      { x: 1.19, y: 0.32, z: -0.35 },
      // Sommier - cadre exterieur (40-47)
      { x: 0.33, y: 0.32, z: -0.97 },
      { x: 1.27, y: 0.32, z: -0.97 },
      { x: 1.27, y: 0.32, z: -0.33 },
      { x: 0.33, y: 0.32, z: -0.33 },
      { x: 0.33, y: 0.28, z: -0.97 },
      { x: 1.27, y: 0.28, z: -0.97 },
      { x: 1.27, y: 0.28, z: -0.33 },
      { x: 0.33, y: 0.28, z: -0.33 },
      // Lattes du sommier (48-63)
      { x: 0.38, y: 0.30, z: -0.92 },
      { x: 1.22, y: 0.30, z: -0.92 },
      { x: 0.38, y: 0.30, z: -0.79 },
      { x: 1.22, y: 0.30, z: -0.79 },
      { x: 0.38, y: 0.30, z: -0.66 },
      { x: 1.22, y: 0.30, z: -0.66 },
      { x: 0.38, y: 0.30, z: -0.53 },
      { x: 1.22, y: 0.30, z: -0.53 },
      { x: 0.38, y: 0.30, z: -0.40 },
      { x: 1.22, y: 0.30, z: -0.40 },
      // Renforts lateraux sommier (58-61)
      { x: 0.38, y: 0.30, z: -0.92 },
      { x: 0.38, y: 0.30, z: -0.38 },
      { x: 1.22, y: 0.30, z: -0.92 },
      { x: 1.22, y: 0.30, z: -0.38 },
      // Matelas (62-69)
      { x: 0.34, y: 0.28, z: -0.96 },
      { x: 1.26, y: 0.28, z: -0.96 },
      { x: 1.26, y: 0.28, z: -0.34 },
      { x: 0.34, y: 0.28, z: -0.34 },
      { x: 0.34, y: 0.18, z: -0.96 },
      { x: 1.26, y: 0.18, z: -0.96 },
      { x: 1.26, y: 0.18, z: -0.34 },
      { x: 0.34, y: 0.18, z: -0.34 },

      // ===== ARMOIRE REALISTE (coin arriere-droit, mur arriere z=1.0) =====
      // Structure principale - cadre exterieur (70-77)
      { x: 0.55, y: 0.5, z: 0.97 },
      { x: 1.25, y: 0.5, z: 0.97 },
      { x: 1.25, y: -0.35, z: 0.97 },
      { x: 0.55, y: -0.35, z: 0.97 },
      { x: 0.55, y: 0.5, z: 0.55 },
      { x: 1.25, y: 0.5, z: 0.55 },
      { x: 1.25, y: -0.35, z: 0.55 },
      { x: 0.55, y: -0.35, z: 0.55 },
      // Separation centrale verticale (78-79)
      { x: 0.90, y: 0.47, z: 0.55 },
      { x: 0.90, y: -0.32, z: 0.55 },
      // Etagere haute (80-81)
      { x: 0.58, y: 0.20, z: 0.55 },
      { x: 1.22, y: 0.20, z: 0.55 },
      // Porte gauche - cadre (82-85)
      { x: 0.58, y: 0.47, z: 0.55 },
      { x: 0.87, y: 0.47, z: 0.55 },
      { x: 0.87, y: -0.32, z: 0.55 },
      { x: 0.58, y: -0.32, z: 0.55 },
      // Porte gauche - panneau decoratif haut (86-89)
      { x: 0.61, y: 0.44, z: 0.55 },
      { x: 0.84, y: 0.44, z: 0.55 },
      { x: 0.84, y: 0.23, z: 0.55 },
      { x: 0.61, y: 0.23, z: 0.55 },
      // Porte gauche - panneau decoratif bas (90-93)
      { x: 0.61, y: 0.17, z: 0.55 },
      { x: 0.84, y: 0.17, z: 0.55 },
      { x: 0.84, y: -0.29, z: 0.55 },
      { x: 0.61, y: -0.29, z: 0.55 },
      // Porte droite - cadre (94-97) - REMPLACE fenetres
      { x: 0.93, y: 0.47, z: 0.55 },
      { x: 1.22, y: 0.47, z: 0.55 },
      { x: 1.22, y: -0.32, z: 0.55 },
      { x: 0.93, y: -0.32, z: 0.55 },
      // Porte droite - panneau decoratif haut (98-101)
      { x: 0.96, y: 0.44, z: 0.55 },
      { x: 1.19, y: 0.44, z: 0.55 },
      { x: 1.19, y: 0.23, z: 0.55 },
      { x: 0.96, y: 0.23, z: 0.55 },
      // Porte droite - panneau decoratif bas (102-105)
      { x: 0.96, y: 0.17, z: 0.55 },
      { x: 1.19, y: 0.17, z: 0.55 },
      { x: 1.19, y: -0.29, z: 0.55 },
      { x: 0.96, y: -0.29, z: 0.55 },
      // Poignee porte gauche (106-107) - verticale
      { x: 0.82, y: 0.10, z: 0.54 },
      { x: 0.82, y: -0.05, z: 0.54 },
      // Poignee porte droite (108-109)
      { x: 0.98, y: 0.10, z: 0.54 },
      { x: 0.98, y: -0.05, z: 0.54 },
      // Corniche haute (110-113)
      { x: 0.53, y: 0.50, z: 0.98 },
      { x: 1.27, y: 0.50, z: 0.98 },
      { x: 1.27, y: 0.50, z: 0.53 },
      { x: 0.53, y: 0.50, z: 0.53 },
      // Plinthe basse (114-117)
      { x: 0.53, y: -0.35, z: 0.98 },
      { x: 1.27, y: -0.35, z: 0.98 },
      { x: 1.27, y: -0.35, z: 0.53 },
      { x: 0.53, y: -0.35, z: 0.53 },
      // Pieds armoire - avant gauche (118-119)
      { x: 0.57, y: -0.35, z: 0.57 },
      { x: 0.57, y: -0.40, z: 0.57 },
      // Pieds armoire - avant droit (120-121)
      { x: 1.23, y: -0.35, z: 0.57 },
      { x: 1.23, y: -0.40, z: 0.57 },

      // ===== FENETRE GAUCHE (mur avant z=-1.0) =====
      // Cadre exterieur (122-125)
      { x: -0.55, y: 0.15, z: -0.99 },
      { x: -0.15, y: 0.15, z: -0.99 },
      { x: -0.15, y: -0.25, z: -0.99 },
      { x: -0.55, y: -0.25, z: -0.99 },
      // Cadre interieur (126-129)
      { x: -0.52, y: 0.12, z: -0.99 },
      { x: -0.18, y: 0.12, z: -0.99 },
      { x: -0.18, y: -0.22, z: -0.99 },
      { x: -0.52, y: -0.22, z: -0.99 },
      // Croix centrale (130-133)
      { x: -0.35, y: 0.12, z: -0.99 },
      { x: -0.35, y: -0.22, z: -0.99 },
      { x: -0.52, y: -0.05, z: -0.99 },
      { x: -0.18, y: -0.05, z: -0.99 },

      // ===== FENETRE DROITE (mur avant z=-1.0) =====
      // Cadre exterieur (134-137)
      { x: 0.15, y: 0.15, z: -0.99 },
      { x: 0.55, y: 0.15, z: -0.99 },
      { x: 0.55, y: -0.25, z: -0.99 },
      { x: 0.15, y: -0.25, z: -0.99 },
      // Cadre interieur (138-141)
      { x: 0.18, y: 0.12, z: -0.99 },
      { x: 0.52, y: 0.12, z: -0.99 },
      { x: 0.52, y: -0.22, z: -0.99 },
      { x: 0.18, y: -0.22, z: -0.99 },
      // Croix centrale (142-145)
      { x: 0.35, y: 0.12, z: -0.99 },
      { x: 0.35, y: -0.22, z: -0.99 },
      { x: 0.18, y: -0.05, z: -0.99 },
      { x: 0.52, y: -0.05, z: -0.99 },

      // ===== PORTE REALISTE MUR 4 (gauche, x=-1.29) =====
      // Cadre exterieur porte (146-149)
      { x: -1.29, y: 0.5, z: 0.50 },
      { x: -1.29, y: 0.5, z: 0.98 },
      { x: -1.29, y: -0.20, z: 0.98 },
      { x: -1.29, y: -0.20, z: 0.50 },
      // Cadre interieur / Panneau porte (150-153)
      { x: -1.29, y: 0.47, z: 0.53 },
      { x: -1.29, y: 0.47, z: 0.95 },
      { x: -1.29, y: -0.17, z: 0.95 },
      { x: -1.29, y: -0.17, z: 0.53 },
      // Panneau decoratif haut gauche (154-157)
      { x: -1.29, y: 0.42, z: 0.56 },
      { x: -1.29, y: 0.42, z: 0.72 },
      { x: -1.29, y: 0.10, z: 0.72 },
      { x: -1.29, y: 0.10, z: 0.56 },
      // Panneau decoratif haut droit (158-161)
      { x: -1.29, y: 0.42, z: 0.76 },
      { x: -1.29, y: 0.42, z: 0.92 },
      { x: -1.29, y: 0.10, z: 0.92 },
      { x: -1.29, y: 0.10, z: 0.76 },
      // Panneau decoratif bas gauche (162-165)
      { x: -1.29, y: 0.05, z: 0.56 },
      { x: -1.29, y: 0.05, z: 0.72 },
      { x: -1.29, y: -0.12, z: 0.72 },
      { x: -1.29, y: -0.12, z: 0.56 },
      // Panneau decoratif bas droit (166-169)
      { x: -1.29, y: 0.05, z: 0.76 },
      { x: -1.29, y: 0.05, z: 0.92 },
      { x: -1.29, y: -0.12, z: 0.92 },
      { x: -1.29, y: -0.12, z: 0.76 },
      // Poignee - plaque arriere (170-173)
      { x: -1.29, y: 0.20, z: 0.56 },
      { x: -1.29, y: 0.20, z: 0.60 },
      { x: -1.29, y: 0.12, z: 0.60 },
      { x: -1.29, y: 0.12, z: 0.56 },
      // Poignee - levier horizontal (174-177)
      { x: -1.32, y: 0.17, z: 0.56 },
      { x: -1.32, y: 0.17, z: 0.52 },
      { x: -1.32, y: 0.15, z: 0.52 },
      { x: -1.32, y: 0.15, z: 0.56 },
      // Charniere haute (178-181)
      { x: -1.30, y: 0.40, z: 0.96 },
      { x: -1.30, y: 0.40, z: 0.98 },
      { x: -1.30, y: 0.35, z: 0.98 },
      { x: -1.30, y: 0.35, z: 0.96 },
      // Charniere basse (182-185)
      { x: -1.30, y: -0.05, z: 0.96 },
      { x: -1.30, y: -0.05, z: 0.98 },
      { x: -1.30, y: -0.10, z: 0.98 },
      { x: -1.30, y: -0.10, z: 0.96 },

      // ===== BUREAU (mur 3 = ARRIERE, z=1.0, CENTRE) =====
      // Plateau du bureau (186-193)
      { x: -0.30, y: 0.25, z: 0.97 },
      { x: 0.30, y: 0.25, z: 0.97 },
      { x: 0.30, y: 0.25, z: 0.60 },
      { x: -0.30, y: 0.25, z: 0.60 },
      { x: -0.30, y: 0.22, z: 0.97 },
      { x: 0.30, y: 0.22, z: 0.97 },
      { x: 0.30, y: 0.22, z: 0.60 },
      { x: -0.30, y: 0.22, z: 0.60 },
      // Pied arriere gauche (194-201)
      { x: -0.27, y: 0.22, z: 0.94 },
      { x: -0.22, y: 0.22, z: 0.94 },
      { x: -0.22, y: 0.22, z: 0.89 },
      { x: -0.27, y: 0.22, z: 0.89 },
      { x: -0.27, y: 0.50, z: 0.94 },
      { x: -0.22, y: 0.50, z: 0.94 },
      { x: -0.22, y: 0.50, z: 0.89 },
      { x: -0.27, y: 0.50, z: 0.89 },
      // Pied arriere droit (202-209)
      { x: 0.22, y: 0.22, z: 0.94 },
      { x: 0.27, y: 0.22, z: 0.94 },
      { x: 0.27, y: 0.22, z: 0.89 },
      { x: 0.22, y: 0.22, z: 0.89 },
      { x: 0.22, y: 0.50, z: 0.94 },
      { x: 0.27, y: 0.50, z: 0.94 },
      { x: 0.27, y: 0.50, z: 0.89 },
      { x: 0.22, y: 0.50, z: 0.89 },
      // Pied avant gauche (210-217)
      { x: -0.27, y: 0.22, z: 0.66 },
      { x: -0.22, y: 0.22, z: 0.66 },
      { x: -0.22, y: 0.22, z: 0.61 },
      { x: -0.27, y: 0.22, z: 0.61 },
      { x: -0.27, y: 0.50, z: 0.66 },
      { x: -0.22, y: 0.50, z: 0.66 },
      { x: -0.22, y: 0.50, z: 0.61 },
      { x: -0.27, y: 0.50, z: 0.61 },
      // Pied avant droit (218-225)
      { x: 0.22, y: 0.22, z: 0.66 },
      { x: 0.27, y: 0.22, z: 0.66 },
      { x: 0.27, y: 0.22, z: 0.61 },
      { x: 0.22, y: 0.22, z: 0.61 },
      { x: 0.22, y: 0.50, z: 0.66 },
      { x: 0.27, y: 0.50, z: 0.66 },
      { x: 0.27, y: 0.50, z: 0.61 },
      { x: 0.22, y: 0.50, z: 0.61 },
      // Ecran ordinateur (226-233)
      { x: -0.08, y: 0.00, z: 0.90 },
      { x: 0.12, y: 0.00, z: 0.90 },
      { x: 0.12, y: 0.15, z: 0.90 },
      { x: -0.08, y: 0.15, z: 0.90 },
      { x: -0.08, y: 0.00, z: 0.88 },
      { x: 0.12, y: 0.00, z: 0.88 },
      { x: 0.12, y: 0.15, z: 0.88 },
      { x: -0.08, y: 0.15, z: 0.88 },
      // Pied ecran (234-237)
      { x: -0.01, y: 0.15, z: 0.89 },
      { x: 0.05, y: 0.15, z: 0.89 },
      { x: -0.01, y: 0.22, z: 0.89 },
      { x: 0.05, y: 0.22, z: 0.89 },
      // Clavier (238-241)
      { x: -0.05, y: 0.21, z: 0.75 },
      { x: 0.15, y: 0.21, z: 0.75 },
      { x: 0.15, y: 0.21, z: 0.68 },
      { x: -0.05, y: 0.21, z: 0.68 },

      // ===== ECRAN TV MUR 4 (gauche, x=-1.27) - DECALE A GAUCHE =====
      // Cadre exterieur TV (242-249)
      { x: -1.27, y: -0.25, z: 0.05 },
      { x: -1.27, y: -0.25, z: -0.85 },
      { x: -1.27, y: 0.25, z: -0.85 },
      { x: -1.27, y: 0.25, z: 0.05 },
      { x: -1.25, y: -0.22, z: 0.02 },
      { x: -1.25, y: -0.22, z: -0.82 },
      { x: -1.25, y: 0.22, z: -0.82 },
      { x: -1.25, y: 0.22, z: 0.02 },

      // ===== CHAISE DE BUREAU DESIGN (devant le bureau, face au bureau) =====
      // Chaise tournee: dossier loin du bureau, accoudoirs vers le bureau
      // Assise - forme ergonomique (250-257)
      { x: -0.15, y: 0.30, z: 0.55 },
      { x: 0.15, y: 0.30, z: 0.55 },
      { x: 0.18, y: 0.30, z: 0.35 },
      { x: -0.18, y: 0.30, z: 0.35 },
      { x: -0.15, y: 0.33, z: 0.55 },
      { x: 0.15, y: 0.33, z: 0.55 },
      { x: 0.18, y: 0.33, z: 0.35 },
      { x: -0.18, y: 0.33, z: 0.35 },
      // Dossier - loin du bureau (258-265)
      { x: -0.14, y: 0.30, z: 0.35 },
      { x: 0.14, y: 0.30, z: 0.35 },
      { x: 0.12, y: 0.03, z: 0.33 },
      { x: -0.12, y: 0.03, z: 0.33 },
      { x: -0.12, y: 0.30, z: 0.33 },
      { x: 0.12, y: 0.30, z: 0.33 },
      { x: 0.10, y: 0.03, z: 0.31 },
      { x: -0.10, y: 0.03, z: 0.31 },
      // Support lombaire (266-269)
      { x: -0.10, y: 0.23, z: 0.34 },
      { x: 0.10, y: 0.23, z: 0.34 },
      { x: 0.10, y: 0.13, z: 0.34 },
      { x: -0.10, y: 0.13, z: 0.34 },
      // Pied central - colonne (270-273)
      { x: -0.03, y: 0.33, z: 0.45 },
      { x: 0.03, y: 0.33, z: 0.45 },
      { x: 0.03, y: 0.47, z: 0.45 },
      { x: -0.03, y: 0.47, z: 0.45 },
      // Base etoile - branche avant (274-275)
      { x: 0.00, y: 0.47, z: 0.45 },
      { x: 0.00, y: 0.47, z: 0.63 },
      // Base etoile - branche arriere (276-277)
      { x: 0.00, y: 0.47, z: 0.45 },
      { x: 0.00, y: 0.47, z: 0.27 },
      // Base etoile - branche gauche (278-279)
      { x: 0.00, y: 0.47, z: 0.45 },
      { x: -0.18, y: 0.47, z: 0.45 },
      // Base etoile - branche droite (280-281)
      { x: 0.00, y: 0.47, z: 0.45 },
      { x: 0.18, y: 0.47, z: 0.45 },
      // Base etoile - branche diagonale avant-gauche (282-283)
      { x: 0.00, y: 0.47, z: 0.45 },
      { x: -0.13, y: 0.47, z: 0.32 },
      // Base etoile - branche diagonale avant-droite (284-285)
      { x: 0.00, y: 0.47, z: 0.45 },
      { x: 0.13, y: 0.47, z: 0.32 },
      // Roulettes au sol (286-291)
      { x: 0.00, y: 0.50, z: 0.63 },
      { x: 0.00, y: 0.50, z: 0.27 },
      { x: -0.18, y: 0.50, z: 0.45 },
      { x: 0.18, y: 0.50, z: 0.45 },
      { x: -0.13, y: 0.50, z: 0.32 },
      { x: 0.13, y: 0.50, z: 0.32 },
      // Accoudoir gauche - support (292-295)
      { x: -0.16, y: 0.30, z: 0.37 },
      { x: -0.16, y: 0.23, z: 0.37 },
      { x: -0.16, y: 0.23, z: 0.50 },
      { x: -0.16, y: 0.30, z: 0.50 },
      // Accoudoir gauche - dessus (296-299)
      { x: -0.18, y: 0.23, z: 0.35 },
      { x: -0.14, y: 0.23, z: 0.35 },
      { x: -0.14, y: 0.23, z: 0.52 },
      { x: -0.18, y: 0.23, z: 0.52 },
      // Accoudoir droit - support (300-303)
      { x: 0.16, y: 0.30, z: 0.37 },
      { x: 0.16, y: 0.23, z: 0.37 },
      { x: 0.16, y: 0.23, z: 0.50 },
      { x: 0.16, y: 0.30, z: 0.50 },
      // Accoudoir droit - dessus (304-307)
      { x: 0.14, y: 0.23, z: 0.35 },
      { x: 0.18, y: 0.23, z: 0.35 },
      { x: 0.18, y: 0.23, z: 0.52 },
      { x: 0.14, y: 0.23, z: 0.52 },

      // ===== LAMPE DE PLAFOND MODERNE (308-355) =====
      // Centre de la piece: x=0, z=-0.4, plafond y=-0.5
      // Attache plafond - rosace (308-311)
      { x: -0.05, y: -0.50, z: -0.35 },
      { x: 0.05, y: -0.50, z: -0.35 },
      { x: 0.05, y: -0.50, z: -0.45 },
      { x: -0.05, y: -0.50, z: -0.45 },
      // Tige centrale (312-315)
      { x: -0.015, y: -0.50, z: -0.415 },
      { x: 0.015, y: -0.50, z: -0.385 },
      { x: -0.015, y: -0.35, z: -0.415 },
      { x: 0.015, y: -0.35, z: -0.385 },
      // Support central du lustre (316-319)
      { x: -0.04, y: -0.35, z: -0.36 },
      { x: 0.04, y: -0.35, z: -0.36 },
      { x: 0.04, y: -0.35, z: -0.44 },
      { x: -0.04, y: -0.35, z: -0.44 },
      // Branche 1 - vers l'avant (320-323)
      { x: 0.00, y: -0.35, z: -0.40 },
      { x: 0.00, y: -0.32, z: -0.20 },
      { x: -0.03, y: -0.28, z: -0.18 },
      { x: 0.03, y: -0.28, z: -0.18 },
      // Branche 2 - vers l'arriere (324-327)
      { x: 0.00, y: -0.35, z: -0.40 },
      { x: 0.00, y: -0.32, z: -0.60 },
      { x: -0.03, y: -0.28, z: -0.62 },
      { x: 0.03, y: -0.28, z: -0.62 },
      // Branche 3 - vers la gauche (328-331)
      { x: 0.00, y: -0.35, z: -0.40 },
      { x: -0.20, y: -0.32, z: -0.40 },
      { x: -0.22, y: -0.28, z: -0.37 },
      { x: -0.22, y: -0.28, z: -0.43 },
      // Branche 4 - vers la droite (332-335)
      { x: 0.00, y: -0.35, z: -0.40 },
      { x: 0.20, y: -0.32, z: -0.40 },
      { x: 0.22, y: -0.28, z: -0.37 },
      { x: 0.22, y: -0.28, z: -0.43 },
      // Ampoule 1 - avant (336-339)
      { x: -0.025, y: -0.28, z: -0.205 },
      { x: 0.025, y: -0.28, z: -0.155 },
      { x: -0.025, y: -0.22, z: -0.205 },
      { x: 0.025, y: -0.22, z: -0.155 },
      // Ampoule 2 - arriere (340-343)
      { x: -0.025, y: -0.28, z: -0.645 },
      { x: 0.025, y: -0.28, z: -0.595 },
      { x: -0.025, y: -0.22, z: -0.645 },
      { x: 0.025, y: -0.22, z: -0.595 },
      // Ampoule 3 - gauche (344-347)
      { x: -0.245, y: -0.28, z: -0.375 },
      { x: -0.195, y: -0.28, z: -0.425 },
      { x: -0.245, y: -0.22, z: -0.375 },
      { x: -0.195, y: -0.22, z: -0.425 },
      // Ampoule 4 - droite (348-351)
      { x: 0.195, y: -0.28, z: -0.375 },
      { x: 0.245, y: -0.28, z: -0.425 },
      { x: 0.195, y: -0.22, z: -0.375 },
      { x: 0.245, y: -0.22, z: -0.425 },
      // Ampoule centrale - plus grande (352-355)
      { x: -0.03, y: -0.35, z: -0.43 },
      { x: 0.03, y: -0.35, z: -0.37 },
      { x: -0.03, y: -0.26, z: -0.43 },
      { x: 0.03, y: -0.26, z: -0.37 },
    ];

    const continuousPath = [
      // Piece principale
      0, 1, 2, 3, 0,
      4, 5, 1, 5, 6, 2, 6, 7, 3, 7, 4,
      0, 4,
      -1, 1, 5,
      -1, 2, 6,
      -1, 3, 7,

      // ===== LIT REALISTE =====
      // Pied avant-gauche (8-15)
      -1, 8, 9, 10, 11, 8,
      -1, 12, 13, 14, 15, 12,
      -1, 8, 12,
      -1, 9, 13,
      -1, 10, 14,
      -1, 11, 15,
      // Pied avant-droit (16-23)
      -1, 16, 17, 18, 19, 16,
      -1, 20, 21, 22, 23, 20,
      -1, 16, 20,
      -1, 17, 21,
      -1, 18, 22,
      -1, 19, 23,
      // Pied arriere-gauche (24-31)
      -1, 24, 25, 26, 27, 24,
      -1, 28, 29, 30, 31, 28,
      -1, 24, 28,
      -1, 25, 29,
      -1, 26, 30,
      -1, 27, 31,
      // Pied arriere-droit (32-39)
      -1, 32, 33, 34, 35, 32,
      -1, 36, 37, 38, 39, 36,
      -1, 32, 36,
      -1, 33, 37,
      -1, 34, 38,
      -1, 35, 39,
      // Sommier cadre (40-47)
      -1, 40, 41, 42, 43, 40,
      -1, 44, 45, 46, 47, 44,
      -1, 40, 44,
      -1, 41, 45,
      -1, 42, 46,
      -1, 43, 47,
      // Lattes du sommier (48-57)
      -1, 48, 49,
      -1, 50, 51,
      -1, 52, 53,
      -1, 54, 55,
      -1, 56, 57,
      // Renforts lateraux (58-61)
      -1, 58, 59,
      -1, 60, 61,
      // Matelas (62-69)
      -1, 62, 63, 64, 65, 62,
      -1, 66, 67, 68, 69, 66,
      -1, 62, 66,
      -1, 63, 67,
      -1, 64, 68,
      -1, 65, 69,

      // ===== ARMOIRE REALISTE (70-121) =====
      // Structure principale (70-77)
      -1, 70, 71, 72, 73, 70,
      -1, 74, 75, 76, 77, 74,
      -1, 70, 74,
      -1, 71, 75,
      -1, 72, 76,
      -1, 73, 77,
      // Separation centrale et etagere (78-81)
      -1, 78, 79,
      -1, 80, 81,
      // Porte gauche - cadre (82-85)
      -1, 82, 83, 84, 85, 82,
      // Porte gauche - panneau haut (86-89)
      -1, 86, 87, 88, 89, 86,
      // Porte gauche - panneau bas (90-93)
      -1, 90, 91, 92, 93, 90,
      // Porte droite - cadre (94-97)
      -1, 94, 95, 96, 97, 94,
      // Porte droite - panneau haut (98-101)
      -1, 98, 99, 100, 101, 98,
      // Porte droite - panneau bas (102-105)
      -1, 102, 103, 104, 105, 102,
      // Poignees (106-109)
      -1, 106, 107,
      -1, 108, 109,
      // Corniche haute (110-113)
      -1, 110, 111, 112, 113, 110,
      // Plinthe basse (114-117)
      -1, 114, 115, 116, 117, 114,
      // Pieds (118-121)
      -1, 118, 119,
      -1, 120, 121,

      // ===== FENETRE GAUCHE (122-133) =====
      -1, 122, 123, 124, 125, 122,
      -1, 126, 127, 128, 129, 126,
      -1, 130, 131,
      -1, 132, 133,

      // ===== FENETRE DROITE (134-145) =====
      -1, 134, 135, 136, 137, 134,
      -1, 138, 139, 140, 141, 138,
      -1, 142, 143,
      -1, 144, 145,

      // ===== PORTE REALISTE (146-185) =====
      // Cadre exterieur (146-149)
      -1, 146, 147, 148, 149, 146,
      // Cadre interieur (150-153)
      -1, 150, 151, 152, 153, 150,
      // Panneau haut gauche (154-157)
      -1, 154, 155, 156, 157, 154,
      // Panneau haut droit (158-161)
      -1, 158, 159, 160, 161, 158,
      // Panneau bas gauche (162-165)
      -1, 162, 163, 164, 165, 162,
      // Panneau bas droit (166-169)
      -1, 166, 167, 168, 169, 166,
      // Poignee plaque (170-173)
      -1, 170, 171, 172, 173, 170,
      // Poignee levier (174-177)
      -1, 174, 175, 176, 177, 174,
      -1, 170, 174,
      // Charniere haute (178-181)
      -1, 178, 179, 180, 181, 178,
      // Charniere basse (182-185)
      -1, 182, 183, 184, 185, 182,

      // ===== BUREAU (186-241) =====
      // Plateau (186-193)
      -1, 186, 187, 188, 189, 186,
      -1, 190, 191, 192, 193, 190,
      -1, 186, 190,
      -1, 187, 191,
      -1, 188, 192,
      -1, 189, 193,
      // Pied arriere gauche (194-201)
      -1, 194, 195, 196, 197, 194,
      -1, 198, 199, 200, 201, 198,
      -1, 194, 198,
      -1, 195, 199,
      -1, 196, 200,
      -1, 197, 201,
      // Pied arriere droit (202-209)
      -1, 202, 203, 204, 205, 202,
      -1, 206, 207, 208, 209, 206,
      -1, 202, 206,
      -1, 203, 207,
      -1, 204, 208,
      -1, 205, 209,
      // Pied avant gauche (210-217)
      -1, 210, 211, 212, 213, 210,
      -1, 214, 215, 216, 217, 214,
      -1, 210, 214,
      -1, 211, 215,
      -1, 212, 216,
      -1, 213, 217,
      // Pied avant droit (218-225)
      -1, 218, 219, 220, 221, 218,
      -1, 222, 223, 224, 225, 222,
      -1, 218, 222,
      -1, 219, 223,
      -1, 220, 224,
      -1, 221, 225,
      // Ecran (226-233)
      -1, 226, 227, 228, 229, 226,
      -1, 230, 231, 232, 233, 230,
      -1, 226, 230,
      -1, 227, 231,
      -1, 228, 232,
      -1, 229, 233,
      // Pied ecran (234-237)
      -1, 234, 235,
      -1, 236, 237,
      -1, 234, 236,
      -1, 235, 237,
      // Clavier (238-241)
      -1, 238, 239, 240, 241, 238,

      // ===== ECRAN TV MUR 4 (242-249) =====
      // Cadre exterieur (242-245)
      -1, 242, 243, 244, 245, 242,
      // Cadre interieur (246-249)
      -1, 246, 247, 248, 249, 246,
      // Connexions cadre
      -1, 242, 246,
      -1, 243, 247,
      -1, 244, 248,
      -1, 245, 249,

      // ===== CHAISE DE BUREAU (250-307) =====
      // Assise (250-257)
      -1, 250, 251, 252, 253, 250,
      -1, 254, 255, 256, 257, 254,
      -1, 250, 254,
      -1, 251, 255,
      -1, 252, 256,
      -1, 253, 257,
      // Dossier (258-265)
      -1, 258, 259, 260, 261, 258,
      -1, 262, 263, 264, 265, 262,
      -1, 258, 262,
      -1, 259, 263,
      -1, 260, 264,
      -1, 261, 265,
      // Support lombaire (266-269)
      -1, 266, 267, 268, 269, 266,
      // Pied central (270-273)
      -1, 270, 271, 272, 273, 270,
      // Base etoile - 6 branches
      -1, 274, 275,
      -1, 276, 277,
      -1, 278, 279,
      -1, 280, 281,
      -1, 282, 283,
      -1, 284, 285,
      // Roulettes
      -1, 275, 286,
      -1, 277, 287,
      -1, 279, 288,
      -1, 281, 289,
      -1, 283, 290,
      -1, 285, 291,
      // Accoudoir gauche (292-299)
      -1, 292, 293, 294, 295, 292,
      -1, 296, 297, 298, 299, 296,
      -1, 293, 296,
      -1, 294, 298,
      // Accoudoir droit (300-307)
      -1, 300, 301, 302, 303, 300,
      -1, 304, 305, 306, 307, 304,
      -1, 301, 304,
      -1, 302, 306,

      // ===== LAMPE DE PLAFOND (308-355) =====
      // Rosace plafond (308-311)
      -1, 308, 309, 310, 311, 308,
      // Tige centrale (312-315)
      -1, 312, 313, 314, 315, 312,
      -1, 312, 314,
      -1, 313, 315,
      // Support central (316-319)
      -1, 316, 317, 318, 319, 316,
      // Branche 1 - avant (320-323)
      -1, 320, 321,
      -1, 321, 322,
      -1, 321, 323,
      -1, 322, 323,
      // Branche 2 - arriere (324-327)
      -1, 324, 325,
      -1, 325, 326,
      -1, 325, 327,
      -1, 326, 327,
      // Branche 3 - gauche (328-331)
      -1, 328, 329,
      -1, 329, 330,
      -1, 329, 331,
      -1, 330, 331,
      // Branche 4 - droite (332-335)
      -1, 332, 333,
      -1, 333, 334,
      -1, 333, 335,
      -1, 334, 335,
      // Ampoule 1 - avant (336-339)
      -1, 336, 337, 339, 338, 336,
      -1, 338, 339,
      // Ampoule 2 - arriere (340-343)
      -1, 340, 341, 343, 342, 340,
      -1, 342, 343,
      // Ampoule 3 - gauche (344-347)
      -1, 344, 345, 347, 346, 344,
      -1, 346, 347,
      // Ampoule 4 - droite (348-351)
      -1, 348, 349, 351, 350, 348,
      -1, 350, 351,
      // Ampoule centrale (352-355)
      -1, 352, 353, 355, 354, 352,
      -1, 354, 355,
    ];

    const rotateY = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x * cos - point.z * sin,
        y: point.y,
        z: point.x * sin + point.z * cos
      };
    };

    const rotateX = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x,
        y: point.y * cos - point.z * sin,
        z: point.y * sin + point.z * cos
      };
    };

    const project = (point: Point3D): { x: number; y: number; depth: number } => {
      const perspective = 3;
      const factor = perspective / (perspective + point.z);
      return {
        x: centerX + point.x * scale * factor,
        y: centerY + point.y * scale * factor,
        depth: point.z
      };
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const darkOverlay = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(width, height)
      );
      darkOverlay.addColorStop(0, 'rgba(0, 0, 0, 0)');
      darkOverlay.addColorStop(0.4, 'rgba(0, 0, 0, 0.3)');
      darkOverlay.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
      darkOverlay.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = darkOverlay;
      ctx.fillRect(0, 0, width, height);

      nebulaCloudsRef.current.forEach(cloud => {
        cloud.drift += cloud.driftSpeed;
        const offsetX = Math.sin(cloud.drift) * 30;
        const offsetY = Math.cos(cloud.drift * 0.7) * 25;
        const pulse = 1 + Math.sin(time * 0.5 + cloud.drift) * 0.15;

        const nebulaGradient = ctx.createRadialGradient(
          cloud.x + offsetX, cloud.y + offsetY, 0,
          cloud.x + offsetX, cloud.y + offsetY, cloud.radius * pulse
        );
        nebulaGradient.addColorStop(0, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${cloud.color.a * 2})`);
        nebulaGradient.addColorStop(0.2, `rgba(${cloud.color.r * 1.2}, ${cloud.color.g * 1.1}, ${cloud.color.b * 1.3}, ${cloud.color.a * 1.5})`);
        nebulaGradient.addColorStop(0.4, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${cloud.color.a})`);
        nebulaGradient.addColorStop(0.6, `rgba(${cloud.color.r * 0.7}, ${cloud.color.g * 0.7}, ${cloud.color.b * 0.9}, ${cloud.color.a * 0.6})`);
        nebulaGradient.addColorStop(0.8, `rgba(${cloud.color.r * 0.4}, ${cloud.color.g * 0.4}, ${cloud.color.b * 0.6}, ${cloud.color.a * 0.3})`);
        nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(cloud.x + offsetX, cloud.y + offsetY, cloud.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = nebulaGradient;
        ctx.fill();

        const innerGlow = ctx.createRadialGradient(
          cloud.x + offsetX * 0.5, cloud.y + offsetY * 0.5, 0,
          cloud.x + offsetX * 0.5, cloud.y + offsetY * 0.5, cloud.radius * 0.4 * pulse
        );
        innerGlow.addColorStop(0, `rgba(${Math.min(255, cloud.color.r * 2)}, ${Math.min(255, cloud.color.g * 1.5)}, ${Math.min(255, cloud.color.b * 1.8)}, ${cloud.color.a * 0.5})`);
        innerGlow.addColorStop(0.5, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${cloud.color.a * 0.2})`);
        innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(cloud.x + offsetX * 0.5, cloud.y + offsetY * 0.5, cloud.radius * 0.4 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = innerGlow;
        ctx.fill();
      });

      starsRef.current.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        const flicker = Math.random() > 0.99 ? 0.3 : 1;
        const alpha = star.brightness * (0.3 + twinkle * 0.7) * flicker;
        const glowSize = star.size * (1 + twinkle * 0.8);

        if (star.size > 0.8) {
          const outerGlow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize * 3);
          outerGlow.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.15})`);
          outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.arc(star.x, star.y, glowSize * 3, 0, Math.PI * 2);
          ctx.fillStyle = outerGlow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      const mouseGlowX = mouseRef.current.x;
      const mouseGlowY = mouseRef.current.y;
      const mousePulse = 1 + Math.sin(time * 5) * 0.1;

      for (let layer = 3; layer >= 0; layer--) {
        const layerSize = (60 - layer * 15) * mousePulse;
        const layerAlpha = 0.02 - layer * 0.005;

        const mouseGlow = ctx.createRadialGradient(mouseGlowX, mouseGlowY, 0, mouseGlowX, mouseGlowY, layerSize);
        mouseGlow.addColorStop(0, `rgba(255, 255, 255, ${layerAlpha})`);
        mouseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(mouseGlowX, mouseGlowY, layerSize, 0, Math.PI * 2);
        ctx.fillStyle = mouseGlow;
        ctx.fill();
      }

      const baseRotationY = time * 0.08;
      const baseRotationX = Math.sin(time * 0.05) * 0.05 - 0.1;

      const rotationY_val = baseRotationY;
      const rotationX_val = baseRotationX;

      const transformedPoints = livingRoomPoints.map(point => {
        const rotatedY = rotateY(point, rotationY_val);
        const rotatedXY = rotateX(rotatedY, rotationX_val);
        return rotatedXY;
      });

      const projectedPoints = transformedPoints.map(point => project(point));

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const totalSegments = continuousPath.length - 1;
      const drawSpeed = 0.035;
      const eraseSpeed = 0.05;

      const isDrawingCompleteCheck = drawProgressRef.current >= totalSegments;
      const isErasingComplete = drawProgressRef.current <= 0;
      const currentRotation = time * 0.08;

      if (isDrawingCompleteCheck && !isErasingRef.current) {
        if (!waitingForRotationRef.current) {
          waitingForRotationRef.current = true;
          rotationAtCompleteRef.current = currentRotation;
        }
        const rotationDelta = currentRotation - rotationAtCompleteRef.current;
        if (rotationDelta >= Math.PI * 2) {
          isErasingRef.current = true;
          waitingForRotationRef.current = false;
        }
      } else if (isErasingComplete && isErasingRef.current) {
        pauseTimerRef.current += 0.016;
        if (pauseTimerRef.current > 1) {
          isErasingRef.current = false;
          pauseTimerRef.current = 0;
          drawProgressRef.current = 0;
        }
      } else if (isErasingRef.current) {
        drawProgressRef.current = Math.max(drawProgressRef.current - eraseSpeed, 0);
      } else {
        drawProgressRef.current = Math.min(drawProgressRef.current + drawSpeed, totalSegments);
      }

      const isDrawingComplete = drawProgressRef.current >= totalSegments;
      const currentProgress = drawProgressRef.current;
      const completedSegments = Math.floor(currentProgress);
      const segmentProgress = easeInOutCubic(currentProgress - completedSegments);

      trailPointsRef.current = trailPointsRef.current.filter(point => {
        point.alpha -= 0.008;
        return point.alpha > 0;
      });

      if (completedSegments > 0) {
        trailPointsRef.current.forEach(point => {
          const trailGlow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 8);
          trailGlow.addColorStop(0, `rgba(150, 220, 255, ${point.alpha * 0.5})`);
          trailGlow.addColorStop(0.5, `rgba(80, 160, 255, ${point.alpha * 0.2})`);
          trailGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = trailGlow;
          ctx.fill();
        });

        const drawPathWithJumps = (glowAlpha: number, glowWidth: number) => {
          ctx.beginPath();
          let isFirstPoint = true;
          let lastValidIdx = -1;

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
            lastValidIdx = i;
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
          const glowAlpha = 0.08 - glow * 0.012;
          const glowWidth = 16 - glow * 2.5;
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
          centerX - scale, centerY - scale,
          centerX + scale, centerY + scale
        );
        lineGradient.addColorStop(0, 'rgba(120, 200, 255, 0.95)');
        lineGradient.addColorStop(0.5, 'rgba(200, 240, 255, 1)');
        lineGradient.addColorStop(1, 'rgba(120, 200, 255, 0.95)');

        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const isAnimating = (!isErasingRef.current && currentProgress < totalSegments) ||
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

        shootingStarPosRef.current = { x: starX, y: starY };

        if (time % 0.02 < 0.016) {
          trailPointsRef.current.push({
            x: starX,
            y: starY,
            alpha: 1,
            time: time
          });
        }

        const starPulse = 1 + Math.sin(time * 20) * 0.3;

        for (let i = 0; i < 3; i++) {
          const trailOffset = (i + 1) * 8;
          const dx = toPoint.x - fromPoint.x;
          const dy = toPoint.y - fromPoint.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const trailX = starX - (dx / len) * trailOffset;
          const trailY = starY - (dy / len) * trailOffset;
          const trailAlpha = 0.4 - i * 0.12;

          const trailGlow = ctx.createRadialGradient(trailX, trailY, 0, trailX, trailY, 15 - i * 3);
          trailGlow.addColorStop(0, `rgba(150, 220, 255, ${trailAlpha})`);
          trailGlow.addColorStop(0.5, `rgba(100, 180, 255, ${trailAlpha * 0.5})`);
          trailGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.arc(trailX, trailY, 15 - i * 3, 0, Math.PI * 2);
          ctx.fillStyle = trailGlow;
          ctx.fill();
        }

        for (let ring = 6; ring >= 0; ring--) {
          const ringSize = (45 - ring * 6) * starPulse;
          const ringAlpha = 0.35 - ring * 0.045;

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

        const rayLength = 25 * starPulse;
        const rayCount = 4;

        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2;
          ctx.save();
          ctx.rotate(angle);

          const rayGradient = ctx.createLinearGradient(0, 0, rayLength, 0);
          rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          rayGradient.addColorStop(0.3, 'rgba(150, 220, 255, 0.4)');
          rayGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(rayLength, -2);
          ctx.lineTo(rayLength * 1.2, 0);
          ctx.lineTo(rayLength, 2);
          ctx.closePath();
          ctx.fillStyle = rayGradient;
          ctx.fill();

          ctx.restore();
        }

        ctx.restore();

        ctx.beginPath();
        ctx.arc(starX, starY, 4 * starPulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fill();

        if (Math.random() < 0.7) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkSpeed = 1.5 + Math.random() * 3;
          particlesRef.current.push({
            x: starX,
            y: starY,
            vx: Math.cos(sparkAngle) * sparkSpeed,
            vy: Math.sin(sparkAngle) * sparkSpeed,
            life: 1,
            maxLife: 1,
            size: 0.5 + Math.random() * 1.5,
            hue: 200 + Math.random() * 20,
            type: 'spark'
          });
        }
      }

      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.life -= 0.025;

        if (particle.life <= 0) return false;

        const alpha = Math.pow(particle.life, 2);
        const particleGlow = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 5
        );
        particleGlow.addColorStop(0, `hsla(${particle.hue}, 80%, 90%, ${alpha})`);
        particleGlow.addColorStop(0.4, `hsla(${particle.hue}, 70%, 70%, ${alpha * 0.5})`);
        particleGlow.addColorStop(1, `hsla(${particle.hue}, 60%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = particleGlow;
        ctx.fill();

        return true;
      });

      const visitedPoints = new Set<number>();
      for (let i = 0; i <= completedSegments && i < continuousPath.length; i++) {
        if (continuousPath[i] !== -1) {
          visitedPoints.add(continuousPath[i]);
        }
      }

      visitedPoints.forEach(index => {
        const point = projectedPoints[index];
        const depthFactor = Math.max(0.5, 1 - (point.depth + 1) * 0.25);
        const pulse = 1 + Math.sin(time * 4 + index * 0.7) * 0.15;
        const size = 3 * depthFactor * pulse;

        for (let ring = 3; ring >= 0; ring--) {
          const ringSize = size * (3.5 - ring * 0.8);
          const ringAlpha = (0.3 - ring * 0.06) * depthFactor;

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
        ctx.arc(point.x, point.y, size * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${depthFactor * 0.95})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

export default HeroHouseAnimation;
