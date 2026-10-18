import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { X, AlertCircle, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, quickSwitchDemoAccount } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ email, password, fullName, phone, role });
      }
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (targetRole: 'CUSTOMER' | 'SUPPLIER' | 'ADMIN') => {
    setIsSubmitting(true);
    try {
      await quickSwitchDemoAccount(targetRole);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-brand-warm-bg">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>BulkBuy Secure Access</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              {isLogin ? 'Sign In to BulkBuy' : 'Join Your Society Pool'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Login Bar */}
        <div className="bg-emerald-50/50 border-b border-emerald-100/60 p-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-700 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Instant 1-Click Demo Personas:</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('CUSTOMER')}
              className="py-2 px-2 bg-white border border-slate-200 hover:border-brand-emerald rounded-xl text-slate-800 text-[11px] font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer text-center"
            >
              <span className="block font-bold">Customer</span>
              <span className="text-[10px] text-slate-400 font-normal">Priya Sharma</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('SUPPLIER')}
              className="py-2 px-2 bg-white border border-slate-200 hover:border-brand-emerald rounded-xl text-slate-800 text-[11px] font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer text-center"
            >
              <span className="block font-bold">Supplier</span>
              <span className="text-[10px] text-slate-400 font-normal">Amara Agro</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="py-2 px-2 bg-white border border-slate-200 hover:border-brand-emerald rounded-xl text-slate-800 text-[11px] font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer text-center"
            >
              <span className="block font-bold">Admin</span>
              <span className="text-[10px] text-slate-400 font-normal">Operations</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Indian Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      role === 'CUSTOMER'
                        ? 'border-brand-emerald bg-emerald-50 text-brand-emerald ring-1 ring-brand-emerald'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('SUPPLIER')}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      role === 'SUPPLIER'
                        ? 'border-brand-emerald bg-emerald-50 text-brand-emerald ring-1 ring-brand-emerald'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Supplier / Mill
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 text-xs font-extrabold text-white bg-brand-emerald rounded-xl hover:bg-brand-moss transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign In to Account' : 'Register Account'}</span>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-xs text-brand-emerald font-bold hover:underline cursor-pointer"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
