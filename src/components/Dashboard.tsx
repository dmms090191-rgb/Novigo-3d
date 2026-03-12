import React from 'react';
import LeadManager from './LeadManager';
import RegistrationManager from './RegistrationManager';
import BulkImport from './BulkImport';
import SellerManager from './SellerManager';
import AdminInfo from './AdminInfo';
import UsersMonitor from './UsersMonitor';
import LeadsTab from './LeadsTab';
import AllAccountsList from './AllAccountsList';
import AdminChatViewer from './AdminChatViewer';
import StatusManager from './StatusManager';
import { User } from '../types/User';
import { Lead } from '../types/Lead';
import { Registration } from '../types/Registration';
import { Seller } from '../types/Seller';
import { Admin } from '../types/Admin';
import {
  Bell,
  Settings,
  LogOut,
  Users,
  Shield,
  UserCheck,
  Upload,
  ShoppingBag,
  Monitor,
  MessageSquare,
  Tag,
  Search,
  ChevronDown,
  Home,
  BarChart3,
  HelpCircle
} from 'lucide-react';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
  leads: Lead[];
  onLeadCreated: (lead: Lead) => void;
  onLeadsDeleted: (leadIds: string[]) => void;
  onLeadsTransferred: (leadIds: string[]) => void;
  transferredLeads: Lead[];
  onTransferredLeadsDeleted?: (clientIds: string[]) => void;
  bulkLeads: Lead[];
  onBulkLeadCreated: (lead: Lead) => void;
  onBulkLeadsDeleted: (leadIds: string[]) => void;
  onBulkLeadsTransferred: (leadIds: string[]) => void;
  homepageImage: string | null;
  onHomepageImageUpdate: (imageUrl: string | null) => void;
  registrations: Registration[];
  onApproveRegistration: (id: string) => void;
  onRejectRegistration: (id: string) => void;
  onRestoreLeads?: (leads: Lead[]) => void;
  onRestoreRegistrations?: (registrations: Registration[]) => void;
  sellers: Seller[];
  onSellerCreated: (seller: Seller) => void;
  onSellersDeleted: (sellerIds: string[]) => void;
  admins: Admin[];
  onAdminCreated: (admin: Admin) => void;
  onAdminsDeleted: (adminIds: string[]) => void;
  onClientLogin?: (lead: Lead) => void;
  onSellerLogin?: (seller: Seller) => void;
  onStatusChanged?: (leadId: string, statusId: string | null) => void;
}

type TabId = 'overview' | 'bulk-import' | 'leads-tab' | 'leads' | 'registrations' | 'sellers' | 'admin-info' | 'users-monitor' | 'chat' | 'all-accounts' | 'statuses';

interface MenuItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  section?: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  user, onLogout, leads, onLeadCreated, onLeadsDeleted, onLeadsTransferred, transferredLeads, onTransferredLeadsDeleted,
  bulkLeads, onBulkLeadCreated, onBulkLeadsDeleted, onBulkLeadsTransferred,
  registrations, onApproveRegistration, onRejectRegistration,
  sellers, onSellerCreated, onSellersDeleted, admins, onClientLogin, onSellerLogin, onStatusChanged
}) => {
  const [activeTab, setActiveTab] = React.useState<TabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const pendingRegistrations = registrations.filter(reg => reg.statut === 'en_attente');

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Principal',
      items: [
        { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
        { id: 'bulk-import', label: 'Import de masse', icon: Upload },
      ]
    },
    {
      title: 'Gestion des leads',
      items: [
        { id: 'leads-tab', label: 'Leads transferes', icon: BarChart3 },
        { id: 'leads', label: 'Tous les leads', icon: Users },
      ]
    },
    {
      title: 'Equipe',
      items: [
        { id: 'sellers', label: 'Commerciaux', icon: ShoppingBag },
        { id: 'registrations', label: 'Inscriptions', icon: UserCheck, badge: pendingRegistrations.length },
        { id: 'all-accounts', label: 'Comptes', icon: Users },
      ]
    },
    {
      title: 'Communication',
      items: [
        { id: 'chat', label: 'Messagerie', icon: MessageSquare },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { id: 'statuses', label: 'Statuts', icon: Tag },
        { id: 'admin-info', label: 'Administration', icon: Shield },
        { id: 'users-monitor', label: 'Activite', icon: Monitor },
      ]
    },
  ];

  const getPageTitle = () => {
    for (const section of menuSections) {
      const item = section.items.find(i => i.id === activeTab);
      if (item) return item.label;
    }
    return 'Dashboard';
  };

  const getBreadcrumb = () => {
    for (const section of menuSections) {
      const item = section.items.find(i => i.id === activeTab);
      if (item) return `${section.title} / ${item.label}`;
    }
    return 'Dashboard';
  };

  const userName = user?.email?.split('@')[0] || 'Admin';
  const userInitials = userName.slice(0, 2).toUpperCase();

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

        <path d="M 0 200 Q 0 0 200 0" fill="none" stroke="rgba(0, 180, 216, 0.2)" strokeWidth="1" />
        <path d="M 0 280 Q 0 0 280 0" fill="none" stroke="rgba(0, 180, 216, 0.1)" strokeWidth="1" />

        <path d="M 100% 200 Q 100% 100% calc(100% - 200px) 100%" fill="none" stroke="rgba(0, 180, 216, 0.15)" strokeWidth="1" style={{transform: 'translate(-200px, -200px)'}} />
      </svg>

      <div className="fixed top-0 left-0 w-[500px] h-[500px] pointer-events-none">
        <svg viewBox="0 0 500 500" className="w-full h-full">
          <path d="M 0 400 Q 0 0 400 0" fill="none" stroke="rgba(0, 180, 216, 0.25)" strokeWidth="1.5" />
          <path d="M 0 320 Q 0 0 320 0" fill="none" stroke="rgba(0, 180, 216, 0.18)" strokeWidth="1.2" />
          <path d="M 0 240 Q 0 0 240 0" fill="none" stroke="rgba(0, 180, 216, 0.12)" strokeWidth="1" />
          <path d="M 0 160 Q 0 0 160 0" fill="none" stroke="rgba(0, 180, 216, 0.08)" strokeWidth="1" />
          <path d="M 0 80 Q 0 0 80 0" fill="none" stroke="rgba(0, 180, 216, 0.05)" strokeWidth="1" />
        </svg>
      </div>

      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] pointer-events-none">
        <svg viewBox="0 0 600 600" className="w-full h-full">
          <path d="M 600 100 Q 600 600 100 600" fill="none" stroke="rgba(0, 180, 216, 0.22)" strokeWidth="1.5" />
          <path d="M 600 180 Q 600 600 180 600" fill="none" stroke="rgba(0, 180, 216, 0.15)" strokeWidth="1.2" />
          <path d="M 600 260 Q 600 600 260 600" fill="none" stroke="rgba(0, 180, 216, 0.1)" strokeWidth="1" />
          <path d="M 600 340 Q 600 600 340 600" fill="none" stroke="rgba(0, 180, 216, 0.07)" strokeWidth="1" />
          <path d="M 600 420 Q 600 600 420 600" fill="none" stroke="rgba(0, 180, 216, 0.04)" strokeWidth="1" />
        </svg>
      </div>

      <div className="fixed top-0 right-0 w-[400px] h-[400px] pointer-events-none">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <path d="M 400 300 Q 400 0 100 0" fill="none" stroke="rgba(0, 180, 216, 0.15)" strokeWidth="1" />
          <path d="M 400 220 Q 400 0 180 0" fill="none" stroke="rgba(0, 180, 216, 0.1)" strokeWidth="1" />
          <path d="M 400 140 Q 400 0 260 0" fill="none" stroke="rgba(0, 180, 216, 0.06)" strokeWidth="1" />
        </svg>
      </div>

      <div className="fixed bottom-0 left-72 w-[450px] h-[450px] pointer-events-none">
        <svg viewBox="0 0 450 450" className="w-full h-full">
          <path d="M 0 150 Q 0 450 300 450" fill="none" stroke="rgba(0, 180, 216, 0.12)" strokeWidth="1" />
          <path d="M 0 230 Q 0 450 220 450" fill="none" stroke="rgba(0, 180, 216, 0.08)" strokeWidth="1" />
          <path d="M 0 310 Q 0 450 140 450" fill="none" stroke="rgba(0, 180, 216, 0.05)" strokeWidth="1" />
        </svg>
      </div>

      <div className="fixed top-1/3 left-1/2 w-[300px] h-[300px] pointer-events-none opacity-40">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          <circle cx="150" cy="150" r="100" fill="none" stroke="rgba(0, 180, 216, 0.08)" strokeWidth="1" strokeDasharray="8 4" />
          <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(0, 180, 216, 0.05)" strokeWidth="1" strokeDasharray="4 8" />
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
                  <Home className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="font-bold text-cyan-300 text-sm tracking-wider uppercase">CRM Pro</span>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Home className="w-6 h-6 text-cyan-400" />
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
                          <>
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {item.badge && item.badge > 0 && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/30 text-cyan-200 rounded-full border border-cyan-400/50">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {sidebarCollapsed && item.badge && item.badge > 0 && (
                          <span className="absolute right-1 top-0 w-2 h-2 bg-cyan-400 rounded-full" />
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
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-[#0a1929]" />
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
                  <p className="text-sm font-semibold text-cyan-200">{userName}</p>
                  <p className="text-[10px] text-cyan-500/50 uppercase tracking-wider">Administrateur</p>
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
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-cyan-400/60 text-sm font-medium uppercase tracking-wider">Total Leads</span>
                    <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-600/40 flex items-center justify-center">
                      <Users className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-cyan-200">{transferredLeads.length + bulkLeads.length + leads.length}</p>
                  <p className="text-xs text-cyan-600/50 mt-2 uppercase tracking-wider">Tous les leads</p>
                </div>
                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-cyan-400/60 text-sm font-medium uppercase tracking-wider">Commerciaux</span>
                    <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-600/40 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-cyan-200">{sellers.length}</p>
                  <p className="text-xs text-cyan-600/50 mt-2 uppercase tracking-wider">Equipe active</p>
                </div>
                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-cyan-400/60 text-sm font-medium uppercase tracking-wider">En attente</span>
                    <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-600/40 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-cyan-200">{pendingRegistrations.length}</p>
                  <p className="text-xs text-cyan-600/50 mt-2 uppercase tracking-wider">Inscriptions</p>
                </div>
                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-cyan-400/60 text-sm font-medium uppercase tracking-wider">Administrateurs</span>
                    <div className="w-12 h-12 rounded-full bg-[#071018] border-2 border-cyan-600/40 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-cyan-200">{admins.length}</p>
                  <p className="text-xs text-cyan-600/50 mt-2 uppercase tracking-wider">Comptes admin</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6">
                  <h3 className="text-cyan-200 font-bold mb-6 uppercase tracking-wider text-sm">Actions rapides</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab('bulk-import')}
                      className="flex items-center justify-center gap-3 p-5 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold text-sm uppercase tracking-wide"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Import</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('sellers')}
                      className="flex items-center justify-center gap-3 p-5 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold text-sm uppercase tracking-wide"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Equipe</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('registrations')}
                      className="flex items-center justify-center gap-3 p-5 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold text-sm uppercase tracking-wide"
                    >
                      <UserCheck className="w-5 h-5" />
                      <span>Inscriptions</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className="flex items-center justify-center gap-3 p-5 bg-[#071018]/80 border border-cyan-600/50 text-cyan-400/80 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold text-sm uppercase tracking-wide"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Messages</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#0a1929]/80 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-6">
                  <h3 className="text-cyan-200 font-bold mb-6 uppercase tracking-wider text-sm">Activite recente</h3>
                  <div className="space-y-4">
                    {transferredLeads.slice(0, 4).map((lead, idx) => (
                      <div key={lead.id || idx} className="flex items-center gap-4 p-4 bg-[#071018]/60 rounded-xl border border-cyan-700/20 hover:border-cyan-600/40 transition-all duration-300">
                        <div className="w-12 h-12 bg-[#071018] rounded-full border-2 border-cyan-600/40 flex items-center justify-center">
                          <Users className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-cyan-200 font-medium truncate">{lead.nom} {lead.prenom}</p>
                          <p className="text-xs text-cyan-600/50">{lead.email}</p>
                        </div>
                      </div>
                    ))}
                    {transferredLeads.length === 0 && (
                      <p className="text-sm text-cyan-600/50 text-center py-8">Aucune activite recente</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bulk-import' && (
            <BulkImport
              leads={bulkLeads}
              onLeadCreated={onBulkLeadCreated}
              onLeadsDeleted={onBulkLeadsDeleted}
              onLeadsTransferred={onBulkLeadsTransferred}
            />
          )}

          {activeTab === 'leads-tab' && (
            <LeadsTab
              leads={transferredLeads}
              onLeadsDeleted={onTransferredLeadsDeleted || (() => {})}
              onClientLogin={onClientLogin}
              onStatusChanged={onStatusChanged}
            />
          )}

          {activeTab === 'leads' && (
            <LeadManager
              leads={leads}
              onLeadCreated={onLeadCreated}
              onLeadsDeleted={onLeadsDeleted}
              onLeadsTransferred={onLeadsTransferred}
              currentUserEmail={user?.email}
              onClientLogin={onClientLogin}
            />
          )}

          {activeTab === 'registrations' && (
            <RegistrationManager
              registrations={registrations}
              onApproveRegistration={onApproveRegistration}
              onRejectRegistration={onRejectRegistration}
            />
          )}

          {activeTab === 'sellers' && (
            <SellerManager
              sellers={sellers}
              onSellerCreated={onSellerCreated}
              onSellersDeleted={onSellersDeleted}
              onSellerLogin={onSellerLogin}
            />
          )}

          {activeTab === 'admin-info' && user?.email && (
            <AdminInfo adminEmail={user.email} />
          )}

          {activeTab === 'users-monitor' && (
            <UsersMonitor sellers={sellers} admins={admins} />
          )}

          {activeTab === 'all-accounts' && (
            <AllAccountsList />
          )}

          {activeTab === 'chat' && (
            <AdminChatViewer
              supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
              supabaseKey={import.meta.env.VITE_SUPABASE_ANON_KEY}
            />
          )}

          {activeTab === 'statuses' && (
            <StatusManager />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
