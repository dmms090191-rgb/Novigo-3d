import React, { useState, useRef } from 'react';
import { Image, Upload, Eye, Trash2, Check, X } from 'lucide-react';

interface HomepageManagerProps {
  currentImage: string | null;
  onImageUpdate: (imageUrl: string | null) => void;
}

const HomepageManager: React.FC<HomepageManagerProps> = ({ currentImage, onImageUpdate }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setPreviewImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSaveImage = () => {
    onImageUpdate(previewImage);
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    onImageUpdate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelChanges = () => {
    setPreviewImage(currentImage);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasChanges = previewImage !== currentImage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Image className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Page d'accueil</h2>
          <p className="text-gray-600">Gérez l'image affichée sur la page de connexion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600" />
              Importer une image
            </h3>

            {/* Drag & Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                isDragging
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Glissez-déposez votre image ici
                  </p>
                  <p className="text-gray-500 mb-4">
                    ou cliquez pour sélectionner un fichier
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Choisir un fichier
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Formats supportés: JPG, PNG, GIF (max 5MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            {hasChanges && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveImage}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer
                </button>
                <button
                  onClick={handleCancelChanges}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </div>
            )}
          </div>

          {/* Current Image Info */}
          {currentImage && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Image actuelle
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Une image est actuellement affichée sur la page de connexion
                </p>
                <button
                  onClick={handleRemoveImage}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Aperçu
            </h3>

            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Aperçu de l'image"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Aucune image sélectionnée</p>
                  </div>
                </div>
              )}
            </div>

            {previewImage && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Aperçu:</strong> Cette image sera affichée sur le côté droit de la page de connexion.
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">Instructions</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• L'image sera affichée sur la page de connexion</li>
              <li>• Format recommandé: 16:9 (paysage)</li>
              <li>• Résolution optimale: 1920x1080px</li>
              <li>• Taille maximale: 5MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageManager;