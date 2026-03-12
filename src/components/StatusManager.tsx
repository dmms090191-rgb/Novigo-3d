import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Palette, List, RotateCcw, Sparkles } from 'lucide-react';
import { statusService } from '../services/statusService';
import { Status } from '../types/Status';

const StatusManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#06b6d4');
  const [loading, setLoading] = useState(false);
  const [savedColors, setSavedColors] = useState<(string | null)[]>(() => {
    const stored = localStorage.getItem('statusColorSlots');
    return stored ? JSON.parse(stored) : [null, null, null, null, null, null];
  });

  useEffect(() => {
    loadStatuses();
  }, []);

  useEffect(() => {
    localStorage.setItem('statusColorSlots', JSON.stringify(savedColors));
  }, [savedColors]);

  const handleResetColors = () => {
    setSavedColors([null, null, null, null, null, null]);
  };

  const allSlotsFilled = savedColors.every(color => color !== null);

  const loadStatuses = async () => {
    try {
      const data = await statusService.getAllStatuses();
      setStatuses(data);
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) {
      return;
    }

    setLoading(true);
    try {
      await statusService.createStatus(newStatusName, newStatusColor);

      const emptySlotIndex = savedColors.findIndex(color => color === null);
      if (emptySlotIndex !== -1) {
        const newSavedColors = [...savedColors];
        newSavedColors[emptySlotIndex] = newStatusColor;
        setSavedColors(newSavedColors);
      }

      setNewStatusName('');
      setNewStatusColor('#06b6d4');
      await loadStatuses();
      setActiveTab('list');
    } catch (error) {
      console.error('Error creating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStatus = async (id: string) => {
    try {
      await statusService.deleteStatus(id);
      await loadStatuses();
    } catch (error) {
      console.error('Error deleting status:', error);
    }
  };

  return (
    <div className="flex h-full gap-6">
      <div className="w-72 flex-shrink-0">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-5 sticky top-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Statuts</h3>
              <p className="text-xs text-slate-400">Gestion des statuts</p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <button
              onClick={() => setActiveTab('create')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Creer un statut</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'list'
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <List className="w-5 h-5" />
              <span className="font-medium">Liste des statuts</span>
              {statuses.length > 0 && (
                <span className="ml-auto bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-1 rounded-lg">
                  {statuses.length}
                </span>
              )}
            </button>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total</span>
              <Tag className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-white">{statuses.length}</p>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl p-4 border border-cyan-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Info</span>
            </div>
            <p className="text-xs text-slate-400">
              Les statuts permettent de categoriser vos leads et clients.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {activeTab === 'create' && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Creer un statut</h2>
                  <p className="text-sm text-slate-400">Ajoutez un nouveau statut personnalise</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateStatus} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom du statut
                </label>
                <input
                  type="text"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="Ex: En cours, Termine, En attente..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-300">
                    Couleurs enregistrees ({savedColors.filter(c => c !== null).length}/6)
                  </label>
                  <button
                    type="button"
                    onClick={handleResetColors}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reinitialiser
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-3 mb-4">
                  {savedColors.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => color && setNewStatusColor(color)}
                      disabled={!color}
                      className={`w-full h-14 rounded-xl transition-all duration-200 ${
                        color
                          ? newStatusColor === color
                            ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-105'
                            : 'hover:scale-105 border border-slate-700'
                          : 'bg-slate-800/50 border-2 border-dashed border-slate-700 cursor-not-allowed'
                      }`}
                      style={color ? { backgroundColor: color } : {}}
                      title={color || 'Case vide'}
                    >
                      {!color && (
                        <span className="text-slate-600 text-xs">Vide</span>
                      )}
                    </button>
                  ))}
                </div>

                {allSlotsFilled && (
                  <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-sm text-amber-400 font-medium">
                      Toutes les cases sont remplies. Reinitialisez pour enregistrer de nouvelles couleurs.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <div className="relative">
                    <input
                      type="color"
                      value={newStatusColor}
                      onChange={(e) => setNewStatusColor(e.target.value)}
                      className="w-20 h-20 rounded-xl cursor-pointer border-2 border-slate-700 bg-transparent"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Palette className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                      <p className="text-sm text-slate-400 mb-2">Apercu:</p>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: newStatusColor }}
                      >
                        {newStatusName || 'Nom du statut'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Code couleur: <span className="font-mono text-cyan-400">{newStatusColor}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !newStatusName.trim()}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Creation en cours...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Creer le statut
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <List className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Liste des statuts</h2>
                  <p className="text-sm text-slate-400">{statuses.length} statuts enregistres</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {statuses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Tag className="w-10 h-10 text-slate-600" />
                  </div>
                  <p className="text-xl font-semibold text-white mb-2">Aucun statut cree</p>
                  <p className="text-slate-400 mb-6">
                    Creez votre premier statut pour commencer
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-cyan-500/30"
                  >
                    <Plus className="w-5 h-5" />
                    Creer un statut
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statuses.map((status) => (
                    <div
                      key={status.id}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-cyan-500/30 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: status.color + '20' }}
                          >
                            <Tag className="w-6 h-6" style={{ color: status.color }} />
                          </div>
                          <div>
                            <h3
                              className="text-lg font-bold"
                              style={{ color: status.color }}
                            >
                              {status.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-mono mt-1">
                              {status.color}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteStatus(status.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="pt-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500">
                          Cree le {new Date(status.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusManager;
