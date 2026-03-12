import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GridSettings, Wall, Brick, Block, TerrainCell, TerrainType } from '../types/Scene';
import { Sun, Moon, Lock, Unlock, Navigation, Hammer, Box, ChevronDown, Mountain, Grid3x3, Pencil } from 'lucide-react';
import { LibraryElement, ScenePlacedElement, DrawingStroke, DrawingPoint } from '../types/ElementLibrary';
import SceneElementPlayer from './SceneElementPlayer';

type EditorMode = 'navigation' | 'terrain' | 'construction' | 'robot';

interface TerrainConfig {
  width: number;
  length: number;
  cellSize: number;
}

interface Zone2DProps {
  gridSettings: GridSettings;
  walls: Wall[];
  blocks: Block[];
  bricks: Brick[];
  terrainCells: TerrainCell[];
  onAddWall: (wall: Wall) => void;
  onAddBlock: (block: Block) => void;
  onRemoveBlock: (id: string) => void;
  onAddBrick: (brick: Brick) => void;
  onRemoveWall: (id: string) => void;
  onRemoveBrick: (id: string) => void;
  onAddTerrainCell: (cell: TerrainCell) => void;
  onRemoveTerrainCell: (id: string) => void;
  isActive?: boolean;
  onActiveChange?: (active: boolean) => void;
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
  terrain: TerrainConfig | null;
  terrainPreview?: TerrainConfig | null;
  thirdModeLabel?: string;
  thirdModeValue?: 'construction' | 'robot';
  selectedLibraryElement?: LibraryElement | null;
  placedElements?: ScenePlacedElement[];
  elementsMap?: Map<string, LibraryElement>;
  onPlaceElement?: (element: LibraryElement, x: number, y: number) => void;
  onElementDrawingComplete?: (placedElementId: string) => void;
  isDrawingMode?: boolean;
  onStartDrawing?: () => void;
  onAddStroke?: (stroke: DrawingStroke) => void;
  onStopDrawing?: () => void;
  onUpdateLivePoints?: (points: DrawingPoint[]) => void;
}

const Zone2D: React.FC<Zone2DProps> = ({
  gridSettings, walls, blocks, bricks, terrainCells,
  onAddBlock, onRemoveBlock, onAddTerrainCell, onRemoveTerrainCell,
  isActive: isActiveProp = true, onActiveChange,
  editorMode, onEditorModeChange, terrain, terrainPreview,
  thirdModeLabel = 'Construction',
  thirdModeValue = 'construction',
  selectedLibraryElement,
  placedElements = [],
  elementsMap = new Map(),
  onPlaceElement,
  onElementDrawingComplete,
  isDrawingMode = false,
  onStartDrawing,
  onAddStroke,
  onStopDrawing,
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
  const isViewLockedRefLocal = useRef(true);
  const previewWallMeshRef = useRef<THREE.Mesh | null>(null);
  const [isFPSMode] = React.useState(true);
  const [isDayMode, setIsDayMode] = useState(true);
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
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentSpeedLevel, setCurrentSpeedLevel] = useState(2);
  const [currentZoom, setCurrentZoom] = useState(500);
  const [isOrthographic, setIsOrthographic] = useState(false);
  const [isViewLocked, setIsViewLocked] = useState(true);
  const isActiveRef = useRef(isActiveProp);
  const [isFocused, setIsFocused] = useState(false);
  const isFocusedRef = useRef(false);
  const [hoveredBlock, setHoveredBlock] = useState<{ gridX: number; gridZ: number } | null>(null);
  const [previewWall, setPreviewWall] = useState<{ startX: number; startZ: number; endX: number; endZ: number } | null>(null);
  const hoverMeshRef = useRef<THREE.Mesh | null>(null);
  const [selectedTool, setSelectedTool] = useState<'block' | null>(null);
  const [selectedTerrainType, setSelectedTerrainType] = useState<TerrainType>('grass');
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const editorModeRef = useRef<EditorMode>('navigation');
  const selectedToolRef = useRef<'block' | null>(null);
  const selectedTerrainTypeRef = useRef<TerrainType>('grass');
  const selectedLibraryElementRef = useRef<LibraryElement | null>(null);
  const onPlaceElementRef = useRef<((element: LibraryElement, x: number, y: number) => void) | undefined>(undefined);
  const terrainGroupRef = useRef<THREE.Group | null>(null);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isAmbianceMenuOpen, setIsAmbianceMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const ambianceMenuRef = useRef<HTMLDivElement>(null);
  const [sceneColorMode, setSceneColorMode] = useState<'default' | 'navyTech' | 'navyWhite'>('default');
  const [ambiance, setAmbiance] = useState<'white' | 'black' | 'navyBlue' | 'nightBlue'>('black');
  const [cameraPosition, setCameraPosition] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [isTopView, setIsTopView] = useState(true);

  const [isActiveDrawing, setIsActiveDrawing] = useState(false);
  const currentStrokeRef = useRef<DrawingPoint[]>([]);
  const strokeStartTimeRef = useRef<number>(0);
  const onAddStrokeRef = useRef(onAddStroke);
  const onStopDrawingRef = useRef(onStopDrawing);
  const onUpdateLivePointsRef = useRef(onUpdateLivePoints);

  useEffect(() => {
    onAddStrokeRef.current = onAddStroke;
  }, [onAddStroke]);

  useEffect(() => {
    onStopDrawingRef.current = onStopDrawing;
  }, [onStopDrawing]);

  useEffect(() => {
    onUpdateLivePointsRef.current = onUpdateLivePoints;
  }, [onUpdateLivePoints]);

  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const terrainGridRef = useRef<THREE.GridHelper | null>(null);
  const terrainSmallGridRef = useRef<THREE.GridHelper | null>(null);
  const previewMeshRef = useRef<THREE.Mesh | null>(null);
  const previewGridRef = useRef<THREE.GridHelper | null>(null);
  const previewBorderRef = useRef<THREE.LineSegments | null>(null);
  const previewQuadrantsRef = useRef<THREE.Group | null>(null);
  const previewCompassRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    isActiveRef.current = isActiveProp;
  }, [isActiveProp]);

  useEffect(() => {
    currentSpeedLevelRef.current = currentSpeedLevel;
  }, [currentSpeedLevel]);

  useEffect(() => {
    speedSettingsRef.current = speedSettings;
  }, [speedSettings]);

  useEffect(() => {
    editorModeRef.current = editorMode;
  }, [editorMode]);

  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    selectedTerrainTypeRef.current = selectedTerrainType;
  }, [selectedTerrainType]);

  useEffect(() => {
    selectedLibraryElementRef.current = selectedLibraryElement || null;
  }, [selectedLibraryElement]);

  useEffect(() => {
    onPlaceElementRef.current = onPlaceElement;
  }, [onPlaceElement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) {
        setIsModeMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
      if (ambianceMenuRef.current && !ambianceMenuRef.current.contains(event.target as Node)) {
        setIsAmbianceMenuOpen(false);
      }
    };

    if (isModeMenuOpen || isThemeMenuOpen || isAmbianceMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModeMenuOpen, isThemeMenuOpen, isAmbianceMenuOpen]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);
    sceneRef.current = scene;

    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
    const centerX = gridSettings.gridWidthMeters / 2;
    const centerZ = gridSettings.gridLengthMeters / 2;
    camera.position.set(centerX, 1, centerZ);
    camera.lookAt(centerX, 0, centerZ);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

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

    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);
    terrainGroupRef.current = terrainGroup;


    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraRotation = { theta: Math.PI / 4, phi: Math.PI / 4 };
    let cameraDistance = 100;

    const fpsRotation = { yaw: 0, pitch: 0 };
    const keys2D: { [key: string]: boolean } = {};

    const updateFPSCamera = () => {
      if (!cameraRef.current) return;

      const direction = new THREE.Vector3();
      direction.x = -Math.sin(fpsRotation.yaw) * Math.cos(fpsRotation.pitch);
      direction.y = Math.sin(fpsRotation.pitch);
      direction.z = -Math.cos(fpsRotation.yaw) * Math.cos(fpsRotation.pitch);

      const lookAt = new THREE.Vector3().addVectors(cameraRef.current.position, direction);
      cameraRef.current.lookAt(lookAt);
    };

    updateFPSCamera();

    const getBlockGridPosition = (clientX: number, clientY: number): { gridX: number; gridZ: number } | null => {
      if (!cameraRef.current || !rendererRef.current) return null;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      // Créer un plan au niveau du sol (y = 0)
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();

      // Trouver l'intersection avec le plan du sol
      const rayOrigin = raycaster.ray.origin;
      const rayDirection = raycaster.ray.direction;

      raycaster.ray.intersectPlane(groundPlane, intersectionPoint);

      if (intersectionPoint) {
        const blockSize = gridSettings.blockSize;
        const gridX = Math.floor(intersectionPoint.x / blockSize);
        const gridZ = Math.floor(intersectionPoint.z / blockSize);
        return { gridX, gridZ };
      }

      return null;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isActiveRef.current) return;

      if (isViewLockedRefLocal.current && e.button === 1) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        return;
      }

      if (isViewLockedRefLocal.current && (editorModeRef.current === 'construction' || editorModeRef.current === 'robot') && e.button === 0) {
        const gridPos = getBlockGridPosition(e.clientX, e.clientY);

        if (gridPos && selectedToolRef.current === 'block') {
          const existingBlock = blocks.find(b => b.gridX === gridPos.gridX && b.gridZ === gridPos.gridZ);

          if (!existingBlock) {
            let imageUrl: string | undefined;
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
              rendererRef.current.render(sceneRef.current, cameraRef.current);
              imageUrl = rendererRef.current.domElement.toDataURL('image/png');
            }

            const newBlock: Block = {
              id: `block-${Date.now()}-${Math.random()}`,
              gridX: gridPos.gridX,
              gridZ: gridPos.gridZ,
              height: gridSettings.wallHeight,
              imageUrl: imageUrl
            };
            onAddBlock(newBlock);
          }
        }
        return;
      }

      if (isViewLockedRefLocal.current && (editorModeRef.current === 'construction' || editorModeRef.current === 'robot') && e.button === 2) {
        const gridPos = getBlockGridPosition(e.clientX, e.clientY);
        if (gridPos) {
          const blockToRemove = blocks.find(b => b.gridX === gridPos.gridX && b.gridZ === gridPos.gridZ);
          if (blockToRemove) {
            onRemoveBlock(blockToRemove.id);
            if (selectedBlock === blockToRemove.id) {
              setSelectedBlock(null);
            }
          }
        }
        return;
      }

      if (isViewLockedRefLocal.current && editorModeRef.current === 'terrain' && e.button === 0) {
        const gridPos = getBlockGridPosition(e.clientX, e.clientY);
        if (gridPos) {
          const existingCell = terrainCells.find(c => c.gridX === gridPos.gridX && c.gridZ === gridPos.gridZ);
          if (existingCell) {
            onRemoveTerrainCell(existingCell.id);
          }
          const newCell: TerrainCell = {
            id: `terrain-${Date.now()}-${Math.random()}`,
            gridX: gridPos.gridX,
            gridZ: gridPos.gridZ,
            type: selectedTerrainTypeRef.current,
            elevation: 0
          };
          onAddTerrainCell(newCell);
        }
        return;
      }

      if (isViewLockedRefLocal.current && editorModeRef.current === 'terrain' && e.button === 2) {
        const gridPos = getBlockGridPosition(e.clientX, e.clientY);
        if (gridPos) {
          const cellToRemove = terrainCells.find(c => c.gridX === gridPos.gridX && c.gridZ === gridPos.gridZ);
          if (cellToRemove) {
            onRemoveTerrainCell(cellToRemove.id);
          }
        }
        return;
      }

      if (isViewLockedRefLocal.current) {
        if (e.button === 2) {
          isDragging = true;
          previousMousePosition = { x: e.clientX, y: e.clientY };
        }
        return;
      }

      if (e.button === 0) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isActiveRef.current) return;

      if (isDragging && cameraRef.current && isViewLockedRefLocal.current) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        const currentHeight = cameraRef.current.position.y;
        const panSpeed = currentHeight * 0.003;

        const camera = cameraRef.current;
        const right = new THREE.Vector3(1, 0, 0);
        const forward = new THREE.Vector3(0, 0, 1);

        camera.position.addScaledVector(right, -deltaX * panSpeed);
        camera.position.addScaledVector(forward, -deltaY * panSpeed);

        const lookAtPoint = new THREE.Vector3(
          camera.position.x,
          0,
          camera.position.z
        );
        camera.lookAt(lookAtPoint);

        previousMousePosition = { x: e.clientX, y: e.clientY };
        return;
      }

      if (isViewLockedRefLocal.current && !isDragging && (editorModeRef.current === 'construction' || editorModeRef.current === 'robot')) {
        const gridPos = getBlockGridPosition(e.clientX, e.clientY);
        if (gridPos) {
          setHoveredBlock(gridPos);
        } else {
          setHoveredBlock(null);
        }
        return;
      }

      if (isViewLockedRefLocal.current && isDragging && cameraRef.current) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        const currentHeight = cameraRef.current.position.y;
        const panSpeed = currentHeight * 0.003;

        const camera = cameraRef.current;
        const right = new THREE.Vector3(1, 0, 0);
        const forward = new THREE.Vector3(0, 0, 1);

        camera.position.addScaledVector(right, -deltaX * panSpeed);
        camera.position.addScaledVector(forward, -deltaY * panSpeed);

        const lookAtPoint = new THREE.Vector3(
          camera.position.x,
          0,
          camera.position.z
        );
        camera.lookAt(lookAtPoint);

        previousMousePosition = { x: e.clientX, y: e.clientY };
        return;
      }

      if (isViewLockedRefLocal.current) return;

      // Mode débloqué: rotation seulement si on maintient clic gauche
      if (!isViewLockedRefLocal.current && isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        fpsRotation.yaw -= deltaX * 0.005;
        fpsRotation.pitch -= deltaY * 0.005;
        fpsRotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, fpsRotation.pitch));

        previousMousePosition = { x: e.clientX, y: e.clientY };
        updateFPSCamera();
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (isViewLockedRefLocal.current && cameraRef.current) {
        const currentHeight = cameraRef.current.position.y;
        const zoomDelta = e.deltaY > 0 ? 5 : -5;
        const newHeight = Math.max(1, Math.min(500, currentHeight + zoomDelta));

        // Calcul du zoom: hauteur 500 = zoom 1, hauteur 1 = zoom 500
        const zoomLevel = Math.round(501 - newHeight);

        cameraRef.current.position.y = newHeight;

        const lookAtPoint = new THREE.Vector3(
          cameraRef.current.position.x,
          0,
          cameraRef.current.position.z
        );
        cameraRef.current.lookAt(lookAtPoint);
        cameraRef.current.updateProjectionMatrix();

        setCurrentZoom(Math.max(1, Math.min(500, zoomLevel)));

        setHoveredBlock(null);
        return;
      }

      if (!isFPSMode) {
        cameraDistance = Math.max(10, Math.min(500, cameraDistance + e.deltaY * 0.1));
        updateCameraPosition();
        const zoomLevel = Math.round((1 - (cameraDistance - 10) / (500 - 10)) * 200);
        setCurrentZoom(zoomLevel);
      } else {
        // Changer le niveau de vitesse avec la molette (en mode déverrouillé)
        const levelChange = e.deltaY > 0 ? -1 : 1;
        const newLevel = Math.max(0, Math.min(10, currentSpeedLevelRef.current + levelChange));
        setCurrentSpeedLevel(newLevel);
      }
    };

    const updateCameraPosition = () => {
      if (!cameraRef.current || isFPSMode) return;

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

      keys2D[e.key.toLowerCase()] = true;

      // Touches + et - pour contrôler la vitesse
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const newLevel = Math.min(10, currentSpeedLevelRef.current + 1);
        currentSpeedLevelRef.current = newLevel;
        setCurrentSpeedLevel(newLevel);
        const newSpeed = speedSettingsRef.current[newLevel as keyof typeof speedSettingsRef.current];
        setCurrentSpeed(newSpeed);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        const newLevel = Math.max(0, currentSpeedLevelRef.current - 1);
        currentSpeedLevelRef.current = newLevel;
        setCurrentSpeedLevel(newLevel);
        const newSpeed = speedSettingsRef.current[newLevel as keyof typeof speedSettingsRef.current];
        setCurrentSpeed(newSpeed);
        return;
      }

      // Touche B pour bloquer/débloquer la vue
      if (e.key.toLowerCase() === 'b') {
        isViewLockedRefLocal.current = !isViewLockedRefLocal.current;

        // Émettre un événement pour synchroniser l'état React (spécifique à 2D)
        const event = new CustomEvent('viewLockChanged2D', {
          detail: { locked: isViewLockedRefLocal.current }
        });
        window.dispatchEvent(event);

        // Forcer mise a jour du rendu pour nettete
        if (containerRef.current && cameraRef.current) {
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight;
          renderer.setPixelRatio(window.devicePixelRatio);
          renderer.setSize(width, height);
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
        }

        // Sortir du mode pointer lock si on bloque la vue
        if (isViewLockedRefLocal.current && document.pointerLockElement === renderer.domElement) {
          document.exitPointerLock();
        }
        return;
      }

      // Raccourcis pavé numérique pour les vues
      if (!cameraRef.current || !containerRef.current) return;
      if (!isFocusedRef.current) return; // Ne pas réagir si la zone n'est pas focalisée

      const distance = 80;
      const centerX = gridSettings.gridWidthMeters / 2;
      const centerZ = gridSettings.gridLengthMeters / 2;

      switch(e.key) {
        case '1': // Vue de face
          cameraRef.current.position.set(centerX, 5, distance + centerZ);
          cameraRef.current.lookAt(centerX, 0, centerZ);
          fpsRotation.yaw = 0;
          fpsRotation.pitch = 0;
          updateFPSCamera();
          break;
        case '5': // Recentrer au centre
          cameraRef.current.position.set(centerX, 5, distance + centerZ);
          cameraRef.current.lookAt(centerX, 0, centerZ);
          fpsRotation.yaw = 0;
          fpsRotation.pitch = 0;
          updateFPSCamera();
          break;
        case '7': // Vue du dessus
          if (isViewLockedRefLocal.current) {
            cameraRef.current.position.set(centerX, 1, centerZ);
            cameraRef.current.lookAt(centerX, 0, centerZ);
            // Forcer mise a jour complete pour nettete
            if (containerRef.current) {
              const width = containerRef.current.clientWidth;
              const height = containerRef.current.clientHeight;
              renderer.setPixelRatio(window.devicePixelRatio);
              renderer.setSize(width, height);
              cameraRef.current.aspect = width / height;
              cameraRef.current.updateProjectionMatrix();
            }
            setCurrentZoom(500);
            setIsTopView(true);
          } else {
            cameraRef.current.position.set(centerX, 25, centerZ);
            cameraRef.current.lookAt(centerX, 0, centerZ);
            cameraRef.current.updateProjectionMatrix();
            fpsRotation.yaw = 0;
            fpsRotation.pitch = -Math.PI / 2;
            updateFPSCamera();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isFocusedRef.current) return;
      keys2D[e.key.toLowerCase()] = false;
    };

    const updateMovement = () => {
      if (!cameraRef.current) return;

      // Calculer la vitesse de déplacement basée sur le niveau de vitesse
      const actualSpeed = speedSettingsRef.current[currentSpeedLevelRef.current as keyof typeof speedSettingsRef.current];
      const speed = actualSpeed * 0.02;

      // Mode bloqué: navigation avec WASD pour haut/bas/gauche/droite (vue de dessus)
      if (isViewLockedRefLocal.current) {
        const camera = cameraRef.current;

        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        camera.getWorldDirection(forward);
        right.crossVectors(forward, up).normalize();
        up.crossVectors(right, forward).normalize();

        // En mode bloqué (vue de dessus), WASD = déplacement de la vue
        if (keys2D['w']) {
          camera.position.addScaledVector(up, speed);
        }
        if (keys2D['s']) {
          camera.position.addScaledVector(up, -speed);
        }
        if (keys2D['a']) {
          camera.position.addScaledVector(right, -speed);
        }
        if (keys2D['d']) {
          camera.position.addScaledVector(right, speed);
        }
        return;
      }

      // Mode NON bloqué: navigation libre 3D
      const camera = cameraRef.current;
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);

      // Récupérer la direction de la caméra (projection horizontale)
      camera.getWorldDirection(forward);
      forward.y = 0; // Garder le mouvement horizontal
      forward.normalize();
      right.crossVectors(forward, up).normalize();

      const minHeight = 1.7;

      // W = avancer
      if (keys2D['w']) {
        camera.position.addScaledVector(forward, speed);
      }
      // S = reculer
      if (keys2D['s']) {
        camera.position.addScaledVector(forward, -speed);
      }
      // A = gauche
      if (keys2D['a']) {
        camera.position.addScaledVector(right, -speed);
      }
      // D = droite
      if (keys2D['d']) {
        camera.position.addScaledVector(right, speed);
      }
      // E = monter
      if (keys2D['e']) {
        camera.position.y += speed;
      }
      // Q = descendre (avec collision au sol)
      if (keys2D['q']) {
        const newY = camera.position.y - speed;
        if (newY >= minHeight) {
          camera.position.y = newY;
        } else {
          camera.position.y = minHeight;
        }
      }

      // Collision permanente avec le sol
      if (camera.position.y < minHeight) {
        camera.position.y = minHeight;
      }
    };

    const handleMouseEnter = () => {
      isFocusedRef.current = true;
      setIsFocused(true);
      console.log('🎯 Zone2D - Focus activé');
    };

    const handleMouseLeave = () => {
      isFocusedRef.current = false;
      setIsFocused(false);
      console.log('🎯 Zone2D - Focus désactivé');
    };

    renderer.domElement.addEventListener('mouseenter', handleMouseEnter);
    renderer.domElement.addEventListener('mouseleave', handleMouseLeave);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const animate = () => {
      requestAnimationFrame(animate);
      updateMovement();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
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
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isFPSMode]);

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

    if (!ambientLightRef.current) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      sceneRef.current.add(ambientLight);
      ambientLightRef.current = ambientLight;
    }

    if (!sunLightRef.current) {
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
    }

    if (!terrain) return;

    const gridWidthMeters = terrain.width;
    const gridLengthMeters = terrain.length;
    const centerX = gridWidthMeters / 2;
    const centerZ = gridLengthMeters / 2;

    const planeGeometry = new THREE.PlaneGeometry(gridWidthMeters, gridLengthMeters);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(centerX, 0, centerZ);
    plane.receiveShadow = true;
    plane.name = 'terrain_ground';
    plane.userData.isGround = true;
    plane.userData.isCollider = true;
    sceneRef.current.add(plane);
    terrainMeshRef.current = plane;

    const cellsX = gridWidthMeters;
    const cellsZ = gridLengthMeters;
    const maxDim = Math.max(gridWidthMeters, gridLengthMeters);

    const gridHelper = new THREE.GridHelper(
      maxDim,
      maxDim,
      0x4a4a4a,
      0x3a3a3a
    );
    gridHelper.position.set(centerX, 0.01, centerZ);
    sceneRef.current.add(gridHelper);
    terrainGridRef.current = gridHelper;

    if (cameraRef.current) {
      const cameraHeight = Math.max(25, maxDim * 0.5);
      cameraRef.current.position.set(centerX, cameraHeight, centerZ);
      cameraRef.current.lookAt(centerX, 0, centerZ);
    }

  }, [terrain]);

  useEffect(() => {
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

    if (terrainPreview && editorMode === 'terrain' && !terrain) {
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
        const quadMat = new THREE.MeshStandardMaterial({
          color: quadrantColors[i],
          side: THREE.DoubleSide,
          roughness: 0.85,
          metalness: 0.05,
          transparent: true,
          opacity: 0.9
        });
        const quad = new THREE.Mesh(quadGeom, quadMat);
        quad.rotation.x = -Math.PI / 2;
        quad.position.set(pos.x, -0.02, pos.z);
        quad.receiveShadow = true;
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
  }, [terrainPreview, editorMode, terrain]);

  useEffect(() => {
    console.log('🔥 Zone2D - useEffect BLOCKS déclenché, nombre de blocs:', blocks.length);
    console.log('📷 Zone2D - Position caméra:', cameraRef.current?.position);

    if (!blocksGroupRef.current || !sceneRef.current) {
      console.log('⚠️ Zone2D - blocksGroupRef ou sceneRef est null');
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
      console.log('🟦 Zone2D - Rendu du bloc:', block);
      const blockSize = gridSettings.blockSize;
      const blockGeometry = new THREE.BoxGeometry(blockSize, block.height, blockSize);

      const isSelected = selectedBlock === block.id;
      const blockMaterial = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xfbbf24 : 0x3b82f6,
        roughness: 0.6,
        metalness: 0.3,
        emissive: isSelected ? 0xfbbf24 : 0x000000,
        emissiveIntensity: isSelected ? 0.3 : 0
      });

      const blockMesh = new THREE.Mesh(blockGeometry, blockMaterial);

      const worldX = block.gridX * blockSize + blockSize / 2;
      const worldZ = block.gridZ * blockSize + blockSize / 2;

      console.log('📍 Zone2D - Position du bloc:', { worldX, y: block.height / 2, worldZ });

      blockMesh.position.set(worldX, block.height / 2, worldZ);
      blockMesh.castShadow = true;
      blockMesh.receiveShadow = true;

      blocksGroupRef.current?.add(blockMesh);
      console.log('🎯 Zone2D - Mesh ajouté, children count:', blocksGroupRef.current?.children.length);
    });

    console.log('✅ Zone2D - Rendu des blocs terminé, total:', blocksGroupRef.current?.children.length);

    if (hoverMeshRef.current) {
      sceneRef.current.remove(hoverMeshRef.current);
      hoverMeshRef.current.geometry.dispose();
      if (Array.isArray(hoverMeshRef.current.material)) {
        hoverMeshRef.current.material.forEach(m => m.dispose());
      } else {
        hoverMeshRef.current.material.dispose();
      }
      hoverMeshRef.current = null;
    }

    if (hoveredBlock && isViewLocked) {
      const blockExists = blocks.some(b => b.gridX === hoveredBlock.gridX && b.gridZ === hoveredBlock.gridZ);
      const hoverColor = blockExists ? 0xff0000 : 0x00ff00;

      const hoverMaterial = new THREE.MeshStandardMaterial({
        color: hoverColor,
        roughness: 0.6,
        metalness: 0.3,
        transparent: true,
        opacity: 0.5
      });

      const blockSize = gridSettings.blockSize;
      const hoverGeometry = new THREE.BoxGeometry(blockSize, gridSettings.wallHeight, blockSize);
      const hoverMesh = new THREE.Mesh(hoverGeometry, hoverMaterial);

      const worldX = hoveredBlock.gridX * blockSize + blockSize / 2;
      const worldZ = hoveredBlock.gridZ * blockSize + blockSize / 2;

      hoverMesh.position.set(worldX, gridSettings.wallHeight / 2, worldZ);

      sceneRef.current.add(hoverMesh);
      hoverMeshRef.current = hoverMesh;
    }
  }, [blocks, gridSettings.blockSize, gridSettings.wallHeight, hoveredBlock, isViewLocked, selectedBlock]);

  useEffect(() => {
    if (!wallsGroupRef.current || !sceneRef.current) return;

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

    if (previewWallMeshRef.current) {
      sceneRef.current.remove(previewWallMeshRef.current);
      previewWallMeshRef.current.geometry.dispose();
      if (Array.isArray(previewWallMeshRef.current.material)) {
        previewWallMeshRef.current.material.forEach(m => m.dispose());
      } else {
        previewWallMeshRef.current.material.dispose();
      }
      previewWallMeshRef.current = null;
    }

    if (previewWall) {
      const dx = previewWall.endX - previewWall.startX;
      const dz = previewWall.endZ - previewWall.startZ;
      const length = Math.sqrt(dx * dx + dz * dz);

      if (length > 0.01) {
        const angle = Math.atan2(dz, dx);
        const previewMaterial = new THREE.MeshStandardMaterial({
          color: 0xffff00,
          roughness: 0.7,
          metalness: 0.2,
          transparent: true,
          opacity: 0.6
        });

        const wallGeometry = new THREE.BoxGeometry(length, gridSettings.wallHeight, gridSettings.wallThickness);
        const previewMesh = new THREE.Mesh(wallGeometry, previewMaterial);

        const centerX = (previewWall.startX + previewWall.endX) / 2;
        const centerZ = (previewWall.startZ + previewWall.endZ) / 2;

        previewMesh.position.set(centerX, gridSettings.wallHeight / 2, centerZ);
        previewMesh.rotation.y = -angle;

        sceneRef.current.add(previewMesh);
        previewWallMeshRef.current = previewMesh;
      }
    }
  }, [walls, gridSettings, previewWall]);

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
  }, [bricks, gridSettings]);

  const getTerrainColor = (type: TerrainType): number => {
    switch (type) {
      case 'grass': return 0x4ade80;
      case 'dirt': return 0x92400e;
      case 'sand': return 0xfbbf24;
      case 'concrete': return 0x9ca3af;
      case 'gravel': return 0x6b7280;
      case 'water': return 0x38bdf8;
      case 'asphalt': return 0x374151;
      default: return 0x4ade80;
    }
  };

  useEffect(() => {
    if (!terrainGroupRef.current || !sceneRef.current) return;

    while (terrainGroupRef.current.children.length > 0) {
      const child = terrainGroupRef.current.children[0];
      terrainGroupRef.current.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    terrainCells.forEach((cell) => {
      const blockSize = gridSettings.blockSize;
      const cellGeometry = new THREE.PlaneGeometry(blockSize, blockSize);
      const cellMaterial = new THREE.MeshStandardMaterial({
        color: getTerrainColor(cell.type),
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      const cellMesh = new THREE.Mesh(cellGeometry, cellMaterial);
      cellMesh.rotation.x = -Math.PI / 2;

      const worldX = cell.gridX * blockSize + blockSize / 2;
      const worldZ = cell.gridZ * blockSize + blockSize / 2;
      cellMesh.position.set(worldX, 0.02 + cell.elevation, worldZ);
      cellMesh.receiveShadow = true;

      terrainGroupRef.current?.add(cellMesh);
    });
  }, [terrainCells, gridSettings.blockSize]);

  useEffect(() => {
    const handleLockToggle = (e: CustomEvent<{ locked: boolean }>) => {
      setIsViewLocked(e.detail.locked);
    };

    window.addEventListener('viewLockChanged2D' as any, handleLockToggle);
    return () => {
      window.removeEventListener('viewLockChanged2D' as any, handleLockToggle);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!cameraRef.current) return;

      // Update zoom - displays in 1-500 range based on height
      if (isViewLockedRefLocal.current) {
        const currentHeight = cameraRef.current.position.y;
        const zoomLevel = Math.round(501 - currentHeight);
        setCurrentZoom(Math.max(1, Math.min(500, zoomLevel)));
      }

      // Update camera position for GPS mini-map
      setCameraPosition({
        x: cameraRef.current.position.x,
        z: cameraRef.current.position.z
      });

      if (cameraRef.current && isFPSMode && document.pointerLockElement === rendererRef.current?.domElement) {
        const actualSpeed = speedSettingsRef.current[currentSpeedLevelRef.current as keyof typeof speedSettingsRef.current];
        const moveSpeed = actualSpeed * 0.02;
        const forward = new THREE.Vector3(
          Math.sin(fpsRotation.yaw),
          0,
          Math.cos(fpsRotation.yaw)
        ).normalize();
        const velocity = cameraRef.current.position.clone();
        velocity.addScaledVector(forward, moveSpeed);
        const speed = cameraRef.current.position.distanceTo(velocity) / (1/60);
        setCurrentSpeed(moveSpeed);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isFPSMode]);

  useEffect(() => {
    if (!sceneRef.current || !sunLightRef.current || !ambientLightRef.current) return;

    if (isDayMode) {
      sceneRef.current.background = new THREE.Color(0x3a3a3a);
      sunLightRef.current.color.setHex(0xffffff);
      sunLightRef.current.intensity = 0.9;
      ambientLightRef.current.color.setHex(0xffffff);
      ambientLightRef.current.intensity = 0.7;
      sunLightRef.current.position.set(50, 100, 50);
    } else {
      sceneRef.current.background = new THREE.Color(0x1a1a1a);
      sunLightRef.current.color.setHex(0xcccccc);
      sunLightRef.current.intensity = 0.4;
      ambientLightRef.current.color.setHex(0x999999);
      ambientLightRef.current.intensity = 0.3;
      sunLightRef.current.position.set(-50, 80, -50);
    }
  }, [isDayMode]);

  useEffect(() => {
    if (!sceneRef.current) return;

    if (sceneColorMode === 'default') {
      sceneRef.current.background = new THREE.Color(0x0a0d14);
      if (sunLightRef.current) {
        sunLightRef.current.castShadow = true;
        sunLightRef.current.intensity = isDayMode ? 0.9 : 0.4;
        sunLightRef.current.visible = true;
      }
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = isDayMode ? 0.7 : 0.3;
      }
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
    } else if (sceneColorMode === 'black') {
      sceneRef.current.background = new THREE.Color(0x000000);
      if (sunLightRef.current) {
        sunLightRef.current.castShadow = false;
        sunLightRef.current.intensity = 0.3;
      }
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = 1.2;
      }
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
    } else if (sceneColorMode === 'whiteGrid') {
      sceneRef.current.background = isDayMode ? new THREE.Color(0x3a3a3a) : new THREE.Color(0x1a1a1a);
      if (sunLightRef.current) {
        sunLightRef.current.castShadow = true;
        sunLightRef.current.intensity = isDayMode ? 0.9 : 0.4;
      }
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = isDayMode ? 0.7 : 0.3;
      }
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
    } else if (sceneColorMode === 'navyTech') {
      sceneRef.current.background = new THREE.Color(0x0a1929);
      if (sunLightRef.current) {
        sunLightRef.current.castShadow = true;
        sunLightRef.current.intensity = 0.6;
      }
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = 0.5;
      }
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
    } else if (sceneColorMode === 'navyWhite') {
      sceneRef.current.background = new THREE.Color(0x1a2744);
      if (sunLightRef.current) {
        sunLightRef.current.castShadow = true;
        sunLightRef.current.intensity = 0.6;
      }
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = 0.5;
      }
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
    } else if (sceneColorMode === 'whiteMatte') {
      sceneRef.current.background = new THREE.Color(0xf8f8f8);
      if (sunLightRef.current) {
        sunLightRef.current.castShadow = false;
        sunLightRef.current.intensity = 0.3;
      }
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = 1.5;
      }
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
    }
  }, [sceneColorMode, isDayMode]);

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

  const onStartDrawingRef = useRef(onStartDrawing);
  useEffect(() => {
    onStartDrawingRef.current = onStartDrawing;
  }, [onStartDrawing]);

  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const groundPlaneForRaycast = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const liveDrawing3DGroupRef = useRef<THREE.Group | null>(null);
  const currentStroke3DPointsRef = useRef<THREE.Vector3[]>([]);
  const currentLineMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (sceneRef.current && !liveDrawing3DGroupRef.current) {
      liveDrawing3DGroupRef.current = new THREE.Group();
      liveDrawing3DGroupRef.current.position.y = 0.1;
      sceneRef.current.add(liveDrawing3DGroupRef.current);
    }
  }, [terrain]);

  const getWorldPosition = useCallback((clientX: number, clientY: number): THREE.Vector3 | null => {
    if (!containerRef.current || !cameraRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    const intersectPoint = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(groundPlaneForRaycast.current, intersectPoint);

    return intersectPoint;
  }, []);

  const updateLiveStrokeMesh = useCallback(() => {
    if (!liveDrawing3DGroupRef.current) return;

    if (currentLineMeshRef.current) {
      liveDrawing3DGroupRef.current.remove(currentLineMeshRef.current);
      currentLineMeshRef.current.geometry.dispose();
      (currentLineMeshRef.current.material as THREE.Material).dispose();
      currentLineMeshRef.current = null;
    }

    const points = currentStroke3DPointsRef.current;
    if (points.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, Math.max(points.length * 2, 8), 0.05, 8, false);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const tubeMesh = new THREE.Mesh(tubeGeometry, material);

    liveDrawing3DGroupRef.current.add(tubeMesh);
    currentLineMeshRef.current = tubeMesh;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();

      const worldPos = getWorldPosition(e.clientX, e.clientY);
      if (!worldPos) return;

      setIsActiveDrawing(true);
      strokeStartTimeRef.current = Date.now();
      currentStroke3DPointsRef.current = [worldPos.clone()];
      currentStrokeRef.current = [{ x: worldPos.x, y: worldPos.z, timestamp: 0 }];

      if (onStartDrawingRef.current) {
        onStartDrawingRef.current();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isActiveDrawing) return;

      const worldPos = getWorldPosition(e.clientX, e.clientY);
      if (!worldPos) return;

      const lastPoint = currentStroke3DPointsRef.current[currentStroke3DPointsRef.current.length - 1];
      if (lastPoint && worldPos.distanceTo(lastPoint) < 0.1) return;

      const timestamp = Date.now() - strokeStartTimeRef.current;
      currentStroke3DPointsRef.current.push(worldPos.clone());
      currentStrokeRef.current.push({ x: worldPos.x, y: worldPos.z, timestamp });

      updateLiveStrokeMesh();

      if (onUpdateLivePointsRef.current && currentStrokeRef.current.length >= 2) {
        onUpdateLivePointsRef.current([...currentStrokeRef.current]);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 1 || !isActiveDrawing) return;

      setIsActiveDrawing(false);

      if (currentStrokeRef.current.length >= 2 && onAddStrokeRef.current) {
        const endTime = Date.now() - strokeStartTimeRef.current;
        const stroke: DrawingStroke = {
          points: currentStrokeRef.current,
          color: '#00ffff',
          width: 3,
          startTime: 0,
          endTime
        };
        onAddStrokeRef.current(stroke);
      }

      currentStrokeRef.current = [];
      currentStroke3DPointsRef.current = [];
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
  }, [isActiveDrawing, getWorldPosition, updateLiveStrokeMesh]);

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm-10 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400"></div>
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wider uppercase">Editeur 2D</span>
              <p className="text-[9px] text-cyan-500/60 font-mono">VIEW.2D.ACTIVE</p>
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
              title={isActiveProp ? "Fenetre 2D active" : "Fenetre 2D inactive"}
            >
              <div className={`absolute inset-1 ${isActiveProp ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isViewLockedRefLocal.current = !isViewLockedRefLocal.current;
                const event = new CustomEvent('viewLockChanged2D', {
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

            <div className="h-6 w-px bg-cyan-500/20"></div>

            <div className="relative" ref={modeMenuRef}>
              <button
                onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0a0d14] border border-cyan-500/30 font-medium transition-all text-xs uppercase tracking-wider text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5"
              >
                {editorMode === 'navigation' ? (
                  <Navigation className="w-3.5 h-3.5" />
                ) : editorMode === 'construction' || editorMode === 'robot' ? (
                  <Hammer className="w-3.5 h-3.5" />
                ) : (
                  <Mountain className="w-3.5 h-3.5" />
                )}
                <span>Mode</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isModeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isModeMenuOpen && (
                <div className="absolute top-full mt-1 left-0 bg-[#0a0d14] border border-cyan-500/30 shadow-2xl z-50 min-w-[180px] overflow-hidden">
                  <button
                    onClick={() => {
                      onEditorModeChange('navigation');
                      setSelectedTool(null);
                      setIsModeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      editorMode === 'navigation' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navigation</span>
                  </button>

                  <button
                    onClick={() => {
                      onEditorModeChange('terrain');
                      setSelectedTool(null);
                      setIsModeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      editorMode === 'terrain' ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <Mountain className="w-4 h-4" />
                    <span>Terrain</span>
                  </button>

                  <button
                    onClick={() => {
                      onEditorModeChange(thirdModeValue);
                      setIsModeMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                      editorMode === thirdModeValue ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
                    }`}
                  >
                    <Hammer className="w-4 h-4" />
                    <span>{thirdModeLabel}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-cyan-500/20"></div>


            <div className="h-6 w-px bg-cyan-500/20"></div>

            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0a0d14] border border-cyan-500/30 font-medium transition-all text-xs uppercase tracking-wider text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5"
              >
                <Grid3x3 className="w-3.5 h-3.5" />
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

      {isTopView && isViewLocked && (
        <div className="absolute bottom-4 right-4 z-40 bg-[#0f1318]/95 backdrop-blur-md border border-cyan-500/20 shadow-2xl overflow-hidden">
          <div className="text-[10px] text-cyan-400 font-mono uppercase text-center py-2 bg-[#0a0d14] border-b border-cyan-500/20 flex items-center justify-center gap-2">
            <Navigation className="w-3 h-3" />
            GPS - {gridSettings.gridWidthMeters}m x {gridSettings.gridLengthMeters}m
          </div>
          <div className="p-3">
            <div
              className="relative bg-[#0a0d14] border border-cyan-500/30"
              style={{ width: '120px', height: '120px' }}
            >
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className={`border-r border-b border-cyan-500/20 flex items-center justify-center text-[8px] font-mono font-bold transition-colors duration-200 ${
                  cameraPosition.x < gridSettings.gridWidthMeters / 2 && cameraPosition.z < gridSettings.gridLengthMeters / 2
                    ? 'bg-cyan-500/30 text-cyan-400'
                    : 'text-gray-600'
                }`}>
                  NW
                </div>
                <div className={`border-b border-cyan-500/20 flex items-center justify-center text-[8px] font-mono font-bold transition-colors duration-200 ${
                  cameraPosition.x >= gridSettings.gridWidthMeters / 2 && cameraPosition.z < gridSettings.gridLengthMeters / 2
                    ? 'bg-cyan-500/30 text-cyan-400'
                    : 'text-gray-600'
                }`}>
                  NE
                </div>
                <div className={`border-r border-cyan-500/20 flex items-center justify-center text-[8px] font-mono font-bold transition-colors duration-200 ${
                  cameraPosition.x < gridSettings.gridWidthMeters / 2 && cameraPosition.z >= gridSettings.gridLengthMeters / 2
                    ? 'bg-cyan-500/30 text-cyan-400'
                    : 'text-gray-600'
                }`}>
                  SW
                </div>
                <div className={`flex items-center justify-center text-[8px] font-mono font-bold transition-colors duration-200 ${
                  cameraPosition.x >= gridSettings.gridWidthMeters / 2 && cameraPosition.z >= gridSettings.gridLengthMeters / 2
                    ? 'bg-cyan-500/30 text-cyan-400'
                    : 'text-gray-600'
                }`}>
                  SE
                </div>
              </div>

              <div
                className="absolute w-2.5 h-2.5 bg-cyan-400 shadow-lg shadow-cyan-400/50 transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  left: `${Math.max(0, Math.min(100, (cameraPosition.x / gridSettings.gridWidthMeters) * 100))}%`,
                  top: `${Math.max(0, Math.min(100, (cameraPosition.z / gridSettings.gridLengthMeters) * 100))}%`,
                  transition: 'left 0.1s, top 0.1s'
                }}
              />

              <div
                className="absolute w-4 h-4 border-2 border-cyan-400/50 transform -translate-x-1/2 -translate-y-1/2 animate-ping"
                style={{
                  left: `${Math.max(0, Math.min(100, (cameraPosition.x / gridSettings.gridWidthMeters) * 100))}%`,
                  top: `${Math.max(0, Math.min(100, (cameraPosition.z / gridSettings.gridLengthMeters) * 100))}%`,
                }}
              />
            </div>

            <div className="mt-2 text-center">
              <div className="text-[9px] text-gray-500 font-mono">
                X: <span className="text-cyan-400">{cameraPosition.x.toFixed(1)}m</span>
                {' | '}
                Z: <span className="text-cyan-400">{cameraPosition.z.toFixed(1)}m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {placedElements.length > 0 && (
        <SceneElementPlayer
          placedElements={placedElements}
          elements={elementsMap}
          canvasWidth={containerRef.current?.clientWidth || 800}
          canvasHeight={containerRef.current?.clientHeight || 600}
          onDrawingComplete={onElementDrawingComplete}
          zoom={1}
        />
      )}

    </div>
  );
};

export default Zone2D;
