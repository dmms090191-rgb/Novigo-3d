import React, { useState, useEffect } from 'react';
import { Box, DoorOpen, Armchair, UtensilsCrossed, Bath, Bed, Tv, Archive, Plus, Trash2, Pencil, X, Check, Sofa, Activity, Play, Image, Loader2 } from 'lucide-react';
import { LibraryElement, DrawingData } from '../types/ElementLibrary';
import { elementLibraryService } from '../services/elementLibraryService';
import DrawingRecorder from './DrawingRecorder';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'box': Box,
  'door': DoorOpen,
  'chair': Armchair,
  'table': UtensilsCrossed,
  'bath': Bath,
  'bed': Bed,
  'tv': Tv,
  'archive': Archive,
  'sofa': Sofa,
};

const categories = ['Tous', 'Structure', 'Mobilier', 'Salle de bain', 'Chambre', 'Electronique', 'Rangement', 'Salon'];

const ElementsManager: React.FC = () => {
  const [elements, setElements] = useState<LibraryElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [editingElement, setEditingElement] = useState<LibraryElement | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [recordingElement, setRecordingElement] = useState<LibraryElement | null>(null);
  const [newElement, setNewElement] = useState({
    name: '',
    icon: 'box',
    category: 'Mobilier',
    width: 100,
    height: 100,
    depth: 100,
  });

  useEffect(() => {
    loadElements();
  }, []);

  const loadElements = async () => {
    setLoading(true);
    const data = await elementLibraryService.getAll();
    setElements(data);
    setLoading(false);
  };

  const filteredElements = selectedCategory === 'Tous'
    ? elements
    : elements.filter(el => el.category === selectedCategory);

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cet element ?')) {
      const success = await elementLibraryService.delete(id);
      if (success) {
        setElements(elements.filter(el => el.id !== id));
      }
    }
  };

  const handleSaveEdit = async () => {
    if (editingElement) {
      const updated = await elementLibraryService.update(editingElement.id, {
        name: editingElement.name,
        category: editingElement.category,
        icon: editingElement.icon,
        width: editingElement.width,
        height: editingElement.height,
        depth: editingElement.depth,
      });
      if (updated) {
        setElements(elements.map(el => el.id === editingElement.id ? updated : el));
      }
      setEditingElement(null);
    }
  };

  const handleAddNew = async () => {
    if (newElement.name) {
      const created = await elementLibraryService.create(newElement);
      if (created) {
        setElements([...elements, created]);
      }
      setNewElement({
        name: '',
        icon: 'box',
        category: 'Mobilier',
        width: 100,
        height: 100,
        depth: 100,
      });
      setIsAddingNew(false);
    }
  };

  const handleSaveDrawing = async (drawingData: DrawingData, previewImage: string) => {
    if (!recordingElement) return;

    const success = await elementLibraryService.saveDrawing(
      recordingElement.id,
      drawingData,
      previewImage
    );

    if (success) {
      setElements(elements.map(el =>
        el.id === recordingElement.id
          ? { ...el, drawing_data: drawingData, preview_image: previewImage }
          : el
      ));
    }

    setRecordingElement(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#071018] border-2 border-amber-500/40 flex items-center justify-center">
            <Sofa className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-cyan-200 uppercase tracking-wider">Bibliotheque d'Elements</h2>
            <div className="flex items-center gap-2 mt-1">
              <Activity className="w-3 h-3 text-amber-500/50" />
              <p className="text-xs text-amber-500/50 font-mono">DESSINS INTERACTIFS</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 hover:border-amber-400 transition-all font-semibold text-sm uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
              selectedCategory === cat
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                : 'bg-[#071018]/80 border border-cyan-700/30 text-cyan-500/60 hover:border-cyan-500/40 hover:text-cyan-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isAddingNew && (
        <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-amber-400 font-semibold uppercase tracking-wider">Nouvel Element</h3>
            <button onClick={() => setIsAddingNew(false)} className="text-gray-500 hover:text-red-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Nom</label>
              <input
                type="text"
                value={newElement.name}
                onChange={e => setNewElement({ ...newElement, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#071018] border border-cyan-700/30 text-cyan-200 text-sm focus:border-cyan-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Categorie</label>
              <select
                value={newElement.category}
                onChange={e => setNewElement({ ...newElement, category: e.target.value })}
                className="w-full px-3 py-2 bg-[#071018] border border-cyan-700/30 text-cyan-200 text-sm focus:border-cyan-500/50 outline-none"
              >
                {categories.filter(c => c !== 'Tous').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Icone</label>
              <select
                value={newElement.icon}
                onChange={e => setNewElement({ ...newElement, icon: e.target.value })}
                className="w-full px-3 py-2 bg-[#071018] border border-cyan-700/30 text-cyan-200 text-sm focus:border-cyan-500/50 outline-none"
              >
                {Object.keys(iconMap).map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">L (cm)</label>
                <input
                  type="number"
                  value={newElement.width}
                  onChange={e => setNewElement({ ...newElement, width: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#071018] border border-cyan-700/30 text-cyan-200 text-sm focus:border-cyan-500/50 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">H (cm)</label>
                <input
                  type="number"
                  value={newElement.height}
                  onChange={e => setNewElement({ ...newElement, height: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#071018] border border-cyan-700/30 text-cyan-200 text-sm focus:border-cyan-500/50 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">P (cm)</label>
                <input
                  type="number"
                  value={newElement.depth}
                  onChange={e => setNewElement({ ...newElement, depth: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#071018] border border-cyan-700/30 text-cyan-200 text-sm focus:border-cyan-500/50 outline-none"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleAddNew}
            className="mt-4 flex items-center gap-2 px-5 py-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 transition-all font-semibold text-sm uppercase tracking-wider"
          >
            <Check className="w-4 h-4" />
            Creer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredElements.map(element => {
          const Icon = iconMap[element.icon] || Box;
          const isEditing = editingElement?.id === element.id;
          const hasDrawing = element.drawing_data && element.drawing_data.strokes?.length > 0;

          return (
            <div
              key={element.id}
              className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-xl p-5 hover:border-cyan-500/50 transition-all"
            >
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingElement.name}
                    onChange={e => setEditingElement({ ...editingElement, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#071018] border border-cyan-500/50 text-cyan-200 text-sm outline-none"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500">L</label>
                      <input
                        type="number"
                        value={editingElement.width}
                        onChange={e => setEditingElement({ ...editingElement, width: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-[#071018] border border-cyan-700/30 text-cyan-200 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">H</label>
                      <input
                        type="number"
                        value={editingElement.height}
                        onChange={e => setEditingElement({ ...editingElement, height: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-[#071018] border border-cyan-700/30 text-cyan-200 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">P</label>
                      <input
                        type="number"
                        value={editingElement.depth}
                        onChange={e => setEditingElement({ ...editingElement, depth: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-[#071018] border border-cyan-700/30 text-cyan-200 text-xs outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs"
                    >
                      <Check className="w-3 h-3" />
                      Sauver
                    </button>
                    <button
                      onClick={() => setEditingElement(null)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-500/20 border border-gray-500/50 text-gray-400 text-xs"
                    >
                      <X className="w-3 h-3" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {element.preview_image ? (
                        <div className="w-14 h-14 bg-[#071018] border border-cyan-500/30 rounded overflow-hidden">
                          <img
                            src={element.preview_image}
                            alt={element.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-[#071018] border border-amber-500/30 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-amber-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-cyan-200 font-semibold">{element.name}</h3>
                        <p className="text-[10px] text-cyan-500/50 uppercase tracking-wider">{element.category}</p>
                        {hasDrawing ? (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                            <span className="text-[10px] text-emerald-400">Dessin enregistre</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-amber-500/50 rounded-full" />
                            <span className="text-[10px] text-amber-400/50">Aucun dessin</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setRecordingElement(element)}
                        className="p-2 text-cyan-500/50 hover:text-emerald-400 transition-colors"
                        title="Enregistrer un dessin"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingElement(element)}
                        className="p-2 text-cyan-500/50 hover:text-cyan-400 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(element.id)}
                        className="p-2 text-cyan-500/50 hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-[#071018]/60 border border-cyan-700/20 p-2 rounded">
                      <p className="text-lg font-mono text-cyan-400">{element.width}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Largeur</p>
                    </div>
                    <div className="bg-[#071018]/60 border border-cyan-700/20 p-2 rounded">
                      <p className="text-lg font-mono text-emerald-400">{element.height}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Hauteur</p>
                    </div>
                    <div className="bg-[#071018]/60 border border-cyan-700/20 p-2 rounded">
                      <p className="text-lg font-mono text-amber-400">{element.depth}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Prof.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setRecordingElement(element)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                      hasDrawing
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    }`}
                  >
                    {hasDrawing ? (
                      <>
                        <Image className="w-4 h-4" />
                        Modifier le dessin
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Enregistrer un dessin
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {elements.length === 0 && (
        <div className="text-center py-12">
          <Box className="w-12 h-12 text-cyan-500/30 mx-auto mb-4" />
          <p className="text-cyan-500/50">Aucun element dans la bibliotheque</p>
          <button
            onClick={() => setIsAddingNew(true)}
            className="mt-4 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-all"
          >
            Creer votre premier element
          </button>
        </div>
      )}

      <div className="bg-[#0a1929]/60 border border-cyan-700/20 rounded-xl p-4">
        <p className="text-xs text-cyan-500/50 font-mono">
          Total: {elements.length} elements | Affichage: {filteredElements.length} elements |
          Avec dessin: {elements.filter(e => e.drawing_data?.strokes?.length > 0).length}
        </p>
      </div>

      {recordingElement && (
        <DrawingRecorder
          elementName={recordingElement.name}
          initialDrawing={recordingElement.drawing_data}
          onSave={handleSaveDrawing}
          onCancel={() => setRecordingElement(null)}
        />
      )}
    </div>
  );
};

export default ElementsManager;
