import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Box, Layers, Cpu, Shield, ChevronDown, Play, LogIn, X, Mail, Eye, EyeOff, UserPlus, MessageCircle } from 'lucide-react';
import RegistrationForm from '../components/RegistrationForm';
import HeroHouseAnimation from '../components/HeroHouseAnimation';
import { Registration } from '../types/Registration';

interface HomePageProps {
  onLogin?: (email: string, password: string) => Promise<boolean>;
  onRegister?: (registration: Registration) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLogin, onRegister }) => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number; opacity: number }>>([]);
  const [heroDimensions, setHeroDimensions] = useState({ width: 0, height: 0 });

  const [showModal, setShowModal] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    const initialParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.5 + 0.2
    }));
    setParticles(initialParticles);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        });
      }
    };

    const handleScroll = () => setScrollY(window.scrollY);

    const updateHeroDimensions = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setHeroDimensions({ width: rect.width, height: rect.height });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateHeroDimensions);
    updateHeroDimensions();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeroDimensions);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Box, title: 'Modelisation 3D', description: 'Creez des modeles architecturaux detailles en temps reel' },
    { icon: Layers, title: 'Plans 2D/3D', description: 'Passez facilement de la vue 2D a la visualisation 3D' },
    { icon: Cpu, title: 'IA Integree', description: 'Suggestions intelligentes pour optimiser vos designs' },
    { icon: Shield, title: 'Securise', description: 'Vos projets sont proteges et sauvegardes automatiquement' }
  ];

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

    if (onLogin) {
      try {
        const success = await onLogin(email, password);
        if (!success) {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
              method: 'POST',
              headers: {
                'apikey': supabaseAnonKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.access_token) {
              const clientResponse = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${data.user.id}`, {
                headers: {
                  'apikey': supabaseAnonKey,
                  'Authorization': `Bearer ${data.access_token}`,
                  'Content-Type': 'application/json',
                },
              });

              const clientData = await clientResponse.json();

              if (clientResponse.ok && clientData.length > 0) {
                sessionStorage.setItem('clientData', JSON.stringify({
                  user: data.user,
                  token: data.access_token,
                  client: clientData[0]
                }));
                setIsLoading(false);
                window.location.href = '/client/dashboard';
                return;
              } else {
                setError('Compte client introuvable');
              }
            } else {
              setError('Email ou mot de passe incorrect');
            }
          } catch (err) {
            setError('Email ou mot de passe incorrect');
          }
        }
      } catch (err) {
        setError('Email ou mot de passe incorrect');
      }
    } else {
      setError('Email ou mot de passe incorrect');
    }

    setIsLoading(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowRegistration(false);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleRegister = (registration: Registration) => {
    if (onRegister) {
      onRegister(registration);
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleCloseModal} />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative w-full max-w-md group/modal">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-cyan-500/30 rounded-2xl blur-xl opacity-60 group-hover/modal:opacity-80 transition-opacity duration-500" />

            <div className="relative backdrop-blur-xl rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(8, 47, 73, 0.9) 50%, rgba(15, 23, 42, 0.95) 100%)' }}>
              <div className="absolute inset-0 overflow-hidden">
                <svg className="absolute w-full h-full opacity-20">
                  <defs>
                    <pattern id="techGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="0.5"/>
                      <circle cx="0" cy="0" r="1" fill="rgba(6, 182, 212, 0.6)" />
                      <circle cx="40" cy="0" r="1" fill="rgba(6, 182, 212, 0.6)" />
                      <circle cx="0" cy="40" r="1" fill="rgba(6, 182, 212, 0.6)" />
                      <circle cx="40" cy="40" r="1" fill="rgba(6, 182, 212, 0.6)" />
                    </pattern>
                    <linearGradient id="techGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(6, 182, 212, 0.1)" />
                      <stop offset="50%" stopColor="rgba(59, 130, 246, 0.05)" />
                      <stop offset="100%" stopColor="rgba(6, 182, 212, 0.1)" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#techGrid)" />
                  <rect width="100%" height="100%" fill="url(#techGradient)" />
                </svg>

                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-cyan-500/10 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-blue-500/10 to-transparent" />

                <div className="absolute top-10 left-10 w-32 h-32 border border-cyan-500/10 rounded-full" />
                <div className="absolute top-8 left-8 w-36 h-36 border border-cyan-500/5 rounded-full" />
                <div className="absolute bottom-10 right-10 w-24 h-24 border border-blue-500/10 rounded-full" />

                <div className="absolute top-1/4 right-8 w-1 h-16 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent" />
                <div className="absolute bottom-1/4 left-8 w-1 h-16 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent" />
                <div className="absolute top-8 left-1/4 w-16 h-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                <div className="absolute bottom-8 right-1/4 w-16 h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
              </div>

              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-20 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent" />
                <div className="absolute top-0 left-0 w-[2px] h-20 bg-gradient-to-b from-cyan-400 to-transparent" />
                <div className="absolute top-0 right-0 w-20 h-[2px] bg-gradient-to-l from-cyan-400 to-transparent" />
                <div className="absolute top-0 right-0 w-[2px] h-20 bg-gradient-to-b from-cyan-400 to-transparent" />
                <div className="absolute bottom-0 left-0 w-20 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent" />
                <div className="absolute bottom-0 left-0 w-[2px] h-20 bg-gradient-to-t from-cyan-400 to-transparent" />
                <div className="absolute bottom-0 right-0 w-20 h-[2px] bg-gradient-to-l from-cyan-400 to-transparent" />
                <div className="absolute bottom-0 right-0 w-[2px] h-20 bg-gradient-to-t from-cyan-400 to-transparent" />
              </div>

              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400" />

              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-50 group/close w-10 h-10 rounded-full transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm" />
                <div className="absolute inset-0 border border-gray-600/50 rounded-full group-hover/close:border-cyan-400/60 transition-all duration-300" />
                <div className="absolute inset-0 opacity-0 group-hover/close:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-cyan-400/20 rounded-full blur-md" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-4 h-4">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-400 rounded-full transform -translate-y-1/2 rotate-45 group-hover/close:bg-cyan-400 transition-colors duration-300" />
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-400 rounded-full transform -translate-y-1/2 -rotate-45 group-hover/close:bg-cyan-400 transition-colors duration-300" />
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full opacity-0 group-hover/close:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 rounded-full animate-ping bg-cyan-400/10" style={{ animationDuration: '1.5s' }} />
                </div>
              </button>

              {showRegistration ? (
                <div className="p-8 relative z-10">
                  <RegistrationForm onRegister={handleRegister} onBackToLogin={() => setShowRegistration(false)} />
                </div>
              ) : (
                <div className="p-8 relative z-10">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-4">
                      <LogIn className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Connexion</span>
                    </h1>
                    <p className="text-gray-400 text-sm">Accedez a votre espace personnel</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Adresse email
                      </label>
                      <div className="relative group/input">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg blur opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-cyan-500" />
                          </div>
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3.5 bg-gray-900/80 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all duration-300"
                            placeholder="votre@email.com"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <label className="block text-sm font-medium text-gray-300 text-center">
                          Mot de passe
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-cyan-400 transition-colors p-1"
                        >
                          {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="flex justify-center items-center gap-3 mb-5">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <div key={index} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-12 rounded-lg border ${password[index] ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-gray-700/50 bg-gray-900/50'} flex items-center justify-center transition-all duration-200`}>
                              {password[index] && (
                                <span className="text-xl font-bold text-cyan-400">
                                  {showPassword ? password[index] : '*'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleClearPassword}
                          disabled={isLoading || password.length === 0}
                          className="w-10 h-12 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border border-gray-700/50 bg-gray-900/50 hover:border-red-500/50 hover:bg-red-500/10"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {shuffledDigits.map((digit) => (
                          <button
                            key={digit}
                            type="button"
                            onClick={() => handleDigitClick(digit)}
                            disabled={isLoading || password.length >= 6}
                            className="group/digit relative aspect-square overflow-hidden rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <div className="absolute inset-0 bg-gray-900/80 border border-gray-700/50 rounded-xl group-hover/digit:border-cyan-500/50 transition-colors" />
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover/digit:from-cyan-500/10 group-hover/digit:to-blue-500/10 transition-all duration-300" />
                            <span className="relative z-10 text-xl font-semibold text-gray-300 group-hover/digit:text-cyan-400 transition-colors">
                              {digit}
                            </span>
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setVoiceEnabled(!voiceEnabled);
                          const synth = window.speechSynthesis;
                          const message = !voiceEnabled ? 'Mode clavier sonore active' : 'Mode clavier sonore desactive';
                          const utterance = new SpeechSynthesisUtterance(message);
                          utterance.lang = 'fr-FR';
                          synth.speak(utterance);
                        }}
                        className={`w-full text-center py-2 text-sm transition-colors ${
                          voiceEnabled ? 'text-cyan-400 font-semibold' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {voiceEnabled ? 'Desactiver le clavier sonore' : 'Activer le clavier sonore'}
                      </button>
                    </div>

                    {error && (
                      <div className="relative overflow-hidden rounded-lg">
                        <div className="absolute inset-0 bg-red-500/10 border border-red-500/30" />
                        <div className="relative p-3 text-red-400 text-sm text-center">
                          {error}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !email || password.length !== 6}
                      className="group/submit relative w-full py-4 bg-transparent overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm" />

                      <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-8 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent group-hover/submit:w-full transition-all duration-500" />
                        <div className="absolute top-0 left-0 w-[2px] h-8 bg-gradient-to-b from-cyan-400 to-transparent group-hover/submit:h-full transition-all duration-500" />
                        <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-gradient-to-l from-cyan-400 to-transparent group-hover/submit:w-full transition-all duration-500" />
                        <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-gradient-to-t from-cyan-400 to-transparent group-hover/submit:h-full transition-all duration-500" />
                      </div>

                      <div className="absolute inset-[1px] bg-black/60 group-hover/submit:bg-black/40 transition-colors duration-300" />

                      <div className="absolute inset-0 opacity-0 group-hover/submit:opacity-100 transition-opacity duration-500">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/30 rounded-full blur-2xl" />
                      </div>

                      <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-cyan-400" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-cyan-400" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-cyan-400" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-cyan-400" />

                      <div className="relative flex items-center justify-center gap-3">
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                            <span className="text-lg font-semibold tracking-wider uppercase text-cyan-100">
                              Connexion...
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="relative">
                              <LogIn className="w-5 h-5 text-cyan-400 group-hover/submit:text-white transition-colors duration-300" />
                              <div className="absolute inset-0 blur-sm bg-cyan-400/50 opacity-0 group-hover/submit:opacity-100 transition-opacity duration-300" />
                            </div>
                            <span className="text-lg font-semibold tracking-wider uppercase text-cyan-100 group-hover/submit:text-white transition-colors duration-300">
                              Valider
                            </span>
                            <div className="w-0 group-hover/submit:w-6 h-[1px] bg-gradient-to-r from-cyan-400 to-transparent transition-all duration-500 overflow-hidden">
                              <div className="w-6 h-[1px] bg-cyan-400 animate-pulse" />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="absolute inset-0 opacity-0 group-hover/submit:opacity-100 transition-opacity duration-1000 pointer-events-none overflow-hidden">
                        <div className="absolute top-0 -left-full w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent group-hover/submit:left-full transition-all duration-1000" />
                        <div className="absolute -top-full left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent group-hover/submit:top-full transition-all duration-1000 delay-100" />
                      </div>
                    </button>

                    <div className="text-center">
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-black text-gray-500">ou</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRegistration(true)}
                        className="group/register inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 font-medium transition-colors"
                      >
                        <UserPlus className="w-5 h-5" />
                        <span>S'inscrire</span>
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/register:opacity-100 group-hover/register:translate-x-0 transition-all duration-300" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center"
        style={{
          background: `
            radial-gradient(ellipse at ${mousePosition.x}% ${mousePosition.y}%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 40%),
            linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)
          `
        }}
      >
        <HeroHouseAnimation
          width={heroDimensions.width}
          height={heroDimensions.height}
          mouseX={mousePosition.x * heroDimensions.width / 100}
          mouseY={mousePosition.y * heroDimensions.height / 100}
        />

        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-cyan-400 pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${(particle.y + scrollY * particle.speed * 0.1) % 100}%`,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 2}px rgba(6, 182, 212, 0.5)`,
              animation: `float ${5 + particle.speed * 5}s ease-in-out infinite`
            }}
          />
        ))}

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-[800px] h-[800px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${1 + scrollY * 0.001})`,
              filter: 'blur(60px)'
            }}
          />
        </div>

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <svg className="w-full h-full opacity-10">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <nav className="absolute top-0 left-0 right-0 z-[100] px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 relative z-[101]">
              <img src="/logo_nova_2.jpeg" alt="Novigo3D Logo" className="h-16 w-auto rounded-lg shadow-lg" />
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm font-medium">Fonctionnalites</a>
              <a href="#about" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm font-medium">A propos</a>
              <a
                href="#contact"
                className="group relative px-6 py-2.5 bg-transparent overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm" />

                <div className="absolute inset-0">
                  <div className="absolute top-0 left-0 w-4 h-[1px] bg-gradient-to-r from-cyan-400 to-transparent group-hover:w-full transition-all duration-500" />
                  <div className="absolute top-0 left-0 w-[1px] h-4 bg-gradient-to-b from-cyan-400 to-transparent group-hover:h-full transition-all duration-500" />
                  <div className="absolute bottom-0 right-0 w-4 h-[1px] bg-gradient-to-l from-cyan-400 to-transparent group-hover:w-full transition-all duration-500" />
                  <div className="absolute bottom-0 right-0 w-[1px] h-4 bg-gradient-to-t from-cyan-400 to-transparent group-hover:h-full transition-all duration-500" />
                </div>

                <div className="absolute inset-[1px] bg-black/60 group-hover:bg-black/40 transition-colors duration-300" />

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-cyan-500/30 rounded-full blur-xl" />
                </div>

                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-cyan-400" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-cyan-400" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-cyan-400" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-cyan-400" />

                <div className="relative flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors duration-300" />
                  <span className="text-sm font-medium tracking-wide text-cyan-100 group-hover:text-white transition-colors duration-300">
                    Nous contacter
                  </span>
                </div>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none overflow-hidden">
                  <div className="absolute top-0 -left-full w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent group-hover:left-full transition-all duration-1000" />
                </div>
              </a>
            </div>
          </div>
        </nav>

        <div className="relative z-10 flex flex-col items-center px-4">
        </div>

        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => setShowModal(true)}
            className="group relative px-12 py-5 bg-transparent overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm" />

            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-8 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent group-hover:w-full transition-all duration-500" />
              <div className="absolute top-0 left-0 w-[2px] h-8 bg-gradient-to-b from-cyan-400 to-transparent group-hover:h-full transition-all duration-500" />
              <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-gradient-to-l from-cyan-400 to-transparent group-hover:w-full transition-all duration-500" />
              <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-gradient-to-t from-cyan-400 to-transparent group-hover:h-full transition-all duration-500" />
            </div>

            <div className="absolute inset-[1px] bg-black/60 group-hover:bg-black/40 transition-colors duration-300" />

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/30 rounded-full blur-2xl" />
            </div>

            <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-cyan-400" />

            <div className="relative flex items-center gap-3">
              <div className="relative">
                <LogIn className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors duration-300" />
                <div className="absolute inset-0 blur-sm bg-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-lg font-semibold tracking-wider uppercase text-cyan-100 group-hover:text-white transition-colors duration-300">
                Connexion
              </span>
              <div className="w-0 group-hover:w-6 h-[1px] bg-gradient-to-r from-cyan-400 to-transparent transition-all duration-500 overflow-hidden">
                <div className="w-6 h-[1px] bg-cyan-400 animate-pulse" />
              </div>
            </div>

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none overflow-hidden">
              <div className="absolute top-0 -left-full w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent group-hover:left-full transition-all duration-1000" />
              <div className="absolute -top-full left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent group-hover:top-full transition-all duration-1000 delay-100" />
            </div>
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-cyan-400/60" />
        </div>
      </div>


      <section id="features" className="relative py-32 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Fonctionnalites <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">puissantes</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour donner vie a vos projets architecturaux
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl border transition-all duration-500 cursor-pointer group ${
                  activeFeature === index
                    ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/50 scale-105'
                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  activeFeature === index
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                    : 'bg-gray-800 group-hover:bg-gray-700'
                }`}>
                  <feature.icon className={`w-7 h-7 ${activeFeature === index ? 'text-white' : 'text-cyan-400'}`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>

                {activeFeature === index && (
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 -z-10 blur-xl" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="relative py-32 bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Revolutionnez votre<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">approche architecturale</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Novigo3D combine la puissance de la modelisation 3D avec une interface intuitive.
                Que vous soyez architecte, designer ou passione, notre plateforme vous permet de
                creer des visualisations professionnelles en quelques clics.
              </p>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-400 mb-2">500+</div>
                  <div className="text-gray-500 text-sm">Projets crees</div>
                </div>
                <div className="w-px h-16 bg-gray-800" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-400 mb-2">98%</div>
                  <div className="text-gray-500 text-sm">Satisfaction</div>
                </div>
                <div className="w-px h-16 bg-gray-800" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
                  <div className="text-gray-500 text-sm">Support</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl p-8 border border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                  <div className="h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20 flex items-center justify-center">
                    <Box className="w-16 h-16 text-cyan-400/50" />
                  </div>
                  <div className="h-4 bg-gray-800 rounded w-2/3" />
                  <div className="h-4 bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 border-y border-gray-800">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pret a commencer ?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Lancez-vous des maintenant et decouvrez la puissance de Novigo3D
          </p>
          <button
            onClick={() => navigate('/plan')}
            className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-2xl"
          >
            <Play className="w-5 h-5" />
            Acceder a l'editeur
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <footer className="bg-black py-12 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Box className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Novigo<span className="text-cyan-400">3D</span></span>
            </div>
            <p className="text-gray-500 text-sm">
              2026 Novigo3D. Tous droits reserves.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
