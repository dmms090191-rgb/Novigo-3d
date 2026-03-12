import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { X, Play, RotateCcw, Save, Loader2 } from 'lucide-react';
import { DrawingData, DrawingStroke } from '../types/ElementLibrary';

interface Drawing3DPreviewProps {
  drawingData?: DrawingData | null;
  onClose: () => void;
  onSave: () => void;
  elementName?: string;
  embedded?: boolean;
}

const Drawing3DPreview: React.FC<Drawing3DPreviewProps> = ({
  drawingData,
  onClose,
  onSave,
  elementName,
  embedded = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const drawingGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const strokeMeshesRef = useRef<THREE.Mesh[]>([]);
  const glowSphereRef = useRef<THREE.Mesh | null>(null);
  const glowLightRef = useRef<THREE.PointLight | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const animationStartTimeRef = useRef<number>(0);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050810);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    const gridSize = 20;
    const gridHelper = new THREE.GridHelper(gridSize, 40, 0x00ffff, 0x003344);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a1020,
      roughness: 0.9,
      metalness: 0.1,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const drawingGroup = new THREE.Group();
    drawingGroup.position.y = 0.05;
    scene.add(drawingGroup);
    drawingGroupRef.current = drawingGroup;

    const glowSphereGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const glowSphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
    });
    const glowSphere = new THREE.Mesh(glowSphereGeometry, glowSphereMaterial);
    glowSphere.visible = false;
    scene.add(glowSphere);
    glowSphereRef.current = glowSphere;

    const glowLight = new THREE.PointLight(0x00ffff, 0, 3);
    scene.add(glowLight);
    glowLightRef.current = glowLight;

    createDrawingMeshes();
    setIsSceneReady(true);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 6 };
    let cameraDistance = 15;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      cameraAngle.theta -= deltaX * 0.01;
      cameraAngle.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraAngle.phi + deltaY * 0.01));

      updateCameraPosition();
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistance = Math.max(5, Math.min(30, cameraDistance + e.deltaY * 0.02));
      updateCameraPosition();
    };

    const updateCameraPosition = () => {
      if (!cameraRef.current) return;
      cameraRef.current.position.x = cameraDistance * Math.sin(cameraAngle.theta) * Math.cos(cameraAngle.phi);
      cameraRef.current.position.y = cameraDistance * Math.sin(cameraAngle.phi);
      cameraRef.current.position.z = cameraDistance * Math.cos(cameraAngle.theta) * Math.cos(cameraAngle.phi);
      cameraRef.current.lookAt(0, 0, 0);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  const hasDrawingData = drawingData && drawingData.strokes && drawingData.strokes.length > 0;

  const createDrawingMeshes = useCallback(() => {
    if (!drawingGroupRef.current || !hasDrawingData) return;

    while (drawingGroupRef.current.children.length > 0) {
      const child = drawingGroupRef.current.children[0];
      drawingGroupRef.current.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    }
    strokeMeshesRef.current = [];

    const bbox = drawingData!.boundingBox;
    const drawingWidth = bbox.maxX - bbox.minX;
    const drawingHeight = bbox.maxY - bbox.minY;
    const maxDim = Math.max(drawingWidth, drawingHeight);
    const scale3D = 8 / maxDim;

    drawingData!.strokes.forEach((stroke, strokeIndex) => {
      if (stroke.points.length < 2) return;

      const points3D: THREE.Vector3[] = stroke.points.map(point => {
        const localX = (point.x - bbox.minX - drawingWidth / 2) * scale3D;
        const localZ = -(point.y - bbox.minY - drawingHeight / 2) * scale3D;
        return new THREE.Vector3(localX, 0.15, localZ);
      });

      const curve = new THREE.CatmullRomCurve3(points3D);
      const tubeGeometry = new THREE.TubeGeometry(curve, points3D.length * 3, 0.08, 12, false);

      const color = new THREE.Color(stroke.color);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.7,
        transparent: true,
        opacity: 0,
      });

      const tubeMesh = new THREE.Mesh(tubeGeometry, material);
      tubeMesh.castShadow = true;
      tubeMesh.userData = {
        strokeIndex,
        startTime: stroke.startTime,
        endTime: stroke.endTime,
        points3D,
        color: stroke.color,
      };
      tubeMesh.visible = false;

      strokeMeshesRef.current.push(tubeMesh);
      drawingGroupRef.current?.add(tubeMesh);
    });
  }, [hasDrawingData, drawingData]);

  const playAnimation = useCallback(() => {
    if (strokeMeshesRef.current.length === 0 || !hasDrawingData) return;

    strokeMeshesRef.current.forEach(mesh => {
      mesh.visible = false;
      (mesh.material as THREE.MeshStandardMaterial).opacity = 0;
    });

    if (glowSphereRef.current) {
      glowSphereRef.current.visible = true;
      (glowSphereRef.current.material as THREE.MeshBasicMaterial).opacity = 0.8;
    }
    if (glowLightRef.current) {
      glowLightRef.current.intensity = 2;
    }

    setIsPlaying(true);
    animationStartTimeRef.current = Date.now();

    const totalDuration = drawingData!.totalDuration;

    const animateDrawing = () => {
      const elapsed = Date.now() - animationStartTimeRef.current;
      const progress = Math.min(1, elapsed / totalDuration);
      setAnimationProgress(progress);

      let currentPoint: THREE.Vector3 | null = null;

      strokeMeshesRef.current.forEach(mesh => {
        const { startTime, endTime, points3D } = mesh.userData;
        const material = mesh.material as THREE.MeshStandardMaterial;

        if (elapsed >= startTime) {
          mesh.visible = true;

          const strokeDuration = endTime - startTime;
          const strokeElapsed = elapsed - startTime;
          const strokeProgress = Math.min(1, strokeElapsed / strokeDuration);

          material.opacity = strokeProgress;

          if (strokeProgress < 1 && points3D.length > 0) {
            const pointIndex = Math.floor(strokeProgress * (points3D.length - 1));
            currentPoint = points3D[pointIndex];
          }
        }
      });

      if (currentPoint && glowSphereRef.current && glowLightRef.current) {
        glowSphereRef.current.position.copy(currentPoint);
        glowSphereRef.current.position.y += 0.2;
        glowLightRef.current.position.copy(currentPoint);
        glowLightRef.current.position.y += 0.3;

        const pulse = 0.8 + Math.sin(elapsed * 0.01) * 0.2;
        (glowSphereRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
        glowLightRef.current.intensity = 2 + Math.sin(elapsed * 0.01) * 0.5;
      }

      if (progress < 1) {
        requestAnimationFrame(animateDrawing);
      } else {
        setIsPlaying(false);
        if (glowSphereRef.current) {
          glowSphereRef.current.visible = false;
        }
        if (glowLightRef.current) {
          glowLightRef.current.intensity = 0;
        }
      }
    };

    requestAnimationFrame(animateDrawing);
  }, [hasDrawingData, drawingData]);

  const resetAnimation = useCallback(() => {
    setIsPlaying(false);
    setAnimationProgress(0);

    strokeMeshesRef.current.forEach(mesh => {
      mesh.visible = false;
      (mesh.material as THREE.MeshStandardMaterial).opacity = 0;
    });

    if (glowSphereRef.current) {
      glowSphereRef.current.visible = false;
    }
    if (glowLightRef.current) {
      glowLightRef.current.intensity = 0;
    }
  }, []);

  useEffect(() => {
    const cleanup = initScene();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (cleanup) cleanup();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [initScene]);

  useEffect(() => {
    if (isSceneReady && hasDrawingData) {
      createDrawingMeshes();
    }
  }, [isSceneReady, hasDrawingData, createDrawingMeshes]);

  return (
    <div className={embedded ? "h-full flex flex-col bg-[#050810]" : "fixed inset-0 z-[60] bg-black/95 flex flex-col"}>
      <div className={`flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-[#0a0d14] ${embedded ? 'flex-wrap gap-2' : 'px-6 py-4'}`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-cyan-400 animate-pulse"></div>
          <div>
            <h2 className={`font-bold text-cyan-200 uppercase tracking-wider ${embedded ? 'text-sm' : 'text-lg'}`}>
              Preview 3D
            </h2>
            <p className={`text-cyan-500/50 ${embedded ? 'text-xs' : 'text-sm'}`}>{elementName || 'Scene 3D'}</p>
          </div>
        </div>

        <div className={`flex items-center ${embedded ? 'gap-2 flex-wrap' : 'gap-4'}`}>
          <div className={`flex items-center gap-2 bg-[#0f1318] border border-cyan-500/20 ${embedded ? 'px-2 py-1' : 'px-4 py-2'}`}>
            <span className={`text-gray-400 font-mono ${embedded ? 'text-[10px]' : 'text-xs'}`}>Progress:</span>
            <span className={`text-cyan-400 font-mono font-bold ${embedded ? 'text-xs' : 'text-sm'}`}>
              {Math.round(animationProgress * 100)}%
            </span>
          </div>

          <button
            onClick={resetAnimation}
            disabled={isPlaying}
            className={`flex items-center gap-1.5 bg-gray-500/20 border border-gray-500/50 text-gray-400 hover:bg-gray-500/30 transition-all font-semibold uppercase disabled:opacity-50 ${embedded ? 'px-2 py-1.5 text-[10px]' : 'px-4 py-2 text-sm gap-2'}`}
          >
            <RotateCcw className={embedded ? "w-3 h-3" : "w-4 h-4"} />
            Reset
          </button>

          <button
            onClick={playAnimation}
            disabled={isPlaying || !hasDrawingData}
            className={`flex items-center gap-1.5 border font-semibold uppercase transition-all ${embedded ? 'px-2 py-1.5 text-[10px]' : 'px-4 py-2 text-sm gap-2'} ${
              hasDrawingData
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50'
                : 'bg-gray-500/10 border-gray-500/30 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPlaying ? (
              <Loader2 className={`animate-spin ${embedded ? "w-3 h-3" : "w-4 h-4"}`} />
            ) : (
              <Play className={embedded ? "w-3 h-3" : "w-4 h-4"} />
            )}
            {isPlaying ? 'Animation...' : 'Jouer'}
          </button>

          {!embedded && (
            <>
              <button
                onClick={onSave}
                className="flex items-center gap-2 px-6 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-semibold uppercase"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" />

        <div className={`absolute bg-[#0f1318]/90 border border-cyan-500/20 backdrop-blur-sm ${embedded ? 'bottom-2 left-2 p-2' : 'bottom-4 left-4 p-4'}`}>
          <div className={`text-cyan-400 font-mono uppercase ${embedded ? 'text-[8px] mb-1' : 'text-[10px] mb-2'}`}>Controls</div>
          <div className={`flex flex-col gap-0.5 text-gray-400 font-mono ${embedded ? 'text-[8px]' : 'text-[10px] gap-1'}`}>
            <span>Clic + Drag: Rotate camera</span>
            <span>Scroll: Zoom in/out</span>
          </div>
        </div>

        {hasDrawingData && (
          <div className={`absolute bg-[#0f1318]/90 border border-cyan-500/20 backdrop-blur-sm ${embedded ? 'bottom-2 right-2 p-2' : 'bottom-4 right-4 p-4'}`}>
            <div className={`text-cyan-400 font-mono uppercase ${embedded ? 'text-[8px] mb-1' : 'text-[10px] mb-2'}`}>Drawing Info</div>
            <div className={`flex flex-col gap-0.5 text-gray-400 font-mono ${embedded ? 'text-[8px]' : 'text-[10px] gap-1'}`}>
              <span>Strokes: {drawingData!.strokes.length}</span>
              <span>Duration: {(drawingData!.totalDuration / 1000).toFixed(1)}s</span>
            </div>
          </div>
        )}

        {!hasDrawingData && isSceneReady && (
          <div className={`absolute bg-[#0f1318]/90 border border-amber-500/20 backdrop-blur-sm ${embedded ? 'bottom-2 right-2 p-2' : 'bottom-4 right-4 p-4'}`}>
            <div className={`text-amber-400 font-mono uppercase ${embedded ? 'text-[8px] mb-1' : 'text-[10px] mb-2'}`}>Info</div>
            <div className={`flex flex-col gap-0.5 text-gray-400 font-mono ${embedded ? 'text-[8px]' : 'text-[10px] gap-1'}`}>
              <span>Aucun dessin charge</span>
              <span>Selectionnez un element avec un dessin</span>
            </div>
          </div>
        )}

        {!isSceneReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="text-cyan-400 font-mono">Loading 3D scene...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawing3DPreview;
