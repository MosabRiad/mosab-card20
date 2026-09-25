import React, { useState } from 'react';
import { X, Search, CheckCircle2, AlertCircle, Key, FileText } from 'lucide-react';
import { CardBatchGroup } from '../types';

interface ViewCardsModalProps {
  group: CardBatchGroup | null;
  onClose: () => void;
}

export const ViewCardsModal: React.FC<ViewCardsModalProps> = ({ group, onClose }) => {
  const [search, setSearch] = useState('');

  if (!group) return null;

  const filteredCards = group.cards.filter(
    (c) =>
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.profileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base font-sans text-white">
              بطاقات {group.profileName}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              المجموع الكلي: {group.cardCount} كرت | تاريخ الدفعة: {group.createdDate} {group.createdTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الكرت / اسم المستخدم..."
              className="w-full pl-4 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Cards Table */}
        <div className="overflow-y-auto flex-1 p-4">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">إسم المستخدم / PIN</th>
                <th className="p-2.5">اسم الحزمة</th>
                <th className="p-2.5">تاريخ إنشاء المستخدم</th>
                <th className="p-2.5">تاريخ أول اتصال</th>
                <th className="p-2.5">تاريخ الفصل</th>
                <th className="p-2.5">حالة الكرت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {filteredCards.map((card, idx) => {
                const hasFirstConn = Boolean(
                  card.firstConnectAt &&
                  String(card.firstConnectAt).trim() !== '' &&
                  String(card.firstConnectAt).toLowerCase() !== 'null'
                );
                const hasDisconn = Boolean(
                  card.disconnectAt &&
                  String(card.disconnectAt).trim() !== '' &&
                  String(card.disconnectAt).toLowerCase() !== 'null'
                );

                const isUnused = !hasFirstConn && !hasDisconn;

                return (
                  <tr key={idx} className={`transition-colors ${isUnused ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50/80'}`}>
                    <td className="p-2.5 font-bold text-slate-900">{card.username}</td>
                    <td className="p-2.5 font-sans font-semibold text-slate-700">{card.profileName}</td>
                    <td className="p-2.5 text-slate-500">{card.createdAt}</td>
                    <td className="p-2.5 text-slate-600">{card.firstConnectAt || '—'}</td>
                    <td className="p-2.5 text-slate-600">{card.disconnectAt || '—'}</td>
                    <td className="p-2.5">
                      {isUnused ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-sans border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>غير مستخدم (مستعاد)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 font-sans border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>مستبعد (اشتغل)</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredCards.length === 0 && (
            <div className="py-8 text-center text-slate-400 font-sans text-xs">
              لا توجد بطاقات مطابقة للبحث
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-left">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
