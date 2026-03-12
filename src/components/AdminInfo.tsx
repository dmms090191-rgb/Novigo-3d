import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, Check, X, Sparkles, Settings, User, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminInfoProps {
  adminEmail: string;
}

const AdminInfo: React.FC<AdminInfoProps> = ({ adminEmail }) => {
  const [passwordDigits, setPasswordDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [adminId, setAdminId] = useState<string | null>(null);
  const [originalPassword, setOriginalPassword] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentPassword = useMemo(() => passwordDigits.join(''), [passwordDigits]);
  const isPasswordComplete = currentPassword.length === 6;

  useEffect(() => {
    loadAdminInfo();
  }, [adminEmail]);

  const loadAdminInfo = async () => {
    if (!supabase) return;

    try {
      const { data } = await supabase
        .from('admins')
        .select('id, first_name, last_name, email, password_pin')
        .eq('email', adminEmail)
        .maybeSingle();

      if (data) {
        setAdminId(data.id);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || adminEmail);
        if (data.password_pin) {
          setOriginalPassword(data.password_pin);
          const pinDigits = data.password_pin.split('');
          while (pinDigits.length < 6) pinDigits.push('');
          setPasswordDigits(pinDigits.slice(0, 6));
        }
      } else {
        setEmail(adminEmail);
      }
    } catch (error) {
      console.error('Error loading admin info:', error);
      setEmail(adminEmail);
    }
  };

  const handleSaveAll = async () => {
    if (!supabase) {
      setMessage({ type: 'error', text: 'Connexion a la base de donnees non disponible' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const pinString = passwordDigits.join('');

    if (pinString.length !== 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir exactement 6 chiffres' });
      setIsSaving(false);
      return;
    }

    try {
      const { data: currentAdmin } = await supabase
        .from('admins')
        .select('password_pin')
        .eq('email', adminEmail)
        .maybeSingle();

      const currentDbPassword = currentAdmin?.password_pin || '';

      if (adminId) {
        const { error } = await supabase
          .from('admins')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            email: email.trim(),
            password_pin: pinString,
            updated_at: new Date().toISOString()
          })
          .eq('id', adminId);

        if (error) throw error;
      } else {
        const { data: existingAdmin } = await supabase
          .from('admins')
          .select('id')
          .eq('email', adminEmail)
          .maybeSingle();

        if (existingAdmin) {
          const { error } = await supabase
            .from('admins')
            .update({
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: `${firstName.trim()} ${lastName.trim()}`,
              password_pin: pinString,
              updated_at: new Date().toISOString()
            })
            .eq('email', adminEmail);

          if (error) throw error;
          setAdminId(existingAdmin.id);
        } else {
          const { data: newAdmin, error } = await supabase
            .from('admins')
            .insert({
              email: adminEmail,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: `${firstName.trim()} ${lastName.trim()}`,
              password_pin: pinString,
              role: 'admin',
              status: 'active'
            })
            .select('id')
            .single();

          if (error) throw error;
          if (newAdmin) setAdminId(newAdmin.id);
        }
      }

      setOriginalPassword(pinString);

      const savedMessage = pinString === currentDbPassword
        ? 'Informations enregistrees (mot de passe inchange)'
        : 'Toutes les informations ont ete enregistrees avec succes';
      setMessage({ type: 'success', text: savedMessage });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: unknown) {
      console.error('Erreur lors de la sauvegarde:', error);
      let errorMessage = 'Erreur lors de l\'enregistrement';
      if (error && typeof error === 'object') {
        const supaError = error as { message?: string; details?: string; hint?: string; code?: string };
        errorMessage = supaError.message || supaError.details || supaError.hint || errorMessage;
        console.error('Details:', supaError.details, 'Hint:', supaError.hint, 'Code:', supaError.code);
      }
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    if (index === 0 && value && passwordDigits.every(d => d !== '')) {
      const newDigits = [value.slice(-1), '', '', '', '', ''];
      setPasswordDigits(newDigits);
      inputRefs.current[1]?.focus();
      return;
    }

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
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
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

    const nextIndex = Math.min(digits.length, 5);
    inputRefs.current[nextIndex]?.focus();
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
              <span className="text-sm font-medium text-cyan-400">Informations</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <span>Nom et prenom</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <span>Adresse email</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <span>Code a 6 chiffres</span>
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
                <p className="text-sm text-slate-400">Modifiez vos informations et cliquez sur Enregistrer</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Identite</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Email</h2>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre email"
                className="w-full bg-slate-900/50 border-2 border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
              />
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-semibold text-white">Mot de passe (6 chiffres)</h2>
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

              <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                {passwordDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-14 h-14 text-center text-2xl font-bold bg-slate-900/50 border-2 rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                      isPasswordComplete
                        ? 'border-emerald-500 focus:ring-emerald-500/50 focus:border-emerald-500'
                        : 'border-slate-600 focus:ring-cyan-500/50 focus:border-cyan-500'
                    }`}
                  />
                ))}
              </div>

              {isPasswordComplete && (
                <div className="mt-4 p-3 rounded-xl flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">
                    Mot de passe valide (6 chiffres)
                  </span>
                </div>
              )}

              <p className="text-center text-xs text-slate-500 mt-3">
                Utilisez les fleches gauche/droite pour naviguer entre les chiffres
              </p>
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

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
            >
              {isSaving ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enregistrement en cours...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  Enregistrer toutes les modifications
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInfo;
