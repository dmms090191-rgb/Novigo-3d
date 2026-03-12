import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, ArrowRight, Sun, Wind, Home, Leaf, UserPlus, LogIn, X, Award, CheckCircle, Star, Facebook, Linkedin, Instagram, Phone, MapPin, Mail as MailIcon, ChevronDown, Eye, EyeOff } from 'lucide-react';
import RegistrationForm from './RegistrationForm';
import { Registration } from '../types/Registration';

interface LoginPageProps {
  onLogin: (email: string, password: string) => boolean;
  onRegister: (registration: Registration) => void;
  homepageImage?: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, homepageImage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [shuffledDigits] = useState<number[]>(() => {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = [...digits];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  const [statsAnimated, setStatsAnimated] = useState(false);
  const [installations, setInstallations] = useState(0);
  const [years, setYears] = useState(0);
  const [satisfaction, setSatisfaction] = useState(0);
  const [savings, setSavings] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);

  const [showSectorMenu, setShowSectorMenu] = useState(false);
  const sectorMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !statsAnimated) {
            setStatsAnimated(true);
            animateCounter(setInstallations, 2500, 1000);
            animateCounter(setYears, 15, 1000);
            animateCounter(setSatisfaction, 98, 1000);
            animateCounter(setSavings, 45, 1000);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [statsAnimated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectorMenuRef.current && !sectorMenuRef.current.contains(event.target as Node)) {
        setShowSectorMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const animateCounter = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    target: number,
    duration: number
  ) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setter(target);
        clearInterval(timer);
      } else {
        setter(Math.floor(current));
      }
    }, 16);
  };

  const handleDigitClick = (digit: number) => {
    if (password.length < 6) {
      setPassword(prev => prev + digit.toString());
      setError('');

      if (voiceEnabled) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(digit.toString());
        utterance.lang = 'fr-FR';
        utterance.rate = 1;
        synth.speak(utterance);
      }
    }
  };

  const handleClearPassword = () => {
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 500));

    const success = onLogin(email, password);

    if (!success) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        console.log('Tentative de connexion client...', email);

        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const data = await response.json();
        console.log('Réponse auth:', response.ok, data);

        if (response.ok && data.access_token) {
          const clientResponse = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${data.user.id}`, {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${data.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          const clientData = await clientResponse.json();
          console.log('Données client:', clientResponse.ok, clientData);

          if (clientResponse.ok && clientData.length > 0) {
            console.log('Redirection vers dashboard client...');
            sessionStorage.setItem('clientData', JSON.stringify({
              user: data.user,
              token: data.access_token,
              client: clientData[0]
            }));
            setIsLoading(false);
            window.location.href = '/client/dashboard';
            return;
          } else {
            console.log('Aucune donnée client trouvée');
            setError('Compte client introuvable');
          }
        } else {
          console.log('Échec authentification');
          setError('Email ou mot de passe incorrect');
        }
      } catch (err) {
        console.error('Erreur de connexion:', err);
        setError('Email ou mot de passe incorrect');
      }
    }

    setIsLoading(false);
  };

  const handleRegister = (registration: Registration) => {
    onRegister(registration);
  };

  const handleBackToLogin = () => {
    setShowRegistration(false);
  };

  const handleShowRegistration = () => {
    setShowRegistration(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowRegistration(false);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-lg z-40 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center py-2">
            <img
              src="/LOGO_OFFICIEL4096.png"
              alt="SJ Renov Pro"
              className="h-40 md:h-48 w-auto"
            />

            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
              <nav className="flex items-center gap-2 md:gap-4">
                <div ref={sectorMenuRef} className="relative">
                  <button
                    onClick={() => setShowSectorMenu(!showSectorMenu)}
                    onMouseEnter={() => setShowSectorMenu(true)}
                    className="flex items-center gap-2 text-gray-700 hover:text-amber-600 font-semibold transition-all duration-200 hover:scale-105 text-lg px-2 py-1"
                  >
                    Secteur
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${showSectorMenu ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showSectorMenu && (
                    <div
                      className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 animate-fade-in"
                      onMouseLeave={() => setShowSectorMenu(false)}
                    >
                      <a
                        href="/secteurs/tertiaire"
                        className="block px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors rounded-lg mx-2"
                        onClick={() => setShowSectorMenu(false)}
                      >
                        <div className="font-medium">Secteur Tertiaire</div>
                        <div className="text-sm text-gray-500">Bureaux et commerces</div>
                      </a>
                      <a
                        href="/secteurs/residentiel"
                        className="block px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors rounded-lg mx-2"
                        onClick={() => setShowSectorMenu(false)}
                      >
                        <div className="font-medium">Secteur Résidentiel</div>
                        <div className="text-sm text-gray-500">Maisons et appartements</div>
                      </a>
                      <a
                        href="/secteurs/industriel"
                        className="block px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors rounded-lg mx-2"
                        onClick={() => setShowSectorMenu(false)}
                      >
                        <div className="font-medium">Secteur Industriel</div>
                        <div className="text-sm text-gray-500">Usines et entrepôts</div>
                      </a>
                    </div>
                  )}
                </div>

                <a
                  href="/qui-sommes-nous"
                  className="text-gray-700 hover:text-amber-600 font-semibold transition-all duration-200 hover:scale-105 text-lg px-2 py-1"
                >
                  Qui sommes-nous
                </a>

                <a
                  href="/plan"
                  className="text-gray-700 hover:text-amber-600 font-semibold transition-all duration-200 hover:scale-105 text-lg px-2 py-1"
                >
                  Plan
                </a>
              </nav>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/50 transition-all duration-200 hover:scale-105 text-lg"
              >
                <LogIn className="w-5 h-5" />
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de connexion */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {showRegistration ? (
              <div className="p-8">
                <RegistrationForm onRegister={handleRegister} onBackToLogin={handleBackToLogin} />
              </div>
            ) : (
              <div className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h1>
                  <p className="text-gray-600">Accédez à votre espace personnel</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-amber-500" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <label className="block text-sm font-medium text-gray-700 text-center">
                        Mot de passe
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-600 hover:text-gray-800 transition-colors p-1"
                      >
                        {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex justify-center items-center gap-2 mb-4">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <div key={index} className="flex flex-col items-center gap-1">
                          {password[index] && (
                            <div className="text-2xl font-bold text-gray-700 mb-1">
                              {showPassword ? password[index] : '★'}
                            </div>
                          )}
                          <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleClearPassword}
                        disabled={isLoading || password.length === 0}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-1"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {shuffledDigits.map((digit) => (
                        <button
                          key={digit}
                          type="button"
                          onClick={() => handleDigitClick(digit)}
                          disabled={isLoading || password.length >= 6}
                          className="aspect-square bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-xl text-2xl font-semibold text-gray-700 transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border border-amber-200 hover:border-amber-300 hover:shadow-md"
                        >
                          {digit}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setVoiceEnabled(!voiceEnabled);
                        const synth = window.speechSynthesis;
                        const message = !voiceEnabled ? 'Mode clavier sonore activé' : 'Mode clavier sonore désactivé';
                        const utterance = new SpeechSynthesisUtterance(message);
                        utterance.lang = 'fr-FR';
                        synth.speak(utterance);
                      }}
                      className={`w-full text-center underline hover:text-gray-900 transition-colors py-1 text-sm ${
                        voiceEnabled ? 'text-amber-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {voiceEnabled ? 'Désactiver le clavier sonore' : 'Activer le clavier sonore'}
                    </button>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !email || password.length !== 6}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-4 px-6 rounded-full text-lg font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl hover:shadow-amber-500/50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Connexion...
                      </>
                    ) : (
                      'Valider'
                    )}
                  </button>

                  <div className="text-center">
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">ou</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleShowRegistration}
                      className="text-amber-600 hover:text-amber-700 font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                      <UserPlus className="w-5 h-5" />
                      S'inscrire
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-[320px] md:pt-[340px] pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium backdrop-blur-sm">
                  Cabinet d'Architecture d'Excellence
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                <span className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 bg-clip-text text-transparent">
                  Architecture
                </span>
                <br />
                <span className="text-gray-100">& Innovation</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Nous concevons des espaces exceptionnels qui allient esthétique contemporaine,
                fonctionnalité optimale et durabilité. Plus de 15 ans d'expertise au service de vos ambitions.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-amber-500/50 transition-all transform hover:scale-105">
                  Démarrer votre projet
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all">
                  Nos réalisations
                </button>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-3xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <img
                    src="/pa1 copy.jpg"
                    alt="Architecture moderne"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold mb-4">
              Nos Expertises
            </span>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Domaines d'Excellence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des solutions architecturales sur mesure qui transforment votre vision en réalité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-amber-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Sun className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-amber-600 transition-colors">
                  Architecture Tertiaire
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Conception de bureaux modernes, espaces commerciaux et établissements professionnels alliant fonctionnalité et esthétique.
                </p>
                <div className="flex items-center gap-2 text-amber-600 font-semibold group-hover:gap-3 transition-all">
                  Découvrir
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-stone-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-stone-500/10 to-gray-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-stone-600 to-gray-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-stone-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-stone-700 transition-colors">
                  Architecture Résidentielle
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Maisons individuelles, villas contemporaines et résidences collectives pensées pour votre confort et votre bien-être.
                </p>
                <div className="flex items-center gap-2 text-stone-700 font-semibold group-hover:gap-3 transition-all">
                  Découvrir
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-slate-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-slate-500/10 to-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Wind className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-slate-700 transition-colors">
                  Architecture Industrielle
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Entrepôts, usines et sites logistiques conçus pour optimiser vos processus de production et votre efficacité opérationnelle.
                </p>
                <div className="flex items-center gap-2 text-slate-700 font-semibold group-hover:gap-3 transition-all">
                  Découvrir
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-semibold mb-6 backdrop-blur-sm">
              Notre Méthodologie
            </span>
            <h2 className="text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 bg-clip-text text-transparent">
                Processus en 4 Étapes
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Une approche éprouvée pour transformer votre vision en réalité architecturale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/20 h-full hover:border-amber-500/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/50 group-hover:shadow-amber-500/80 group-hover:scale-110 transition-all">
                  <span className="text-4xl font-bold text-white">1</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Analyse</h3>
                <p className="text-gray-300 leading-relaxed">
                  Étude approfondie de votre terrain, analyse du contexte urbain et des contraintes réglementaires. Définition des orientations architecturales.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/20 h-full hover:border-amber-500/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/50 group-hover:shadow-amber-500/80 group-hover:scale-110 transition-all">
                  <span className="text-4xl font-bold text-white">2</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Conception</h3>
                <p className="text-gray-300 leading-relaxed">
                  Création des plans architecturaux, modélisations 3D et sélection des matériaux. Un projet unique qui répond à vos exigences.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/20 h-full hover:border-amber-500/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/50 group-hover:shadow-amber-500/80 group-hover:scale-110 transition-all">
                  <span className="text-4xl font-bold text-white">3</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Réalisation</h3>
                <p className="text-gray-300 leading-relaxed">
                  Coordination des entreprises et suivi de chantier rigoureux. Respect des plans, des délais et du budget garantis.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/20 h-full hover:border-amber-500/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/50 group-hover:shadow-amber-500/80 group-hover:scale-110 transition-all">
                  <span className="text-4xl font-bold text-white">4</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Livraison</h3>
                <p className="text-gray-300 leading-relaxed">
                  Réception des travaux et accompagnement dans la prise en main. Service après-vente pour votre entière satisfaction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 text-center">
            <div className="group">
              <div className="text-6xl lg:text-7xl font-bold mb-3 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                {installations.toLocaleString()}+
              </div>
              <p className="text-amber-50 text-lg font-medium">Projets architecturaux</p>
            </div>
            <div className="group">
              <div className="text-6xl lg:text-7xl font-bold mb-3 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                {years} ans
              </div>
              <p className="text-amber-50 text-lg font-medium">D'expertise</p>
            </div>
            <div className="group">
              <div className="text-6xl lg:text-7xl font-bold mb-3 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                {satisfaction}%
              </div>
              <p className="text-amber-50 text-lg font-medium">Clients satisfaits</p>
            </div>
            <div className="group">
              <div className="text-6xl lg:text-7xl font-bold mb-3 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                {savings}%
              </div>
              <p className="text-amber-50 text-lg font-medium">Gain d'espace optimisé</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold mb-4">
              Témoignages
            </span>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez les retours d'expérience de nos clients satisfaits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-amber-200">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 50}ms` }} />
                ))}
              </div>
              <p className="text-gray-700 mb-8 italic text-lg leading-relaxed">
                "Architectes créatifs et à l'écoute. Notre villa moderne dépasse toutes nos attentes, un véritable chef-d'œuvre !"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="font-bold text-white text-lg">MR</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Marie Rousseau</div>
                  <div className="text-gray-500">Paris</div>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-amber-200">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 50}ms` }} />
                ))}
              </div>
              <p className="text-gray-700 mb-8 italic text-lg leading-relaxed">
                "Accompagnement exceptionnel de la conception à la livraison. Notre nouveau siège social est magnifique et fonctionnel."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="font-bold text-white text-lg">PD</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Pierre Dubois</div>
                  <div className="text-gray-500">Lyon</div>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-amber-200">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 50}ms` }} />
                ))}
              </div>
              <p className="text-gray-700 mb-8 italic text-lg leading-relaxed">
                "Design innovant et respect total du budget. Je recommande vivement pour tout projet architectural ambitieux."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="font-bold text-white text-lg">SL</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Sophie Laurent</div>
                  <div className="text-gray-500">Marseille</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white py-8 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-center items-center gap-4 text-gray-400">
            <p>&copy; 2025 SJ Renov Pro. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;