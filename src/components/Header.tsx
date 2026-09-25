import React, { useState } from 'react';
import { LogOut, Menu, X, Globe, User, Shield, HelpCircle, Layers, Key } from 'lucide-react';
import { DealerUser } from '../types';

interface HeaderProps {
  dealer: DealerUser | null;
  onLogout: () => void;
  lang: 'AR' | 'EN';
  onToggleLang: () => void;
  onNavigateTab?: (tab: 'recovery' | 'matcher') => void;
}

export const Header: React.FC<HeaderProps> = ({ dealer, onLogout, lang, onToggleLang, onNavigateTab }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Right side (RTL): Logout or Dealer Info */}
        <div className="flex items-center gap-2">
          {dealer ? (
            <button
              onClick={onLogout}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs"
              title="تسجيل الخروج من الحساب"
            >
              <LogOut className="w-5 h-5 text-rose-500" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <User className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Center / Brand Logo: Smart Net */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-rose-600 font-sans uppercase">
            Smart Net
          </span>
          <button
            onClick={onToggleLang}
            className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-xs shadow-2xs hover:bg-rose-700 transition-colors"
          >
            {lang}
          </button>
        </div>

        {/* Left side: Menu Hamburger */}
        <div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 space-y-2 text-sm font-semibold animate-in slide-in-from-top-2 duration-150">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              <div className="font-bold text-slate-900">{dealer?.name || 'Smart Net'}</div>
              <div className="text-[11px] text-slate-500">{dealer?.dealerId || 'Smart Net'}</div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              حساب مفعّل
            </span>
          </div>

          <button
            onClick={() => {
              setMenuOpen(false);
              onNavigateTab?.('recovery');
            }}
            className="w-full text-right py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-rose-600" />
            <span>1. استعادة كروت المبادرة</span>
          </button>

          <button
            onClick={() => {
              setMenuOpen(false);
              onNavigateTab?.('matcher');
            }}
            className="w-full text-right py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2"
          >
            <Key className="w-4 h-4 text-emerald-600" />
            <span>2. دمج ومطابقة كلمات المرور</span>
          </button>

          <button
            onClick={() => setMenuOpen(false)}
            className="w-full text-right py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>رصيد الكروت: غير محدود (∞)</span>
          </button>

          <button
            onClick={() => setMenuOpen(false)}
            className="w-full text-right py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>تعليمات الحصول على ملف Users.xlsx</span>
          </button>

          {dealer && (
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="w-full text-right py-2 px-3 rounded-lg hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
