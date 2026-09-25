import React, { useState, useMemo } from 'react';
import { Calendar, Eye, CheckSquare, Square, Filter, RefreshCcw, Layers, Zap } from 'lucide-react';
import { CardBatchGroup } from '../types';

interface Step2SelectGroupsProps {
  groups: CardBatchGroup[];
  onToggleGroup: (groupId: string) => void;
  onSelectAll: (select: boolean) => void;
  onViewGroupCards: (group: CardBatchGroup) => void;
  onStartExtraction: () => void;
  selectedCount: number;
  totalSelectedCards: number;
}

export const Step2SelectGroups: React.FC<Step2SelectGroupsProps> = ({
  groups,
  onToggleGroup,
  onSelectAll,
  onViewGroupCards,
  onStartExtraction,
  selectedCount,
  totalSelectedCards,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [olderThanDate, setOlderThanDate] = useState<string>(todayStr);
  const [appliedDateFilter, setAppliedDateFilter] = useState<string>(todayStr);
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'COUNT'>('NEWEST');
  const [selectedProfileFilter, setSelectedProfileFilter] = useState<string>('ALL');

  // Extract unique profiles for pills
  const uniqueProfiles = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => set.add(g.profileName));
    return Array.from(set);
  }, [groups]);

  // Filter & Sort Groups
  const filteredGroups = useMemo(() => {
    let list = [...groups];

    // Filter by profile
    if (selectedProfileFilter !== 'ALL') {
      list = list.filter((g) => g.profileName === selectedProfileFilter);
    }

    // Filter by date if applied
    if (appliedDateFilter) {
      list = list.filter((g) => new Date(g.createdDate) <= new Date(appliedDateFilter));
    }

    // Sort
    list.sort((a, b) => {
      const dateTimeA = new Date(`${a.createdDate} ${a.createdTime}`).getTime();
      const dateTimeB = new Date(`${b.createdDate} ${b.createdTime}`).getTime();
      
      if (sortOrder === 'NEWEST') {
        return dateTimeB - dateTimeA;
      } else if (sortOrder === 'OLDEST') {
        return dateTimeA - dateTimeB;
      } else {
        return b.cardCount - a.cardCount;
      }
    });

    return list;
  }, [groups, selectedProfileFilter, appliedDateFilter, sortOrder]);

  const allFilteredSelected =
    filteredGroups.length > 0 && filteredGroups.every((g) => g.selected);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-xl font-black text-slate-900 font-sans">
            اختيار المجموعات
          </h2>
          <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            2
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          اختر المجموعات التي تريد استخراجها من البطاقات غير المستخدمة
        </p>
      </div>

      {/* Date Filter & Sort Controls (Matching Image 1 IMG_4770.png) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
        {/* Date Filter Box */}
        <div className="space-y-2">
          <label className="block text-slate-700 text-xs font-bold flex items-center justify-center gap-1">
            <Calendar className="w-4 h-4 text-rose-600" />
            <span>أقدم من:</span>
          </label>

          <input
            type="date"
            value={olderThanDate}
            onChange={(e) => setOlderThanDate(e.target.value)}
            className="w-full text-center px-4 py-2.5 bg-white border border-rose-300 rounded-xl font-mono font-bold text-sm text-slate-900 shadow-2xs focus:outline-none focus:border-rose-500"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setAppliedDateFilter(olderThanDate)}
              className="flex-1 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-xl font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              تطبيق
            </button>
            <button
              onClick={() => {
                setOlderThanDate('');
                setAppliedDateFilter('');
              }}
              className="flex-1 py-2 bg-white hover:bg-slate-100 text-rose-600 border border-rose-300 rounded-xl font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              مسح
            </button>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="space-y-1">
          <label className="block text-center text-slate-600 text-xs font-bold">
            ترتيب حسب:
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full text-center py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 shadow-2xs"
          >
            <option value="NEWEST">الأحدث أولاً</option>
            <option value="OLDEST">الأقدم أولاً</option>
            <option value="COUNT">حسب عدد الكروت</option>
          </select>
        </div>

        {/* Package Profile Filter Pills */}
        {uniqueProfiles.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <button
                onClick={() => setSelectedProfileFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                  selectedProfileFilter === 'ALL'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                جميع الباقات
              </button>
              {uniqueProfiles.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProfileFilter(p)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                    selectedProfileFilter === p
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Selection Actions (Matching Image 2 IMG_4771.png) */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span>تحديد الكل ({filteredGroups.length} مجموعة)</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onSelectAll(true)}
              className="flex-1 sm:flex-none px-6 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-xl font-bold transition-colors shadow-2xs cursor-pointer"
            >
              تحديد
            </button>
            <button
              onClick={() => onSelectAll(false)}
              className="flex-1 sm:flex-none px-6 py-2 bg-white hover:bg-slate-100 text-rose-600 border border-rose-300 rounded-xl font-bold transition-colors shadow-2xs cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>

      {/* Card Group Items List (Matching Image 2 IMG_4771.png) */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            لا توجد مجموعات مطابقة للفلتر المحدد
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`bg-white border rounded-2xl p-4 shadow-2xs transition-all space-y-3 relative ${
                group.selected
                  ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Badge & Title Row */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs font-mono">
                  {group.cardCount} كرت
                </span>

                <h3 className="font-bold text-slate-900 text-sm font-sans">
                  {group.profileName}
                </h3>
              </div>

              {/* Time & Date */}
              <div className="flex items-center justify-end gap-3 text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <span>{group.createdTime}</span>
                  <span className="text-slate-400">🕒</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>{group.createdDate}</span>
                  <span className="text-slate-400">📅</span>
                </span>
              </div>

              {/* Action Buttons: View Cards & Select Checkbox */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onViewGroupCards(group)}
                  className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>عرض البطاقات</span>
                </button>

                <label className="flex items-center gap-2 font-bold text-slate-700 text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none hover:bg-slate-100 shrink-0">
                  <span>تحديد</span>
                  <input
                    type="checkbox"
                    checked={group.selected}
                    onChange={() => onToggleGroup(group.id)}
                    className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                </label>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Prominent Action Button to Trigger Extraction */}
      <div className="pt-4 border-t border-slate-200 sticky bottom-4 z-20">
        <button
          onClick={onStartExtraction}
          disabled={selectedCount === 0}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
            selectedCount > 0
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-4 ring-rose-500/20'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Zap className="w-5 h-5 fill-white" />
          <span>
            {selectedCount > 0
              ? `بدء استخراج الكروت غير المستخدمة (${totalSelectedCards.toLocaleString('ar-EG')} كرت)`
              : 'اختر مجموعة واحدة على الأقل للاستخراج'}
          </span>
        </button>
      </div>
    </div>
  );
};
