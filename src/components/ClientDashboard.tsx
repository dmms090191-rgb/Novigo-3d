import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, FileText, Calendar, LogOut, MessageSquare, Home, ArrowLeft, Lock, Eye, EyeOff, Save, ClipboardList, ChevronRight, Zap, Shield, HelpCircle } from 'lucide-react';
import ChatWindow from './ChatWindow';
import TechBackground from './TechBackground';
import { supabase } from '../lib/supabase';

interface ClientDashboardProps {
  clientData: {
    user: any;
    token: string;
    client: {
      id: string;
      email: string;
      full_name: string;
      company_name?: string;
      phone?: string;
      address?: string;
      project_description?: string;
      status: string;
      created_at: string;
      assigned_agent_name?: string;
    };
  };
  onLogout: () => void;
  isAdminViewing?: boolean;
  onReturnToAdmin?: () => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ clientData, onLogout, isAdminViewing, onReturnToAdmin }) => {
  const { client } = clientData;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentPin, setCurrentPin] = useState('');
  const [displayPin, setDisplayPin] = useState(['', '', '', '', '', '']);
  const [isViewing, setIsViewing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetchCurrentPin();
  }, []);

  const fetchCurrentPin = async () => {
    try {
      const { data, error } = await supabase
        .from('password_pins')
        .select('pin')
        .eq('user_id', clientData.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentPin(data.pin);
      }
    } catch (error) {
      console.error('Error fetching PIN:', error);
    }
  };

  const handleViewPassword = () => {
    if (currentPin) {
      setDisplayPin(currentPin.split(''));
      setIsViewing(true);
      setIsEditing(false);
      setPasswordError('');
      setPasswordMessage('');
    }
  };

  const handleHidePassword = () => {
    setIsViewing(false);
    setDisplayPin(['', '', '', '', '', '']);
  };

  const handleStartEditing = () => {
    if (currentPin) {
      setDisplayPin(currentPin.split(''));
    }
    setIsEditing(true);
    setIsViewing(false);
    setPasswordError('');
    setPasswordMessage('');
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setDisplayPin(['', '', '', '', '', '']);
    setPasswordError('');
    setPasswordMessage('');
  };

  const handlePinChange = (index: number, value: string) => {
    if (value === '' || /^\d$/.test(value)) {
      const newPinArray = [...displayPin];
      newPinArray[index] = value;
      setDisplayPin(newPinArray);
      setPasswordError('');
      setPasswordMessage('');
    }
  };

  const handleSavePassword = async () => {
    const pinString = displayPin.join('');

    if (pinString.length !== 6) {
      setPasswordError('Le code doit contenir 6 chiffres');
      return;
    }

    if (!/^\d{6}$/.test(pinString)) {
      setPasswordError('Le code doit contenir uniquement des chiffres');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordMessage('');

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: pinString
      });

      if (authError) throw authError;

      const { error: pinError } = await supabase
        .from('password_pins')
        .upsert({
          user_id: clientData.user.id,
          pin: pinString,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (pinError) throw pinError;

      setCurrentPin(pinString);
      setPasswordMessage('Code modifie avec succes !');
      setIsEditing(false);
      setIsViewing(false);
      setDisplayPin(['', '', '', '', '', '']);

      setTimeout(() => {
        setPasswordMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setPasswordError('Erreur lors de la modification du code');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, description: 'Vue generale' },
    { id: 'chat', label: 'Messagerie', icon: MessageSquare, description: 'Discussions' },
    { id: 'plan', label: 'Plan 3D', icon: ClipboardList, description: 'Visualisation' },
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
                  {isAdminViewing && onReturnToAdmin && (
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
                    <h1 className="text-lg font-bold text-white">Espace Client</h1>
                    <p className="text-xs text-cyan-400">{client.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
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

      <div className="pt-24 min-h-screen px-4">
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl blur-lg" />
            <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-1">
              <div className="flex items-center gap-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30'
                          : 'hover:bg-slate-800/50 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                      <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <main className="pb-8">

          {activeTab === 'dashboard' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
                    <div className="p-6 border-b border-cyan-500/10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                          <User className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Informations personnelles</h3>
                          <p className="text-cyan-300/60 text-sm">Vos donnees de profil</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 grid sm:grid-cols-2 gap-4">
                      {[
                        { icon: User, label: 'Nom complet', value: client.full_name },
                        { icon: Mail, label: 'Email', value: client.email },
                        { icon: Phone, label: 'Telephone', value: client.phone || 'Non renseigne' },
                        { icon: FileText, label: 'Entreprise', value: client.company_name || 'Non renseigne' },
                        { icon: MapPin, label: 'Adresse', value: client.address || 'Non renseigne' },
                        { icon: Calendar, label: 'Client depuis', value: formatDate(client.created_at) },
                      ].map((item, index) => (
                        <div key={index} className="group/item flex items-center gap-4 p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300">
                          <div className="w-10 h-10 bg-cyan-500/10 group-hover/item:bg-cyan-500/20 rounded-xl flex items-center justify-center transition-colors">
                            <item.icon className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-cyan-300/50 mb-0.5">{item.label}</p>
                            <p className="text-white font-medium truncate">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
                    <div className="p-6 border-b border-cyan-500/10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                          <Lock className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Securite du compte</h3>
                          <p className="text-cyan-300/60 text-sm">Gestion du code PIN</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      {passwordMessage && (
                        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/30 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-green-400" />
                          </div>
                          <p className="text-sm text-green-300">{passwordMessage}</p>
                        </div>
                      )}
                      {passwordError && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                          <p className="text-sm text-red-300">{passwordError}</p>
                        </div>
                      )}

                      <div className="flex flex-col items-center">
                        <p className="text-sm text-cyan-300/70 mb-4">Code a 6 chiffres</p>
                        <div className="flex gap-3 mb-6">
                          {displayPin.map((digit, index) => (
                            <input
                              key={index}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handlePinChange(index, e.target.value)}
                              disabled={!isEditing}
                              className={`w-12 h-14 text-center text-xl font-bold rounded-xl transition-all duration-300 ${
                                isEditing
                                  ? 'bg-slate-800/50 border-2 border-cyan-500/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-white'
                                  : 'bg-slate-800/30 border-2 border-slate-700 text-gray-500 cursor-not-allowed'
                              }`}
                              placeholder="*"
                            />
                          ))}
                        </div>

                        <div className="flex gap-3 w-full max-w-md">
                          {!isViewing && !isEditing && (
                            <>
                              <button
                                onClick={handleViewPassword}
                                disabled={!currentPin}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl transition-all duration-300 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Eye className="w-5 h-5" />
                                <span className="font-medium">Afficher</span>
                              </button>
                              <button
                                onClick={handleStartEditing}
                                disabled={!currentPin}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl transition-all duration-300 border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Lock className="w-5 h-5" />
                                <span className="font-medium">Modifier</span>
                              </button>
                            </>
                          )}
                          {isViewing && (
                            <button
                              onClick={handleHidePassword}
                              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-xl transition-all duration-300 border border-slate-600"
                            >
                              <EyeOff className="w-5 h-5" />
                              <span className="font-medium">Masquer</span>
                            </button>
                          )}
                          {isEditing && (
                            <>
                              <button
                                onClick={handleCancelEditing}
                                disabled={isChangingPassword}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-xl transition-all duration-300 border border-slate-600 disabled:opacity-50"
                              >
                                <span className="font-medium">Annuler</span>
                              </button>
                              <button
                                onClick={handleSavePassword}
                                disabled={isChangingPassword || displayPin.join('').length !== 6}
                                className="flex-1 group relative flex items-center justify-center gap-2 px-6 py-3 overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="relative flex items-center gap-2 text-white font-semibold">
                                  {isChangingPassword ? (
                                    <>
                                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Enregistrement...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-5 h-5" />
                                      <span>Enregistrer</span>
                                    </>
                                  )}
                                </div>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {client.project_description && (
                  <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Description du projet</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{client.project_description}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {client.assigned_agent_name && (
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl" />
                    <div className="relative bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <User className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-300/70">Votre agent</p>
                          <p className="text-xl font-bold text-white">{client.assigned_agent_name}</p>
                        </div>
                      </div>
                      <p className="text-sm text-blue-300/60">Votre agent personnel vous accompagne tout au long de votre projet.</p>
                    </div>
                  </div>
                )}

                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl" />
                  <div className="relative bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Statut du compte</h3>
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-300 font-medium capitalize">{client.status}</span>
                    </div>
                    <p className="text-sm text-cyan-300/60 mt-4">Votre compte est actif et operationnel.</p>
                  </div>
                </div>

                <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <HelpCircle className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-lg font-bold text-white">Besoin d'aide ?</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Notre equipe est disponible pour repondre a vos questions.</p>
                  <a
                    href="mailto:contact@sjrenovpro.fr"
                    className="group relative flex items-center justify-center gap-2 w-full py-3 overflow-hidden rounded-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="relative text-white font-semibold">Nous contacter</span>
                    <ChevronRight className="relative w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden min-h-[600px]">
              {client.assigned_agent_name ? (
                <ChatWindow
                  clientId={client.id}
                  currentUserId={client.id}
                  currentUserType="client"
                  senderName={client.full_name}
                  recipientName={client.assigned_agent_name}
                  supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
                  supabaseKey={import.meta.env.VITE_SUPABASE_ANON_KEY}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-96">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
                    <MessageSquare className="w-10 h-10 text-cyan-500/40" />
                  </div>
                  <p className="text-gray-400 text-lg">Aucun agent assigne</p>
                  <p className="text-gray-500 text-sm mt-1">Un agent sera bientot affecte a votre compte</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
              <div className="flex flex-col items-center justify-center py-20 px-8">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
                  <div className="relative w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                    <ClipboardList className="w-16 h-16 text-white" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-white mb-4 text-center">Editeur de Plan 3D</h2>
                <p className="text-gray-400 text-center max-w-md mb-8">Creez et visualisez vos plans de renovation en temps reel avec notre outil de conception 3D professionnel.</p>

                <div className="grid sm:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
                  {[
                    { title: 'Zone 2D', desc: 'Plan vue du dessus', color: 'cyan' },
                    { title: 'Zone 3D', desc: 'Visualisation 3D', color: 'blue' },
                    { title: 'Parametres', desc: 'Configuration', color: 'indigo' },
                  ].map((feature, i) => (
                    <div key={i} className={`p-4 bg-${feature.color}-500/10 rounded-xl border border-${feature.color}-500/30`}>
                      <div className={`w-3 h-3 bg-${feature.color}-400 rounded-full mb-2`} />
                      <h3 className="text-white font-semibold">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <a
                  href="/plan"
                  className="group relative inline-flex items-center gap-3 px-8 py-4 overflow-hidden rounded-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 bg-[length:200%_100%] animate-gradient" />
                  <span className="relative text-lg font-bold text-white">Ouvrir l'editeur 3D</span>
                  <ChevronRight className="relative w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
