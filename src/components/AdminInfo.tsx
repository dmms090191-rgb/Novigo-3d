import React, { useState, useRef, useEffect } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, Check, X, Sparkles, Settings, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminInfoProps {
  adminEmail: string;
}

const AdminInfo: React.FC<AdminInfoProps> = ({ adminEmail }) => {
  const [passwordDigits, setPasswordDigits] = useState<string[]>(['0', '0', '0', '0', '0', '0']);
  const [showPassword, setShowPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    loadCurrentPassword();
    loadAdminInfo();
  }, [adminEmail]);

  const loadAdminInfo = async () => {
    try {
      const { data } = await supabase
        .from('admins')
        .select('first_name, last_name')
        .eq('email', adminEmail)
        .maybeSingle();

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
      }
    } catch (error) {
      console.error('Error loading admin info:', error);
    }
  };

  const handleSaveName = async () => {
    setIsLoadingName(true);
    setNameMessage(null);

    try {
      const { error } = await supabase
        .from('admins')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('email', adminEmail);

      if (error) throw error;

      setNameMessage({ type: 'success', text: 'Informations enregistrees avec succes' });
      setTimeout(() => setNameMessage(null), 2000);
    } catch (error: any) {
      console.error('Error saving admin info:', error);
      setNameMessage({ type: 'error', text: error.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setIsLoadingName(false);
    }
  };

  const loadCurrentPassword = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPasswordDigits(['0', '0', '0', '0', '0', '0']);
        return;
      }

      const { data } = await supabase
        .from('password_pins')
        .select('pin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.pin) {
        setPasswordDigits(data.pin.split(''));
      } else {
        setPasswordDigits(['0', '0', '0', '0', '0', '0']);
      }
    } catch (error) {
      console.error('Error loading password:', error);
      setPasswordDigits(['0', '0', '0', '0', '0', '0']);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...passwordDigits];
    newDigits[index] = value.slice(-1);
    setPasswordDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !passwordDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    const newDigits = [...passwordDigits];
    digits.forEach((digit, index) => {
      if (index < 6) {
        newDigits[index] = digit;
      }
    });
    setPasswordDigits(newDigits);

    const nextEmptyIndex = newDigits.findIndex(d => !d);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSavePassword = async () => {
    const password = passwordDigits.join('');

    if (password.length !== 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir 6 chiffres' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) throw authError;

      const { error: pinError } = await supabase
        .from('password_pins')
        .upsert({
          user_id: user.id,
          pin: password,
          updated_at: new Date().toISOString()
        });

      if (pinError) throw pinError;

      setMessage({ type: 'success', text: 'Mot de passe modifie avec succes' });
      setTimeout(() => {
        setMessage(null);
      }, 2000);
    } catch (error: any) {
      console.error('Erreur lors de la modification du mot de passe:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la modification du mot de passe' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    loadCurrentPassword();
    setMessage(null);
  };

  return (
    <div className="flex h-full gap-6">
      <div className="w-72 flex-shrink-0">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-5 sticky top-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Configuration</h3>
              <p className="text-xs text-slate-400">Parametres admin</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20 mb-6">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Administrateur</span>
            </div>
            <p className="text-sm text-slate-400">
              Gerez vos informations de connexion en toute securite
            </p>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl p-4 border border-cyan-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Securite</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <span>Code a 6 chiffres</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <span>Unique et confidentiel</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <span>Changement regulier</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Info Admin</h1>
                <p className="text-sm text-slate-400">Consultez et modifiez vos informations</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Identite administrateur</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Prenom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Entrez votre prenom"
                    className="w-full bg-slate-900/50 border-2 border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Entrez votre nom"
                    className="w-full bg-slate-900/50 border-2 border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
                  />
                </div>
              </div>

              {nameMessage && (
                <div
                  className={`p-3 rounded-xl mb-4 ${
                    nameMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {nameMessage.type === 'success' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{nameMessage.text}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveName}
                disabled={isLoadingName || (!firstName.trim() && !lastName.trim())}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
              >
                {isLoadingName ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Enregistrer l'identite
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Email administrateur</h2>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-lg font-medium text-white">{adminEmail}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-semibold text-white">Mot de passe</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium border border-slate-600"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-5 h-5" />
                      Masquer
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      Afficher
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-4 text-center">
                    Mot de passe actuel (6 chiffres)
                  </label>

                  <div className="flex gap-3 mb-4 justify-center">
                    {passwordDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type={showPassword ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-14 h-14 text-center text-2xl font-bold bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
                      />
                    ))}
                  </div>
                </div>

                {message && (
                  <div
                    className={`p-4 rounded-xl ${
                      message.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {message.type === 'success' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                      <span className="font-medium">{message.text}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleSavePassword}
                    disabled={isLoading || passwordDigits.some(d => !d)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Enregistrer
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-700/50 text-slate-300 py-3 px-6 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium border border-slate-600"
                  >
                    <X className="w-5 h-5" />
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInfo;
