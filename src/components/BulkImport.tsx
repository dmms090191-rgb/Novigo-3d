import React, { useState, useRef } from 'react';
import { Upload, Eye, Plus, List, User, Mail, Phone, Calendar, Hash, Users, Trash2, CheckSquare, Square, ArrowRight, FileText, ChevronRight, Zap, BarChart3 } from 'lucide-react';
import { Lead } from '../types/Lead';
import { leadService } from '../services/leadService';

interface BulkImportProps {
  leads: Lead[];
  onLeadCreated: (lead: Lead) => void;
  onLeadsDeleted: (leadIds: string[]) => void;
  onLeadsTransferred?: (leadIds: string[]) => void;
}

const BulkImport: React.FC<BulkImportProps> = ({ leads, onLeadCreated, onLeadsDeleted, onLeadsTransferred }) => {
  const [activeTab, setActiveTab] = useState<'import' | 'list'>('import');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [csvFormat, setCsvFormat] = useState('nom,prenom,email,motDePasse,telephone');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = (): string => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const handleFileSelect = (file: File) => {
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      setCsvFile(file);
      setIsProcessingCsv(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length > 0) {
          const parsedLines = lines.map(line => {
            const separator = line.includes(';') ? ';' : ',';
            return line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, ''));
          });

          setCsvPreview(parsedLines);

          if (parsedLines.length > 0) {
            const detectedFormat = parsedLines[0]
              .map(header => header.toLowerCase().trim())
              .join(',');
            setCsvFormat(detectedFormat);
          }
        }
        setIsProcessingCsv(false);
      };

      reader.onerror = () => {
        setIsProcessingCsv(false);
      };

      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImportCsv = () => {
    if (!csvFile || csvPreview.length === 0) {
      return;
    }

    const formatColumns = csvFormat.split(',').map(col => col.trim());
    const dataRows = csvPreview.slice(1);
    let importedCount = 0;

    dataRows.forEach(row => {
      if (row.length >= formatColumns.length) {
        const leadData: any = {};

        formatColumns.forEach((column, index) => {
          const value = row[index]?.trim();
          if (value) {
            const normalizedColumn = column.toLowerCase().replace(/[_\s-]/g, '');
            switch (normalizedColumn) {
              case 'nom':
                leadData.nom = value;
                break;
              case 'prenom':
              case 'prénom':
                leadData.prenom = value;
                break;
              case 'adresse':
                break;
              case 'email':
              case 'mail':
                leadData.email = value;
                break;
              case 'numero':
              case 'numéro':
              case 'telephone':
              case 'téléphone':
              case 'tel':
              case 'phone':
                leadData.telephone = value;
                break;
              case 'source':
                if (!leadData.motDePasse) {
                  leadData.motDePasse = value;
                }
                break;
              case 'com':
                if (!leadData.motDePasse) {
                  leadData.motDePasse = value;
                }
                break;
              case 'motdepasse':
              case 'password':
              case 'mdp':
                leadData.motDePasse = value;
                break;
              default:
                if (!leadData.motDePasse && value.length >= 4) {
                  leadData.motDePasse = value;
                }
                break;
            }
          }
        });

        if (!leadData.motDePasse && leadData.nom && leadData.prenom) {
          leadData.motDePasse = `${leadData.prenom.toLowerCase()}123`;
        }

        if (leadData.nom && leadData.prenom && leadData.email && leadData.telephone) {
          if (!leadData.motDePasse) {
            leadData.motDePasse = `${leadData.prenom.toLowerCase()}123`;
          }

          const newLead: Lead = {
            id: generateId(),
            nom: leadData.nom,
            prenom: leadData.prenom,
            email: leadData.email,
            motDePasse: leadData.motDePasse,
            telephone: leadData.telephone,
            dateCreation: new Date().toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          };

          onLeadCreated(newLead);
          importedCount++;
        }
      }
    });

    if (importedCount > 0) {
      setActiveTab('list');
      setCsvFile(null);
      setCsvPreview([]);
      setCsvFormat('nom,prenom,email,motDePasse,telephone');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    if (selectedLeads.length > 0) {
      try {
        await leadService.deleteMultipleLeads(selectedLeads);
        onLeadsDeleted(selectedLeads);
        setSelectedLeads([]);
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleTransferSelected = async () => {
    if (selectedLeads.length === 0 || !onLeadsTransferred) {
      return;
    }

    try {
      await onLeadsTransferred(selectedLeads);
      setSelectedLeads([]);
    } catch (error: any) {
      console.error('Erreur lors du transfert:', error);
    }
  };

  const subMenuItems = [
    { id: 'import', label: 'Importer', icon: Upload, description: 'Fichier CSV' },
    { id: 'list', label: 'Liste des leads', icon: List, description: `${leads.length} leads`, badge: leads.length },
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
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
                <div className="p-6 border-b border-cyan-500/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Format des colonnes</h3>
                      <p className="text-cyan-300/60 text-sm">Configuration du fichier CSV</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-300/70 mb-2">
                      Format CSV (ordre des colonnes)
                    </label>
                    <input
                      type="text"
                      value={csvFormat}
                      onChange={(e) => setCsvFormat(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                      placeholder="nom,prenom,email,motDePasse,telephone"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-medium text-blue-300">Detection auto</span>
                      </div>
                      <p className="text-xs text-blue-300/70">Les colonnes sont detectees automatiquement</p>
                    </div>
                    <div className="flex-1 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-medium text-green-300">Colonnes supportees</span>
                      </div>
                      <p className="text-xs text-green-300/70">nom, prenom, email, telephone, etc.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
                <div className="p-6 border-b border-cyan-500/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Selectionner le fichier</h3>
                      <p className="text-cyan-300/60 text-sm">Glissez-deposez ou parcourez</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      isDragging
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/5'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-cyan-400" />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">
                      Glissez-deposez votre fichier CSV ici
                    </p>
                    <p className="text-gray-500 mb-4">ou</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                      <Upload className="relative w-5 h-5 text-white" />
                      <span className="relative text-white font-semibold">Parcourir les fichiers</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>

                  {csvFile && (
                    <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-cyan-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{csvFile.name}</p>
                            <p className="text-sm text-gray-500">{(csvFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCsvFile(null);
                            setCsvPreview([]);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1 bg-red-500/10 rounded-lg border border-red-500/30 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>

                      {isProcessingCsv ? (
                        <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-blue-300">Analyse du fichier...</span>
                        </div>
                      ) : csvPreview.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-green-400">{csvPreview.length - 1}</span>
                            </div>
                            <span className="text-sm font-medium text-green-300">
                              {csvPreview.length - 1} leads detectes
                            </span>
                          </div>
                          <button
                            onClick={handleImportCsv}
                            className="group relative w-full flex items-center justify-center gap-3 py-4 overflow-hidden rounded-xl"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                            <Upload className="relative w-5 h-5 text-white" />
                            <span className="relative text-white font-semibold">Importer {csvPreview.length - 1} leads</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Instructions</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <h4 className="font-medium text-amber-300 mb-2">Detection automatique</h4>
                  <ul className="text-sm text-amber-300/70 space-y-1">
                    <li>- Premiere ligne = noms des colonnes</li>
                    <li>- Detection auto lors du chargement</li>
                    <li>- Modification manuelle possible</li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <h4 className="font-medium text-blue-300 mb-2">Regles d'import</h4>
                  <ul className="text-sm text-blue-300/70 space-y-1">
                    <li>- CSV avec virgule ou point-virgule</li>
                    <li>- Max 1000 leads par import</li>
                    <li>- Champs: nom, prenom, email, tel</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl" />
            <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
              <div className="p-6 border-b border-cyan-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <List className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Liste des leads importes</h3>
                      <p className="text-cyan-300/60 text-sm">{leads.length} leads au total</p>
                    </div>
                  </div>

                  {selectedLeads.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-cyan-300">
                        {selectedLeads.length} selectionne{selectedLeads.length > 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={handleTransferSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl border border-blue-500/30 transition-all"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-sm font-medium">Transferer</span>
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl border border-red-500/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Supprimer</span>
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
                  <h3 className="text-lg font-medium text-white mb-2">Aucun lead importe</h3>
                  <p className="text-gray-500 mb-6">Commencez par importer votre premier fichier CSV</p>
                  <button
                    onClick={() => setActiveTab('import')}
                    className="group relative inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <Upload className="relative w-5 h-5 text-white" />
                    <span className="relative text-white font-semibold">Importer des leads</span>
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
                        <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            ID
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Nom
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Prenom
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Telephone
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300/70 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date
                          </div>
                        </th>
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
                          <td className="px-6 py-4 text-sm font-mono text-cyan-300">
                            #{lead.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-white font-medium">
                            {lead.nom}
                          </td>
                          <td className="px-6 py-4 text-sm text-white">
                            {lead.prenom}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {lead.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {lead.telephone}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {lead.dateCreation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImport;
