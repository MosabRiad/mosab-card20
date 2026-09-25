import React, { useState } from 'react';
import { KeyRound, User, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DealerUser } from '../types';
import { INITIAL_DEALER } from '../data/mockData';

interface LoginScreenProps {
  onLoginSuccess: (dealer: DealerUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setErrorMessage('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    // Only allow the specific credentials set by the user
    if (trimmedUser !== '2901414' || trimmedPass !== '2901414') {
      setErrorMessage('اسم المستخدم أو كلمة المرور غير صحيحة.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Inside the platform, display name/username is different from the secret credentials
      const dealer: DealerUser = {
        ...INITIAL_DEALER,
        username: 'Smart Net',
        name: 'Smart Net',
        dealerId: 'Smart Net',
      };
      if (rememberMe) {
        localStorage.setItem('smartnet_session', JSON.stringify(dealer));
      }
      onLoginSuccess(dealer);
    }, 500);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden space-y-6 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shadow-xs mb-1">
            <KeyRound className="w-8 h-8" />
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-sans">
            Smart Net
          </h1>

          <p className="text-xs text-slate-500 font-medium pt-1">
            تسجيل الدخول لاستخراج الكروت غير المستخدمة واختيار المجموعات
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold animate-pulse">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          {/* Username Input */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">اسم المستخدم:</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم"
                className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-sans focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition-all"
              />
              <User className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">كلمة المرور:</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full pr-10 pl-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-sans focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition-all"
              />
              <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-bold cursor-pointer"
              >
                {showPassword ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-slate-600 text-xs py-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span>تذكر بيانات الدخول على هذا الجهاز</span>
            </label>
            <span className="text-rose-600 hover:underline cursor-pointer font-bold">استعادة كلمة المرور؟</span>
          </div>

          {/* Login Submit Button */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <span className="animate-pulse">جاري التحقق وتسجيل الدخول...</span>
              ) : (
                <>
                  <span>تسجيل الدخول للمنصة</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>

            {/* Quick Demo Preview Button */}
            <button
              type="button"
              onClick={() => {
                setUsername('2901414');
                setPassword('2901414');
                setLoading(true);
                setTimeout(() => {
                  setLoading(false);
                  const dealer: DealerUser = {
                    ...INITIAL_DEALER,
                    username: 'Smart Net',
                    name: 'Smart Net',
                    dealerId: 'Smart Net',
                  };
                  if (rememberMe) {
                    localStorage.setItem('smartnet_session', JSON.stringify(dealer));
                  }
                  onLoginSuccess(dealer);
                }, 300);
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 border border-slate-200"
            >
              <span>⚡ دخول سريع للمعاينة المباشرة</span>
            </button>
          </div>
        </form>

        {/* Trust Badges */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>اتصال آمن ومشفّر</span>
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
            <span>معتمد لـ Users.xlsx</span>
          </span>
        </div>
      </div>
    </div>
  );
};
