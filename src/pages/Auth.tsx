import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldCheck, KeyRound, ArrowLeft, Loader2, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onLogin: (role: 'admin' | 'seller' | 'customer') => void;
  onBack: () => void;
  isOtpFlow: React.MutableRefObject<boolean>;
}

// ── Daftar email yang diizinkan beserta rolenya ──────────────────────────────
// Tambahkan email admin/seller di sini
const AUTHORIZED_ROLES: Record<string, 'admin' | 'seller'> = {
  'admin@seadanyastore.com': 'admin',
  'seller@seadanyastore.com': 'seller',
  'a22100048@mhs.stmik-sumedang.ac.id': 'admin',
  'konterseadanya@gmail.com' : 'admin',
  // tambahkan email lain di sini
};

export function Auth({ onLogin, onBack, isOtpFlow }: AuthProps) {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // ── Step 1: Login dengan email + password ──────────────────────────────────
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  const normalizedEmail = email.toLowerCase().trim();
  const role = AUTHORIZED_ROLES[normalizedEmail];
  if (!role) {
    setError('Akun ini tidak memiliki akses ke portal admin.');
    return;
  }

  setIsLoading(true);
  setStatusText('Memverifikasi kredensial...');

  try {
    // Step 1: Verifikasi password dulu
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : signInError.message
      );
      setIsLoading(false);
      return;
    }

    // Step 2: Logout dulu (session dari signInWithPassword),
    // lalu kirim OTP — user harus verifikasi OTP untuk lanjut
    isOtpFlow.current = true;
    await supabase.auth.signOut();

    setStatusText('Mengirim kode OTP ke email...');

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        // Pastikan Supabase kirim kode OTP, bukan magic link
        emailRedirectTo: undefined,
      },
    });

    if (otpError) {
      setError(`Gagal mengirim OTP: ${otpError.message}`);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setStep('otp');
  } catch (err) {
    setError('Terjadi kesalahan. Coba lagi.');
    setIsLoading(false);
  }
};

  // ── Step 2: Verifikasi OTP ─────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setStatusText('Memverifikasi OTP...');

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError) {
        setError('OTP salah atau sudah kadaluarsa. Coba lagi.');
        setIsLoading(false);
        return;
      }

      isOtpFlow.current = false;


      const role = AUTHORIZED_ROLES[email.toLowerCase()];
      setIsLoading(false);
      onLogin(role ?? 'admin');
    } catch {
      setError('Terjadi kesalahan saat verifikasi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-300 shadow-2xl border border-gray-100">
        <button
          onClick={onBack}
          className="p-2 mb-4 -ml-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition inline-flex items-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-[#0066cc] rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm relative">
            <Lock className="w-8 h-8" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-black tracking-tight mb-2">Portal Akses SSS</h1>
          <p className="text-sm text-gray-500 font-medium">Secure System Services • End-to-End Encrypted</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Step 1: Credentials ─────────────────────────────────────────── */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@seadanyastore.com"
                  className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition shadow-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg mt-4 shadow-md bg-[#0066cc] hover:bg-[#0077ed]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {statusText}
                </div>
              ) : 'Masuk'}
            </Button>
          </form>
        )}

        {/* ── Step 2: OTP ─────────────────────────────────────────────────── */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in slide-in-from-right-4">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0066cc] shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-black mb-1">Verifikasi 2 Langkah (2FA)</p>
                <p className="text-gray-500">
                  Kode OTP telah dikirim ke email <strong>{email}</strong>. Cek inbox atau folder spam.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                One-Time Password (OTP)
              </label>
              <div className="relative">
                <KeyRound className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                  placeholder="000000"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition shadow-sm text-lg tracking-widest font-mono font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg shadow-md bg-[#0066cc] hover:bg-[#0077ed]"
              disabled={isLoading || otp.length < 6}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {statusText}
                </div>
              ) : 'Verifikasi & Masuk'}
            </Button>

            <button
              type="button"
              onClick={() => { isOtpFlow.current = false; setStep('credentials'); setOtp(''); setError(''); }}
              className="w-full text-sm text-gray-500 hover:text-black font-medium text-center transition"
            >
              ← Kembali ke Login
            </button>
          </form>
        )}
      </Card>

      <div className="fixed bottom-6 text-xs text-gray-400 font-medium tracking-wide flex items-center gap-2">
        <Lock className="w-3 h-3" /> SEADANYA STORE KMS v2.4 • System Secured
      </div>
    </div>
  );
}