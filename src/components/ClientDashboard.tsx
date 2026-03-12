import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, FileText, Calendar, LogOut, MessageSquare, Home, ArrowLeft, Lock, Eye, EyeOff, Save, ClipboardList, Shield, HelpCircle, ChevronDown, Search, Bell, Settings, Pencil } from 'lucide-react';
import ChatWindow from './ChatWindow';
import Plan from '../pages/Plan';
import InteractiveDrawing from '../pages/InteractiveDrawing';
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

type TabId = 'dashboard' | 'chat' | 'plan' | 'interactive-drawing';

interface MenuItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ clientData, onLogout, isAdminViewing, onReturnToAdmin }) => {
  const { client } = clientData;
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: Home },
      ]
    },
    {
      title: 'Communication',
      items: [
        { id: 'chat', label: 'Messagerie', icon: MessageSquare },
      ]
    },
    {
      title: 'Outils',
      items: [
        { id: 'plan', label: 'Editeur de plan', icon: ClipboardList },
        { id: 'interactive-drawing', label: 'Dessin interactif', icon: Pencil },
      ]
    },
  ];

  const getPageTitle = () => {
    for (const section of menuSections) {
      const item = section.items.find(i => i.id === activeTab);
      if (item) return item.label;
    }
    return 'Espace Client';
  };

  const getBreadcrumb = () => {
    for (const section of menuSections) {
      const item = section.items.find(i => i.id === activeTab);
      if (item) return `${section.title} / ${item.label}`;
    }
    return 'Espace Client';
  };

  const getInitials = () => {
    if (client.full_name) {
      const parts = client.full_name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return client.full_name.slice(0, 2).toUpperCase();
    }
    return client.email?.split('@')[0]?.slice(0, 2).toUpperCase() || 'CL';
  };

  const userInitials = getInitials();

  return (
    <div className="min-h-screen bg-[#071018] flex">
      <div className="fixed inset-0 bg-gradient-to-br from-[#071018] via-[#0a1929] to-[#071018] pointer-events-none" />

      <svg className="fixed inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0, 180, 216, 0.08)" strokeWidth="0.5"/>
          </pattern>
          <pattern id="dots" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1.5" fill="rgba(0, 180, 216, 0.3)"/>
            <circle cx="60" cy="0" r="1.5" fill="rgba(0, 180, 216, 0.3)"/>
            <circle cx="0" cy="60" r="1.5" fill="rgba(0, 180, 216, 0.3)"/>
            <circle cx="60" cy="60" r="1.5" fill="rgba(0, 180, 216, 0.3)"/>
          </pattern>
          <radialGradient id="cornerGlow" cx="0%" cy="0%" r="100%">
            <stop offset="0%" stopColor="rgba(0, 180, 216, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#dots)" />
        <circle cx="0" cy="0" r="300" fill="url(#cornerGlow)" opacity="0.5" />
        <circle cx="100%" cy="100%" r="400" fill="url(#cornerGlow)" opacity="0.4" />
      </svg>

      <div className="fixed top-0 left-0 w-[500px] h-[500px] pointer-events-none">
        <svg viewBox="0 0 500 500" className="w-full h-full">
          <path d="M 0 400 Q 0 0 400 0" fill="none" stroke="rgba(0, 180, 216, 0.25)" strokeWidth="1.5" />
          <path d="M 0 320 Q 0 0 320 0" fill="none" stroke="rgba(0, 180, 216, 0.18)" strokeWidth="1.2" />
          <path d="M 0 240 Q 0 0 240 0" fill="none" stroke="rgba(0, 180, 216, 0.12)" strokeWidth="1" />
        </svg>
      </div>

      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] pointer-events-none">
        <svg viewBox="0 0 600 600" className="w-full h-full">
          <path d="M 600 100 Q 600 600 100 600" fill="none" stroke="rgba(0, 180, 216, 0.22)" strokeWidth="1.5" />
          <path d="M 600 180 Q 600 600 180 600" fill="none" stroke="rgba(0, 180, 216, 0.15)" strokeWidth="1.2" />
        </svg>
      </div>

      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(6,182,212,0.1)_0%,_transparent_40%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.08)_0%,_transparent_50%)] pointer-events-none" />

      <aside className={`fixed top-0 left-0 h-full bg-[#0a1929]/90 backdrop-blur-xl border-r border-cyan-600/20 z-50 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="flex flex-col h-full">
          <div className="h-20 flex items-center justify-center px-4 border-b border-cyan-600/20">
            {!sidebarCollapsed && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <User className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="font-bold text-cyan-300 text-sm tracking-wider uppercase">Espace Client</span>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <User className="w-6 h-6 text-cyan-400" />
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-6">
            {menuSections.map((section, idx) => (
              <div key={idx} className="mb-8">
                {!sidebarCollapsed && (
                  <div className="px-6 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-500/50">
                      {section.title}
                    </span>
                  </div>
                )}
                <div className="space-y-2 px-3">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`cut-corner-btn w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 uppercase relative ${
                          isActive
                            ? 'cut-corner-btn-active text-cyan-300'
                            : 'text-cyan-400/70 hover:text-cyan-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-300' : ''}`} />
                        {!sidebarCollapsed && (
                          <span className="flex-1 text-left truncate">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-cyan-600/20">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-cyan-400/80 hover:text-cyan-300 text-sm font-semibold bg-[#071018]/80 border border-cyan-600/50 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 uppercase tracking-wider"
            >
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-90' : '-rotate-90'}`} />
              {!sidebarCollapsed && <span>Reduire</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} relative z-10`}>
        <header className="sticky top-0 z-40 h-20 bg-[#0a1929]/90 backdrop-blur-xl border-b border-cyan-600/20">
          <div className="h-full px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isAdminViewing && onReturnToAdmin && (
                <button
                  onClick={onReturnToAdmin}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all duration-300 border border-blue-500/30 hover:border-blue-500/50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Retour Admin</span>
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-cyan-200 tracking-wide">{getPageTitle()}</h1>
                <p className="text-xs text-cyan-500/50 tracking-wider">{getBreadcrumb()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-[#071018]/80 rounded-full border border-cyan-700/30">
                <Search className="w-4 h-4 text-cyan-500/50" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="bg-transparent border-none outline-none text-sm text-cyan-200 placeholder-cyan-600/50 w-44"
                />
              </div>

              <button className="w-10 h-10 flex items-center justify-center text-cyan-500/60 hover:text-cyan-300 bg-[#071018]/60 rounded-full border border-cyan-700/30 hover:border-cyan-500/50 transition-all duration-300 relative">
                <Bell className="w-5 h-5" />
              </button>

              <button className="w-10 h-10 flex items-center justify-center text-cyan-500/60 hover:text-cyan-300 bg-[#071018]/60 rounded-full border border-cyan-700/30 hover:border-cyan-500/50 transition-all duration-300">
                <HelpCircle className="w-5 h-5" />
              </button>

              <button className="w-10 h-10 flex items-center justify-center text-cyan-500/60 hover:text-cyan-300 bg-[#071018]/60 rounded-full border border-cyan-700/30 hover:border-cyan-500/50 transition-all duration-300">
                <Settings className="w-5 h-5" />
              </button>

              <div className="h-8 w-px bg-cyan-700/30 mx-2" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#071018] rounded-full border-2 border-cyan-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.15)]">
                  <span className="text-sm font-bold text-cyan-300">{userInitials}</span>
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-cyan-200">{client.full_name}</p>
                  <p className="text-[10px] text-cyan-500/50 uppercase tracking-wider">Client</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-10 h-10 flex items-center justify-center text-cyan-500/60 hover:text-red-400 bg-[#071018]/60 rounded-full border border-cyan-700/30 hover:border-red-500/50 transition-all duration-300"
                title="Deconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-cyan-400/60 text-sm font-medium uppercase tracking-wider">Statut</span>
                    <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-600/40 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-cyan-200 capitalize">{client.status}</p>
                  <p className="text-xs text-cyan-600/50 mt-2 uppercase tracking-wider">Compte actif</p>
                </div>

                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-cyan-400/60 text-sm font-medium uppercase tracking-wider">Agent</span>
                    <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-600/40 flex items-center justify-center">
                      <User className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-cyan-200 truncate">{client.assigned_agent_name || 'Non assigne'}</p>
                  <p className="text-xs text-cyan-600/50 mt-2 uppercase tracking-wider">Votre contact</p>
                </div>

                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-cyan-400/60 text-sm font-medium uppercase tracking-wider">Messages</span>
                    <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-600/40 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-cyan-200">-</p>
                  <p className="text-xs text-cyan-600/50 mt-2 uppercase tracking-wider">Conversations</p>
                </div>

                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-cyan-400/60 text-sm font-medium uppercase tracking-wider">Membre depuis</span>
                    <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-600/40 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-cyan-200">{formatDate(client.created_at)}</p>
                  <p className="text-xs text-cyan-600/50 mt-2 uppercase tracking-wider">Date d'inscription</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6">
                  <h3 className="text-cyan-200 font-bold mb-6 uppercase tracking-wider text-sm flex items-center gap-3">
                    <User className="w-5 h-5 text-cyan-400" />
                    Informations personnelles
                  </h3>
                  <div className="space-y-4">
                    {[
                      { icon: User, label: 'Nom complet', value: client.full_name },
                      { icon: Mail, label: 'Email', value: client.email },
                      { icon: Phone, label: 'Telephone', value: client.phone || 'Non renseigne' },
                      { icon: FileText, label: 'Entreprise', value: client.company_name || 'Non renseigne' },
                      { icon: MapPin, label: 'Adresse', value: client.address || 'Non renseigne' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-[#071018]/60 rounded-xl border border-cyan-700/20 hover:border-cyan-600/40 transition-all duration-300">
                        <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-cyan-500/50 mb-0.5">{item.label}</p>
                          <p className="text-cyan-200 font-medium truncate">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6">
                  <h3 className="text-cyan-200 font-bold mb-6 uppercase tracking-wider text-sm flex items-center gap-3">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    Securite du compte
                  </h3>

                  {passwordMessage && (
                    <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-400" />
                      <p className="text-sm text-green-300">{passwordMessage}</p>
                    </div>
                  )}
                  {passwordError && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                      <p className="text-sm text-red-300">{passwordError}</p>
                    </div>
                  )}

                  <div className="flex flex-col items-center py-4">
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
                              ? 'bg-[#071018] border-2 border-cyan-500/50 focus:border-cyan-400 text-white'
                              : 'bg-[#071018]/50 border-2 border-cyan-700/30 text-gray-500 cursor-not-allowed'
                          }`}
                          placeholder="*"
                        />
                      ))}
                    </div>

                    <div className="flex gap-3 w-full">
                      {!isViewing && !isEditing && (
                        <>
                          <button
                            onClick={handleViewPassword}
                            disabled={!currentPin}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Eye className="w-5 h-5" />
                            <span>Afficher</span>
                          </button>
                          <button
                            onClick={handleStartEditing}
                            disabled={!currentPin}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Lock className="w-5 h-5" />
                            <span>Modifier</span>
                          </button>
                        </>
                      )}
                      {isViewing && (
                        <button
                          onClick={handleHidePassword}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300 font-semibold text-sm uppercase tracking-wide"
                        >
                          <EyeOff className="w-5 h-5" />
                          <span>Masquer</span>
                        </button>
                      )}
                      {isEditing && (
                        <>
                          <button
                            onClick={handleCancelEditing}
                            disabled={isChangingPassword}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300 font-semibold text-sm uppercase tracking-wide disabled:opacity-50"
                          >
                            <span>Annuler</span>
                          </button>
                          <button
                            onClick={handleSavePassword}
                            disabled={isChangingPassword || displayPin.join('').length !== 6}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 hover:border-cyan-400 transition-all duration-300 font-semibold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isChangingPassword ? (
                              <>
                                <div className="w-5 h-5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                                <span>Enregistrement...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5" />
                                <span>Enregistrer</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {client.project_description && (
                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6">
                  <h3 className="text-cyan-200 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    Description du projet
                  </h3>
                  <p className="text-gray-300 leading-relaxed">{client.project_description}</p>
                </div>
              )}

              <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6">
                <h3 className="text-cyan-200 font-bold mb-6 uppercase tracking-wider text-sm">Actions rapides</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="flex items-center justify-center gap-3 p-5 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold text-sm uppercase tracking-wide"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Messagerie</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('plan')}
                    className="flex items-center justify-center gap-3 p-5 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold text-sm uppercase tracking-wide"
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span>Editeur 3D</span>
                  </button>
                  <a
                    href="mailto:contact@sjrenovpro.fr"
                    className="flex items-center justify-center gap-3 p-5 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold text-sm uppercase tracking-wide"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span>Support</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl overflow-hidden min-h-[600px]">
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
                  <div className="w-20 h-20 bg-[#071018] rounded-2xl border-2 border-cyan-600/40 flex items-center justify-center mb-4">
                    <MessageSquare className="w-10 h-10 text-cyan-500/40" />
                  </div>
                  <p className="text-cyan-200 text-lg font-semibold">Aucun agent assigne</p>
                  <p className="text-cyan-500/50 text-sm mt-1">Un agent sera bientot affecte a votre compte</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="-m-8 h-[calc(100vh-5rem)]">
              <Plan embedded />
            </div>
          )}

          {activeTab === 'interactive-drawing' && (
            <div className="-m-8 h-[calc(100vh-5rem)]">
              <InteractiveDrawing embedded />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
