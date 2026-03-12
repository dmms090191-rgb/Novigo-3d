import React from 'react';
import { Users, Search, Mail, Phone, Calendar, Trash2, LogIn, Eye, X, UserPlus, ArrowDown, ArrowUp, BarChart3, Filter, ChevronRight } from 'lucide-react';
import { Lead } from '../types/Lead';
import { sellerService } from '../services/sellerService';
import { statusService } from '../services/statusService';
import { clientService } from '../services/clientService';
import { Status } from '../types/Status';
import { supabase } from '../lib/supabase';

interface Seller {
  id: string;
  full_name: string;
  email: string;
}

interface LeadsTabProps {
  leads: Lead[];
  onLeadsDeleted: (leadIds: string[]) => void;
  onClientLogin?: (lead: Lead) => void;
  onStatusChanged?: (leadId: string, statusId: string | null) => void;
}

const LeadsTab: React.FC<LeadsTabProps> = ({ leads, onLeadsDeleted, onClientLogin, onStatusChanged }) => {
  const [searchId, setSearchId] = React.useState('');
  const [searchEmail, setSearchEmail] = React.useState('');
  const [searchPhone, setSearchPhone] = React.useState('');
  const [searchNom, setSearchNom] = React.useState('');
  const [searchPrenom, setSearchPrenom] = React.useState('');
  const [selectedLeads, setSelectedLeads] = React.useState<string[]>([]);
  const [selectedLeadDetails, setSelectedLeadDetails] = React.useState<Lead | null>(null);
  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [leadToTransfer, setLeadToTransfer] = React.useState<Lead | null>(null);
  const [sellers, setSellers] = React.useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = React.useState('');
  const [transferring, setTransferring] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>('newest');
  const [statuses, setStatuses] = React.useState<Status[]>([]);
  const [updatingStatus, setUpdatingStatus] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  const parseDate = (dateStr: string): Date => {
    const parts = dateStr.split(/[\s,:\/]+/);
    if (parts.length >= 5) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const hour = parseInt(parts[3]);
      const minute = parseInt(parts[4]);
      return new Date(year, month, day, hour, minute);
    }
    return new Date(dateStr);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesId = searchId === '' || lead.id.toLowerCase().includes(searchId.toLowerCase());
    const matchesEmail = searchEmail === '' || lead.email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesPhone = searchPhone === '' || lead.telephone.includes(searchPhone);
    const matchesNom = searchNom === '' || lead.nom.toLowerCase().includes(searchNom.toLowerCase());
    const matchesPrenom = searchPrenom === '' || lead.prenom.toLowerCase().includes(searchPrenom.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'none' && !lead.status_id) ||
                         (lead.status_id === filterStatus);

    return matchesId && matchesEmail && matchesPhone && matchesNom && matchesPrenom && matchesStatus;
  }).sort((a, b) => {
    const dateA = parseDate(a.dateCreation).getTime();
    const dateB = parseDate(b.dateCreation).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLeads.length === 0) return;

    try {
      const numericIds = selectedLeads.map(id => parseInt(id));
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', numericIds)
        .select();

      if (error) {
        console.error('Erreur Supabase:', error);
        return;
      }

      onLeadsDeleted(selectedLeads);
      setSelectedLeads([]);
    } catch (error: any) {
      console.error('Erreur:', error);
    }
  };

  React.useEffect(() => {
    loadSellers();
    loadStatuses();
  }, []);

  const loadSellers = async () => {
    try {
      const data = await sellerService.getAllSellers();
      const formattedSellers = data.map((seller: any) => ({
        id: seller.id,
        full_name: seller.full_name,
        email: seller.email
      }));
      setSellers(formattedSellers);
    } catch (error) {
      console.error('Erreur lors du chargement des sellers:', error);
    }
  };

  const loadStatuses = async () => {
    try {
      const data = await statusService.getAllStatuses();
      setStatuses(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statuses:', error);
    }
  };

  const handleStatusChange = async (leadId: string, statusId: string) => {
    setUpdatingStatus(leadId);
    try {
      await clientService.updateClientStatus(leadId, statusId || null);
      if (onStatusChanged) {
        onStatusChanged(leadId, statusId || null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleTransferLead = (lead: Lead) => {
    setLeadToTransfer(lead);
    setSelectedSellerId('');
    setShowTransferModal(true);
  };

  const handleTransferSelected = () => {
    setLeadToTransfer(null);
    setSelectedSellerId('');
    setShowTransferModal(true);
  };

  const confirmTransfer = async () => {
    if (!selectedSellerId) return;
    if (!leadToTransfer && selectedLeads.length === 0) return;

    setTransferring(true);
    try {
      const selectedSeller = sellers.find(s => s.id === selectedSellerId);
      if (!selectedSeller) return;

      const leadsToTransfer = leadToTransfer ? [leadToTransfer.id] : selectedLeads;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/clients?id=in.(${leadsToTransfer.join(',')})`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assigned_agent_name: selectedSeller.full_name,
          }),
        }
      );

      if (response.ok) {
        setShowTransferModal(false);
        setLeadToTransfer(null);
        setSelectedLeads([]);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error transferring lead:', error);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl" />
        <div className="relative bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Leads Principal</h2>
                <p className="text-green-300/70 text-sm">Vue d'ensemble de tous vos leads</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-green-500/20">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{leads.length}</p>
                    <p className="text-xs text-gray-400">Total leads</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl" />
        <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
          <div className="p-6 border-b border-cyan-500/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Filtres de recherche</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Rechercher par ID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Rechercher par email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Rechercher par numero..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={searchNom}
                  onChange={(e) => setSearchNom(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Rechercher par prenom..."
                  value={searchPrenom}
                  onChange={(e) => setSearchPrenom(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="none">Sans statut</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>{status.name}</option>
                ))}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white hover:bg-slate-700/50 transition-all text-sm"
              >
                {sortOrder === 'newest' ? (
                  <>
                    <ArrowDown className="w-4 h-4 text-cyan-400" />
                    <span>Plus recent</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4 text-cyan-400" />
                    <span>Plus ancien</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {selectedLeads.length > 0 && (
            <div className="mx-6 my-4 flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <span className="text-sm font-medium text-blue-300">
                {selectedLeads.length} lead(s) selectionne(s)
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTransferSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl border border-green-500/30 transition-all text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Transferer
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl border border-red-500/30 transition-all text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          )}

          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-cyan-500/40" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Aucun lead trouve</h3>
              <p className="text-gray-500">
                {(searchId || searchEmail || searchPhone || searchNom || searchPrenom) ? 'Essayez de modifier vos criteres de recherche' : 'Aucun lead disponible'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-500/10">
                    <th className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-cyan-500 bg-slate-800 border-cyan-500/50 rounded focus:ring-cyan-500"
                      />
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Nom</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Email</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Telephone</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Date</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Statut</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-cyan-300/70 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(lead => (
                    <tr key={lead.id} className="border-b border-cyan-500/5 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="w-4 h-4 text-cyan-500 bg-slate-800 border-cyan-500/50 rounded focus:ring-cyan-500"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-green-500/20">
                            {lead.prenom[0]}{lead.nom[0]}
                          </div>
                          <div>
                            <p className="font-medium text-white">{lead.prenom} {lead.nom}</p>
                            <p className="text-xs text-gray-500">ID: {lead.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Mail className="w-4 h-4 text-cyan-400" />
                          <span className="truncate max-w-[200px]">{lead.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Phone className="w-4 h-4 text-cyan-400" />
                          {lead.telephone}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          {lead.dateCreation}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={lead.status_id || ''}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          disabled={updatingStatus === lead.id.toString()}
                          className="px-3 py-1.5 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Aucun</option>
                          {statuses.map((status) => (
                            <option key={status.id} value={status.id}>{status.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setSelectedLeadDetails(lead)}
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

      {selectedLeadDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-w-2xl w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-green-500/30 overflow-hidden">
              <div className="p-6 border-b border-green-500/20 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Details du Lead</h2>
                      <p className="text-green-300/70 text-sm">Informations completes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLeadDetails(null)}
                    className="w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center transition-all"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                  <p className="text-2xl font-bold text-white">{selectedLeadDetails.prenom} {selectedLeadDetails.nom}</p>
                  <p className="text-sm text-gray-400 mt-1">ID: #{selectedLeadDetails.id}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-cyan-300/70 uppercase font-medium">Email</span>
                    </div>
                    <p className="text-white font-medium break-all">{selectedLeadDetails.email}</p>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-cyan-300/70 uppercase font-medium">Telephone</span>
                    </div>
                    <p className="text-white font-medium">{selectedLeadDetails.telephone}</p>
                  </div>
                  {selectedLeadDetails.motDePasse && (
                    <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 md:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-amber-300/70 uppercase font-medium">Mot de passe</span>
                      </div>
                      <p className="text-amber-300 font-mono font-semibold">{selectedLeadDetails.motDePasse}</p>
                    </div>
                  )}
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/10 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-cyan-300/70 uppercase font-medium">Date de creation</span>
                    </div>
                    <p className="text-white font-medium">{selectedLeadDetails.dateCreation}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-cyan-500/10 flex items-center justify-end gap-3">
                {onClientLogin && (
                  <button
                    onClick={() => {
                      onClientLogin(selectedLeadDetails);
                      setSelectedLeadDetails(null);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 rounded-xl font-semibold transition-all duration-300"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Se connecter en tant que client</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedLeadDetails(null)}
                  className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 rounded-xl font-medium border border-slate-700 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-w-lg w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-green-500/30 overflow-hidden">
              <div className="p-6 border-b border-green-500/20 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Transferer le Lead</h2>
                      <p className="text-green-300/70 text-sm">Assigner a un seller</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTransferModal(false)}
                    disabled={transferring}
                    className="w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                  <p className="text-xs text-gray-400 uppercase font-medium mb-1">
                    {leadToTransfer ? 'Lead a transferer' : `${selectedLeads.length} lead(s) a transferer`}
                  </p>
                  {leadToTransfer ? (
                    <>
                      <p className="text-xl font-bold text-white">{leadToTransfer.prenom} {leadToTransfer.nom}</p>
                      <p className="text-sm text-gray-400 mt-1">{leadToTransfer.email}</p>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-white">{selectedLeads.length} lead(s) selectionne(s)</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300/70 mb-2">Selectionner un Seller</label>
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(e.target.value)}
                    disabled={transferring}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Choisir un seller --</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>{seller.full_name} ({seller.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-cyan-500/10 flex items-center justify-end gap-3">
                <button
                  onClick={confirmTransfer}
                  disabled={!selectedSellerId || transferring}
                  className="group relative flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                  {transferring ? (
                    <>
                      <div className="relative w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="relative text-white font-semibold">Transfert...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="relative w-5 h-5 text-white" />
                      <span className="relative text-white font-semibold">Confirmer</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  disabled={transferring}
                  className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 rounded-xl font-medium border border-slate-700 transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsTab;
