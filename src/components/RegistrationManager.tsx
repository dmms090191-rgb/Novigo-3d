import React from 'react';
import { UserCheck, Clock, User, Mail, Phone, Calendar, Hash, CheckCircle, XCircle, Sparkles, Users } from 'lucide-react';
import { Registration } from '../types/Registration';

interface RegistrationManagerProps {
  registrations: Registration[];
  onApproveRegistration: (id: string) => void;
  onRejectRegistration: (id: string) => void;
}

const RegistrationManager: React.FC<RegistrationManagerProps> = ({
  registrations,
  onApproveRegistration,
  onRejectRegistration
}) => {
  const pendingRegistrations = registrations.filter(reg => reg.statut === 'en_attente');

  return (
    <div className="flex h-full gap-6">
      <div className="w-72 flex-shrink-0">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-5 sticky top-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Inscriptions</h3>
              <p className="text-xs text-slate-400">Gestion des demandes</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">En attente</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-bold text-white">{pendingRegistrations.length}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Total</span>
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-2xl font-bold text-slate-300">{registrations.length}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl p-4 border border-cyan-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Guide</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Valider convertit en lead</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                <span>Refuser supprime la demande</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Demandes d'inscription</h2>
                  <p className="text-sm text-slate-400">Validez ou refusez les nouvelles inscriptions</p>
                </div>
              </div>
              {pendingRegistrations.length > 0 && (
                <div className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
                  <span className="text-cyan-400 font-semibold">{pendingRegistrations.length} en attente</span>
                </div>
              )}
            </div>
          </div>

          {pendingRegistrations.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserCheck className="w-10 h-10 text-slate-600" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Aucune inscription en attente</h4>
              <p className="text-slate-400">Toutes les demandes d'inscription ont ete traitees</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-700/50">
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
                        <Phone className="w-4 h-4" />
                        Telephone
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
                  {pendingRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="hover:bg-slate-800/30 transition-all duration-200 group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-cyan-400">#{registration.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-white">{registration.nom}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{registration.prenom}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{registration.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{registration.telephone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">{registration.dateInscription}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onApproveRegistration(registration.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-medium rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Valider
                          </button>
                          <button
                            onClick={() => onRejectRegistration(registration.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-medium rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-105"
                          >
                            <XCircle className="w-4 h-4" />
                            Refuser
                          </button>
                        </div>
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
  );
};

export default RegistrationManager;
