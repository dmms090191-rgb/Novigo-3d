import React, { useState } from 'react';
import { Shield, Plus, List, User, Mail, Lock, Calendar, Hash, Trash2, CheckSquare, Square } from 'lucide-react';
import { Admin } from '../types/Admin';
import { adminService } from '../services/adminService';

interface AdminManagerProps {
  admins: Admin[];
  onAdminCreated: (admin: Admin) => void;
  onAdminsDeleted: (adminIds: string[]) => void;
}

const AdminManager: React.FC<AdminManagerProps> = ({ admins, onAdminCreated, onAdminsDeleted }) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
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

    try {
      const adminData = {
        email: formData.email,
        full_name: `${formData.prenom} ${formData.nom}`,
        role: 'admin',
        status: 'active'
      };

      const createdAdmin = await adminService.createAdmin(
        formData.email,
        formData.motDePasse,
        adminData
      );

      const newAdmin: Admin = {
        id: createdAdmin.id,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        motDePasse: formData.motDePasse,
        dateCreation: new Date(createdAdmin.created_at).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      onAdminCreated(newAdmin);

      setFormData({
        nom: '',
        prenom: '',
        email: '',
        motDePasse: ''
      });

      setActiveTab('list');
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'admin:', error);
    }
  };

  const handleSelectAdmin = (adminId: string) => {
    setSelectedAdmins(prev =>
      prev.includes(adminId)
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAdmins.length === admins.length) {
      setSelectedAdmins([]);
    } else {
      setSelectedAdmins(admins.map(a => a.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedAdmins.length === 0) return;

    try {
      await adminService.deleteMultipleAdmins(selectedAdmins);
      onAdminsDeleted(selectedAdmins);
      setSelectedAdmins([]);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <div className="w-64 bg-slate-900/60 backdrop-blur-xl border-r border-green-500/20 p-6">
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('add')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'add'
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Ajouter Admin</span>
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
            <span className="font-medium">Liste Admins</span>
            {admins.length > 0 && (
              <span className="ml-auto bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-1 rounded-lg">
                {admins.length}
              </span>
            )}
          </button>
        </div>

        <div className="mt-8 p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total admins</span>
              <span className="font-medium text-white">{admins.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Ajoutes aujourd'hui</span>
              <span className="font-medium text-white">
                {admins.filter(admin =>
                  admin.dateCreation.includes(new Date().toLocaleDateString('fr-FR'))
                ).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Gestionnaire d'Admins</h1>
            </div>
            <p className="text-gray-600">Gérez vos administrateurs et leurs privilèges</p>
          </div>

          {activeTab === 'add' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Plus className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Ajouter un admin</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Dupont"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="prenom"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Jean"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="jean.dupont@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="motDePasse"
                      name="motDePasse"
                      value={formData.motDePasse}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-8 rounded-lg font-medium hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    Valider
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <List className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Liste des Admins ({admins.length})
                    </h2>
                  </div>
                  {selectedAdmins.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {selectedAdmins.length} sélectionné(s)
                      </span>
                      <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {admins.length === 0 ? (
                <div className="p-12 text-center">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun admin créé</h3>
                  <p className="text-gray-500 mb-6">Commencez par ajouter votre premier admin</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un admin
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={handleSelectAll}
                            className="flex items-center justify-center w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors"
                            title={selectedAdmins.length === admins.length ? "Désélectionner tout" : "Sélectionner tout"}
                          >
                            {selectedAdmins.length === admins.length ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            ID
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Nom
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Prénom
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Mot de passe
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date de création
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {admins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleSelectAdmin(admin.id)}
                              className="flex items-center justify-center w-5 h-5 text-gray-500 hover:text-red-600 transition-colors"
                            >
                              {selectedAdmins.includes(admin.id) ? (
                                <CheckSquare className="w-5 h-5 text-red-600" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{admin.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {admin.nom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {admin.prenom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {admin.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {admin.motDePasse}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.dateCreation}
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
      </div>
    </div>
  );
};

export default AdminManager;
