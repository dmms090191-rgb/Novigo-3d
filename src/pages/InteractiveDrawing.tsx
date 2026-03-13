import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Layers, Box, HelpCircle, Activity, Cpu, Monitor, Eye, Save, Plus, Cuboid, FolderOpen, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import Zone2D from '../components/Zone2D';
import Zone3D from '../components/Zone3D';
import Zone3Params from '../components/Zone3Params';
import ControlsHelp from '../components/ControlsHelp';
import DrawingRecorder from '../components/DrawingRecorder';
import Drawing3DPreview from '../components/Drawing3DPreview';
import Animation3DViewer from '../components/Animation3DViewer';
import { GridSettings, Wall, Brick, Block, TerrainCell, TerrainConfig } from '../types/Scene';
import { getDefaultDrawing, saveDrawing, clearDrawingData } from '../services/drawingService';
import { LibraryElement, ScenePlacedElement, DrawingData } from '../types/ElementLibrary';
import { elementLibraryService } from '../services/elementLibraryService';

type TabType = 'editor' | 'controls' | '3d';
type EditorMode = 'navigation' | 'terrain' | 'robot';

interface InteractiveDrawingProps {
  embedded?: boolean;
}

const InteractiveDrawing: React.FC<InteractiveDrawingProps> = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [topHeight, setTopHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [is2DActive, setIs2DActive] = useState(false);
  const [is3DActive, setIs3DActive] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('terrain');
  const [terrain, setTerrain] = useState<TerrainConfig | null>(null);
  const [terrainPreview, setTerrainPreview] = useState<TerrainConfig | null>(null);
  const [is2DMinimized, setIs2DMinimized] = useState(false);
  const [is3DMinimized, setIs3DMinimized] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  const [gridSettings, setGridSettings] = useState<GridSettings>({
    gridWidthMeters: 20,
    gridLengthMeters: 20,
    cellSize: 0.1,
    blockSize: 0.10,
    wallHeight: 2.5,
    wallThickness: 0.20,
    wallType: 'exterior',
  });

  const [walls, setWalls] = useState<Wall[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [terrainCells, setTerrainCells] = useState<TerrainCell[]>([]);
  const [selectedElement, setSelectedElement] = useState<LibraryElement | null>(null);
  const [placedElements, setPlacedElements] = useState<ScenePlacedElement[]>([]);
  const [elementsMap, setElementsMap] = useState<Map<string, LibraryElement>>(new Map());
  const [showRecorder, setShowRecorder] = useState(false);
  const [newElementName, setNewElementName] = useState('');
  const [showNewElementModal, setShowNewElementModal] = useState(false);
  const [isAnimation3DPlaying, setIsAnimation3DPlaying] = useState(false);
  const [animation3DDrawingData, setAnimation3DDrawingData] = useState<DrawingData | null>(null);
  const [isArmoireSelected, setIsArmoireSelected] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'warning' } | null>(null);

  const showNotification = useCallback((message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    const loadScene = async () => {
      try {
        const scene = await getDefaultDrawing();
        if (scene) {
          if (scene.terrain) {
            setTerrain(scene.terrain);
            setEditorMode('navigation');
          }
          if (scene.blocks) setBlocks(scene.blocks);
          if (scene.walls) setWalls(scene.walls);
          if (scene.bricks) setBricks(scene.bricks);
          if (scene.terrain_cells) setTerrainCells(scene.terrain_cells);
          if (scene.grid_settings) setGridSettings(scene.grid_settings);
        }
      } catch (error) {
        console.error('Error loading drawing:', error);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 500);
      }
    };

    loadScene();
  }, []);

  const debouncedSave = useCallback(() => {
    if (isInitialLoadRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDrawing(terrain, blocks, walls, bricks, terrainCells, gridSettings);
    }, 1000);
  }, [terrain, blocks, walls, bricks, terrainCells, gridSettings]);

  useEffect(() => {
    debouncedSave();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [terrain, blocks, walls, bricks, terrainCells, gridSettings, debouncedSave]);

  useEffect(() => {
    if (terrain === null && !isLoading) {
      setEditorMode('terrain');
    }
  }, [terrain, isLoading]);

  const handleCreateTerrain = (width: number, length: number, cellSize: number) => {
    setTerrain({ width, length, cellSize });
    setTerrainPreview(null);
    setGridSettings(prev => ({
      ...prev,
      gridWidthMeters: width,
      gridLengthMeters: length,
      cellSize: cellSize
    }));
    setEditorMode('navigation');
  };

  const handlePreviewChange = (preview: TerrainConfig) => {
    setTerrainPreview(preview);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const container = document.getElementById('drawing-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        if (newHeight > 10 && newHeight < 90) {
          setTopHeight(newHeight);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  const handleAddWall = (wall: Wall) => {
    setWalls([...walls, wall]);
  };

  const handleAddBlock = (block: Block) => {
    const newBlocks = [...blocks, block];
    setBlocks(newBlocks);
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const handleAddBrick = (brick: Brick) => {
    setBricks([...bricks, brick]);
  };

  const handleRemoveWall = (id: string) => {
    setWalls(walls.filter((w) => w.id !== id));
  };

  const handleRemoveBrick = (id: string) => {
    setBricks(bricks.filter((b) => b.id !== id));
  };

  const handleAddTerrainCell = (cell: TerrainCell) => {
    setTerrainCells([...terrainCells, cell]);
  };

  const handleRemoveTerrainCell = (id: string) => {
    setTerrainCells(terrainCells.filter((c) => c.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('Voulez-vous vraiment tout effacer ?')) {
      setBlocks([]);
      setWalls([]);
      setBricks([]);
      setTerrainCells([]);
    }
  };

  const handleDeleteTerrain = async () => {
    setTerrain(null);
    setTerrainPreview(null);
    setBlocks([]);
    setWalls([]);
    setBricks([]);
    setTerrainCells([]);
    setEditorMode('terrain');
    await clearDrawingData();
  };

  const handlePlaceElement = useCallback((element: LibraryElement, x: number, y: number) => {
    const newPlacedElement: ScenePlacedElement = {
      id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      elementId: element.id,
      x,
      y,
      rotation: 0,
      scale: 1,
      isDrawing: true,
      drawingProgress: 0,
    };

    setPlacedElements(prev => [...prev, newPlacedElement]);
    setElementsMap(prev => new Map(prev).set(element.id, element));
  }, []);

  const handleElementDrawingComplete = useCallback((placedElementId: string) => {
    setPlacedElements(prev =>
      prev.map(el =>
        el.id === placedElementId
          ? { ...el, isDrawing: false, drawingProgress: 1 }
          : el
      )
    );
  }, []);

  const handleDrawOnScene = useCallback(() => {
    if (selectedElement) {
      handlePlaceElement(selectedElement, 400, 300);
    }
  }, [selectedElement, handlePlaceElement]);

  const handleStartNewElement = () => {
    setShowNewElementModal(true);
  };

  const handleCreateAndRecord = async () => {
    if (!newElementName.trim()) return;

    const created = await elementLibraryService.create({
      name: newElementName.trim(),
      category: 'Mobilier',
      icon: 'box',
      width: 100,
      height: 100,
      depth: 100,
    });

    if (created) {
      setSelectedElement(created);
      setShowNewElementModal(false);
      setNewElementName('');
      setShowRecorder(true);
    }
  };

  const handleSaveDrawing = async (drawingData: DrawingData, previewImage: string) => {
    if (!selectedElement) return;

    const success = await elementLibraryService.saveDrawing(
      selectedElement.id,
      drawingData,
      previewImage
    );

    if (success) {
      const updatedElement = { ...selectedElement, drawing_data: drawingData, preview_image: previewImage };
      setSelectedElement(updatedElement);
      setElementsMap(prev => new Map(prev).set(updatedElement.id, updatedElement));
    }

    setShowRecorder(false);
  };

  const handlePlayAnimation3D = useCallback(async () => {
    if (!isArmoireSelected) {
      showNotification('Veuillez selectionner un element avant de lancer la construction', 'warning');
      return;
    }
    setIsAnimation3DPlaying(false);
    await new Promise(resolve => setTimeout(resolve, 50));
    setIsAnimation3DPlaying(true);
  }, [isArmoireSelected, showNotification]);

  useEffect(() => {
    if (activeTab !== '3d') {
      setIsAnimation3DPlaying(false);
    }
  }, [activeTab]);

  return (
    <div className={`${embedded ? 'h-[calc(100vh-5rem)]' : 'h-screen'} w-full bg-[#0a0d14] flex flex-col overflow-hidden`}>
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-pulse ${
          notification.type === 'error' ? 'bg-red-600' :
          notification.type === 'warning' ? 'bg-amber-600' :
          'bg-emerald-600'
        }`}>
          <span className="text-white font-medium">{notification.message}</span>
        </div>
      )}
      {!embedded && (
        <div className="relative bg-[#0f1318] px-6 py-3 flex-shrink-0 border-b border-cyan-500/20">
          <div className="absolute inset-0 bg-tech-grid opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-12 h-12 bg-[#0a0d14] flex items-center justify-center tech-border-glow">
                  <Layers className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 animate-pulse-glow"></div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wider uppercase">Dessin Interactif</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-cyan-500" />
                    <span className="text-[10px] text-cyan-500/70 font-mono">SYS.ACTIVE</span>
                  </div>
                  <div className="w-[1px] h-3 bg-cyan-500/30"></div>
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] text-emerald-500/70 font-mono">3D.ENGINE</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {editorMode === 'robot' && (
                <>
                  <button
                    onClick={handleStartNewElement}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 transition-all text-sm font-semibold uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" />
                    Creer Element
                  </button>
                  {selectedElement && (
                    <button
                      onClick={() => setShowRecorder(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 transition-all text-sm font-semibold uppercase tracking-wider"
                    >
                      <Save className="w-4 h-4" />
                      Enregistrer Dessin
                    </button>
                  )}
                </>
              )}
              <a
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 font-medium transition-all px-4 py-2.5 tech-btn text-sm uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0a0d14] border-b border-cyan-500/10 flex-shrink-0">
        <div className="flex items-center gap-1 px-4">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2.5 px-5 py-3 font-medium transition-all border-b-2 text-sm uppercase tracking-wider ${
              activeTab === 'editor'
                ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-cyan-500/5'
            }`}
          >
            <Box className="w-4 h-4" />
            Editeur
          </button>
          <button
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-2.5 px-5 py-3 font-medium transition-all border-b-2 text-sm uppercase tracking-wider ${
              activeTab === '3d'
                ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-emerald-500/5'
            }`}
          >
            <Cuboid className="w-4 h-4" />
            Dessin 3D
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-2.5 px-5 py-3 font-medium transition-all border-b-2 text-sm uppercase tracking-wider ${
              activeTab === 'controls'
                ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-cyan-500/5'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Aide
          </button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div
          id="drawing-container"
          className="flex flex-1 overflow-hidden"
          onMouseMove={handleMouseMove}
          style={{ cursor: isDragging ? 'row-resize' : 'default' }}
        >
          <div className="flex flex-col flex-1 relative">
            {!is2DMinimized && (
              <div
                className="bg-[#0a0d14] overflow-hidden relative flex"
                style={{ height: is3DMinimized ? '100%' : `${topHeight}%` }}
              >
                <div className="flex-1 relative">
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#0a0d14]/90 px-3 py-1.5 tech-border backdrop-blur-sm">
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] text-cyan-400 font-mono uppercase">Vue 2D</span>
                    <div className={`w-2 h-2 rounded-full ${is2DActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`}></div>
                  </div>
                  <button
                    onClick={() => setIs2DMinimized(true)}
                    className="absolute top-3 right-3 z-50 w-6 h-6 bg-[#0a0d14]/90 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
                    title="Reduire la fenetre 2D"
                  >
                    <div className="w-3 h-0.5 bg-cyan-400"></div>
                  </button>
                  <Zone2D
                    gridSettings={gridSettings}
                    walls={walls}
                    blocks={blocks}
                    bricks={bricks}
                    terrainCells={terrainCells}
                    onAddWall={handleAddWall}
                    onAddBlock={handleAddBlock}
                    onRemoveBlock={handleRemoveBlock}
                    onAddBrick={handleAddBrick}
                    onRemoveWall={handleRemoveWall}
                    onRemoveBrick={handleRemoveBrick}
                    onAddTerrainCell={handleAddTerrainCell}
                    onRemoveTerrainCell={handleRemoveTerrainCell}
                    isActive={is2DActive}
                    onActiveChange={setIs2DActive}
                    editorMode={editorMode}
                    onEditorModeChange={setEditorMode}
                    terrain={terrain}
                    terrainPreview={terrainPreview}
                    thirdModeLabel="Robot IA"
                    thirdModeValue="robot"
                    selectedLibraryElement={selectedElement}
                    placedElements={placedElements}
                    elementsMap={elementsMap}
                    onPlaceElement={handlePlaceElement}
                    onElementDrawingComplete={handleElementDrawingComplete}
                  />
                </div>
              </div>
            )}

            {!is2DMinimized && !is3DMinimized && (
              <div
                className="h-2 bg-[#0f1318] hover:bg-cyan-500/10 cursor-row-resize flex items-center justify-center relative z-10 transition-all group border-y border-cyan-500/20"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                <div className="flex gap-2">
                  <div className="w-10 h-[2px] bg-cyan-500/40 group-hover:bg-cyan-400 transition-all"></div>
                  <div className="w-10 h-[2px] bg-cyan-500/40 group-hover:bg-cyan-400 transition-all"></div>
                  <div className="w-10 h-[2px] bg-cyan-500/40 group-hover:bg-cyan-400 transition-all"></div>
                </div>
              </div>
            )}

            {!is3DMinimized && (
              <div
                className="bg-[#0a0d14] overflow-hidden relative flex"
                style={{ height: is2DMinimized ? '100%' : `${100 - topHeight}%` }}
              >
                <div className="flex-1 relative">
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#0a0d14]/90 px-3 py-1.5 tech-border backdrop-blur-sm">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-mono uppercase">Vue 3D</span>
                    <div className={`w-2 h-2 rounded-full ${is3DActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`}></div>
                  </div>
                  <button
                    onClick={() => setIs3DMinimized(true)}
                    className="absolute top-3 right-3 z-50 w-6 h-6 bg-[#0a0d14]/90 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all"
                    title="Reduire la fenetre 3D"
                  >
                    <div className="w-3 h-0.5 bg-emerald-400"></div>
                  </button>
                  <Zone3D
                    gridSettings={gridSettings}
                    walls={walls}
                    blocks={blocks}
                    bricks={bricks}
                    isActive={is3DActive}
                    onActiveChange={setIs3DActive}
                    terrain={terrain}
                    terrainPreview={terrainPreview}
                    selectedLibraryElement={selectedElement}
                    placedElements={placedElements}
                    elementsMap={elementsMap}
                    onPlaceElement={handlePlaceElement}
                    onElementDrawingComplete={handleElementDrawingComplete}
                    editorMode={editorMode}
                  />
                </div>
              </div>
            )}

            {is2DMinimized && (
              <button
                onClick={() => setIs2DMinimized(false)}
                className="absolute top-0 right-0 z-50 w-1 h-24 bg-cyan-500/50 hover:bg-cyan-400 hover:w-2 transition-all cursor-pointer group"
                title="Restaurer Vue 2D"
              >
                <div className="absolute -left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a0d14]/95 border border-cyan-500/30 px-2 py-1 whitespace-nowrap">
                  <span className="text-[9px] text-cyan-400 font-mono">VUE 2D</span>
                </div>
              </button>
            )}

            {is3DMinimized && (
              <button
                onClick={() => setIs3DMinimized(false)}
                className="absolute bottom-0 right-0 z-50 w-1 h-24 bg-emerald-500/50 hover:bg-emerald-400 hover:w-2 transition-all cursor-pointer group"
                title="Restaurer Vue 3D"
              >
                <div className="absolute -left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a0d14]/95 border border-emerald-500/30 px-2 py-1 whitespace-nowrap">
                  <span className="text-[9px] text-emerald-400 font-mono">VUE 3D</span>
                </div>
              </button>
            )}
          </div>

          <div className="flex flex-shrink-0 relative">
            <button
              onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-4 h-16 bg-[#0a0d14] border border-cyan-500/30 hover:border-cyan-400/50 rounded-l-lg transition-colors group"
              title={isRightPanelCollapsed ? 'Afficher le panneau' : 'Masquer le panneau'}
            >
              {isRightPanelCollapsed ? (
                <ChevronLeft className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
              )}
            </button>
            <div className={`transition-all duration-300 ease-out overflow-hidden ${isRightPanelCollapsed ? 'w-0' : 'w-72 xl:w-80'}`}>
              <div className="w-72 xl:w-80 border-l border-cyan-500/20 overflow-y-auto h-full">
                <Zone3Params
                  gridSettings={gridSettings}
                  walls={walls}
                  blocks={blocks}
                  bricks={bricks}
                  onGridSettingsChange={setGridSettings}
                  onClearAll={handleClearAll}
                  editorMode={editorMode}
                  terrain={terrain}
                  onCreateTerrain={handleCreateTerrain}
                  onPreviewChange={handlePreviewChange}
                  onDeleteTerrain={handleDeleteTerrain}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  onDrawOnScene={handleDrawOnScene}
                />
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === '3d' ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col p-6">
            <div className="flex-1 relative rounded-lg overflow-hidden" style={{
              border: '3px solid #0e7490',
              boxShadow: '0 0 20px rgba(14, 116, 144, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.5)',
              background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)'
            }}>
              <div className="absolute inset-0 rounded-lg" style={{
                border: '8px solid #1e293b',
                borderRadius: '0.5rem',
                pointerEvents: 'none'
              }}>
                <div className="absolute inset-0" style={{
                  border: '2px solid #334155',
                  borderRadius: '0.25rem'
                }} />
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <div className={`w-2 h-2 rounded-full ${isAnimation3DPlaying ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Zone Animation 3D</span>
              </div>
              <div className="absolute bottom-4 right-4 text-xs text-gray-600 z-10">
                <span className="font-mono">16:9</span>
              </div>
              <Animation3DViewer
                isPlaying={isAnimation3DPlaying}
                onComplete={() => setIsAnimation3DPlaying(false)}
                onPlay={handlePlayAnimation3D}
              />
            </div>
          </div>
          <div className="flex flex-shrink-0 relative">
            <button
              onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-4 h-16 bg-[#0a0d14] border border-cyan-500/30 hover:border-cyan-400/50 rounded-l-lg transition-colors group"
              title={isRightPanelCollapsed ? 'Afficher le panneau' : 'Masquer le panneau'}
            >
              {isRightPanelCollapsed ? (
                <ChevronLeft className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
              )}
            </button>
            <div className={`transition-all duration-300 ease-out overflow-hidden ${isRightPanelCollapsed ? 'w-0' : 'w-72 xl:w-80'}`}>
              <div className="w-72 xl:w-80 border-l border-cyan-500/20 overflow-y-auto bg-[#0a0d14] h-full">
                <div className="p-4">
                  <div
                    onClick={() => setIsArmoireSelected(!isArmoireSelected)}
                    className={`relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isArmoireSelected
                        ? 'bg-emerald-500/10 border-2 border-emerald-500/50'
                        : 'hover:bg-slate-800/50 border-2 border-transparent'
                    }`}
                  >
                    {isArmoireSelected && (
                      <div className="absolute inset-0 rounded-lg bg-emerald-500/5 pointer-events-none" />
                    )}
                    <FolderOpen className={`w-5 h-5 ${isArmoireSelected ? 'text-emerald-400' : 'text-emerald-400/70'}`} />
                    <span className={`text-sm font-bold uppercase tracking-wider ${isArmoireSelected ? 'text-emerald-400' : 'text-white'}`}>Armoire</span>
                    {isArmoireSelected && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ControlsHelp />
      )}

      {showNewElementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0a1929] border border-cyan-700/30 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-cyan-200 uppercase tracking-wider mb-4">
              Nouvel Element
            </h2>
            <div className="mb-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
                Nom de l'element
              </label>
              <input
                type="text"
                value={newElementName}
                onChange={(e) => setNewElementName(e.target.value)}
                placeholder="Ex: Lit, Table, Chaise..."
                className="w-full px-4 py-3 bg-[#071018] border border-cyan-700/30 text-cyan-200 placeholder-gray-600 focus:border-cyan-500/50 outline-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewElementModal(false);
                  setNewElementName('');
                }}
                className="flex-1 px-4 py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 hover:bg-gray-500/30 transition-all font-semibold text-sm uppercase"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateAndRecord}
                disabled={!newElementName.trim()}
                className="flex-1 px-4 py-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 transition-all font-semibold text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Creer et Dessiner
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecorder && selectedElement && (
        <DrawingRecorder
          elementName={selectedElement.name}
          initialDrawing={selectedElement.drawing_data}
          onSave={handleSaveDrawing}
          onCancel={() => setShowRecorder(false)}
        />
      )}

    </div>
  );
};

export default InteractiveDrawing;
