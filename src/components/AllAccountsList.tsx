import React, { useState, useEffect } from 'react';
import { Users, Shield, ShoppingBag, User, Mail, Phone, Calendar, Search, Filter } from 'lucide-react';

interface Account {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  status: string;
  created_at: string;
  type: 'admin' | 'seller' | 'client';
  role?: string;
  commission_rate?: number;
  company_name?: string;
}

const AllAccountsList: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'seller' | 'client'>('all');

  useEffect(() => {
    fetchAllAccounts();
  }, []);

  const fetchAllAccounts = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const [adminsRes, sellersRes, clientsRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/admins?select=*`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        }),
        fetch(`${supabaseUrl}/rest/v1/sellers?select=*`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        }),
        fetch(`${supabaseUrl}/rest/v1/clients?select=*`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        }),
      ]);

      const admins = await adminsRes.json();
      const sellers = await sellersRes.json();
      const clients = await clientsRes.json();

      const allAccounts: Account[] = [
        ...admins.map((a: any) => ({ ...a, type: 'admin' as const })),
        ...sellers.map((s: any) => ({ ...s, type: 'seller' as const })),
        ...clients.map((c: any) => ({ ...c, type: 'client' as const })),
      ];

      setAccounts(allAccounts);
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch =
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.phone && account.phone.includes(searchTerm));

    const matchesFilter = filterType === 'all' || account.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'admin':
        return <Shield className="w-5 h-5 text-red-400" />;
      case 'seller':
        return <ShoppingBag className="w-5 h-5 text-blue-400" />;
      case 'client':
        return <User className="w-5 h-5 text-green-400" />;
      default:
        return <Users className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      admin: 'bg-red-500/20 text-red-300 border border-red-500/30',
      seller: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      client: 'bg-green-500/20 text-green-300 border border-green-500/30',
    };
    return colors[type as keyof typeof colors] || 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
  };

  const stats = [
    {
      label: 'Admins',
      count: accounts.filter(a => a.type === 'admin').length,
      icon: Shield,
      gradient: 'from-red-500 to-rose-600',
      shadow: 'shadow-red-500/30',
    },
    {
      label: 'Sellers',
      count: accounts.filter(a => a.type === 'seller').length,
      icon: ShoppingBag,
      gradient: 'from-blue-500 to-cyan-600',
      shadow: 'shadow-blue-500/30',
    },
    {
      label: 'Clients',
      count: accounts.filter(a => a.type === 'client').length,
      icon: User,
      gradient: 'from-green-500 to-emerald-600',
      shadow: 'shadow-green-500/30',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Tous les comptes</h2>
        <p className="text-slate-400">Liste complete de tous les utilisateurs du systeme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6 hover:border-green-500/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.count}</p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg ${stat.shadow}`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl blur-xl" />
        <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 overflow-hidden">
          <div className="p-6 border-b border-green-500/10">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou telephone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-green-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <Filter className="text-slate-500 w-5 h-5" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-3 bg-slate-800/50 border border-green-500/30 rounded-xl text-green-400 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200 cursor-pointer"
                >
                  <option value="all">Tous les types</option>
                  <option value="admin">Admins</option>
                  <option value="seller">Sellers</option>
                  <option value="client">Clients</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-green-500/10 bg-slate-800/30">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Type</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Nom complet</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Email</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Telephone</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Statut</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-green-400/70 uppercase tracking-wider">Cree le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-500/5">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                          <Users className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-500">Aucun compte trouve</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-800/30 transition-all duration-200">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(account.type)}
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getTypeBadge(account.type)}`}>
                            {account.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-white">{account.full_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-300">{account.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {account.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-300">{account.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          account.status === 'active'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                        }`}>
                          {account.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-400 text-sm">
                            {new Date(account.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-green-500/10">
            <span className="text-sm text-slate-400">
              {filteredAccounts.length} compte{filteredAccounts.length > 1 ? 's' : ''} trouve{filteredAccounts.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllAccountsList;
