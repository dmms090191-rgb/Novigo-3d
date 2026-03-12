import React from 'react';
import { ShoppingBag, LogOut, User, Bell, Settings, Users, MessageSquare, ArrowLeft, Plus, Mail, Phone, Lock, UserPlus, ChevronRight, Zap, Briefcase } from 'lucide-react';
import { Seller } from '../types/Seller';
import { Lead } from '../types/Lead';
import SellerChatList from './SellerChatList';
import TechBackground from './TechBackground';

interface SellerDashboardProps {
  sellerData: Seller & { isAdminViewing?: boolean };
  onLogout: () => void;
  onReturnToAdmin?: () => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ sellerData, onLogout, onReturnToAdmin }) => {
  const [activeTab, setActiveTab] = React.useState<'leads' | 'chat'>('leads');
  const [myLeads, setMyLeads] = React.useState<Lead[]>([]);
  const [formData, setFormData] = React.useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    telephone: ''
  });

  React.useEffect(() => {
    const savedLeads = localStorage.getItem(`seller_leads_${sellerData.id}`);
    if (savedLeads) {
      setMyLeads(JSON.parse(savedLeads));
    }
  }, [sellerData.id]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newLead: Lead = {
      id: generateId(),
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      motDePasse: formData.motDePasse,
      telephone: formData.telephone,
      dateCreation: new Date().toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      sellerId: sellerData.id,
      sellerName: `${sellerData.prenom} ${sellerData.nom}`
    };

    const updatedLeads = [...myLeads, newLead];
    setMyLeads(updatedLeads);
    localStorage.setItem(`seller_leads_${sellerData.id}`, JSON.stringify(updatedLeads));

    setFormData({
      nom: '',
      prenom: '',
      email: '',
      motDePasse: '',
      telephone: ''
    });
  };

  const menuItems = [
    { id: 'leads', label: 'Gestion Leads', icon: Users, description: 'Creer et gerer' },
    { id: 'chat', label: 'Messagerie', icon: MessageSquare, description: 'Conversations' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <TechBackground />

      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-cyan-500/10 rounded-2xl blur-xl" />
            <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {sellerData.isAdminViewing && onReturnToAdmin && (
                    <button
                      onClick={onReturnToAdmin}
                      className="group flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl transition-all duration-300 border border-blue-500/30"
                    >
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      <span className="text-sm font-medium">Retour Admin</span>
                    </button>
                  )}
                  <img src="/LOGO_OFFICIEL4096.png" alt="Logo" className="h-12 w-auto" />
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-bold text-white">Espace Vendeur</h1>
                    <p className="text-xs text-cyan-400">{sellerData.prenom} {sellerData.nom}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="p-2 text-cyan-400/50 hover:text-cyan-400 transition-colors rounded-lg hover:bg-cyan-500/10">
                    <Bell className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-cyan-400/50 hover:text-cyan-400 transition-colors rounded-lg hover:bg-cyan-500/10">
                    <Settings className="w-5 h-5" />
                  </button>
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-cyan-300">En ligne</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="group flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all duration-300 border border-red-500/20 hover:border-red-500/40"
                  >
                    <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="hidden sm:inline text-sm font-medium">Deconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-24 min-h-screen">
        <aside className="fixed left-4 top-28 bottom-4 w-72 z-40">
          <div className="relative h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl" />
            <div className="relative h-full bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-4 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{sellerData.prenom} {sellerData.nom}</p>
                    <p className="text-cyan-400 text-xs">Vendeur</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`group relative w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {isActive && (
                        <>
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full" />
                          <div className="absolute inset-0 rounded-xl border border-cyan-500/30" />
                        </>
                      )}
                      <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/30'
                          : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                      }`}>
                        <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-cyan-400'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                          {item.label}
                        </p>
                        <p className={`text-xs transition-colors ${isActive ? 'text-cyan-300' : 'text-gray-500'}`}>
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                        isActive ? 'text-cyan-400 translate-x-0 opacity-100' : 'text-gray-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                      }`} />
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-3 pt-4 border-t border-cyan-500/20">
                <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/10">
                  <h4 className="font-semibold text-white mb-3 text-sm flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-cyan-400" />
                    Informations
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded-lg">
                      <span className="text-gray-400">ID</span>
                      <span className="text-cyan-300 font-mono">#{sellerData.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded-lg">
                      <span className="text-gray-400">Inscription</span>
                      <span className="text-white">{sellerData.dateCreation}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-white">Compte Actif</span>
                  </div>
                  <p className="text-xs text-gray-400">Acces vendeur complet</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 ml-80 mr-4 pb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-0.5">
              {activeTab === 'leads' ? 'Gestion des Leads' : 'Messagerie'}
            </h2>
            <p className="text-cyan-300/60 text-sm">
              {activeTab === 'leads' ? 'Creez et gerez vos leads clients' : 'Communiquez avec vos clients'}
            </p>
          </div>

          {activeTab === 'leads' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
                  <div className="p-6 border-b border-cyan-500/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Nouveau Lead</h3>
                        <p className="text-cyan-300/60 text-sm">Creer un nouveau client</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-cyan-300/70 mb-2">Nom</label>
                        <input
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cyan-300/70 mb-2">Prenom</label>
                        <input
                          type="text"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cyan-300/70 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cyan-300/70 mb-2">Telephone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                        <input
                          type="tel"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cyan-300/70 mb-2">Mot de passe</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                        <input
                          type="password"
                          name="motDePasse"
                          value={formData.motDePasse}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="group relative w-full flex items-center justify-center gap-3 py-4 overflow-hidden rounded-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                      <UserPlus className="relative w-5 h-5 text-white" />
                      <span className="relative text-white font-semibold">Creer le Lead</span>
                    </button>
                  </form>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
                  <div className="p-6 border-b border-cyan-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Mes Leads</h3>
                          <p className="text-cyan-300/60 text-sm">Liste de vos clients</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-sm font-bold rounded-full border border-cyan-500/30">
                        {myLeads.length}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {myLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
                          <Users className="w-10 h-10 text-cyan-500/40" />
                        </div>
                        <p className="text-gray-400 text-lg">Aucun lead</p>
                        <p className="text-gray-500 text-sm mt-1">Commencez par creer votre premier lead</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {myLeads.map(lead => (
                          <div key={lead.id} className="group/item p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center">
                                  <User className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">{lead.prenom} {lead.nom}</h4>
                                  <p className="text-xs text-gray-500">ID: #{lead.id}</p>
                                </div>
                              </div>
                              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                                Actif
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-300">
                                <Mail className="w-4 h-4 text-cyan-400" />
                                <span className="truncate">{lead.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-300">
                                <Phone className="w-4 h-4 text-cyan-400" />
                                <span>{lead.telephone}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-cyan-500/10">
                              Cree le {lead.dateCreation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-sm text-blue-300">
                    <strong>Note:</strong> Les leads crees sont enregistres localement dans votre navigateur
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
              <SellerChatList
                sellerId={sellerData.id}
                sellerFullName={sellerData.full_name}
                supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
                supabaseKey={import.meta.env.VITE_SUPABASE_ANON_KEY}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;
