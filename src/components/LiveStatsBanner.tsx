import React from 'react';
import { Sparkles, Infinity as InfinityIcon, ShieldCheck, Zap, HeartHandshake } from 'lucide-react';

interface LiveStatsBannerProps {
  remainingQuota?: number;
  dealerName?: string;
}

export const LiveStatsBanner: React.FC<LiveStatsBannerProps> = ({
  dealerName = 'Smart Net',
}) => {
  return (
    <div className="space-y-3">
      {/* Welcoming Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-rose-500 to-rose-700 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-rose-400/30">
        {/* Subtle background decoration */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Greeting Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xl">👋</span>
                <h2 className="text-lg sm:text-xl font-black font-sans tracking-tight">
                  أهلاً وسهلاً بك في منصة Smart Net
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-rose-100 font-medium">
                نسعد بخدمتكم! نظامك جاهز بالكامل لاستخراج وفرز الكروت بكل سهولة وأمان.
              </p>
            </div>

            {/* Unlimited Cards Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/25 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 text-white text-xs sm:text-sm font-bold shadow-xs shrink-0 transition-transform">
              <InfinityIcon className="w-5 h-5 text-amber-300 stroke-[2.5]" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] text-rose-200">حالة الرصيد</span>
                <span className="font-extrabold text-white">بطاقات غير محدودة (∞)</span>
              </div>
            </div>
          </div>

          {/* Quick Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            <div className="bg-black/15 backdrop-blur-xs rounded-xl p-2.5 flex items-center gap-2 border border-white/10">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="font-medium text-rose-50">استخراج كافة الكروت غير المستخدمة</span>
            </div>
            <div className="bg-black/15 backdrop-blur-xs rounded-xl p-2.5 flex items-center gap-2 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-medium text-rose-50">استبعاد تلقائي للمتصل والمفصول</span>
            </div>
            <div className="bg-black/15 backdrop-blur-xs rounded-xl p-2.5 flex items-center gap-2 border border-white/10">
              <Zap className="w-4 h-4 text-yellow-300 shrink-0" />
              <span className="font-medium text-rose-50">تصدير مباشر بصيغ Excel و TXT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
