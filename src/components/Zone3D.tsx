import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GridSettings, Wall, Brick, Block } from '../types/Scene';
import { LibraryElement, ScenePlacedElement, DrawingData } from '../types/ElementLibrary';
import { Sun, Moon, Sunset, CloudSnow, Lock, Unlock, Loader2, Grid3x3 as Grid3X3, Eye, EyeOff, ChevronDown, Video, User, Pencil } from 'lucide-react';
import { createRealisticCharacter, createFallbackCharacter, RealisticCharacterController } from './RealisticCharacter';
import { AtmosphericSkySystem } from './AtmosphericSky';
import { NightSkySystem } from './NightSky';
import { SunsetSkySystem } from './SunsetSky';
import { SnowStormSkySystem } from './SnowStormSky';
import { HDRPostProcessing } from './PostProcessing';

interface TerrainConfig {
  width: number;
  length: number;
  cellSize: number;
}

type EditorMode = 'navigation' | 'terrain' | 'construction' | 'robot';

interface DrawingPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface DrawingStroke {
  points: DrawingPoint[];
  color: string;
  width: number;
  startTime: number;
  endTime: number;
}

interface Zone3DProps {
  gridSettings: GridSettings;
  walls: Wall[];
  blocks: Block[];
  bricks: Brick[];
  isActive?: boolean;
  onActiveChange?: (active: boolean) => void;
  terrain?: TerrainConfig | null;
  terrainPreview?: TerrainConfig | null;
  selectedLibraryElement?: LibraryElement | null;
  placedElements?: ScenePlacedElement[];
  elementsMap?: Map<string, LibraryElement>;
  onPlaceElement?: (element: LibraryElement, x: number, y: number) => void;
  onElementDrawingComplete?: (placedElementId: string) => void;
  editorMode?: EditorMode;
  isDrawingMode?: boolean;
  currentDrawingStrokes?: DrawingData | null;
  onStartDrawing?: () => void;
  onAddStroke?: (stroke: DrawingStroke) => void;
  onUpdateLivePoints?: (points: DrawingPoint[]) => void;
}

const Zone3D: React.FC<Zone3DProps> = ({
  gridSettings,
  walls,
  blocks,
  bricks,
  isActive: isActiveProp = true,
  onActiveChange,
  terrain,
  terrainPreview,
  selectedLibraryElement,
  placedElements = [],
  elementsMap = new Map(),
  onPlaceElement,
  onElementDrawingComplete,
  editorMode = 'navigation',
  isDrawingMode = false,
  currentDrawingStrokes = null,
  onStartDrawing,
  onAddStroke,
  onUpdateLivePoints
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const blocksGroupRef = useRef<THREE.Group | null>(null);
  const wallsGroupRef = useRef<THREE.Group | null>(null);
  const bricksGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const characterRef = useRef<THREE.Group | null>(null);
  const characterControllerRef = useRef<RealisticCharacterController | null>(null);
  const atmosphericSkyRef = useRef<AtmosphericSkySystem | null>(null);
  const nightSkyRef = useRef<NightSkySystem | null>(null);
  const sunsetSkyRef = useRef<SunsetSkySystem | null>(null);
  const snowStormSkyRef = useRef<SnowStormSkySystem | null>(null);
  const postProcessingRef = useRef<HDRPostProcessing | null>(null);
  const drawingsGroupRef = useRef<THREE.Group | null>(null);
  const drawing3DAnimationsRef = useRef<Map<string, { startTime: number; completed: boolean; lines: THREE.Line[]; element: LibraryElement; glowSphere?: THREE.Mesh; glowLight?: THREE.PointLight }>>(new Map());
  const wardrobeGroupRef = useRef<THREE.Group | null>(null);
  const wardrobeAnimationRef = useRef<{ startTime: number; completed: boolean; lines: THREE.Line[]; glowSphere?: THREE.Mesh; glowLight?: THREE.PointLight } | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [isActiveDrawing3D, setIsActiveDrawing3D] = useState(false);
  const currentStroke3DRef = useRef<DrawingPoint[]>([]);
  const strokeStartTime3DRef = useRef<number>(0);
  const drawing2DCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const onStartDrawingRef = useRef(onStartDrawing);
  const onAddStrokeRef = useRef(onAddStroke);
  const onUpdateLivePointsRef = useRef(onUpdateLivePoints);

  useEffect(() => {
    onStartDrawingRef.current = onStartDrawing;
    onAddStrokeRef.current = onAddStroke;
    onUpdateLivePointsRef.current = onUpdateLivePoints;
  }, [onStartDrawing, onAddStroke, onUpdateLivePoints]);
  const [isCharacterLoading, setIsCharacterLoading] = useState(false);
  const [characterLoadError, setCharacterLoadError] = useState<string | null>(null);
  const [isCharacterLoaded, setIsCharacterLoaded] = useState(false);
  const [cameraMode, setCameraMode] = useState<'fps' | 'thirdPerson'>('fps');
  const cameraModeRef = useRef<'fps' | 'thirdPerson'>('fps');
  const [skyMode, setSkyMode] = useState<'day' | 'night' | 'sunset' | 'snowstorm' | 'normal'>('normal');
  const [currentSpeedLevel, setCurrentSpeedLevel] = useState(2); // Niveau de vitesse 0-10 (défaut: 1)
  const speedSettingsRef = useRef({
    0: 0,    // Arrêt
    1: 0.05, // Très lent
    2: 1,    // Vitesse 1 (défaut)
    3: 2,
    4: 5,
    5: 8,    // Moyen
    6: 10,
    7: 13,
    8: 15,
    9: 17,
    10: 20   // Max
  });
  const [speedSettings, setSpeedSettings] = useState(speedSettingsRef.current);
  const currentSpeedLevelRef = useRef(2);
  const [currentZoom, setCurrentZoom] = useState(100);
  const [isOrthographic, setIsOrthographic] = useState(false);
  const [isViewLocked, setIsViewLocked] = useState(true);
  const isActiveRef = useRef(isActiveProp);
  const isViewLockedRefLocal = useRef(true);
  const [isFocused, setIsFocused] = useState(false);
  const isFocusedRef = useRef(false);
  const [sceneColorMode, setSceneColorMode] = useState<'default' | 'navyTech' | 'navyWhite'>('default');
  const [ambiance, setAmbiance] = useState<'white' | 'black' | 'navyBlue' | 'nightBlue'>('black');
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isAmbianceMenuOpen, setIsAmbianceMenuOpen] = useState(false);
  const [isCameraModeMenuOpen, setIsCameraModeMenuOpen] = useState(false);
  const [isSkyModeMenuOpen, setIsSkyModeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const ambianceMenuRef = useRef<HTMLDivElement>(null);
  const cameraModeMenuRef = useRef<HTMLDivElement>(null);
  const skyModeMenuRef = useRef<HTMLDivElement>(null);
  const groundPlaneRef = useRef<THREE.Mesh | null>(null);
  const subGridHelperRef = useRef<THREE.GridHelper | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const terrainGridRef = useRef<THREE.GridHelper | null>(null);
  const terrainSmallGridRef = useRef<THREE.GridHelper | null>(null);
  const previewMeshRef = useRef<THREE.Mesh | null>(null);
  const previewGridRef = useRef<THREE.GridHelper | null>(null);
  const previewBorderRef = useRef<THREE.LineSegments | null>(null);
  const previewQuadrantsRef = useRef<THREE.Group | null>(null);
  const previewCompassRef = useRef<THREE.Group | null>(null);
  const selectedLibraryElementRef = useRef<LibraryElement | null>(null);
  const onPlaceElementRef = useRef<((element: LibraryElement, x: number, y: number) => void) | undefined>(undefined);

  useEffect(() => {
    isActiveRef.current = isActiveProp;
  }, [isActiveProp]);

  useEffect(() => {
    selectedLibraryElementRef.current = selectedLibraryElement || null;
  }, [selectedLibraryElement]);

  useEffect(() => {
    onPlaceElementRef.current = onPlaceElement;
  }, [onPlaceElement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
      if (ambianceMenuRef.current && !ambianceMenuRef.current.contains(event.target as Node)) {
        setIsAmbianceMenuOpen(false);
      }
      if (cameraModeMenuRef.current && !cameraModeMenuRef.current.contains(event.target as Node)) {
        setIsCameraModeMenuOpen(false);
      }
      if (skyModeMenuRef.current && !skyModeMenuRef.current.contains(event.target as Node)) {
        setIsSkyModeMenuOpen(false);
      }
    };

    if (isThemeMenuOpen || isAmbianceMenuOpen || isCameraModeMenuOpen || isSkyModeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isThemeMenuOpen, isAmbianceMenuOpen, isCameraModeMenuOpen, isSkyModeMenuOpen]);

  useEffect(() => {
    currentSpeedLevelRef.current = currentSpeedLevel;
  }, [currentSpeedLevel]);

  useEffect(() => {
    speedSettingsRef.current = speedSettings;
  }, [speedSettings]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const loadCharacter = async () => {
      if (cameraMode === 'thirdPerson' && !isCharacterLoaded) {
        setIsCharacterLoading(true);
        setCharacterLoadError(null);

        const centerX = gridSettings.gridWidthMeters / 2;
        const centerZ = gridSettings.gridLengthMeters / 2;
        const initialPos = new THREE.Vector3(centerX, 0, centerZ);

        try {
          const controller = await createRealisticCharacter(sceneRef.current!, initialPos);
          characterControllerRef.current = controller;
          characterRef.current = controller.model;
          controller.model.scale.set(1.0, 1.0, 1.0);
          controller.model.visible = true;
          setIsCharacterLoaded(true);
          setIsCharacterLoading(false);
        } catch (error) {
          console.warn('Failed to load realistic character, using fallback:', error);
          const fallback = createFallbackCharacter(sceneRef.current!, initialPos);
          characterControllerRef.current = fallback;
          characterRef.current = fallback.model;
          fallback.model.scale.set(1.0, 1.0, 1.0);
          fallback.model.visible = true;
          setIsCharacterLoaded(true);
          setIsCharacterLoading(false);
          setCharacterLoadError('Using simplified character');
        }
      } else if (cameraMode === 'fps' && isCharacterLoaded) {
        if (characterControllerRef.current) {
          characterControllerRef.current.dispose();
          characterControllerRef.current = null;
        }
        if (characterRef.current && sceneRef.current) {
          sceneRef.current.remove(characterRef.current);
          characterRef.current = null;
        }
        setIsCharacterLoaded(false);
      }
    };

    loadCharacter();
  }, [cameraMode, isCharacterLoaded, gridSettings.gridWidthMeters, gridSettings.gridLengthMeters]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);
    sceneRef.current = scene;
    setSceneReady(true);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    const centerX = gridSettings.gridWidthMeters / 2;
    const centerZ = gridSettings.gridLengthMeters / 2;
    camera.position.set(centerX, 1.8, centerZ + 4);
    camera.lookAt(centerX, 0, centerZ);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const atmosphericSky = new AtmosphericSkySystem(scene);
    atmosphericSky.init();
    atmosphericSky.setSunPosition(55, 160);
    atmosphericSky.setVisible(true);
    atmosphericSkyRef.current = atmosphericSky;

    const nightSky = new NightSkySystem(scene);
    nightSky.init();
    nightSky.setMoonPosition(45, 220);
    nightSky.setMoonPhase(0.75);
    nightSky.setVisible(false);
    nightSkyRef.current = nightSky;

    const sunsetSky = new SunsetSkySystem(scene);
    sunsetSky.init();
    sunsetSky.setSunPosition(12, 250);
    sunsetSky.setCloudDensity(0.55);
    sunsetSky.setVisible(false);
    sunsetSkyRef.current = sunsetSky;

    const snowStormSky = new SnowStormSkySystem(scene);
    snowStormSky.init();
    snowStormSky.setStormIntensity(0.9);
    snowStormSky.setWindStrength(1.2);
    snowStormSky.setVisible(false);
    snowStormSkyRef.current = snowStormSky;

    scene.background = null;

    const postProcessing = new HDRPostProcessing(
      renderer,
      scene,
      camera,
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    postProcessing.bloomStrength = 0.6;
    postProcessing.bloomThreshold = 0.8;
    postProcessing.exposure = 1.1;
    postProcessing.vignetteIntensity = 0.25;
    postProcessing.enabled = true;
    postProcessingRef.current = postProcessing;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    sunLightRef.current = directionalLight;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    const blocksGroup = new THREE.Group();
    scene.add(blocksGroup);
    blocksGroupRef.current = blocksGroup;

    const wallsGroup = new THREE.Group();
    scene.add(wallsGroup);
    wallsGroupRef.current = wallsGroup;

    const bricksGroup = new THREE.Group();
    scene.add(bricksGroup);
    bricksGroupRef.current = bricksGroup;

    const drawingsGroup = new THREE.Group();
    drawingsGroup.position.y = 0.05;
    scene.add(drawingsGroup);
    drawingsGroupRef.current = drawingsGroup;

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraRotation = { theta: Math.PI / 4, phi: Math.PI / 4 };
    let cameraDistance = 100;
    let thirdPersonDistance = 4;
    let thirdPersonHeight = 1.8;

    const fpsRotation = { yaw: 0, pitch: 0 };
    const keys3D: { [key: string]: boolean } = {};

    const updateCamera = () => {
      if (!cameraRef.current) return;

      const direction = new THREE.Vector3();
      direction.x = -Math.sin(fpsRotation.yaw) * Math.cos(fpsRotation.pitch);
      direction.y = Math.sin(fpsRotation.pitch);
      direction.z = -Math.cos(fpsRotation.yaw) * Math.cos(fpsRotation.pitch);

      if (cameraModeRef.current === 'fps') {
        if (characterRef.current) {
          characterRef.current.visible = false;
        }
        const lookAt = new THREE.Vector3().addVectors(cameraRef.current.position, direction);
        cameraRef.current.lookAt(lookAt);
      } else if (characterRef.current) {
        characterRef.current.visible = true;
        characterRef.current.traverse((child) => {
          child.visible = true;
        });

        const charPos = characterRef.current.position.clone();
        const cameraOffset = new THREE.Vector3(
          Math.sin(fpsRotation.yaw) * thirdPersonDistance,
          thirdPersonHeight,
          Math.cos(fpsRotation.yaw) * thirdPersonDistance
        );

        cameraRef.current.position.copy(charPos).add(cameraOffset);
        cameraRef.current.lookAt(charPos.x, charPos.y + 1.2, charPos.z);
      }
    };

    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
      if (!isActiveRef.current) return;

      if (isViewLockedRefLocal.current) {
        if (e.button === 0 || e.button === 2) {
          isDragging = true;
          previousMousePosition = { x: e.clientX, y: e.clientY };
        }
        return;
      }

      // En mode débloqué: maintenir clic gauche pour tourner
      if (e.button === 0) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      // Si la fenêtre est inactive, ne rien faire
      if (!isActiveRef.current) return;

      // Mode bloqué: déplacement avec clic gauche ou clic droit
      if (isViewLockedRefLocal.current && isDragging && cameraRef.current) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        const distance = cameraRef.current.position.length();
        const panSpeed = distance * 0.003;

        const camera = cameraRef.current;
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        camera.getWorldDirection(forward);
        right.crossVectors(forward, up).normalize();
        up.crossVectors(right, forward).normalize();

        camera.position.addScaledVector(right, -deltaX * panSpeed);
        camera.position.addScaledVector(up, deltaY * panSpeed);

        previousMousePosition = { x: e.clientX, y: e.clientY };
        return;
      }

      // Mode bloqué: pas de rotation avec mouvement de souris
      if (isViewLockedRefLocal.current && !isDragging) {
        return;
      }

      // Mode débloqué: rotation seulement si on maintient clic gauche
      if (!isViewLockedRefLocal.current && isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        fpsRotation.yaw -= deltaX * 0.005;
        fpsRotation.pitch -= deltaY * 0.005;
        fpsRotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, fpsRotation.pitch));

        previousMousePosition = { x: e.clientX, y: e.clientY };
        updateCamera();
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Si la fenêtre est inactive, ne rien faire
      if (!isActiveRef.current) return;

      if (isViewLockedRefLocal.current && cameraRef.current) {
        // Zoom basé sur la hauteur Y (comme dans Zone2D)
        const currentHeight = cameraRef.current.position.y;
        const zoomDelta = e.deltaY > 0 ? 5 : -5;
        const newHeight = Math.max(1, Math.min(500, currentHeight + zoomDelta));

        // Calcul du zoom: hauteur 500 = zoom 1, hauteur 1 = zoom 500
        const zoomLevel = Math.round(501 - newHeight);

        cameraRef.current.position.y = newHeight;

        // Regarder le centre de la grille
        const centerX = gridSettings.gridWidthMeters / 2;
        const centerZ = gridSettings.gridLengthMeters / 2;
        const lookAtPoint = new THREE.Vector3(centerX, 0, centerZ);
        cameraRef.current.lookAt(lookAtPoint);

        setCurrentZoom(Math.max(1, Math.min(500, zoomLevel)));

        setHoveredBlock(null);
        return;
      }

      // Changer le niveau de vitesse avec la molette (en mode déverrouillé)
      const levelChange = e.deltaY > 0 ? -1 : 1;
      const newLevel = Math.max(0, Math.min(10, currentSpeedLevelRef.current + levelChange));
      setCurrentSpeedLevel(newLevel);
    };

    const updateCameraPosition = () => {
      if (!cameraRef.current) return;

      const x = cameraDistance * Math.sin(cameraRotation.phi) * Math.cos(cameraRotation.theta);
      const y = cameraDistance * Math.cos(cameraRotation.phi);
      const z = cameraDistance * Math.sin(cameraRotation.phi) * Math.sin(cameraRotation.theta);

      const centerX = gridSettings.gridWidthMeters / 2;
      const centerZ = gridSettings.gridLengthMeters / 2;
      cameraRef.current.position.set(x + centerX, y, z + centerZ);
      cameraRef.current.lookAt(centerX, 0, centerZ);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si la zone n'est pas focalisée, ne rien faire
      if (!isFocusedRef.current) return;

      keys3D[e.key.toLowerCase()] = true;

      // Touches + et - pour contrôler la vitesse
      if (e.key === '+' || e.key === '=') {
        const newLevel = Math.min(10, currentSpeedLevelRef.current + 1);
        setCurrentSpeedLevel(newLevel);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        const newLevel = Math.max(0, currentSpeedLevelRef.current - 1);
        setCurrentSpeedLevel(newLevel);
        return;
      }

      // Touche B pour bloquer/débloquer la vue
      if (e.key.toLowerCase() === 'b') {
        isViewLockedRefLocal.current = !isViewLockedRefLocal.current;

        // Émettre un événement pour synchroniser l'état React (spécifique à 3D)
        const event = new CustomEvent('viewLockChanged3D', {
          detail: { locked: isViewLockedRefLocal.current }
        });
        window.dispatchEvent(event);

        // Sortir du mode pointer lock si on bloque la vue
        if (isViewLockedRefLocal.current && document.pointerLockElement === renderer.domElement) {
          document.exitPointerLock();
        }
        return;
      }

      // Raccourcis pavé numérique pour les vues
      if (!cameraRef.current) return;
      if (!isActiveRef.current) return; // Ne pas réagir si la fenêtre est inactive

      const distance = 80;
      const centerX = gridSettings.gridWidthMeters / 2;
      const centerZ = gridSettings.gridLengthMeters / 2;

      switch(e.key) {
        case '1': // Vue de face
          cameraRef.current.position.set(centerX, 5, distance + centerZ);
          cameraRef.current.lookAt(centerX, 0, centerZ);
          fpsRotation.yaw = 0;
          fpsRotation.pitch = 0;
          updateCamera();
          break;
        case '5': // Recentrer au centre
          cameraRef.current.position.set(centerX, 5, distance + centerZ);
          cameraRef.current.lookAt(centerX, 0, centerZ);
          fpsRotation.yaw = 0;
          fpsRotation.pitch = 0;
          updateCamera();
          break;
        case '7': // Vue du dessus
          cameraRef.current.position.set(centerX, distance, centerZ);
          cameraRef.current.lookAt(centerX, 0, centerZ);
          fpsRotation.yaw = 0;
          fpsRotation.pitch = -Math.PI / 2;
          updateCamera();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isFocusedRef.current) return;
      keys3D[e.key.toLowerCase()] = false;
    };

    const updateMovement = () => {
      if (!cameraRef.current) return;

      if (!isActiveRef.current) return;

      const actualSpeed = speedSettingsRef.current[currentSpeedLevelRef.current as keyof typeof speedSettingsRef.current];
      const speed = actualSpeed * 0.02;

      if (isViewLockedRefLocal.current) {
        const camera = cameraRef.current;

        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        camera.getWorldDirection(forward);
        right.crossVectors(forward, up).normalize();
        up.crossVectors(right, forward).normalize();

        if (keys3D['s']) {
          camera.position.addScaledVector(up, speed);
        }
        if (keys3D['w']) {
          camera.position.addScaledVector(up, -speed);
        }
        if (keys3D['d']) {
          camera.position.addScaledVector(right, -speed);
        }
        if (keys3D['a']) {
          camera.position.addScaledVector(right, speed);
        }
        return;
      }

      const camera = cameraRef.current;
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);

      forward.x = Math.sin(fpsRotation.yaw);
      forward.z = Math.cos(fpsRotation.yaw);
      forward.normalize();
      right.crossVectors(forward, up).normalize();

      const moveTarget = cameraModeRef.current === 'thirdPerson' && characterRef.current
        ? characterRef.current.position
        : camera.position;

      const moveDirection = new THREE.Vector3();

      if (keys3D['s']) {
        moveTarget.addScaledVector(forward, speed);
        moveDirection.add(forward);
      }
      if (keys3D['w']) {
        moveTarget.addScaledVector(forward, -speed);
        moveDirection.sub(forward);
      }
      if (keys3D['a']) {
        moveTarget.addScaledVector(right, speed);
        moveDirection.add(right);
      }
      if (keys3D['d']) {
        moveTarget.addScaledVector(right, -speed);
        moveDirection.sub(right);
      }

      if (cameraModeRef.current === 'thirdPerson' && characterRef.current) {
        characterRef.current.position.y = 0;
        if (moveDirection.length() > 0) {
          moveDirection.normalize();
          const targetRotation = Math.atan2(moveDirection.x, moveDirection.z) + Math.PI;
          const currentRotation = characterRef.current.rotation.y;
          let deltaRotation = targetRotation - currentRotation;
          while (deltaRotation > Math.PI) deltaRotation -= Math.PI * 2;
          while (deltaRotation < -Math.PI) deltaRotation += Math.PI * 2;
          characterRef.current.rotation.y = currentRotation + deltaRotation * 0.15;
        }
      }

      if (cameraModeRef.current === 'fps') {
        if (keys3D['e']) {
          camera.position.y += speed;
        }
        if (keys3D['q']) {
          camera.position.y -= speed;
        }
      }

      updateCamera();
    };

    const handleMouseEnter = () => {
      isFocusedRef.current = true;
      setIsFocused(true);
      console.log('🎯 Zone3D - Focus activé');
    };

    const handleMouseLeave = () => {
      isFocusedRef.current = false;
      setIsFocused(false);
      console.log('🎯 Zone3D - Focus désactivé');
    };

    renderer.domElement.addEventListener('mouseenter', handleMouseEnter);
    renderer.domElement.addEventListener('mouseleave', handleMouseLeave);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    let lastTime = performance.now();
    const animate = () => {
      requestAnimationFrame(animate);
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      updateMovement();

      if (characterControllerRef.current) {
        if (cameraModeRef.current === 'thirdPerson') {
          if (characterRef.current) {
            characterRef.current.visible = true;
          }
          const isMoving = keys3D['w'] || keys3D['s'] || keys3D['d'] || keys3D['a'];
          const isRunning = currentSpeedLevelRef.current >= 6;
          characterControllerRef.current.update(delta, isMoving, isRunning);
        } else {
          if (characterRef.current) {
            characterRef.current.visible = false;
          }
        }
      }

      if (atmosphericSkyRef.current) {
        atmosphericSkyRef.current.update(delta);
      }

      if (nightSkyRef.current) {
        nightSkyRef.current.update(delta);
      }

      if (sunsetSkyRef.current) {
        sunsetSkyRef.current.update(delta);
      }

      if (snowStormSkyRef.current) {
        snowStormSkyRef.current.update(delta);
      }

      if (postProcessingRef.current && postProcessingRef.current.enabled) {
        postProcessingRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    let resizeTimeout: number | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout);
      }
      resizeTimeout = requestAnimationFrame(() => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (width <= 0 || height <= 0) return;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height, false);
        if (postProcessingRef.current) {
          postProcessingRef.current.setSize(width, height);
        }
        resizeTimeout = null;
      });
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mouseenter', handleMouseEnter);
      renderer.domElement.removeEventListener('mouseleave', handleMouseLeave);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (characterControllerRef.current) {
        characterControllerRef.current.dispose();
      }
      if (atmosphericSkyRef.current) {
        atmosphericSkyRef.current.dispose();
      }
      if (nightSkyRef.current) {
        nightSkyRef.current.dispose();
      }
      if (sunsetSkyRef.current) {
        sunsetSkyRef.current.dispose();
      }
      if (snowStormSkyRef.current) {
        snowStormSkyRef.current.dispose();
      }
      if (postProcessingRef.current) {
        postProcessingRef.current.dispose();
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    const protectedNames = [
      'atmosphericSky', 'sunSphere', 'sunGlow', 'cloudLayer',
      'atmosphericSunLight', 'atmosphericHemisphereLight', 'atmosphericAmbientLight',
      'nightSky', 'stars', 'moon', 'moonGlow', 'moonOuterGlow', 'nebula',
      'moonLight', 'nightAmbient', 'starLight',
      'sunsetSky', 'sunsetSun', 'sunsetSunGlow', 'sunsetSunOuterGlow', 'sunsetSunCorona',
      'sunsetCloudLayer0', 'sunsetCloudLayer1', 'sunsetCloudLayer2',
      'sunsetGodRays', 'sunsetSunLight', 'sunsetHemisphereLight', 'sunsetAmbientLight',
      'snowStormSky', 'snowStormStars', 'snowStormMoon', 'snowStormMoonGlow',
      'snowStormParticles', 'snowStormAmbient', 'snowStormMoonLight'
    ];

    const childrenToRemove: THREE.Object3D[] = [];
    sceneRef.current.children.forEach(child => {
      if (child !== blocksGroupRef.current &&
          child !== wallsGroupRef.current &&
          child !== bricksGroupRef.current &&
          child !== characterRef.current &&
          !protectedNames.includes(child.name || '')) {
        childrenToRemove.push(child);
      }
    });

    childrenToRemove.forEach(child => {
      sceneRef.current?.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
      if (child instanceof THREE.Light && (child as THREE.DirectionalLight).shadow?.map) {
        (child as THREE.DirectionalLight).shadow.map?.dispose();
      }
    });

    const gridWidthMeters = gridSettings.gridWidthMeters;
    const gridLengthMeters = gridSettings.gridLengthMeters;
    const cellSizeMeters = gridSettings.cellSize || 0.1;
    const centerX = gridWidthMeters / 2;
    const centerZ = gridLengthMeters / 2;

    if (ambientLightRef.current) {
      sceneRef.current.remove(ambientLightRef.current);
    }
    if (sunLightRef.current) {
      if (sunLightRef.current.shadow?.map) {
        sunLightRef.current.shadow.map.dispose();
      }
      sceneRef.current.remove(sunLightRef.current);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    sceneRef.current.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    sunLightRef.current = directionalLight;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    sceneRef.current.add(directionalLight);

    const maxDimension = Math.max(gridWidthMeters, gridLengthMeters);
    const gridCellsX = Math.ceil(gridWidthMeters / cellSizeMeters);
    const gridCellsZ = Math.ceil(gridLengthMeters / cellSizeMeters);
    const gridDivisions = Math.max(gridCellsX, gridCellsZ);

    gridHelperRef.current = null;
    subGridHelperRef.current = null;
    groundPlaneRef.current = null;


    if (cameraRef.current) {
      cameraRef.current.position.set(centerX + maxDimension * 0.5, maxDimension * 0.5, centerZ + maxDimension * 0.5);
      cameraRef.current.lookAt(centerX, 0, centerZ);
    }

    sceneRef.current.background = null;
  }, [gridSettings]);

  useEffect(() => {
    console.log('🔥 useEffect BLOCKS déclenché, nombre de blocs:', blocks.length);
    if (!blocksGroupRef.current) {
      console.log('⚠️ blocksGroupRef.current est null');
      return;
    }

    while (blocksGroupRef.current.children.length > 0) {
      const child = blocksGroupRef.current.children[0];
      blocksGroupRef.current.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    blocks.forEach((block) => {
      console.log('🟦 Rendu du bloc:', block);
      const blockSize = gridSettings.blockSize;

      const blockGeometry = new THREE.BoxGeometry(blockSize, block.height, blockSize);

      // Créer les matériaux pour chaque face
      let materials: THREE.Material[];

      if (block.imageUrl) {
        console.log('📸 Zone3D - Chargement de l\'image pour le bloc:', block.id);
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(block.imageUrl);
        texture.colorSpace = THREE.SRGBColorSpace;

        // Matériau avec texture pour le dessus
        const topMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.6,
          metalness: 0.3
        });

        // Matériau bleu pour les autres faces
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          roughness: 0.6,
          metalness: 0.3
        });

        // Ordre des faces: droite, gauche, dessus, dessous, avant, arrière
        materials = [
          sideMaterial, // droite
          sideMaterial, // gauche
          topMaterial,  // dessus (avec image)
          sideMaterial, // dessous
          sideMaterial, // avant
          sideMaterial  // arrière
        ];
      } else {
        // Pas d'image, matériau bleu uniforme
        const blockMaterial = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          roughness: 0.6,
          metalness: 0.3
        });
        materials = [blockMaterial];
      }

      const blockMesh = new THREE.Mesh(blockGeometry, materials);

      const worldX = block.gridX * blockSize + blockSize / 2;
      const worldZ = block.gridZ * blockSize + blockSize / 2;

      console.log('📍 Zone3D - Position du bloc:', { worldX, y: block.height / 2, worldZ });

      blockMesh.position.set(worldX, block.height / 2, worldZ);
      blockMesh.castShadow = true;
      blockMesh.receiveShadow = true;

      blocksGroupRef.current?.add(blockMesh);
      console.log('🎯 Mesh ajouté au groupe, children count:', blocksGroupRef.current?.children.length);
    });
    console.log('✅ Rendu des blocs terminé, total meshes dans le groupe:', blocksGroupRef.current?.children.length);
    console.log('📦 Groupe de blocs:', blocksGroupRef.current);
  }, [blocks, gridSettings.blockSize]);

  useEffect(() => {
    if (!drawingsGroupRef.current || !sceneRef.current || !sceneReady) return;

    const currentIds = new Set(placedElements.map(e => e.id));

    drawing3DAnimationsRef.current.forEach((anim, id) => {
      if (!currentIds.has(id)) {
        anim.lines.forEach(obj => {
          drawingsGroupRef.current?.remove(obj);
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (obj.material instanceof THREE.Material) {
              obj.material.dispose();
            }
          }
        });
        if (anim.glowSphere) {
          drawingsGroupRef.current?.remove(anim.glowSphere);
          anim.glowSphere.geometry.dispose();
          (anim.glowSphere.material as THREE.Material).dispose();
        }
        if (anim.glowLight) {
          drawingsGroupRef.current?.remove(anim.glowLight);
        }
        drawing3DAnimationsRef.current.delete(id);
      }
    });

    placedElements.forEach(placedEl => {
      const element = elementsMap.get(placedEl.elementId);
      if (!element || !element.drawing_data) return;

      if (!drawing3DAnimationsRef.current.has(placedEl.id)) {
        console.log('Creating 3D drawing animation for:', placedEl.id, 'at position:', placedEl.x, placedEl.y);
        const drawing = element.drawing_data;
        const bbox = drawing.boundingBox;
        const drawingWidth = bbox.maxX - bbox.minX;
        const drawingHeight = bbox.maxY - bbox.minY;

        const scale3D = 0.02 * placedEl.scale;

        const centerX = gridSettings.gridWidthMeters / 2;
        const centerZ = gridSettings.gridLengthMeters / 2;

        const offsetX = (placedEl.x - 400) * 0.025;
        const offsetZ = (placedEl.y - 300) * 0.025;

        const worldX = centerX + offsetX;
        const worldZ = centerZ + offsetZ;

        const meshes: THREE.Mesh[] = [];

        drawing.strokes.forEach((stroke, strokeIndex) => {
          if (stroke.points.length < 2) return;

          const points3D: THREE.Vector3[] = stroke.points.map(point => {
            const localX = (point.x - bbox.minX - drawingWidth / 2) * scale3D;
            const localZ = -(point.y - bbox.minY - drawingHeight / 2) * scale3D;
            return new THREE.Vector3(
              worldX + localX,
              0.15,
              worldZ + localZ
            );
          });

          const curve = new THREE.CatmullRomCurve3(points3D);
          const tubeGeometry = new THREE.TubeGeometry(curve, points3D.length * 2, 0.03, 8, false);

          const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0
          });

          const tubeMesh = new THREE.Mesh(tubeGeometry, material);
          tubeMesh.userData = {
            strokeIndex,
            startTime: stroke.startTime,
            endTime: stroke.endTime,
            totalPoints: stroke.points.length,
            points3D
          };
          tubeMesh.visible = false;

          meshes.push(tubeMesh);
          drawingsGroupRef.current?.add(tubeMesh);
        });

        const glowGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.9
        });
        const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
        glowSphere.visible = false;
        drawingsGroupRef.current?.add(glowSphere);

        const glowLight = new THREE.PointLight(0x00ffff, 2, 3);
        glowLight.visible = false;
        drawingsGroupRef.current?.add(glowLight);

        drawing3DAnimationsRef.current.set(placedEl.id, {
          startTime: Date.now(),
          completed: false,
          lines: meshes as unknown as THREE.Line[],
          element,
          glowSphere,
          glowLight
        });
      }
    });
  }, [placedElements, elementsMap, gridSettings.gridWidthMeters, gridSettings.gridLengthMeters, sceneReady]);

  useEffect(() => {
    if (drawing3DAnimationsRef.current.size === 0) return;

    let animationRunning = true;
    let frameId: number;

    const animate3DDrawings = () => {
      if (!animationRunning) return;

      const now = Date.now();
      let hasActiveAnimations = false;

      if (drawing3DAnimationsRef.current.size > 0) {
        console.log('Animating', drawing3DAnimationsRef.current.size, 'drawings');
      }

      drawing3DAnimationsRef.current.forEach((anim, placedId) => {
        if (anim.completed) return;

        const drawing = anim.element.drawing_data;
        if (!drawing) return;

        const elapsed = now - anim.startTime;
        const totalDuration = drawing.totalDuration;
        const progress = Math.min(1, elapsed / totalDuration);

        let currentGlowPos: THREE.Vector3 | null = null;
        let isActivelyDrawing = false;

        anim.lines.forEach(obj => {
          const mesh = obj as unknown as THREE.Mesh;
          const strokeData = mesh.userData;
          const strokeStart = strokeData.startTime;
          const strokeEnd = strokeData.endTime;
          const strokeDuration = strokeEnd - strokeStart;

          if (elapsed >= strokeStart) {
            const strokeElapsed = elapsed - strokeStart;
            const strokeProgress = Math.min(1, strokeElapsed / strokeDuration);

            mesh.visible = true;

            const material = mesh.material as THREE.MeshBasicMaterial;

            if (strokeProgress < 1) {
              material.opacity = 0.9;
              material.color.setHex(0x00ffff);

              const points3D = strokeData.points3D as THREE.Vector3[];
              const pointsToShow = Math.max(2, Math.floor(points3D.length * strokeProgress));
              const partialPoints = points3D.slice(0, pointsToShow);

              if (partialPoints.length >= 2) {
                const curve = new THREE.CatmullRomCurve3(partialPoints);
                const newGeometry = new THREE.TubeGeometry(curve, partialPoints.length * 2, 0.03, 8, false);
                mesh.geometry.dispose();
                mesh.geometry = newGeometry;

                currentGlowPos = partialPoints[partialPoints.length - 1].clone();
                isActivelyDrawing = true;
              }
            } else {
              material.opacity = 1;
              material.color.setHex(0x40e0d0);
            }
          }
        });

        if (anim.glowSphere && anim.glowLight) {
          if (isActivelyDrawing && currentGlowPos) {
            anim.glowSphere.visible = true;
            anim.glowLight.visible = true;
            anim.glowSphere.position.copy(currentGlowPos);
            anim.glowLight.position.copy(currentGlowPos);

            const pulse = 1 + Math.sin(now * 0.01) * 0.3;
            anim.glowSphere.scale.setScalar(pulse);
            anim.glowLight.intensity = 2 + Math.sin(now * 0.015) * 0.5;
          } else {
            anim.glowSphere.visible = false;
            anim.glowLight.visible = false;
          }
        }

        if (progress >= 1) {
          anim.completed = true;
          if (anim.glowSphere) anim.glowSphere.visible = false;
          if (anim.glowLight) anim.glowLight.visible = false;
          onElementDrawingComplete?.(placedId);
        } else {
          hasActiveAnimations = true;
        }
      });

      if (hasActiveAnimations) {
        frameId = requestAnimationFrame(animate3DDrawings);
      }
    };

    animate3DDrawings();

    return () => {
      animationRunning = false;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [placedElements, onElementDrawingComplete]);

  const liveDrawingGroupRef = useRef<THREE.Group | null>(null);
  const [sceneReady3D, setSceneReady3D] = useState(false);

  useEffect(() => {
    if (sceneRef.current && !liveDrawingGroupRef.current) {
      liveDrawingGroupRef.current = new THREE.Group();
      liveDrawingGroupRef.current.position.y = 0.1;
      sceneRef.current.add(liveDrawingGroupRef.current);
      setSceneReady3D(true);
    }
  }, [sceneReady]);

  useEffect(() => {
    if (!liveDrawingGroupRef.current) return;

    while (liveDrawingGroupRef.current.children.length > 0) {
      const child = liveDrawingGroupRef.current.children[0];
      liveDrawingGroupRef.current.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    }

    if (!currentDrawingStrokes || !currentDrawingStrokes.strokes || currentDrawingStrokes.strokes.length === 0) {
      return;
    }

    currentDrawingStrokes.strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      const points3D: THREE.Vector3[] = stroke.points.map(point => {
        return new THREE.Vector3(point.x, 0.15, point.y);
      });

      const curve = new THREE.CatmullRomCurve3(points3D);
      const tubeGeometry = new THREE.TubeGeometry(curve, Math.max(points3D.length * 2, 4), 0.05, 8, false);

      const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: false
      });

      const tubeMesh = new THREE.Mesh(tubeGeometry, material);
      liveDrawingGroupRef.current?.add(tubeMesh);
    });
  }, [currentDrawingStrokes, gridSettings.gridWidthMeters, gridSettings.gridLengthMeters, sceneReady3D]);

  useEffect(() => {
    if (!wallsGroupRef.current) return;

    while (wallsGroupRef.current.children.length > 0) {
      const child = wallsGroupRef.current.children[0];
      wallsGroupRef.current.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.7,
      metalness: 0.2
    });

    walls.forEach((wall) => {
      const dx = wall.endX - wall.startX;
      const dz = wall.endY - wall.startY;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const wallGeometry = new THREE.BoxGeometry(length, wall.height, wall.thickness);
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

      const centerX = (wall.startX + wall.endX) / 2;
      const centerZ = (wall.startY + wall.endY) / 2;

      wallMesh.position.set(centerX, wall.height / 2, centerZ);
      wallMesh.rotation.y = -angle;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;

      wallsGroupRef.current?.add(wallMesh);
    });
  }, [walls]);

  useEffect(() => {
    if (!bricksGroupRef.current) return;

    while (bricksGroupRef.current.children.length > 0) {
      const child = bricksGroupRef.current.children[0];
      bricksGroupRef.current.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    const brickMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.8,
      metalness: 0.1
    });

    bricks.forEach((brick) => {
      const brickGeometry = new THREE.BoxGeometry(brick.width, brick.height, brick.depth);
      const brickMesh = new THREE.Mesh(brickGeometry, brickMaterial);

      brickMesh.position.set(
        brick.x + brick.width / 2,
        brick.height / 2,
        brick.y + brick.depth / 2
      );
      brickMesh.castShadow = true;
      brickMesh.receiveShadow = true;

      bricksGroupRef.current?.add(brickMesh);
    });
  }, [bricks]);

  useEffect(() => {
    const handleLockToggle = (e: CustomEvent<{ locked: boolean }>) => {
      setIsViewLocked(e.detail.locked);
    };

    window.addEventListener('viewLockChanged3D' as any, handleLockToggle);
    return () => {
      window.removeEventListener('viewLockChanged3D' as any, handleLockToggle);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!cameraRef.current) return;

      if (isViewLockedRefLocal.current) {
        const currentHeight = cameraRef.current.position.y;
        const zoomLevel = Math.round(501 - currentHeight);
        setCurrentZoom(Math.max(1, Math.min(500, zoomLevel)));
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    if (skyMode === 'day') {
      if (atmosphericSkyRef.current) {
        atmosphericSkyRef.current.setVisible(true);
        atmosphericSkyRef.current.setSunPosition(45, 180);
        atmosphericSkyRef.current.setCloudCoverage(0.4);
        atmosphericSkyRef.current.setRayleigh(2.0);
        atmosphericSkyRef.current.setTurbidity(4.0);
      }
      if (nightSkyRef.current) {
        nightSkyRef.current.setVisible(false);
      }
      if (sunsetSkyRef.current) {
        sunsetSkyRef.current.setVisible(false);
      }
      if (snowStormSkyRef.current) {
        snowStormSkyRef.current.setVisible(false);
      }
      if (postProcessingRef.current) {
        postProcessingRef.current.enabled = true;
        postProcessingRef.current.bloomStrength = 0.6;
        postProcessingRef.current.bloomThreshold = 0.8;
        postProcessingRef.current.exposure = 1.1;
        postProcessingRef.current.vignetteIntensity = 0.25;
      }
      sceneRef.current.background = null;
      if (sunLightRef.current) sunLightRef.current.visible = false;
      if (ambientLightRef.current) ambientLightRef.current.visible = false;
    } else if (skyMode === 'night') {
      if (atmosphericSkyRef.current) {
        atmosphericSkyRef.current.setVisible(false);
      }
      if (nightSkyRef.current) {
        nightSkyRef.current.setVisible(true);
        nightSkyRef.current.setMoonPosition(45, 220);
        nightSkyRef.current.setMoonPhase(0.75);
      }
      if (sunsetSkyRef.current) {
        sunsetSkyRef.current.setVisible(false);
      }
      if (snowStormSkyRef.current) {
        snowStormSkyRef.current.setVisible(false);
      }
      if (postProcessingRef.current) {
        postProcessingRef.current.enabled = true;
        postProcessingRef.current.bloomStrength = 1.2;
        postProcessingRef.current.bloomThreshold = 0.3;
        postProcessingRef.current.exposure = 0.8;
        postProcessingRef.current.vignetteIntensity = 0.4;
      }
      sceneRef.current.background = null;
      if (sunLightRef.current) sunLightRef.current.visible = false;
      if (ambientLightRef.current) {
        ambientLightRef.current.visible = true;
        ambientLightRef.current.intensity = 0.3;
        ambientLightRef.current.color.setHex(0x4466aa);
      }
    } else if (skyMode === 'sunset') {
      if (atmosphericSkyRef.current) {
        atmosphericSkyRef.current.setVisible(false);
      }
      if (nightSkyRef.current) {
        nightSkyRef.current.setVisible(false);
      }
      if (sunsetSkyRef.current) {
        sunsetSkyRef.current.setVisible(true);
        sunsetSkyRef.current.setSunPosition(12, 250);
        sunsetSkyRef.current.setCloudDensity(0.55);
        sunsetSkyRef.current.setGodRaysIntensity(0.6);
      }
      if (snowStormSkyRef.current) {
        snowStormSkyRef.current.setVisible(false);
      }
      if (postProcessingRef.current) {
        postProcessingRef.current.enabled = true;
        postProcessingRef.current.bloomStrength = 1.0;
        postProcessingRef.current.bloomThreshold = 0.5;
        postProcessingRef.current.exposure = 1.2;
        postProcessingRef.current.vignetteIntensity = 0.35;
      }
      sceneRef.current.background = null;
      if (sunLightRef.current) sunLightRef.current.visible = false;
      if (ambientLightRef.current) ambientLightRef.current.visible = false;
    } else if (skyMode === 'snowstorm') {
      if (atmosphericSkyRef.current) {
        atmosphericSkyRef.current.setVisible(false);
      }
      if (nightSkyRef.current) {
        nightSkyRef.current.setVisible(false);
      }
      if (sunsetSkyRef.current) {
        sunsetSkyRef.current.setVisible(false);
      }
      if (snowStormSkyRef.current) {
        snowStormSkyRef.current.setVisible(true);
        snowStormSkyRef.current.setStormIntensity(0.9);
        snowStormSkyRef.current.setWindStrength(1.2);
      }
      if (postProcessingRef.current) {
        postProcessingRef.current.enabled = true;
        postProcessingRef.current.bloomStrength = 0.8;
        postProcessingRef.current.bloomThreshold = 0.6;
        postProcessingRef.current.exposure = 0.9;
        postProcessingRef.current.vignetteIntensity = 0.5;
      }
      sceneRef.current.background = null;
      if (sunLightRef.current) sunLightRef.current.visible = false;
      if (ambientLightRef.current) ambientLightRef.current.visible = false;
    } else {
      if (atmosphericSkyRef.current) {
        atmosphericSkyRef.current.setVisible(false);
      }
      if (nightSkyRef.current) {
        nightSkyRef.current.setVisible(false);
      }
      if (sunsetSkyRef.current) {
        sunsetSkyRef.current.setVisible(false);
      }
      if (snowStormSkyRef.current) {
        snowStormSkyRef.current.setVisible(false);
      }
      if (postProcessingRef.current) {
        postProcessingRef.current.enabled = false;
      }
      sceneRef.current.background = new THREE.Color(0x0a0d14);
      if (sunLightRef.current) sunLightRef.current.visible = true;
      if (ambientLightRef.current) {
        ambientLightRef.current.visible = true;
        ambientLightRef.current.intensity = 0.8;
        ambientLightRef.current.color.setHex(0xffffff);
      }
    }
  }, [skyMode]);

  useEffect(() => {
    if (!sceneRef.current) return;

    if (terrainMeshRef.current) {
      sceneRef.current.remove(terrainMeshRef.current);
      terrainMeshRef.current.geometry.dispose();
      (terrainMeshRef.current.material as THREE.Material).dispose();
      terrainMeshRef.current = null;
    }
    if (terrainGridRef.current) {
      sceneRef.current.remove(terrainGridRef.current);
      terrainGridRef.current = null;
    }
    if (terrainSmallGridRef.current) {
      sceneRef.current.remove(terrainSmallGridRef.current);
      terrainSmallGridRef.current = null;
    }

    if (!terrain) {
      return;
    }

    const gridWidthMeters = terrain.width;
    const gridLengthMeters = terrain.length;
    const centerX = gridWidthMeters / 2;
    const centerZ = gridLengthMeters / 2;

    const planeGeometry = new THREE.PlaneGeometry(gridWidthMeters, gridLengthMeters);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(centerX, 0, centerZ);
    plane.receiveShadow = true;
    plane.name = 'terrain_ground_3d';
    plane.userData.isGround = true;
    plane.userData.isCollider = true;
    sceneRef.current.add(plane);
    terrainMeshRef.current = plane;

    const cellSizeMeters = terrain.cellSize;
    const cellsX = Math.ceil(gridWidthMeters / cellSizeMeters);
    const cellsZ = Math.ceil(gridLengthMeters / cellSizeMeters);
    const maxDimension = Math.max(gridWidthMeters, gridLengthMeters);
    const gridDivisions = Math.max(cellsX, cellsZ);

    const smallGridHelper = new THREE.GridHelper(
      maxDimension,
      gridDivisions,
      0x404040,
      0x404040
    );
    smallGridHelper.position.set(centerX, 0.01, centerZ);
    sceneRef.current.add(smallGridHelper);
    terrainSmallGridRef.current = smallGridHelper;

    const largeCellSize = cellSizeMeters * 10;
    const largeCellsX = Math.ceil(gridWidthMeters / largeCellSize);
    const largeCellsZ = Math.ceil(gridLengthMeters / largeCellSize);
    const largeGridDivisions = Math.max(largeCellsX, largeCellsZ);

    const largeGridHelper = new THREE.GridHelper(
      maxDimension,
      largeGridDivisions,
      0x525252,
      0x525252
    );
    largeGridHelper.position.set(centerX, 0.02, centerZ);
    sceneRef.current.add(largeGridHelper);
    terrainGridRef.current = largeGridHelper;

    if (cameraRef.current && cameraModeRef.current === 'fps') {
      cameraRef.current.position.set(centerX, 1.8, centerZ + 4);
      cameraRef.current.lookAt(centerX, 0, centerZ);
    }
  }, [terrain]);

  useEffect(() => {
    if (!sceneRef.current || !sceneReady || wardrobeAnimationRef.current) return;

    const wardrobeGroup = new THREE.Group();
    wardrobeGroup.position.set(
      gridSettings.gridWidthMeters / 2,
      0.1,
      gridSettings.gridLengthMeters / 2
    );
    sceneRef.current.add(wardrobeGroup);
    wardrobeGroupRef.current = wardrobeGroup;

    const scale = 2.5;
    const wardrobePoints: THREE.Vector3[] = [
      new THREE.Vector3(0.55 * scale, 0.5 * scale, 0.97 * scale),
      new THREE.Vector3(1.25 * scale, 0.5 * scale, 0.97 * scale),
      new THREE.Vector3(1.25 * scale, -0.35 * scale, 0.97 * scale),
      new THREE.Vector3(0.55 * scale, -0.35 * scale, 0.97 * scale),
      new THREE.Vector3(0.55 * scale, 0.5 * scale, 0.55 * scale),
      new THREE.Vector3(1.25 * scale, 0.5 * scale, 0.55 * scale),
      new THREE.Vector3(1.25 * scale, -0.35 * scale, 0.55 * scale),
      new THREE.Vector3(0.55 * scale, -0.35 * scale, 0.55 * scale),
      new THREE.Vector3(0.90 * scale, 0.47 * scale, 0.55 * scale),
      new THREE.Vector3(0.90 * scale, -0.32 * scale, 0.55 * scale),
      new THREE.Vector3(0.58 * scale, 0.20 * scale, 0.55 * scale),
      new THREE.Vector3(1.22 * scale, 0.20 * scale, 0.55 * scale),
      new THREE.Vector3(0.58 * scale, 0.47 * scale, 0.55 * scale),
      new THREE.Vector3(0.87 * scale, 0.47 * scale, 0.55 * scale),
      new THREE.Vector3(0.87 * scale, -0.32 * scale, 0.55 * scale),
      new THREE.Vector3(0.58 * scale, -0.32 * scale, 0.55 * scale),
      new THREE.Vector3(0.61 * scale, 0.44 * scale, 0.55 * scale),
      new THREE.Vector3(0.84 * scale, 0.44 * scale, 0.55 * scale),
      new THREE.Vector3(0.84 * scale, 0.23 * scale, 0.55 * scale),
      new THREE.Vector3(0.61 * scale, 0.23 * scale, 0.55 * scale),
      new THREE.Vector3(0.61 * scale, 0.17 * scale, 0.55 * scale),
      new THREE.Vector3(0.84 * scale, 0.17 * scale, 0.55 * scale),
      new THREE.Vector3(0.84 * scale, -0.29 * scale, 0.55 * scale),
      new THREE.Vector3(0.61 * scale, -0.29 * scale, 0.55 * scale),
      new THREE.Vector3(0.93 * scale, 0.47 * scale, 0.55 * scale),
      new THREE.Vector3(1.22 * scale, 0.47 * scale, 0.55 * scale),
      new THREE.Vector3(1.22 * scale, -0.32 * scale, 0.55 * scale),
      new THREE.Vector3(0.93 * scale, -0.32 * scale, 0.55 * scale),
      new THREE.Vector3(0.96 * scale, 0.44 * scale, 0.55 * scale),
      new THREE.Vector3(1.19 * scale, 0.44 * scale, 0.55 * scale),
      new THREE.Vector3(1.19 * scale, 0.23 * scale, 0.55 * scale),
      new THREE.Vector3(0.96 * scale, 0.23 * scale, 0.55 * scale),
      new THREE.Vector3(0.96 * scale, 0.17 * scale, 0.55 * scale),
      new THREE.Vector3(1.19 * scale, 0.17 * scale, 0.55 * scale),
      new THREE.Vector3(1.19 * scale, -0.29 * scale, 0.55 * scale),
      new THREE.Vector3(0.96 * scale, -0.29 * scale, 0.55 * scale),
      new THREE.Vector3(0.82 * scale, 0.10 * scale, 0.54 * scale),
      new THREE.Vector3(0.82 * scale, -0.05 * scale, 0.54 * scale),
      new THREE.Vector3(0.98 * scale, 0.10 * scale, 0.54 * scale),
      new THREE.Vector3(0.98 * scale, -0.05 * scale, 0.54 * scale),
      new THREE.Vector3(0.53 * scale, 0.50 * scale, 0.98 * scale),
      new THREE.Vector3(1.27 * scale, 0.50 * scale, 0.98 * scale),
      new THREE.Vector3(1.27 * scale, 0.50 * scale, 0.53 * scale),
      new THREE.Vector3(0.53 * scale, 0.50 * scale, 0.53 * scale),
      new THREE.Vector3(0.53 * scale, -0.35 * scale, 0.98 * scale),
      new THREE.Vector3(1.27 * scale, -0.35 * scale, 0.98 * scale),
      new THREE.Vector3(1.27 * scale, -0.35 * scale, 0.53 * scale),
      new THREE.Vector3(0.53 * scale, -0.35 * scale, 0.53 * scale),
      new THREE.Vector3(0.57 * scale, -0.35 * scale, 0.57 * scale),
      new THREE.Vector3(0.57 * scale, -0.40 * scale, 0.57 * scale),
      new THREE.Vector3(1.23 * scale, -0.35 * scale, 0.57 * scale),
      new THREE.Vector3(1.23 * scale, -0.40 * scale, 0.57 * scale),
    ];

    const continuousPath = [
      0, 1, 2, 3, 0,
      -1, 4, 5, 6, 7, 4,
      -1, 0, 4,
      -1, 1, 5,
      -1, 2, 6,
      -1, 3, 7,
      -1, 8, 9,
      -1, 10, 11,
      -1, 12, 13, 14, 15, 12,
      -1, 16, 17, 18, 19, 16,
      -1, 20, 21, 22, 23, 20,
      -1, 24, 25, 26, 27, 24,
      -1, 28, 29, 30, 31, 28,
      -1, 32, 33, 34, 35, 32,
      -1, 36, 37,
      -1, 38, 39,
      -1, 40, 41, 42, 43, 40,
      -1, 44, 45, 46, 47, 44,
      -1, 48, 49,
      -1, 50, 51,
    ];

    const segments: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];
    let lastPoint: THREE.Vector3 | null = null;

    for (let i = 0; i < continuousPath.length; i++) {
      const idx = continuousPath[i];
      if (idx === -1) {
        lastPoint = null;
        continue;
      }
      const point = wardrobePoints[idx];
      if (lastPoint && point) {
        segments.push({ from: lastPoint.clone(), to: point.clone() });
      }
      lastPoint = point;
    }

    const lines: THREE.Line[] = [];
    const totalDuration = 5000;
    const segmentDuration = totalDuration / segments.length;

    segments.forEach((seg, index) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array([
        seg.from.x, seg.from.y, seg.from.z,
        seg.from.x, seg.from.y, seg.from.z
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.9,
        linewidth: 2
      });

      const line = new THREE.Line(geometry, material);
      line.userData = {
        fromPoint: seg.from,
        toPoint: seg.to,
        startTime: index * segmentDuration,
        endTime: (index + 1) * segmentDuration
      };
      line.visible = false;
      wardrobeGroup.add(line);
      lines.push(line);
    });

    const glowGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    glowSphere.visible = false;
    wardrobeGroup.add(glowSphere);

    const glowLight = new THREE.PointLight(0x00ffff, 2, 3);
    glowLight.visible = false;
    wardrobeGroup.add(glowLight);

    wardrobeAnimationRef.current = {
      startTime: Date.now(),
      completed: false,
      lines,
      glowSphere,
      glowLight
    };
  }, [sceneReady, gridSettings.gridWidthMeters, gridSettings.gridLengthMeters]);

  useEffect(() => {
    if (!wardrobeAnimationRef.current || wardrobeAnimationRef.current.completed) return;

    let animationId: number;
    const totalDuration = 5000;

    const animateWardrobe = () => {
      const anim = wardrobeAnimationRef.current;
      if (!anim || anim.completed) return;

      const now = Date.now();
      const elapsed = now - anim.startTime;
      const progress = Math.min(1, elapsed / totalDuration);

      let currentGlowPos: THREE.Vector3 | null = null;
      let isActivelyDrawing = false;

      anim.lines.forEach(line => {
        const userData = line.userData;
        const segStartTime = userData.startTime;
        const segEndTime = userData.endTime;
        const segDuration = segEndTime - segStartTime;

        if (elapsed >= segStartTime) {
          line.visible = true;
          const segElapsed = elapsed - segStartTime;
          const segProgress = Math.min(1, segElapsed / segDuration);

          const fromPoint = userData.fromPoint as THREE.Vector3;
          const toPoint = userData.toPoint as THREE.Vector3;

          const currentX = fromPoint.x + (toPoint.x - fromPoint.x) * segProgress;
          const currentY = fromPoint.y + (toPoint.y - fromPoint.y) * segProgress;
          const currentZ = fromPoint.z + (toPoint.z - fromPoint.z) * segProgress;

          const positions = line.geometry.attributes.position.array as Float32Array;
          positions[3] = currentX;
          positions[4] = currentY;
          positions[5] = currentZ;
          line.geometry.attributes.position.needsUpdate = true;

          if (segProgress < 1) {
            currentGlowPos = new THREE.Vector3(currentX, currentY, currentZ);
            isActivelyDrawing = true;
            const material = line.material as THREE.LineBasicMaterial;
            material.color.setHex(0x00ffff);
          } else {
            const material = line.material as THREE.LineBasicMaterial;
            material.color.setHex(0x40e0d0);
            material.opacity = 1;
          }
        }
      });

      if (anim.glowSphere && anim.glowLight) {
        if (isActivelyDrawing && currentGlowPos) {
          anim.glowSphere.visible = true;
          anim.glowLight.visible = true;
          anim.glowSphere.position.copy(currentGlowPos);
          anim.glowLight.position.copy(currentGlowPos);

          const pulse = 1 + Math.sin(now * 0.01) * 0.3;
          anim.glowSphere.scale.setScalar(pulse);
          anim.glowLight.intensity = 2 + Math.sin(now * 0.015) * 0.5;
        } else {
          anim.glowSphere.visible = false;
          anim.glowLight.visible = false;
        }
      }

      if (progress >= 1) {
        anim.completed = true;
        if (anim.glowSphere) anim.glowSphere.visible = false;
        if (anim.glowLight) anim.glowLight.visible = false;
      } else {
        animationId = requestAnimationFrame(animateWardrobe);
      }
    };

    animateWardrobe();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [sceneReady]);

  useEffect(() => {
    console.log('Zone3D preview effect:', { sceneReady, terrainPreview, terrain, hasScene: !!sceneRef.current });
    if (!sceneRef.current) return;

    if (previewMeshRef.current) {
      sceneRef.current.remove(previewMeshRef.current);
      if (previewMeshRef.current instanceof THREE.Mesh) {
        previewMeshRef.current.geometry.dispose();
        (previewMeshRef.current.material as THREE.Material).dispose();
      }
      previewMeshRef.current = null;
    }
    if (previewGridRef.current) {
      sceneRef.current.remove(previewGridRef.current);
      previewGridRef.current = null;
    }
    if (previewBorderRef.current) {
      sceneRef.current.remove(previewBorderRef.current);
      previewBorderRef.current.geometry.dispose();
      (previewBorderRef.current.material as THREE.Material).dispose();
      previewBorderRef.current = null;
    }
    if (previewQuadrantsRef.current) {
      sceneRef.current.remove(previewQuadrantsRef.current);
      previewQuadrantsRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            (child.material as THREE.Material).dispose();
          }
        }
      });
      previewQuadrantsRef.current = null;
    }
    if (previewCompassRef.current) {
      sceneRef.current.remove(previewCompassRef.current);
      previewCompassRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
          if (child instanceof THREE.Mesh) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              (child.material as THREE.Material).dispose();
            }
          }
        }
      });
      previewCompassRef.current = null;
    }

    if (terrainPreview && !terrain) {
      const { width, length, cellSize } = terrainPreview;
      const cellsX = Math.ceil(width / cellSize);
      const cellsZ = Math.ceil(length / cellSize);
      const actualWidth = cellsX * cellSize;
      const actualLength = cellsZ * cellSize;
      const centerX = actualWidth / 2;
      const centerZ = actualLength / 2;
      const maxDimension = Math.max(actualWidth, actualLength);

      const quadrantsGroup = new THREE.Group();
      const halfW = actualWidth / 2;
      const halfL = actualLength / 2;
      const quadrantColors = [0x1a5c3a, 0x1e6b42, 0x22784a, 0x268552];
      const quadrantPositions = [
        { x: halfW / 2, z: halfL / 2 },
        { x: halfW + halfW / 2, z: halfL / 2 },
        { x: halfW / 2, z: halfL + halfL / 2 },
        { x: halfW + halfW / 2, z: halfL + halfL / 2 }
      ];

      quadrantPositions.forEach((pos, i) => {
        const quadGeom = new THREE.PlaneGeometry(halfW - 0.05, halfL - 0.05);
        const quadMat = new THREE.MeshBasicMaterial({
          color: quadrantColors[i],
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        const quad = new THREE.Mesh(quadGeom, quadMat);
        quad.rotation.x = -Math.PI / 2;
        quad.position.set(pos.x, -0.02, pos.z);
        quadrantsGroup.add(quad);
      });
      sceneRef.current.add(quadrantsGroup);
      previewQuadrantsRef.current = quadrantsGroup;

      const gridDivisions = Math.max(cellsX, cellsZ);
      const gridHelper = new THREE.GridHelper(
        maxDimension,
        gridDivisions,
        0x3d9e6a,
        0x2d7a52
      );
      gridHelper.position.set(centerX, 0.01, centerZ);
      gridHelper.visible = false;
      sceneRef.current.add(gridHelper);
      previewGridRef.current = gridHelper;

      const crossGeometry = new THREE.BufferGeometry();
      const crossVertices = new Float32Array([
        centerX, 0.04, 0, centerX, 0.04, actualLength,
        0, 0.04, centerZ, actualWidth, 0.04, centerZ
      ]);
      crossGeometry.setAttribute('position', new THREE.BufferAttribute(crossVertices, 3));
      const crossMaterial = new THREE.LineBasicMaterial({ color: 0x4ade80, linewidth: 2 });
      const crossLines = new THREE.LineSegments(crossGeometry, crossMaterial);
      sceneRef.current.add(crossLines);
      previewBorderRef.current = crossLines;

      const compassGroup = new THREE.Group();
      const compassSize = Math.min(actualWidth, actualLength) * 0.08;

      const circleGeom = new THREE.RingGeometry(compassSize * 0.8, compassSize, 32);
      const circleMat = new THREE.MeshBasicMaterial({ color: 0x0f1318, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      const circle = new THREE.Mesh(circleGeom, circleMat);
      circle.rotation.x = -Math.PI / 2;
      circle.position.y = 0.06;
      compassGroup.add(circle);

      const innerCircleGeom = new THREE.CircleGeometry(compassSize * 0.15, 16);
      const innerCircleMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
      const innerCircle = new THREE.Mesh(innerCircleGeom, innerCircleMat);
      innerCircle.rotation.x = -Math.PI / 2;
      innerCircle.position.y = 0.07;
      compassGroup.add(innerCircle);

      const arrowShape = new THREE.Shape();
      arrowShape.moveTo(0, compassSize * 0.7);
      arrowShape.lineTo(-compassSize * 0.15, compassSize * 0.2);
      arrowShape.lineTo(0, compassSize * 0.3);
      arrowShape.lineTo(compassSize * 0.15, compassSize * 0.2);
      arrowShape.closePath();
      const arrowGeomN = new THREE.ShapeGeometry(arrowShape);
      const arrowMatN = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
      const arrowN = new THREE.Mesh(arrowGeomN, arrowMatN);
      arrowN.rotation.x = -Math.PI / 2;
      arrowN.position.y = 0.08;
      compassGroup.add(arrowN);

      const arrowGeomS = new THREE.ShapeGeometry(arrowShape);
      const arrowMatS = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const arrowS = new THREE.Mesh(arrowGeomS, arrowMatS);
      arrowS.rotation.x = -Math.PI / 2;
      arrowS.rotation.z = Math.PI;
      arrowS.position.y = 0.08;
      compassGroup.add(arrowS);

      const createLabel = (text: string, color: number, posX: number, posZ: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = color === 0xef4444 ? '#ef4444' : '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(compassSize * 0.5, compassSize * 0.5, 1);
        sprite.position.set(posX, 0.1, posZ);
        return sprite;
      };

      compassGroup.add(createLabel('N', 0xef4444, 0, -compassSize * 0.95));
      compassGroup.add(createLabel('S', 0xffffff, 0, compassSize * 0.95));
      compassGroup.add(createLabel('E', 0xffffff, compassSize * 0.95, 0));
      compassGroup.add(createLabel('W', 0xffffff, -compassSize * 0.95, 0));

      compassGroup.position.set(centerX, 0, centerZ);
      sceneRef.current.add(compassGroup);
      previewCompassRef.current = compassGroup;

      if (cameraRef.current) {
        const cameraHeight = Math.max(25, maxDimension * 0.8);
        cameraRef.current.position.set(centerX, cameraHeight, centerZ);
        cameraRef.current.lookAt(centerX, 0, centerZ);
      }
    }
  }, [terrainPreview, terrain, sceneReady]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const applyColorMode = () => {
      if (sceneColorMode === 'default') {
        if (terrainGridRef.current) {
          terrainGridRef.current.visible = true;
          (terrainGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0x525252);
        }
        if (terrainSmallGridRef.current) {
          terrainSmallGridRef.current.visible = true;
          (terrainSmallGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0x404040);
        }
        if (terrainMeshRef.current) {
          const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x2a2a2a);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0;
          mat.roughness = 0.9;
          mat.metalness = 0.1;
          mat.needsUpdate = true;
          terrainMeshRef.current.receiveShadow = true;
        }
        if (gridHelperRef.current) {
          (gridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x475569);
        }
        if (subGridHelperRef.current) {
          (subGridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x334155);
        }
        if (groundPlaneRef.current) {
          const mat = groundPlaneRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x1e293b);
          mat.roughness = 0.8;
        }
      } else if (sceneColorMode === 'black') {
        if (terrainGridRef.current) {
          terrainGridRef.current.visible = true;
          (terrainGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0x000000);
        }
        if (terrainSmallGridRef.current) {
          terrainSmallGridRef.current.visible = true;
          (terrainSmallGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0x333333);
        }
        if (terrainMeshRef.current) {
          const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x000000);
          mat.emissive = new THREE.Color(0xffffff);
          mat.emissiveIntensity = 1;
          mat.roughness = 1;
          mat.metalness = 0;
          mat.needsUpdate = true;
          terrainMeshRef.current.receiveShadow = false;
        }
        if (gridHelperRef.current) {
          (gridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x1a1a1a);
        }
        if (subGridHelperRef.current) {
          (subGridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x0d0d0d);
        }
        if (groundPlaneRef.current) {
          const mat = groundPlaneRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0xf5f5f5);
          mat.roughness = 1.0;
        }
      } else if (sceneColorMode === 'whiteGrid') {
        if (terrainGridRef.current) {
          terrainGridRef.current.visible = true;
          (terrainGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0xffffff);
        }
        if (terrainSmallGridRef.current) {
          terrainSmallGridRef.current.visible = true;
          (terrainSmallGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0xcccccc);
        }
        if (terrainMeshRef.current) {
          const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x000000);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0;
          mat.roughness = 0.9;
          mat.metalness = 0.1;
          mat.needsUpdate = true;
          terrainMeshRef.current.receiveShadow = true;
        }
        if (gridHelperRef.current) {
          (gridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0xe0e0e0);
        }
        if (subGridHelperRef.current) {
          (subGridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0xcccccc);
        }
        if (groundPlaneRef.current) {
          const mat = groundPlaneRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x0a0a0a);
          mat.roughness = 1.0;
        }
      } else if (sceneColorMode === 'navyTech') {
        if (terrainGridRef.current) {
          terrainGridRef.current.visible = true;
          (terrainGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0x1565c0);
        }
        if (terrainSmallGridRef.current) {
          terrainSmallGridRef.current.visible = true;
          (terrainSmallGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0x0d3c61);
        }
        if (terrainMeshRef.current) {
          const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x061220);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0;
          mat.roughness = 0.9;
          mat.metalness = 0.1;
          mat.needsUpdate = true;
          terrainMeshRef.current.receiveShadow = true;
        }
        if (gridHelperRef.current) {
          (gridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x1565c0);
        }
        if (subGridHelperRef.current) {
          (subGridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x0d3c61);
        }
        if (groundPlaneRef.current) {
          const mat = groundPlaneRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x061220);
          mat.roughness = 0.9;
        }
      } else if (sceneColorMode === 'navyWhite') {
        if (terrainGridRef.current) {
          terrainGridRef.current.visible = true;
          (terrainGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0xffffff);
        }
        if (terrainSmallGridRef.current) {
          terrainSmallGridRef.current.visible = true;
          (terrainSmallGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0xcccccc);
        }
        if (terrainMeshRef.current) {
          const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x1a2744);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0;
          mat.roughness = 1.0;
          mat.metalness = 0;
          mat.needsUpdate = true;
          terrainMeshRef.current.receiveShadow = true;
        }
        if (gridHelperRef.current) {
          (gridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0xffffff);
        }
        if (subGridHelperRef.current) {
          (subGridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0xcccccc);
        }
        if (groundPlaneRef.current) {
          const mat = groundPlaneRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x1a2744);
          mat.roughness = 1.0;
        }
      } else if (sceneColorMode === 'whiteMatte') {
        if (terrainGridRef.current) {
          terrainGridRef.current.visible = true;
          (terrainGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0x2a2a2a);
        }
        if (terrainSmallGridRef.current) {
          terrainSmallGridRef.current.visible = true;
          (terrainSmallGridRef.current.material as THREE.LineBasicMaterial).color.setHex(0x4a4a4a);
        }
        if (terrainMeshRef.current) {
          const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0xf8f8f8);
          mat.emissive = new THREE.Color(0xf8f8f8);
          mat.emissiveIntensity = 0.3;
          mat.roughness = 1.0;
          mat.metalness = 0;
          mat.needsUpdate = true;
          terrainMeshRef.current.receiveShadow = false;
        }
        if (gridHelperRef.current) {
          (gridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x2a2a2a);
        }
        if (subGridHelperRef.current) {
          (subGridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x4a4a4a);
        }
        if (groundPlaneRef.current) {
          const mat = groundPlaneRef.current.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0xf8f8f8);
          mat.roughness = 1.0;
        }
      }
    };

    applyColorMode();
  }, [sceneColorMode]);

  useEffect(() => {
    if (!sceneRef.current) return;

    switch (ambiance) {
      case 'white':
        sceneRef.current.background = new THREE.Color(0xffffff);
        break;
      case 'black':
        sceneRef.current.background = new THREE.Color(0x000000);
        break;
      case 'navyBlue':
        sceneRef.current.background = new THREE.Color(0x0a1929);
        break;
      case 'nightBlue':
        sceneRef.current.background = new THREE.Color(0x0d1b2a);
        break;
    }
  }, [ambiance]);

  useEffect(() => {
    if (terrainGridRef.current) {
      terrainGridRef.current.visible = isGridVisible;
    }
    if (terrainSmallGridRef.current) {
      terrainSmallGridRef.current.visible = isGridVisible;
    }
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = isGridVisible;
    }
    if (subGridHelperRef.current) {
      subGridHelperRef.current.visible = isGridVisible;
    }
    if (previewGridRef.current) {
      previewGridRef.current.visible = isGridVisible;
    }
  }, [isGridVisible]);

  const raycaster3DRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const groundPlane3DRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const liveDrawing3DLocalGroupRef = useRef<THREE.Group | null>(null);
  const currentStroke3DWorldPointsRef = useRef<THREE.Vector3[]>([]);
  const currentLine3DMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (sceneRef.current && !liveDrawing3DLocalGroupRef.current) {
      liveDrawing3DLocalGroupRef.current = new THREE.Group();
      liveDrawing3DLocalGroupRef.current.position.y = 0.1;
      sceneRef.current.add(liveDrawing3DLocalGroupRef.current);
    }
  }, [sceneReady]);

  const getWorldPosition3D = (clientX: number, clientY: number): THREE.Vector3 | null => {
    if (!containerRef.current || !cameraRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster3DRef.current.setFromCamera(mouse, cameraRef.current);
    const intersectPoint = new THREE.Vector3();
    raycaster3DRef.current.ray.intersectPlane(groundPlane3DRef.current, intersectPoint);

    return intersectPoint;
  };

  const updateLiveStroke3DMesh = () => {
    if (!liveDrawing3DLocalGroupRef.current) return;

    if (currentLine3DMeshRef.current) {
      liveDrawing3DLocalGroupRef.current.remove(currentLine3DMeshRef.current);
      currentLine3DMeshRef.current.geometry.dispose();
      (currentLine3DMeshRef.current.material as THREE.Material).dispose();
      currentLine3DMeshRef.current = null;
    }

    const points = currentStroke3DWorldPointsRef.current;
    if (points.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, Math.max(points.length * 2, 8), 0.05, 8, false);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const tubeMesh = new THREE.Mesh(tubeGeometry, material);

    liveDrawing3DLocalGroupRef.current.add(tubeMesh);
    currentLine3DMeshRef.current = tubeMesh;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();

      const worldPos = getWorldPosition3D(e.clientX, e.clientY);
      if (!worldPos) return;

      setIsActiveDrawing3D(true);
      strokeStartTime3DRef.current = Date.now();
      currentStroke3DWorldPointsRef.current = [worldPos.clone()];
      currentStroke3DRef.current = [{ x: worldPos.x, y: worldPos.z, timestamp: 0 }];

      if (onStartDrawingRef.current) {
        onStartDrawingRef.current();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isActiveDrawing3D) return;

      const worldPos = getWorldPosition3D(e.clientX, e.clientY);
      if (!worldPos) return;

      const lastPoint = currentStroke3DWorldPointsRef.current[currentStroke3DWorldPointsRef.current.length - 1];
      if (lastPoint && worldPos.distanceTo(lastPoint) < 0.1) return;

      const timestamp = Date.now() - strokeStartTime3DRef.current;
      currentStroke3DWorldPointsRef.current.push(worldPos.clone());
      currentStroke3DRef.current.push({ x: worldPos.x, y: worldPos.z, timestamp });

      updateLiveStroke3DMesh();

      if (onUpdateLivePointsRef.current && currentStroke3DRef.current.length >= 2) {
        onUpdateLivePointsRef.current([...currentStroke3DRef.current]);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 1 || !isActiveDrawing3D) return;

      setIsActiveDrawing3D(false);

      if (currentStroke3DRef.current.length >= 2 && onAddStrokeRef.current) {
        const endTime = Date.now() - strokeStartTime3DRef.current;
        const stroke: DrawingStroke = {
          points: currentStroke3DRef.current,
          color: '#00ffff',
          width: 3,
          startTime: 0,
          endTime
        };
        onAddStrokeRef.current(stroke);
      }

      currentStroke3DRef.current = [];
      currentStroke3DWorldPointsRef.current = [];
    };

    const preventMiddleClickScroll = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('auxclick', preventMiddleClickScroll);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('auxclick', preventMiddleClickScroll);
    };
  }, [isActiveDrawing3D]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0a0d14] relative">
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
        <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-cyan-500/30 via-transparent to-cyan-500/20"></div>
        <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-cyan-500/30 via-transparent to-cyan-500/20"></div>
      </div>

      <div className="absolute top-0 left-0 right-0 z-50 bg-[#0f1318]/98 backdrop-blur-md border-b border-cyan-500/20 shadow-xl">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
        <div className="absolute inset-0 bg-tech-grid opacity-10"></div>
        <div className="relative flex items-center justify-between gap-2 px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0a0d14] flex items-center justify-center border border-cyan-500/30 relative">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400"></div>
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wider uppercase">Editeur 3D</span>
              <p className="text-[9px] text-cyan-500/60 font-mono">VIEW.3D.RENDER</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newState = !isActiveProp;
                isActiveRef.current = newState;
                onActiveChange?.(newState);
              }}
              className={`relative w-8 h-8 transition-all duration-300 ${
                isActiveProp
                  ? 'bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-red-500/20 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              }`}
              title={isActiveProp ? "Fenetre 3D active" : "Fenetre 3D inactive"}
            >
              <div className={`absolute inset-1 ${isActiveProp ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isViewLockedRefLocal.current = !isViewLockedRefLocal.current;
                const event = new CustomEvent('viewLockChanged3D', {
                  detail: { locked: isViewLockedRefLocal.current }
                });
                window.dispatchEvent(event);
                if (isViewLockedRefLocal.current && document.pointerLockElement === rendererRef.current?.domElement) {
                  document.exitPointerLock();
                }
              }}
              className={`relative w-8 h-8 flex items-center justify-center transition-all duration-300 ${
                isViewLocked
                  ? 'bg-amber-500/20 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-gray-500/20 border border-gray-500/50'
              }`}
              title={isViewLocked ? "Vue bloquee" : "Vue debloquee"}
            >
              {isViewLocked ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <Unlock className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <div className="relative" ref={cameraModeMenuRef}>
              <button
                onClick={() => setIsCameraModeMenuOpen(!isCameraModeMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0a0d14] border border-cyan-500/30 font-medium transition-all text-xs uppercase tracking-wider text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5"
              >
                {cameraMode === 'fps' ? (
                  <Video className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span>{cameraMode === 'fps' ? 'FPS' : '3rd Person'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isCameraModeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCameraModeMenuOpen && (
                <div className="absolute top-full mt-1 left-0 bg-[#0a0d14] border border-cyan-500/30 shadow-2xl z-50 min-w-[180px] overflow-hidden">
                  <button
                    onClick={() => {
                      setCameraMode('fps');
                      cameraModeRef.current = 'fps';
                      if (cameraRef.current) {
                        if (characterRef.current) {
                          cameraRef.current.position.x = characterRef.current.position.x;
                          cameraRef.current.position.z = characterRef.current.position.z;
                        }
                        cameraRef.current.position.y = 1.75;
                      }
                      setIsCameraModeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      cameraMode === 'fps' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>FPS</span>
                  </button>

                  <button
                    onClick={() => {
                      setCameraMode('thirdPerson');
                      cameraModeRef.current = 'thirdPerson';
                      if (cameraRef.current) {
                        const centerX = gridSettings.gridWidthMeters / 2;
                        const centerZ = gridSettings.gridLengthMeters / 2;
                        cameraRef.current.position.set(centerX - 5, 3, centerZ - 5);
                        cameraRef.current.lookAt(centerX, 1.0, centerZ);
                      }
                      setIsCameraModeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      cameraMode === 'thirdPerson' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>3rd Person</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-cyan-500/20"></div>

            <div className="relative" ref={skyModeMenuRef}>
              <button
                onClick={() => setIsSkyModeMenuOpen(!isSkyModeMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0a0d14] border border-cyan-500/30 font-medium transition-all text-xs uppercase tracking-wider text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5"
              >
                {skyMode === 'day' ? (
                  <Sun className="w-3.5 h-3.5" />
                ) : skyMode === 'night' ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : skyMode === 'sunset' ? (
                  <Sunset className="w-3.5 h-3.5" />
                ) : skyMode === 'snowstorm' ? (
                  <CloudSnow className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                <span>Ciel</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isSkyModeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSkyModeMenuOpen && (
                <div className="absolute top-full mt-1 left-0 bg-[#0a0d14] border border-cyan-500/30 shadow-2xl z-50 min-w-[180px] overflow-hidden">
                  <button
                    onClick={() => {
                      setSkyMode('normal');
                      setIsSkyModeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      skyMode === 'normal' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>Eteint</span>
                  </button>

                  <button
                    onClick={() => {
                      setSkyMode('day');
                      setIsSkyModeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      skyMode === 'day' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Jour</span>
                  </button>

                  <button
                    onClick={() => {
                      setSkyMode('sunset');
                      setIsSkyModeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      skyMode === 'sunset' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <Sunset className="w-4 h-4" />
                    <span>Chaude</span>
                  </button>

                  <button
                    onClick={() => {
                      setSkyMode('night');
                      setIsSkyModeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      skyMode === 'night' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Nuit</span>
                  </button>

                  <button
                    onClick={() => {
                      setSkyMode('snowstorm');
                      setIsSkyModeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      skyMode === 'snowstorm' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <CloudSnow className="w-4 h-4" />
                    <span>Tempete</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-cyan-500/20"></div>

            <button
              onClick={() => setIsGridVisible(!isGridVisible)}
              className={`relative w-8 h-8 flex items-center justify-center transition-all duration-300 ${
                isGridVisible
                  ? 'bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-gray-500/20 border border-gray-500/50'
              }`}
              title={isGridVisible ? "Masquer la grille" : "Afficher la grille"}
            >
              {isGridVisible ? (
                <Grid3X3 className="w-4 h-4 text-cyan-400" />
              ) : (
                <Grid3X3 className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <div className="h-6 w-px bg-cyan-500/20"></div>

            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0a0d14] border border-cyan-500/30 font-medium transition-all text-xs uppercase tracking-wider text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Theme</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isThemeMenuOpen && (
                <div className="absolute top-full mt-1 left-0 bg-[#0a0d14] border border-cyan-500/30 shadow-2xl z-50 min-w-[180px] overflow-hidden">
                  <button
                    onClick={() => {
                      setSceneColorMode('default');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      sceneColorMode === 'default' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <div className="w-4 h-4 bg-gray-600 border border-gray-500"></div>
                    <span>Default</span>
                  </button>

                  <button
                    onClick={() => {
                      setSceneColorMode('navyTech');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      sceneColorMode === 'navyTech' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <div className="w-4 h-4 bg-blue-900 border border-blue-700"></div>
                    <span>Navy Tech</span>
                  </button>

                  <button
                    onClick={() => {
                      setSceneColorMode('navyWhite');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      sceneColorMode === 'navyWhite' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <div className="w-4 h-4 bg-slate-700 border border-white"></div>
                    <span>Navy/White</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-cyan-500/20"></div>

            <div className="relative" ref={ambianceMenuRef}>
              <button
                onClick={() => setIsAmbianceMenuOpen(!isAmbianceMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0a0d14] border border-cyan-500/30 font-medium transition-all text-xs uppercase tracking-wider text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Ambiance</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isAmbianceMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAmbianceMenuOpen && (
                <div className="absolute top-full mt-1 left-0 bg-[#0a0d14] border border-cyan-500/30 shadow-2xl z-50 min-w-[180px] overflow-hidden">
                  <button
                    onClick={() => {
                      setAmbiance('white');
                      setIsAmbianceMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      ambiance === 'white' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white border border-gray-300"></div>
                    <span>Light</span>
                  </button>

                  <button
                    onClick={() => {
                      setAmbiance('black');
                      setIsAmbianceMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      ambiance === 'black' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <div className="w-4 h-4 bg-black border border-gray-600"></div>
                    <span>Dark</span>
                  </button>

                  <button
                    onClick={() => {
                      setAmbiance('navyBlue');
                      setIsAmbianceMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      ambiance === 'navyBlue' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <div className="w-4 h-4 bg-blue-950 border border-blue-800"></div>
                    <span>Navy</span>
                  </button>

                  <button
                    onClick={() => {
                      setAmbiance('nightBlue');
                      setIsAmbianceMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      ambiance === 'nightBlue' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <div className="w-4 h-4 bg-slate-900 border border-slate-700"></div>
                    <span>Night</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-16 right-4 z-40 bg-[#0f1318]/95 backdrop-blur-md border border-cyan-500/20 shadow-xl overflow-hidden">
        <div className="text-[10px] text-cyan-400 font-mono uppercase text-center py-2 bg-[#0a0d14] border-b border-cyan-500/20 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan-400"></div>
          Axes
        </div>
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500"></div>
            <span className="text-[10px] text-gray-400 font-mono">X: Front/Back</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500"></div>
            <span className="text-[10px] text-gray-400 font-mono">Y: Left/Right</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500"></div>
            <span className="text-[10px] text-gray-400 font-mono">Z: Up/Down</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-40 bg-[#0f1318]/95 backdrop-blur-md border border-cyan-500/20 shadow-xl p-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[9px] text-cyan-500/50 font-mono uppercase tracking-wider">Mode</p>
            <p className={`text-lg font-bold font-mono ${cameraMode === 'fps' ? 'text-cyan-400' : 'text-emerald-400'}`}>
              {cameraMode === 'fps' ? 'FPS' : '3RD'}
            </p>
          </div>
          <div className="pt-2 border-t border-cyan-500/20">
            <p className="text-[9px] text-cyan-500/50 font-mono uppercase tracking-wider">Speed</p>
            <p className="text-2xl font-bold text-cyan-400 font-mono">{currentSpeedLevel}</p>
          </div>
          {isViewLocked && (
            <div className="pt-2 border-t border-cyan-500/20">
              <p className="text-[9px] text-cyan-500/50 font-mono uppercase tracking-wider">Zoom</p>
              <p className="text-lg font-bold text-white font-mono">{currentZoom}</p>
            </div>
          )}
        </div>
      </div>

      {cameraMode === 'thirdPerson' && (
        <div className="absolute bottom-4 right-4 z-40 bg-[#0f1318]/95 backdrop-blur-md border border-cyan-500/20 shadow-xl p-4">
          <div className="text-[10px] text-cyan-400 font-mono uppercase mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-cyan-400"></div>
            Controls
          </div>
          <div className="flex flex-col gap-1.5 text-[10px] text-gray-400 font-mono">
            <span>S - Forward</span>
            <span>W - Back</span>
            <span>A - Left</span>
            <span>D - Right</span>
            <span>Shift - Run</span>
            <span>Mouse - Rotate</span>
          </div>
        </div>
      )}

      {isCharacterLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0f1318]/95 backdrop-blur-md border border-cyan-500/30 shadow-2xl p-6">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-sm text-gray-300 font-mono uppercase tracking-wider">Loading character...</span>
          </div>
        </div>
      )}

      {characterLoadError && !isCharacterLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-amber-500/20 backdrop-blur-md border border-amber-500/50 shadow-lg px-4 py-2">
          <span className="text-xs text-amber-400 font-mono">{characterLoadError}</span>
        </div>
      )}

    </div>
  );
};

export default Zone3D;
