import React from 'react';
import { Users, Circle, Clock } from 'lucide-react';
import { Seller } from '../types/Seller';
import { Admin } from '../types/Admin';

interface UsersMonitorProps {
  sellers: Seller[];
  admins: Admin[];
}

const UsersMonitor: React.FC<UsersMonitorProps> = ({ sellers, admins }) => {
  const formatLastConnection = (lastConnection?: string) => {
    if (!lastConnection) return 'Jamais connecte';

    const date = new Date(lastConnection);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'A l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  const allUsers = [
    ...admins.map(admin => ({ ...admin, type: 'Admin' as const })),
    ...sellers.map(seller => ({ ...seller, type: 'Seller' as const }))
  ].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    if (a.lastConnection && b.lastConnection) {
      return new Date(b.lastConnection).getTime() - new Date(a.lastConnection).getTime();
    }
    return 0;
  });

  const onlineCount = allUsers.filter(u => u.isOnline).length;
  const totalCount = allUsers.length;

  return (
    <div className="space-y-6">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Utilisateurs Connectes</h2>
              <p className="text-green-100">Surveillance en temps reel</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold">{onlineCount}/{totalCount}</div>
              <div className="text-sm text-green-100">En ligne</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6 hover:border-green-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Administrateurs</h3>
                <p className="text-sm text-slate-400">{admins.length} enregistres</p>
              </div>
            </div>
            <div className="space-y-3">
              {admins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-3">
                    <Users className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm">Aucun administrateur</p>
                </div>
              ) : (
                admins.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-green-500/10 hover:border-green-500/30 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/20">
                          {admin.prenom[0]}{admin.nom[0]}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${admin.isOnline ? 'bg-green-500' : 'bg-slate-500'}`} />
                      </div>
                      <div>
                        <div className="font-medium text-white">{admin.prenom} {admin.nom}</div>
                        <div className="text-sm text-slate-400">{admin.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {admin.isOnline ? (
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-500/20 px-3 py-1 rounded-lg border border-green-500/30">
                          <Circle className="w-2 h-2 fill-current" />
                          En ligne
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Clock className="w-3 h-3" />
                          {formatLastConnection(admin.lastConnection)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6 hover:border-green-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Vendeurs</h3>
                <p className="text-sm text-slate-400">{sellers.length} enregistres</p>
              </div>
            </div>
            <div className="space-y-3">
              {sellers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-3">
                    <Users className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm">Aucun vendeur</p>
                </div>
              ) : (
                sellers.map(seller => (
                  <div key={seller.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-green-500/10 hover:border-green-500/30 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                          {seller.prenom[0]}{seller.nom[0]}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${seller.isOnline ? 'bg-green-500' : 'bg-slate-500'}`} />
                      </div>
                      <div>
                        <div className="font-medium text-white">{seller.prenom} {seller.nom}</div>
                        <div className="text-sm text-slate-400">{seller.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {seller.isOnline ? (
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-500/20 px-3 py-1 rounded-lg border border-green-500/30">
                          <Circle className="w-2 h-2 fill-current" />
                          En ligne
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Clock className="w-3 h-3" />
                          {formatLastConnection(seller.lastConnection)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl blur-xl" />
        <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 overflow-hidden">
          <div className="p-6 border-b border-green-500/10">
            <h3 className="text-lg font-bold text-white">Tous les utilisateurs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-green-500/10 bg-slate-800/30">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Statut</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Nom</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Email</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Type</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Derniere connexion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-500/5">
                {allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                          <Users className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-500">Aucun utilisateur</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  allUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-all duration-200">
                      <td className="py-4 px-6">
                        <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-slate-500'}`} />
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-white">
                        {user.prenom} {user.nom}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-300">{user.email}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                          user.type === 'Admin'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {user.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400">
                        {user.isOnline ? (
                          <span className="text-green-400 font-medium">En ligne</span>
                        ) : (
                          formatLastConnection(user.lastConnection)
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersMonitor;
