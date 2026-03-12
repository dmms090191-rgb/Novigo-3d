import React, { useState } from 'react';
import { GridSettings, Wall, Brick, Block } from '../types/Scene';
import { Mountain, Grid3x3 as Grid3X3, Ruler, Square, Cpu, Activity, Database, Zap, Building2, X } from 'lucide-react';

type EditorMode = 'navigation' | 'terrain' | 'construction';
type TerrainType = 'plat' | 'urbain' | null;

interface TerrainConfig {
  width: number;
  length: number;
  cellSize: number;
}

interface Zone3ParamsProps {
  gridSettings: GridSettings;
  walls: Wall[];
  blocks: Block[];
  bricks: Brick[];
  onGridSettingsChange: (settings: GridSettings) => void;
  onClearAll: () => void;
  editorMode: EditorMode;
  terrain: TerrainConfig | null;
  onCreateTerrain: (width: number, length: number, cellSize: number) => void;
  onPreviewChange?: (preview: TerrainConfig | null) => void;
  onDeleteTerrain?: () => void;
}

const terrainTypes = [
  { id: 'plat' as TerrainType, name: 'Terrain Plat', icon: Square, color: 'cyan', desc: 'Surface plane standard' },
  { id: 'urbain' as TerrainType, name: 'Urbain', icon: Building2, color: 'amber', desc: 'Zone constructible' },
];

const Zone3Params: React.FC<Zone3ParamsProps> = ({
  editorMode,
  terrain,
  onCreateTerrain,
  onPreviewChange,
  onDeleteTerrain
}) => {
  const [selectedTerrainType, setSelectedTerrainType] = useState<TerrainType>(null);
  const [terrainWidth, setTerrainWidth] = useState(terrain?.width || 20);
  const [terrainLength, setTerrainLength] = useState(terrain?.length || 20);
  const [cellSizeCm, setCellSizeCm] = useState(terrain?.cellSize ? terrain.cellSize * 100 : 10);

  React.useEffect(() => {
    if (editorMode === 'terrain' && onPreviewChange && selectedTerrainType) {
      const cellSizeMeters = cellSizeCm / 100;
      onPreviewChange({
        width: terrainWidth,
        length: terrainLength,
        cellSize: cellSizeMeters
      });
    } else if (editorMode === 'terrain' && onPreviewChange && !selectedTerrainType && !terrain) {
      onPreviewChange(null);
    }
  }, [terrainWidth, terrainLength, cellSizeCm, editorMode, onPreviewChange, selectedTerrainType, terrain]);

  const handleSelectTerrainType = (type: TerrainType) => {
    setSelectedTerrainType(type);
    if (onPreviewChange && type) {
      const cellSizeMeters = cellSizeCm / 100;
      onPreviewChange({
        width: terrainWidth,
        length: terrainLength,
        cellSize: cellSizeMeters
      });
    }
  };

  const handleCreateTerrain = () => {
    const cellSizeMeters = cellSizeCm / 100;
    onCreateTerrain(terrainWidth, terrainLength, cellSizeMeters);
  };

  const surfaceArea = terrainWidth * terrainLength;
  const cellSizeMeters = cellSizeCm / 100;
  const cellsInWidth = cellSizeMeters > 0 ? Math.ceil(terrainWidth / cellSizeMeters) : 0;
  const cellsInLength = cellSizeMeters > 0 ? Math.ceil(terrainLength / cellSizeMeters) : 0;
  const totalCells = cellsInWidth * cellsInLength;

  return (
    <div className="h-full bg-[#0a0d14] overflow-auto tech-scrollbar relative">
      <div className="absolute inset-0 bg-tech-grid opacity-30"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
        <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-cyan-500/50 via-transparent to-cyan-500/30"></div>
      </div>

      {editorMode === 'terrain' && !terrain && !selectedTerrainType && (
        <div className="relative p-5">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-cyan-500/10">
            <div className="relative">
              <div className="w-12 h-12 bg-[#0f1318] flex items-center justify-center tech-border-glow">
                <Mountain className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">Creer un Terrain</h2>
              <div className="flex items-center gap-2 mt-1">
                <Activity className="w-3 h-3 text-cyan-500/50" />
                <p className="text-xs text-cyan-500/50 font-mono">SELECTIONNEZ UN TYPE</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {terrainTypes.map((type) => {
              const Icon = type.icon;
              const colorClasses = {
                cyan: 'border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10',
                amber: 'border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10',
              };
              const iconColors = {
                cyan: 'text-cyan-400',
                amber: 'text-amber-400',
              };
              return (
                <button
                  key={type.id}
                  onClick={() => handleSelectTerrainType(type.id)}
                  className={`w-full p-4 bg-[#0f1318] border ${colorClasses[type.color as keyof typeof colorClasses]} transition-all group flex items-center gap-4`}
                >
                  <div className={`w-10 h-10 bg-[#080b10] flex items-center justify-center border border-${type.color}-500/20`}>
                    <Icon className={`w-5 h-5 ${iconColors[type.color as keyof typeof iconColors]}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{type.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{type.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {editorMode === 'terrain' && !terrain && selectedTerrainType && (
        <div className="relative p-5">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-cyan-500/10">
            <div className="relative">
              <div className="w-12 h-12 bg-[#0f1318] flex items-center justify-center tech-border-glow">
                <Mountain className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 animate-pulse-glow"></div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">Configuration Terrain</h2>
              <div className="flex items-center gap-2 mt-1">
                <Activity className="w-3 h-3 text-cyan-500" />
                <p className="text-xs text-cyan-500/70 font-mono">SYS.TERRAIN.ACTIVE</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedTerrainType(null)}
            className="mb-4 px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
          >
            &larr; Changer de type
          </button>

          <div className="space-y-5">
            <div className="tech-card p-4 corner-accent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                  <Ruler className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Dimensions</h3>
                  <p className="text-[10px] text-cyan-500/50 font-mono">PARAM.DIMENSION</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Largeur
                    </label>
                    <span className="text-xs font-mono text-cyan-400">{terrainWidth}m</span>
                  </div>
                  <input
                    type="number"
                    value={terrainWidth}
                    onChange={(e) => setTerrainWidth(Math.max(1, Math.min(200, Number(e.target.value))))}
                    min="1"
                    max="200"
                    className="w-full px-4 py-3 tech-input text-white text-sm font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Longueur
                    </label>
                    <span className="text-xs font-mono text-cyan-400">{terrainLength}m</span>
                  </div>
                  <input
                    type="number"
                    value={terrainLength}
                    onChange={(e) => setTerrainLength(Math.max(1, Math.min(200, Number(e.target.value))))}
                    min="1"
                    max="200"
                    className="w-full px-4 py-3 tech-input text-white text-sm font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            <div className="tech-card p-4 corner-accent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                  <Grid3X3 className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Grille</h3>
                  <p className="text-[10px] text-cyan-500/50 font-mono">PARAM.GRID</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Taille cellules
                  </label>
                  <span className="text-xs font-mono text-cyan-400">{cellSizeCm}cm</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cellSizeCm}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val === '') {
                      setCellSizeCm(0);
                    } else {
                      setCellSizeCm(Math.max(1, Math.min(1000, Number(val))));
                    }
                  }}
                  onBlur={() => {
                    if (cellSizeCm < 1) setCellSizeCm(1);
                  }}
                  className="w-full px-4 py-3 tech-input text-white text-sm font-mono"
                />
                <div className="flex gap-2 mt-3">
                  {[10, 25, 50, 100].map(size => (
                    <button
                      key={size}
                      onClick={() => setCellSizeCm(size)}
                      className={`flex-1 py-2 text-xs font-mono transition-all ${
                        cellSizeCm === size
                          ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                          : 'bg-[#0f1318] border border-cyan-500/10 text-gray-500 hover:border-cyan-500/30 hover:text-cyan-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="tech-card p-4 corner-accent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                  <Database className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Analyse</h3>
                  <p className="text-[10px] text-cyan-500/50 font-mono">DATA.COMPUTE</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="tech-stat-card p-3">
                  <p className="text-2xl font-bold text-white font-mono">{terrainWidth}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Largeur (m)</p>
                </div>
                <div className="tech-stat-card p-3">
                  <p className="text-2xl font-bold text-white font-mono">{terrainLength}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Longueur (m)</p>
                </div>
                <div className="col-span-2 tech-stat-card p-4 bg-gradient-to-r from-cyan-500/10 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Surface totale</p>
                      <p className="text-3xl font-bold text-cyan-400 font-mono mt-1">{surfaceArea.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <Square className="w-8 h-8 text-cyan-500/30" />
                      <p className="text-xs text-cyan-500/50 font-mono">m2</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tech-card p-4 corner-accent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Cellules</h3>
                  <p className="text-[10px] text-emerald-500/50 font-mono">GRID.CELLS</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0f1318] border border-emerald-500/20 p-3">
                  <p className="text-2xl font-bold text-emerald-400 font-mono">{cellsInWidth.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">En largeur</p>
                </div>
                <div className="bg-[#0f1318] border border-emerald-500/20 p-3">
                  <p className="text-2xl font-bold text-emerald-400 font-mono">{cellsInLength.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">En longueur</p>
                </div>
                <div className="col-span-2 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total cellules</p>
                      <p className="text-3xl font-bold text-emerald-400 font-mono mt-1">{totalCells.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Zap className="w-6 h-6 text-emerald-500/50" />
                      <div className="flex gap-1">
                        <div className="w-1.5 h-4 bg-emerald-500/80"></div>
                        <div className="w-1.5 h-4 bg-emerald-500/60"></div>
                        <div className="w-1.5 h-4 bg-emerald-500/40"></div>
                        <div className="w-1.5 h-4 bg-emerald-500/20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateTerrain}
              className="w-full py-4 tech-btn-success font-bold uppercase tracking-wider text-sm relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Finaliser le terrain
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </div>
      )}

      {editorMode === 'terrain' && terrain && (
        <div className="relative p-5">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-emerald-500/10">
            <div className="relative">
              <div className="w-12 h-12 bg-[#0f1318] flex items-center justify-center border border-emerald-500/30">
                <Mountain className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white tracking-wide uppercase">Terrain Actif</h2>
              <div className="flex items-center gap-2 mt-1">
                <Activity className="w-3 h-3 text-emerald-500" />
                <p className="text-xs text-emerald-500/70 font-mono">TERRAIN.EN_LIGNE</p>
              </div>
            </div>
            {onDeleteTerrain && (
              <button
                onClick={onDeleteTerrain}
                className="relative w-10 h-10 group"
                title="Supprimer le terrain"
              >
                <div className="absolute inset-0 rotate-45 border-2 border-red-500/40 group-hover:border-red-500 group-hover:bg-red-500/20 transition-all duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-all duration-300" />
                </div>
                <div className="absolute inset-0 rotate-45 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-400"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-400"></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-red-400"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-red-400"></div>
                </div>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="tech-stat-card p-4 bg-gradient-to-br from-cyan-500/10 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4 text-cyan-400" />
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Largeur</p>
              </div>
              <p className="text-3xl font-bold text-cyan-400 font-mono">{terrain.width}</p>
              <p className="text-xs text-cyan-500/50 font-mono mt-1">metres</p>
            </div>
            <div className="tech-stat-card p-4 bg-gradient-to-br from-emerald-500/10 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4 text-emerald-400" />
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Longueur</p>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{terrain.length}</p>
              <p className="text-xs text-emerald-500/50 font-mono mt-1">metres</p>
            </div>
          </div>

          <div className="tech-card p-4 corner-accent">
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between text-gray-400">
                <span>CELLULES (L x l)</span>
                <span className="text-white">{Math.ceil(terrain.width / terrain.cellSize)} x {Math.ceil(terrain.length / terrain.cellSize)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>TOTAL CELLULES</span>
                <span className="text-cyan-400">{Math.ceil(terrain.width / terrain.cellSize) * Math.ceil(terrain.length / terrain.cellSize)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>TAILLE CELLULE</span>
                <span className="text-white">{terrain.cellSize * 100} cm</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>SURFACE</span>
                <span className="text-emerald-400">{terrain.width * terrain.length} m2</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {editorMode !== 'terrain' && terrain && (
        <div className="relative p-5">
          <div className="tech-card p-4 corner-accent">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                <Mountain className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Terrain Actif</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <p className="text-[10px] text-emerald-500/70 font-mono">EN LIGNE</p>
                </div>
              </div>
              {onDeleteTerrain && (
                <button
                  onClick={onDeleteTerrain}
                  className="relative w-8 h-8 group"
                  title="Supprimer le terrain"
                >
                  <div className="absolute inset-0 rotate-45 border-2 border-red-500/40 group-hover:border-red-500 group-hover:bg-red-500/20 transition-all duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-all duration-300" />
                  </div>
                  <div className="absolute inset-0 rotate-45 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-red-400"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-red-400"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-red-400"></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-red-400"></div>
                  </div>
                </button>
              )}
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between text-gray-400">
                <span>LARGEUR</span>
                <span className="text-cyan-400">{terrain.width} m</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>LONGUEUR</span>
                <span className="text-emerald-400">{terrain.length} m</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>SURFACE</span>
                <span className="text-white">{terrain.width * terrain.length} m2</span>
              </div>
              <div className="h-px bg-gray-700/50 my-2"></div>
              <div className="flex justify-between text-gray-400">
                <span>PETITE CELLULE</span>
                <span className="text-amber-400">{terrain.cellSize * 100} cm</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>GRANDE CELLULE</span>
                <span className="text-rose-400">{terrain.cellSize * 100 * 10} cm</span>
              </div>
              <div className="h-px bg-gray-700/50 my-2"></div>
              <div className="flex justify-between text-gray-400">
                <span>CELLULES (L x l)</span>
                <span className="text-white">{Math.ceil(terrain.width / terrain.cellSize)} x {Math.ceil(terrain.length / terrain.cellSize)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>TOTAL CELLULES</span>
                <span className="text-cyan-400">{Math.ceil(terrain.width / terrain.cellSize) * Math.ceil(terrain.length / terrain.cellSize)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Zone3Params;
