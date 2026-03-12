import React, { useState, useEffect } from 'react';
import { Sofa, Activity, ChevronDown, Loader2, X, Pencil } from 'lucide-react';
import { LibraryElement } from '../types/ElementLibrary';
import { elementLibraryService } from '../services/elementLibraryService';

interface ElementLibraryPanelProps {
  selectedElement: LibraryElement | null;
  onSelectElement: (element: LibraryElement | null) => void;
  onDrawOnScene?: () => void;
}

const ElementLibraryPanel: React.FC<ElementLibraryPanelProps> = ({
  selectedElement,
  onSelectElement,
  onDrawOnScene,
}) => {
  const [elements, setElements] = useState<LibraryElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [categories, setCategories] = useState<string[]>(['Tous']);

  useEffect(() => {
    const loadElements = async () => {
      setLoading(true);
      const data = await elementLibraryService.getAll();
      setElements(data);

      const cats = ['Tous', ...new Set(data.map(e => e.category))];
      setCategories(cats);

      setLoading(false);
    };

    loadElements();

    const interval = setInterval(loadElements, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const filteredElements = selectedCategory === 'Tous'
    ? elements
    : elements.filter(e => e.category === selectedCategory);

  const elementsWithDrawing = filteredElements.filter(e => e.drawing_data?.strokes?.length > 0);

  if (loading) {
    return (
      <div className="tech-card p-4 corner-accent">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="tech-card p-4 corner-accent">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
          <Sofa className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Bibliotheque</h3>
          <div className="flex items-center gap-2 mt-1">
            <Activity className="w-3 h-3 text-amber-500/50" />
            <p className="text-[10px] text-amber-500/50 font-mono">
              {elements.length} ELEMENTS | {elementsWithDrawing.length} DESSINS
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-all ${
              selectedCategory === cat
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                : 'bg-[#0a0d14] border border-cyan-700/20 text-gray-500 hover:border-cyan-500/30 hover:text-cyan-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#0f1318] border border-amber-500/30 hover:border-amber-500/50 transition-all"
        >
          <span className="text-sm font-mono text-gray-400">
            {selectedElement ? selectedElement.name : 'Selectionnez un element'}
          </span>
          <ChevronDown className={`w-4 h-4 text-amber-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0d14] border border-amber-500/30 shadow-2xl z-50 max-h-[250px] overflow-y-auto tech-scrollbar">
            {filteredElements.map((element) => (
              <button
                key={element.id}
                onClick={() => {
                  onSelectElement(element);
                  setIsMenuOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left text-xs font-mono transition-colors ${
                  selectedElement?.id === element.id
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-gray-400 hover:bg-amber-500/10 hover:text-amber-400'
                }`}
              >
                {element.name}
              </button>
            ))}

            {filteredElements.length === 0 && (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-gray-500">Aucun element</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedElement && (
        <div className="mt-2 space-y-2">
          <button
            onClick={() => onSelectElement(null)}
            className="w-full px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500/40 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-3 h-3" />
            Deselectionner
          </button>
          {onDrawOnScene && selectedElement.drawing_data?.strokes?.length > 0 && (
            <button
              onClick={onDrawOnScene}
              className="w-full px-3 py-2 text-xs font-mono bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Dessiner sur la scene
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ElementLibraryPanel;
