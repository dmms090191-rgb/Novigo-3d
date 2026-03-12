import React, { useState, useEffect } from 'react';
import { ArrowLeft, Layers, Box, HelpCircle, Activity, Cpu, Monitor, Eye } from 'lucide-react';
import Zone2D from '../components/Zone2D';
import Zone3D from '../components/Zone3D';
import Zone3Params from '../components/Zone3Params';
import ControlsHelp from '../components/ControlsHelp';
import { GridSettings, Wall, Brick, Block, TerrainCell } from '../types/Scene';

type TabType = 'editor' | 'controls';
type EditorMode = 'navigation' | 'terrain' | 'construction';

interface TerrainConfig {
  width: number;
  length: number;
  cellSize: number;
}

const Plan: React.FC = () => {
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

  useEffect(() => {
    if (terrain === null) {
      setEditorMode('terrain');
    }
  }, [terrain]);

  const [gridSettings, setGridSettings] = useState<GridSettings>({
    gridWidthMeters: 20,
    gridLengthMeters: 20,
    cellSize: 0.1,
    blockSize: 0.10,
    wallHeight: 2.5,
    wallThickness: 0.20,
    wallType: 'exterior',
  });

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

  const [walls, setWalls] = useState<Wall[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [terrainCells, setTerrainCells] = useState<TerrainCell[]>([]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const container = document.getElementById('plan-container');
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
    console.log('handleAddBlock appele avec:', block);
    console.log('Blocs actuels avant:', blocks);
    const newBlocks = [...blocks, block];
    console.log('Nouveaux blocs apres:', newBlocks);
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

  const handleDeleteTerrain = () => {
    setTerrain(null);
    setTerrainPreview(null);
    setBlocks([]);
    setWalls([]);
    setBricks([]);
    setTerrainCells([]);
    setEditorMode('terrain');
  };

  return (
    <div className="h-screen w-screen bg-[#0a0d14] flex flex-col overflow-hidden">
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
              <h2 className="text-lg font-bold text-white tracking-wider uppercase">Plan Editor</h2>
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
          <a
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 font-medium transition-all px-4 py-2.5 tech-btn text-sm uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </a>
        </div>
      </div>

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
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-2.5 px-5 py-3 font-medium transition-all border-b-2 text-sm uppercase tracking-wider ${
              activeTab === 'controls'
                ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-cyan-500/5'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Controles
          </button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div
          id="plan-container"
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
                  />
                </div>

                <div className="w-10 bg-[#080b10] border-l border-cyan-500/20 flex flex-col items-center py-2">
                  <div className="text-[8px] text-cyan-500/60 font-mono mb-1 tracking-wider">2D</div>
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
                  />
                </div>

                <div className="w-10 bg-[#080b10] border-l border-emerald-500/20 flex flex-col items-center py-2">
                  <div className="text-[8px] text-emerald-500/60 font-mono mb-1 tracking-wider">3D</div>
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

          <div className="flex flex-shrink-0">
            <div className="w-96 border-l border-cyan-500/20">
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
              />
            </div>
          </div>
        </div>
      ) : (
        <ControlsHelp />
      )}
    </div>
  );
};

export default Plan;
