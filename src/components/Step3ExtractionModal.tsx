import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Download, FileSpreadsheet, FileText, Printer, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import { CardBatchGroup, UserExcelRow } from '../types';

interface Step3ExtractionModalProps {
  selectedGroups: CardBatchGroup[];
  onClose: () => void;
  onDeductQuota: (extractedCount: number) => void;
  onExtractedSuccess?: (cards: UserExcelRow[]) => void;
  onGoToPasswordMatcher?: (cards: UserExcelRow[]) => void;
}

export const Step3ExtractionModal: React.FC<Step3ExtractionModalProps> = ({
  selectedGroups,
  onClose,
  onDeductQuota,
  onExtractedSuccess,
  onGoToPasswordMatcher,
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('جاري الاتصال بـ ديلر المبادرة وتدقيق السجلات...');
  const [isDone, setIsDone] = useState(false);
  const [extractedCards, setExtractedCards] = useState<UserExcelRow[]>([]);

  useEffect(() => {
    // Collect all genuine unused cards from selected groups (No FirstConnect AND No Disconnect)
    const unusedList: UserExcelRow[] = [];
    selectedGroups.forEach((group) => {
      group.cards.forEach((card) => {
        const hasFirstConn = Boolean(
          card.firstConnectAt &&
          String(card.firstConnectAt).trim() !== '' &&
          String(card.firstConnectAt).trim() !== '0' &&
          String(card.firstConnectAt).toLowerCase() !== 'null'
        );
        const hasDisconn = Boolean(
          card.disconnectAt &&
          String(card.disconnectAt).trim() !== '' &&
          String(card.disconnectAt).trim() !== '0' &&
          String(card.disconnectAt).toLowerCase() !== 'null'
        );

        // Exclude cards if they ever connected OR disconnected!
        if (!hasFirstConn && !hasDisconn) {
          unusedList.push(card);
        }
      });
    });

    setExtractedCards(unusedList);

    // Extraction progress animation
    const steps = [
      { p: 20, t: 'جاري فحص حقول "تاريخ أول اتصال" و "تاريخ الفصل"...' },
      { p: 50, t: 'استبعاد الكروت التي تم الاتصال بها أو تسجيل تاريخ فصل لها...' },
      { p: 80, t: 'تجميع الكروت غير المستعملة نهائياً وتنسيق البيانات...' },
      { p: 100, t: 'تم استخراج وتجهيز الكروت القديمة غير النظيفة بنجاح! 🎉' },
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setProgress(steps[currentStepIndex].p);
        setStatusText(steps[currentStepIndex].t);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        setIsDone(true);
        onDeductQuota(unusedList.length);
        if (onExtractedSuccess) {
          onExtractedSuccess(unusedList);
        }

        // Confetti celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  // Download Excel .xlsx file
  const handleDownloadExcel = () => {
    const excelData = extractedCards.map((c, idx) => ({
      '#': idx + 1,
      'تاريخ إنشاء المستخدم': c.createdAt,
      'إسم المستخدم': c.username,
      'حالة البيع': c.saleStatus || 'تم بيعه',
      'اسم الحزمة': c.profileName,
      'وقت الحزمة': c.packageTime || '08:00',
      'تاريخ أول اتصال': '',
      'تاريخ الفصل': '',
      'الحالة': c.status || 'Active',
      'حالة الكرت': 'غير مستخدم - مستعاد',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الكروت المستعادة');

    XLSX.writeFile(workbook, `Smart_Net_Extracted_Cards_${Date.now()}.xlsx`);
  };

  // Download TXT file
  const handleDownloadTxt = () => {
    let content = `=== منصة Smart Net - الكروت القديمة المستعادة ===\n`;
    content += `تاريخ الاستخراج: ${new Date().toLocaleString('ar-EG')}\n`;
    content += `عدد الكروت: ${extractedCards.length}\n\n`;

    extractedCards.forEach((c, idx) => {
      content += `${idx + 1}. PIN: ${c.username} | Password: ${c.password || '123456'} | ${c.profileName}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Smart_Net_Cards_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base font-sans text-white">
              عملية استخراج الكروت القديمة
            </h3>
          </div>
          {isDone && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-rose-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Progress State */}
          {!isDone ? (
            <div className="py-8 text-center space-y-5">
              <RefreshCw className="w-12 h-12 text-rose-600 animate-spin mx-auto" />
              <div className="space-y-2">
                <div className="text-2xl font-black text-rose-600 font-mono">
                  {progress}%
                </div>
                <div className="text-xs font-bold text-slate-700 max-w-md mx-auto">
                  {statusText}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div
                  className="bg-rose-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            /* Completed Extracted State */
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-black text-emerald-900 font-sans">
                  تمت عملية الاستخراج بنجاح!
                </h4>
                <p className="text-xs text-emerald-800 font-bold">
                  تم العثور على <span className="font-mono text-emerald-950 font-black text-base">{extractedCards.length.toLocaleString('ar-EG')}</span> كرت قديم غير مستخدم وقابل للإعادة البيع.
                </p>
              </div>

              {/* Extracted List Preview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>معاينة الكروت المستخرجة ({extractedCards.length}):</span>
                  <span className="text-slate-400 font-mono text-[11px]">جاهز للتحميل</span>
                </div>

                <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-2 space-y-1 text-xs font-mono">
                  {extractedCards.slice(0, 50).map((card, i) => (
                    <div
                      key={i}
                      className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-900">{card.username}</span>
                      <span className="text-[11px] text-slate-500 font-sans">{card.profileName}</span>
                    </div>
                  ))}
                  {extractedCards.length > 50 && (
                    <div className="p-2 text-center text-slate-400 font-sans text-[11px]">
                      + {extractedCards.length - 50} كرت آخر متوفر في الملف المحمل
                    </div>
                  )}
                </div>
              </div>

              {/* Download Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleDownloadExcel}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  <span>تنزيل ملف Excel (.xlsx)</span>
                </button>

                <button
                  onClick={handleDownloadTxt}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <FileText className="w-4 h-4 text-slate-300" />
                  <span>تنزيل ملف نصي (.txt)</span>
                </button>
              </div>

              {/* Direct Next Step to Match Passwords */}
              {onGoToPasswordMatcher && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onGoToPasswordMatcher(extractedCards);
                      onClose();
                    }}
                    className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-200 hover:border-rose-400 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <span>🔑 الانتقال لإكمال الكروت ودمج كلمات المرور الآن ←</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {isDone && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              تم وإغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
