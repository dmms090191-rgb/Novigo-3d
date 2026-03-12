import React, { useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { Lead } from '../types/Lead';
import { Registration } from '../types/Registration';

interface BackupRestoreProps {
  leads: Lead[];
  registrations: Registration[];
  onRestoreLeads: (leads: Lead[]) => void;
  onRestoreRegistrations: (registrations: Registration[]) => void;
}

interface BackupData {
  version: string;
  timestamp: string;
  leads: Lead[];
  registrations: Registration[];
}

const BackupRestore: React.FC<BackupRestoreProps> = ({
  leads,
  registrations,
  onRestoreLeads,
  onRestoreRegistrations,
}) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExportBackup = () => {
    try {
      const backupData: BackupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        leads,
        registrations,
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-sjrenovpro-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Sauvegarde exportée avec succès !' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'export de la sauvegarde' });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData: BackupData = JSON.parse(content);

        if (!backupData.version || !backupData.leads || !backupData.registrations) {
          throw new Error('Format de sauvegarde invalide');
        }

        onRestoreLeads(backupData.leads);
        onRestoreRegistrations(backupData.registrations);

        setMessage({
          type: 'success',
          text: `Sauvegarde restaurée ! ${backupData.leads.length} leads et ${backupData.registrations.length} inscriptions importés.`,
        });
        setTimeout(() => setMessage(null), 5000);
      } catch (error) {
        setMessage({
          type: 'error',
          text: 'Erreur lors de la restauration. Vérifiez le format du fichier.',
        });
        setTimeout(() => setMessage(null), 5000);
      } finally {
        setIsProcessing(false);
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Erreur lors de la lecture du fichier' });
      setTimeout(() => setMessage(null), 5000);
      setIsProcessing(false);
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Database className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sauvegarde et Restauration</h2>
          <p className="text-sm text-gray-600">Exportez ou importez vos données</p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-emerald-800' : 'text-red-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-6 hover:border-emerald-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Exporter les données</h3>
              <p className="text-sm text-gray-600">Créer une sauvegarde</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Téléchargez un fichier JSON contenant tous les leads et inscriptions actuels.
          </p>
          <button
            onClick={handleExportBackup}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exporter la sauvegarde
          </button>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Données actuelles :</strong>
              <br />
              {leads.length} lead(s) · {registrations.length} inscription(s)
            </p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Importer les données</h3>
              <p className="text-sm text-gray-600">Restaurer une sauvegarde</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Importez un fichier de sauvegarde pour restaurer les données précédentes.
          </p>
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              disabled={isProcessing}
              className="hidden"
              id="backup-file-input"
            />
            <label
              htmlFor="backup-file-input"
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Upload className="w-5 h-5" />
              {isProcessing ? 'Importation...' : 'Importer une sauvegarde'}
            </label>
          </label>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              <strong>Attention :</strong> L'import remplacera toutes les données actuelles.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Bonnes pratiques</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Créez des sauvegardes régulières de vos données importantes</li>
          <li>• Conservez plusieurs versions de sauvegarde à différentes dates</li>
          <li>• Vérifiez l'intégrité des fichiers de sauvegarde après l'export</li>
          <li>• Stockez les sauvegardes dans un endroit sécurisé</li>
        </ul>
      </div>
    </div>
  );
};

export default BackupRestore;
