import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldCheck, KeyRound, ArrowLeft, Loader2, Lock } from 'lucide-react';

interface AuthProps {
  onLogin: (role: 'admin' | 'seller' | 'customer') => void;
  onBack: () => void;
}

export function Auth({ onLogin, onBack }: AuthProps) {
  const [role, setRole] = useState<'admin' | 'seller' | 'customer'>('admin');
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusText('Mengenkripsi data (AES-256)...');
    
    // Simulate secure encryption & network delay
    setTimeout(() => {
      setStatusText('Memverifikasi kredensial...');
      setTimeout(() => {
        setIsLoading(false);
        setStep(2);
      }, 1000);
    }, 1200);
  };

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusText('Memverifikasi OTP...');
    
    setTimeout(() => {
      setIsLoading(false);
      if (otp === '123456' || otp === '1234') {
        onLogin(role);
      } else {
        alert('OTP Salah. Gunakan 123456');
      }
    }, 1000);
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

        {step === 1 ? (
          <form onSubmit={handleInitialSubmit} className="space-y-5">
            <div className="flex bg-gray-100 p-1 rounded-full mb-6">
              <button 
                type="button"
                onClick={() => setRole('customer')}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition ${role === 'customer' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                Customer
              </button>
              <button 
                type="button"
                onClick={() => setRole('seller')}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition ${role === 'seller' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                Seller
              </button>
              <button 
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition ${role === 'admin' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                Admin
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={role === 'admin' ? "admin@seadanyastore.com" : "user@email.com"}
                  className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition shadow-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Master Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {statusText}
                </div>
              ) : 'Login Lanjutan'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit} className="space-y-6 animate-in slide-in-from-right-4">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0066cc] shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-black mb-1">Verifikasi 2 Langkah (2FA)</p>
                <p className="text-gray-500">Kami telah mengirimkan 6-digit OTP Tereskripsi ke Email dan WhatsApp terkait akun <strong>{email || 'admin@seadanyastore.com'}</strong>.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 flex items-center justify-between">
                <span>One-Time Password (OTP)</span>
                <span className="text-xs text-[#0066cc]">Gunakan: 123456</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition shadow-sm text-lg tracking-widest font-mono font-medium" 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 text-lg mt-4 shadow-md bg-[#0066cc] hover:bg-[#0077ed]"
              disabled={isLoading || otp.length < 4}
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {statusText}
                </div>
              ) : 'Verifikasi & Masuk'}
            </Button>
            
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 hover:text-black font-medium mt-4 text-center transition"
            >
              Kembali ke Login
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
