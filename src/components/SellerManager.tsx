import React, { useState } from 'react';
import { ShoppingBag, Plus, List, User, Mail, Lock, Calendar, Hash, Trash2, CheckSquare, Square, LogIn, Eye, X } from 'lucide-react';
import { Seller } from '../types/Seller';
import { sellerService } from '../services/sellerService';

interface SellerManagerProps {
  sellers: Seller[];
  onSellerCreated: (seller: Seller) => void;
  onSellersDeleted: (sellerIds: string[]) => void;
  onSellerLogin?: (seller: Seller) => void;
}

const SellerManager: React.FC<SellerManagerProps> = ({ sellers, onSellerCreated, onSellersDeleted, onSellerLogin }) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [selectedSellerDetails, setSelectedSellerDetails] = useState<Seller | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: ''
  });

  const generateId = (): string => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newSeller: Seller = {
      id: generateId(),
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      motDePasse: formData.motDePasse,
      dateCreation: new Date().toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-seller`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.motDePasse,
            fullName: `${formData.prenom} ${formData.nom}`,
            phone: '',
            commissionRate: 0
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Seller cree avec succes:', data);

        onSellerCreated(newSeller);

        setFormData({
          nom: '',
          prenom: '',
          email: '',
          motDePasse: ''
        });

        setActiveTab('list');
      } else {
        const errorData = await response.json();
        console.error('Failed to create seller in database:', errorData);
      }
    } catch (error) {
      console.error('Error creating seller:', error);
    }
  };

  const handleSelectSeller = (sellerId: string) => {
    setSelectedSellers(prev =>
      prev.includes(sellerId)
        ? prev.filter(id => id !== sellerId)
        : [...prev, sellerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSellers.length === sellers.length) {
      setSelectedSellers([]);
    } else {
      setSelectedSellers(sellers.map(s => s.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSellers.length === 0) return;

    try {
      await sellerService.deleteMultipleSellers(selectedSellers);
      onSellersDeleted(selectedSellers);
      setSelectedSellers([]);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const subMenuItems = [
    { id: 'add', label: 'Ajouter Seller', icon: Plus },
    { id: 'list', label: 'Liste Sellers', icon: List, badge: sellers.length },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl blur-lg" />
        <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-xl border border-green-500/20 p-1">
          <div className="flex items-center gap-1">
            {subMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30'
                      : 'hover:bg-slate-800/50 text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-green-500/30 text-green-300 border border-green-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'add' && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Ajouter un seller</h2>
                  <p className="text-sm text-slate-400">Creez un nouveau compte vendeur</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-slate-300 mb-2">
                    Nom *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-slate-300 mb-2">
                    Prenom *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                      placeholder="Jean"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                    placeholder="jean.dupont@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="motDePasse" className="block text-sm font-medium text-slate-300 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    id="motDePasse"
                    name="motDePasse"
                    value={formData.motDePasse}
                    onChange={handleInputChange}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                    placeholder="password"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-8 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-5 h-5" />
                  Creer le seller
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <List className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Liste des Sellers</h2>
                    <p className="text-sm text-slate-400">{sellers.length} vendeurs enregistres</p>
                  </div>
                </div>
                {selectedSellers.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">
                      {selectedSellers.length} selectionne(s)
                    </span>
                    <button
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg shadow-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {sellers.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Aucun seller cree</h3>
                <p className="text-slate-400 mb-6">Commencez par ajouter votre premier seller</p>
                <button
                  onClick={() => setActiveTab('add')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-cyan-500/30"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un seller
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-700/50">
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center justify-center w-5 h-5 text-slate-500 hover:text-cyan-400 transition-colors"
                        >
                          {selectedSellers.length === sellers.length ? (
                            <CheckSquare className="w-5 h-5 text-cyan-400" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <Hash className="w-4 h-4" />
                          ID
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <User className="w-4 h-4" />
                          Nom
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <User className="w-4 h-4" />
                          Prenom
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <Lock className="w-4 h-4" />
                          Mot de passe
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <Calendar className="w-4 h-4" />
                          Date
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {sellers.map((seller) => (
                      <tr key={seller.id} className="hover:bg-slate-800/30 transition-all duration-200 group">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSelectSeller(seller.id)}
                            className="flex items-center justify-center w-5 h-5 text-slate-500 hover:text-cyan-400 transition-colors"
                          >
                            {selectedSellers.includes(seller.id) ? (
                              <CheckSquare className="w-5 h-5 text-cyan-400" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-cyan-400">#{seller.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-white">{seller.nom}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-300">{seller.prenom}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-300">{seller.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-slate-400">{seller.motDePasse}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-400">{seller.dateCreation}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedSellerDetails(seller)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 text-sm font-medium rounded-xl border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedSellerDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-cyan-500/20">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center ring-2 ring-white/50">
                    <ShoppingBag className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Details du Seller</h2>
                    <p className="text-cyan-100 text-sm">Informations completes du vendeur</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSellerDetails(null)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center transition-all duration-200 hover:rotate-90"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedSellerDetails.prenom} {selectedSellerDetails.nom}
                    </h3>
                    <p className="text-sm text-slate-400">ID: #{selectedSellerDetails.id}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    Adresse Email
                  </label>
                  <div className="bg-slate-800/50 border border-slate-700 group-hover:border-cyan-500/50 px-5 py-4 rounded-xl transition-all duration-200">
                    <p className="text-base font-medium text-white break-all">{selectedSellerDetails.email}</p>
                  </div>
                </div>

                <div className="group">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    Date de Creation
                  </label>
                  <div className="bg-slate-800/50 border border-slate-700 group-hover:border-cyan-500/50 px-5 py-4 rounded-xl transition-all duration-200">
                    <p className="text-base font-medium text-white">{selectedSellerDetails.dateCreation}</p>
                  </div>
                </div>

                <div className="group md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    Mot de Passe
                  </label>
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-5 py-4 rounded-xl">
                    <p className="text-base font-mono font-semibold text-amber-400">{selectedSellerDetails.motDePasse}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 px-8 py-6 border-t border-slate-700/50 flex items-center justify-end gap-4">
              {onSellerLogin && (
                <button
                  onClick={() => {
                    onSellerLogin(selectedSellerDetails);
                    setSelectedSellerDetails(null);
                  }}
                  className="flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105"
                >
                  <LogIn className="w-5 h-5" />
                  Se connecter en tant que ce seller
                </button>
              )}
              <button
                onClick={() => setSelectedSellerDetails(null)}
                className="px-8 py-4 bg-slate-700 border border-slate-600 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all duration-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerManager;
