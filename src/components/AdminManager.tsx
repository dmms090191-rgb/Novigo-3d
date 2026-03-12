import React, { useState, useRef, useEffect } from 'react';
import { Shield, Plus, List, User, Mail, Lock, Calendar, Hash, Trash2, CheckSquare, Square } from 'lucide-react';
import { Admin } from '../types/Admin';
import { adminService } from '../services/adminService';

interface AdminManagerProps {
  admins: Admin[];
  onAdminCreated: (admin: Admin) => void;
  onAdminsDeleted: (adminIds: string[]) => void;
  onAdminUpdated?: (admin: Admin) => void;
}

const AdminManager: React.FC<AdminManagerProps> = ({ admins, onAdminCreated, onAdminsDeleted, onAdminUpdated }) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    pin: ['', '', '', '', '', '']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...formData.pin];
    newPin[index] = value.slice(-1);
    setFormData(prev => ({ ...prev, pin: newPin }));

    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !formData.pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      pinRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newPin = [...formData.pin];
    for (let i = 0; i < pastedData.length; i++) {
      newPin[i] = pastedData[i];
    }
    setFormData(prev => ({ ...prev, pin: newPin }));
    if (pastedData.length > 0) {
      pinRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const pinString = formData.pin.join('');
    if (pinString.length !== 6) {
      alert('Le mot de passe doit contenir 6 chiffres');
      return;
    }

    setIsSubmitting(true);

    try {
      const createdAdmin = await adminService.createAdmin({
        email: formData.email,
        first_name: formData.prenom,
        last_name: formData.nom,
        password_pin: pinString
      });

      if (createdAdmin) {
        const newAdmin: Admin = {
          id: createdAdmin.id,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          motDePasse: pinString,
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
          pin: ['', '', '', '', '', '']
        });

        setActiveTab('list');
      }
    } catch (error: unknown) {
      console.error('Erreur lors de la creation de l\'admin:', error);
    } finally {
      setIsSubmitting(false);
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
    } catch (error: unknown) {
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

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Gestionnaire d'Admins</h1>
            </div>
            <p className="text-slate-400">Gerez vos administrateurs et leurs privileges</p>
          </div>

          {activeTab === 'add' && (
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Plus className="w-6 h-6 text-green-400" />
                <h2 className="text-2xl font-semibold text-white">Ajouter un admin</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-slate-300 mb-2">
                      Nom *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        id="prenom"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="jean.dupont@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Mot de passe (6 chiffres) *
                    </div>
                  </label>
                  <div className="flex gap-3 justify-center" onPaste={handlePinPaste}>
                    {formData.pin.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { pinRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(index, e)}
                        className="w-14 h-14 text-center text-2xl font-bold bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-8 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    {isSubmitting ? 'Enregistrement...' : 'Valider'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <List className="w-5 h-5 text-slate-400" />
                    <h2 className="text-xl font-semibold text-white">
                      Liste des Admins ({admins.length})
                    </h2>
                  </div>
                  {selectedAdmins.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">
                        {selectedAdmins.length} selectionne(s)
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
                  <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Aucun admin cree</h3>
                  <p className="text-slate-400 mb-6">Commencez par ajouter votre premier admin</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un admin
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={handleSelectAll}
                            className="flex items-center justify-center w-5 h-5 text-slate-400 hover:text-white transition-colors"
                            title={selectedAdmins.length === admins.length ? "Deselectionner tout" : "Selectionner tout"}
                          >
                            {selectedAdmins.length === admins.length ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            ID
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Nom
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Prenom
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Mot de passe
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date de creation
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {admins.map((admin) => (
                        <AdminRow
                          key={admin.id}
                          admin={admin}
                          isSelected={selectedAdmins.includes(admin.id)}
                          onSelect={() => handleSelectAdmin(admin.id)}
                          onUpdate={onAdminUpdated}
                        />
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

interface AdminRowProps {
  admin: Admin;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate?: (admin: Admin) => void;
}

const AdminRow: React.FC<AdminRowProps> = ({ admin, isSelected, onSelect, onUpdate }) => {
  const [pin, setPin] = useState<string[]>(admin.motDePasse ? admin.motDePasse.split('') : ['', '', '', '', '', '']);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const savePin = async (newPin: string[]) => {
    const pinString = newPin.join('');
    try {
      await adminService.updatePasswordPin(admin.id, pinString);
      if (onUpdate) {
        onUpdate({ ...admin, motDePasse: pinString });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du PIN:', error);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      savePin(newPin);
    }, 500);

    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      pinRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      pinRefs.current[index + 1]?.focus();
    }
  };

  return (
    <tr className="hover:bg-slate-800/30 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={onSelect}
          className="flex items-center justify-center w-5 h-5 text-slate-400 hover:text-green-400 transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-green-400" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
        #{admin.id.slice(0, 8)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
        {admin.nom}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
        {admin.prenom}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
        {admin.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-1">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { pinRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handlePinKeyDown(index, e)}
              className="w-8 h-8 text-center text-sm font-mono font-bold bg-slate-800/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            />
          ))}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
        {admin.dateCreation}
      </td>
    </tr>
  );
};

export default AdminManager;
