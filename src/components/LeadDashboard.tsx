import React from 'react';
import { User, Mail, Phone, Calendar, Shield, LogOut, CreditCard as Edit, Eye } from 'lucide-react';
import { Lead } from '../types/Lead';
import TechBackground from './TechBackground';

interface LeadDashboardProps {
  lead: Lead;
  onLogout: () => void;
}

const LeadDashboard: React.FC<LeadDashboardProps> = ({ lead, onLogout }) => {
  return (
    <div className="min-h-screen relative">
      <TechBackground />
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-500/30">
                <User className="w-4 h-4 text-cyan-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Mon Compte</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cyan-500/30 rounded-full flex items-center justify-center border border-cyan-500/30">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm font-medium text-white">
                  {lead.prenom} {lead.nom}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors border border-red-500/30"
              >
                <LogOut className="w-4 h-4" />
                Deconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Bienvenue, {lead.prenom} !
          </h2>
          <p className="text-cyan-300/70">
            Voici vos informations personnelles
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-cyan-500/20 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-6 py-8 border-b border-cyan-500/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-cyan-500/30 rounded-full flex items-center justify-center border border-cyan-500/30">
                <User className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{lead.prenom} {lead.nom}</h3>
                <p className="text-cyan-300/70">Lead #{lead.id}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  Informations personnelles
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/10">
                    <User className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm text-cyan-300/70">Nom complet</p>
                      <p className="font-medium text-white">{lead.prenom} {lead.nom}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/10">
                    <Mail className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm text-cyan-300/70">Email</p>
                      <p className="font-medium text-white">{lead.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/10">
                    <Phone className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm text-cyan-300/70">Telephone</p>
                      <p className="font-medium text-white">{lead.telephone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Informations du compte
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/10">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm text-cyan-300/70">Date de creation</p>
                      <p className="font-medium text-white">{lead.dateCreation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/10">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm text-cyan-300/70">ID Lead</p>
                      <p className="font-medium text-white">#{lead.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm text-cyan-300/70">Statut</p>
                      <p className="font-medium text-cyan-300">Compte actif</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-cyan-500/20">
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-colors border border-cyan-500/30">
                  <Edit className="w-4 h-4" />
                  Modifier mes informations
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <Shield className="w-4 h-4" />
                  Changer le mot de passe
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-500/20 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-white mb-1">Securite de votre compte</h4>
              <p className="text-sm text-blue-300/70">
                Vos informations sont securisees et protegees. Si vous avez des questions ou des preoccupations,
                n'hesitez pas a contacter notre equipe de support.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeadDashboard;