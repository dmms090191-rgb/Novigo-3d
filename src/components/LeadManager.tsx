import React, { useState } from 'react';
import { Users, Plus, List, User, Mail, Phone, Lock, Calendar, Hash, Trash2, CheckSquare, Square, UserCheck, ArrowRight, LogIn, Eye, X, ChevronRight, BarChart3 } from 'lucide-react';
import { Lead } from '../types/Lead';
import { leadService } from '../services/leadService';

interface LeadManagerProps {
  leads: Lead[];
  onLeadCreated: (lead: Lead) => void;
  onLeadsDeleted: (leadIds: string[]) => void;
  onLeadsTransferred?: (leadIds: string[]) => void;
  currentUserEmail?: string;
  onClientLogin?: (lead: Lead) => void;
}

const LeadManager: React.FC<LeadManagerProps> = ({ leads, onLeadCreated, onLeadsDeleted, onLeadsTransferred, currentUserEmail, onClientLogin }) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    telephone: ''
  });
  const [passwordDigits, setPasswordDigits] = useState<string[]>(['', '', '', '', '', '']);
  const passwordInputRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null)
  ];

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

  const handlePasswordDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...passwordDigits];
    newDigits[index] = value.slice(-1);
    setPasswordDigits(newDigits);

    const password = newDigits.join('');
    setFormData(prev => ({
      ...prev,
      motDePasse: password
    }));

    if (value && index < 5) {
      passwordInputRefs[index + 1].current?.focus();
    }
  };

  const handlePasswordKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !passwordDigits[index] && index > 0) {
      passwordInputRefs[index - 1].current?.focus();
    }
  };

  const handlePasswordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/\D/g, '').slice(0, 6).split('');

    const newDigits = [...passwordDigits];
    digits.forEach((digit, i) => {
      if (i < 6) {
        newDigits[i] = digit;
      }
    });

    setPasswordDigits(newDigits);
    setFormData(prev => ({
      ...prev,
      motDePasse: newDigits.join('')
    }));

    const nextEmptyIndex = newDigits.findIndex(d => !d);
    if (nextEmptyIndex !== -1) {
      passwordInputRefs[nextEmptyIndex].current?.focus();
    } else {
      passwordInputRefs[5].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const leadData = {
        email: formData.email,
        full_name: `${formData.prenom} ${formData.nom}`,
        phone: formData.telephone,
        status: 'new',
        source: 'CRM',
        notes: `Cree par ${currentUserEmail || 'Admin'}`
      };

      const createdLead = await leadService.createLead(leadData);

      const newLead: Lead = {
        id: createdLead.id,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        motDePasse: formData.motDePasse,
        telephone: formData.telephone,
        dateCreation: new Date(createdLead.created_at).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: currentUserEmail || 'Admin'
      };

      onLeadCreated(newLead);

      setFormData({
        nom: '',
        prenom: '',
        email: '',
        motDePasse: '',
        telephone: ''
      });
      setPasswordDigits(['', '', '', '', '', '']);
      setActiveTab('list');
    } catch (error: any) {
      console.error('Erreur:', error);
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLeads.length === 0) return;

    try {
      await leadService.deleteMultipleLeads(selectedLeads);
      onLeadsDeleted(selectedLeads);
      setSelectedLeads([]);
    } catch (error: any) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleTransferSelected = async () => {
    if (selectedLeads.length === 0 || !onLeadsTransferred) return;

    try {
      await onLeadsTransferred(selectedLeads);
      setSelectedLeads([]);
    } catch (error: any) {
      console.error('Erreur transfert:', error);
    }
  };

  const subMenuItems = [
    { id: 'add', label: 'Ajouter un lead', icon: Plus, description: 'Creer un prospect' },
    { id: 'list', label: 'Leads crees', icon: List, description: `${leads.length} leads`, badge: leads.length },
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

      <div>
        {activeTab === 'add' && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
              <div className="p-6 border-b border-cyan-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Ajouter un lead</h3>
                    <p className="text-cyan-300/60 text-sm">Creer un nouveau prospect</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-300/70 mb-2">Nom *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        placeholder="Nom de famille"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-300/70 mb-2">Prenom *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        placeholder="Prenom"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300/70 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="email@exemple.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300/70 mb-2">Telephone *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="+33 1 23 45 67 89"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300/70 mb-3">Mot de passe (6 chiffres) *</label>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex gap-2">
                      {passwordDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={passwordInputRefs[index]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePasswordDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handlePasswordKeyDown(index, e)}
                          onPaste={index === 0 ? handlePasswordPaste : undefined}
                          className="w-12 h-14 text-center text-xl font-bold bg-slate-800/50 border-2 border-cyan-500/30 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all"
                          required
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 ml-14">Entrez 6 chiffres uniquement</p>
                </div>

                <button
                  type="submit"
                  className="group relative w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 overflow-hidden rounded-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                  <Plus className="relative w-5 h-5 text-white" />
                  <span className="relative text-white font-semibold">Valider</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-sm text-blue-300">
                <strong>Information:</strong> Les leads crees peuvent se connecter sur la page <span className="font-mono bg-blue-500/20 px-2 py-0.5 rounded">/client-login</span> avec leur email et mot de passe.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl" />
              <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
                <div className="p-6 border-b border-cyan-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <List className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Leads crees</h3>
                        <p className="text-cyan-300/60 text-sm">{leads.length} leads au total</p>
                      </div>
                    </div>

                    {selectedLeads.length > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-cyan-300">{selectedLeads.length} selectionne(s)</span>
                        {onLeadsTransferred && (
                          <button
                            onClick={handleTransferSelected}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl border border-green-500/30 transition-all text-sm font-medium"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Transferer
                          </button>
                        )}
                        <button
                          onClick={handleDeleteSelected}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl border border-red-500/30 transition-all text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {leads.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-cyan-500/40" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Aucun lead cree</h3>
                    <p className="text-gray-500 mb-6">Commencez par ajouter votre premier lead</p>
                    <button
                      onClick={() => setActiveTab('add')}
                      className="group relative inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                      <Plus className="relative w-5 h-5 text-white" />
                      <span className="relative text-white font-semibold">Ajouter un lead</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-cyan-500/10">
                          <th className="px-6 py-4 text-left">
                            <button
                              onClick={handleSelectAll}
                              className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-cyan-400 transition-colors"
                            >
                              {selectedLeads.length === leads.length ? (
                                <CheckSquare className="w-5 h-5 text-cyan-400" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Nom</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">MDP</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Tel</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <tr key={lead.id} className="border-b border-cyan-500/5 hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleSelectLead(lead.id)}
                                className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-cyan-400 transition-colors"
                              >
                                {selectedLeads.includes(lead.id) ? (
                                  <CheckSquare className="w-5 h-5 text-cyan-400" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-cyan-300">#{lead.id}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center text-white text-xs font-semibold">
                                  {lead.prenom[0]}{lead.nom[0]}
                                </div>
                                <span className="text-white font-medium">{lead.prenom} {lead.nom}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{lead.email}</td>
                            <td className="px-6 py-4 text-sm font-mono text-amber-300">{lead.motDePasse}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{lead.telephone}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{lead.dateCreation}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowModal(true);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition-all text-sm font-medium"
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
            </div>
          </div>
        )}
      </div>

      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-w-2xl w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-blue-500/30 overflow-hidden">
              <div className="p-6 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Details du Lead</h2>
                      <p className="text-blue-300/70 text-sm">Informations completes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedLead(null);
                    }}
                    className="w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center transition-all"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                  <div>
                    <p className="text-2xl font-bold text-white">{selectedLead.prenom} {selectedLead.nom}</p>
                    <p className="text-sm text-gray-400 mt-1">ID: #{selectedLead.id}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                    {selectedLead.creePar || 'Admin'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-cyan-300/70 uppercase font-medium">Email</span>
                    </div>
                    <p className="text-white font-medium break-all">{selectedLead.email}</p>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-cyan-300/70 uppercase font-medium">Telephone</span>
                    </div>
                    <p className="text-white font-medium">{selectedLead.telephone}</p>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-amber-300/70 uppercase font-medium">Mot de passe</span>
                    </div>
                    <p className="text-amber-300 font-mono font-semibold text-lg">{selectedLead.motDePasse}</p>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/10 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-cyan-300/70 uppercase font-medium">Date de creation</span>
                    </div>
                    <p className="text-white font-medium">{selectedLead.dateCreation}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-cyan-500/10 flex items-center justify-end gap-3">
                {onClientLogin && (
                  <button
                    onClick={() => {
                      onClientLogin(selectedLead);
                      setShowModal(false);
                      setSelectedLead(null);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 rounded-xl font-semibold transition-all duration-300"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Se connecter en tant que client</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedLead(null);
                  }}
                  className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 rounded-xl font-medium border border-slate-700 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManager;
