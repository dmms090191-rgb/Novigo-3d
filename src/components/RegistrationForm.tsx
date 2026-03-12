import React, { useState } from 'react';
import { User, Mail, Lock, Phone, ArrowLeft, UserPlus, Check } from 'lucide-react';
import { Registration } from '../types/Registration';

interface RegistrationFormProps {
  onRegister: (registration: Registration) => void;
  onBackToLogin: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegister, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    telephone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const generateId = (): string => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulation d'un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newRegistration: Registration = {
      id: generateId(),
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      motDePasse: formData.motDePasse,
      telephone: formData.telephone,
      dateInscription: new Date().toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      statut: 'en_attente'
    };

    onRegister(newRegistration);
    setIsLoading(false);
    setIsSuccess(true);

    // Reset form après 3 secondes
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        motDePasse: '',
        telephone: ''
      });
    }, 3000);
  };

  if (isSuccess) {
    return (
      <div>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription envoyée !</h2>
          <p className="text-gray-600 mb-6">
            Votre demande d'inscription a été envoyée avec succès. 
            Un administrateur va examiner votre demande et vous recevrez une confirmation.
          </p>
          <button
            onClick={onBackToLogin}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <button
          onClick={onBackToLogin}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inscription</h1>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Créer un compte</h3>
        <p className="text-gray-600">Remplissez le formulaire pour demander un accès</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
              Nom *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="nom"
                name="nom"
                type="text"
                value={formData.nom}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Nom de famille"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
              Prénom *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="prenom"
                name="prenom"
                type="text"
                value={formData.prenom}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Prénom"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Adresse email *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="votre@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              value={formData.motDePasse}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de téléphone *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="telephone"
              name="telephone"
              type="tel"
              value={formData.telephone}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="+33 1 23 45 67 89"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Envoi en cours...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              S'inscrire
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Votre demande sera examinée par un administrateur avant activation.
        </p>
      </div>
    </div>
  );
};

export default RegistrationForm;