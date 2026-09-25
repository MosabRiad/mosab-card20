import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, HelpCircle, FileText, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { CardBatchGroup, UserExcelRow } from '../types';

interface Step1UploadProps {
  onFileUploaded: (groups: CardBatchGroup[], filename: string) => void;
  currentFilename: string | null;
}

export const Step1Upload: React.FC<Step1UploadProps> = ({ onFileUploaded, currentFilename }) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);

  const processExcelBuffer = (buffer: ArrayBuffer, filename: string) => {
    try {
      setParsing(true);
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonRows || jsonRows.length === 0) {
        alert('الملف فارغ أو غير صحيح، يرجى التأكد من البيانات.');
        setParsing(false);
        return;
      }

      // Group rows by profile / package and createdDate
      const groupsMap: Record<string, CardBatchGroup> = {};

      jsonRows.forEach((row, idx) => {
        // Helper to format any date value (String, Date, or Null)
        const formatValue = (val: any): { date: string, time: string, full: string, isoDate: string } => {
          const fallback = { date: '', time: '', full: '', isoDate: '' };
          if (!val || val === '0' || String(val).toLowerCase() === 'null' || String(val).trim() === '') {
            return fallback;
          }
          
          if (val instanceof Date) {
            const d = val;
            const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            const seconds = String(d.getSeconds()).padStart(2, '0');
            return { date, time, full: `${date} ${time}:${seconds}`, isoDate };
          }

          const s = String(val).trim();
          
          // Try to detect DD/MM/YYYY vs YYYY-MM-DD
          let isoDate = '';
          let displayDate = '';
          let displayTime = '';
          let fullString = s;

          if (s.includes('/')) {
            const parts = s.split(' ')[0].split('/');
            if (parts.length === 3) {
              if (parts[2].length === 4) { // DD/MM/YYYY
                isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                displayDate = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
              } else if (parts[0].length === 4) { // YYYY/MM/DD
                isoDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                displayDate = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
              }
            }
          } else if (s.includes('-')) {
            const parts = s.split(' ')[0].split('-');
            if (parts.length === 3 && parts[0].length === 4) { // YYYY-MM-DD
              isoDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              displayDate = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
            }
          }

          // Handle time if present
          if (s.includes(' ')) {
            displayTime = s.split(' ')[1].substring(0, 5);
          } else if (s.includes('T')) {
            const d = new Date(s);
            if (!isNaN(d.getTime())) {
              isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              displayDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              displayTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
              const seconds = String(d.getSeconds()).padStart(2, '0');
              fullString = `${displayDate} ${displayTime}:${seconds}`;
            }
          }

          if (isoDate) {
            return { 
              date: displayDate, 
              time: displayTime, 
              full: fullString, 
              isoDate 
            };
          }

          return { date: s, time: '', full: s, isoDate: s };
        };

        const createdDateVal =
          row['تاريخ إنشاء المستخدم'] ||
          row['تاريخ انشاء المستخدم'] ||
          row['تاريخ الإنشاء'] ||
          row['Created'] ||
          row['التاريخ'];

        const parsedCreated = formatValue(createdDateVal);
        const dateOnly = parsedCreated.isoDate || '2026-04-15';
        const displayDate = parsedCreated.date || '15/04/2026';
        const timeOnly = parsedCreated.time || '00:00';
        const createdDateStr = parsedCreated.full || `${displayDate} ${timeOnly}`;

        const username =
          row['إسم المستخدم'] ||
          row['اسم المستخدم'] ||
          row['Username'] ||
          row['username'] ||
          row['الاسم'] ||
          `user_${idx + 1}`;

        const saleStatus = row['حالة البيع'] || row['SaleStatus'] || 'تم بيعه';

        const profile =
          row['اسم الحزمة'] ||
          row['اسم حزمة'] ||
          row['الباقة'] ||
          row['Profile'] ||
          row['profile'] ||
          'اشتراك يومى 8 ساعات 2 مي';

        const packageTime = row['وقت الحزمة'] || row['وقت حزمة'] || row['PackageTime'] || '08:00';

        const firstConn =
          row['تاريخ أول اتصال'] ||
          row['تاريخ اول اتصال'] ||
          row['FirstConnect'] ||
          row['تاريخ الاتصال'] ||
          null;

        const disconnectDate =
          row['تاريخ الفصل'] ||
          row['تاريخ فصل'] ||
          row['DisconnectDate'] ||
          row['تاريخ الانقطاع'] ||
          null;

        const status = row['الحالة'] || row['Status'] || 'Active';
        const password = row['كلمة المرور'] || row['Password'] || row['password'] || '';

        // Group by profile and date only - merging all timestamps (seconds/minutes) on the same date into a single group
        const groupKey = `${profile}_${dateOnly}`;

        const parsedFirstConn = formatValue(firstConn);
        const parsedDisconnect = formatValue(disconnectDate);

        const cleanFirstConn = parsedFirstConn.full !== '' ? parsedFirstConn.full : null;
        const cleanDisconnect = parsedDisconnect.full !== '' ? parsedDisconnect.full : null;

        const cardItem: UserExcelRow = {
          username: String(username),
          password: String(password),
          profileName: String(profile),
          packageTime: String(packageTime),
          saleStatus: String(saleStatus),
          createdAt: String(createdDateStr),
          firstConnectAt: cleanFirstConn,
          disconnectAt: cleanDisconnect,
          status: String(status),
        };

        if (!groupsMap[groupKey]) {
          groupsMap[groupKey] = {
            id: `g_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            profileName: String(profile),
            cardCount: 0,
            createdDate: dateOnly,
            createdTime: timeOnly || '00:00',
            selected: false,
            cards: [],
          };
        } else if (!groupsMap[groupKey].createdTime && timeOnly) {
          groupsMap[groupKey].createdTime = timeOnly;
        }

        groupsMap[groupKey].cards.push(cardItem);
        groupsMap[groupKey].cardCount += 1;
      });

      const parsedGroups = Object.values(groupsMap);
      if (parsedGroups.length > 0) {
        onFileUploaded(parsedGroups, filename);
      } else {
        alert('لم نتمكن من قراءة أي بيانات من الملف. يرجى التأكد من الصيغة.');
      }
    } catch (err) {
      console.error('Error parsing Excel:', err);
      alert('حدث خطأ أثناء قراءة الملف. يرجى المحاولة مرة أخرى.');
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          processExcelBuffer(evt.target.result as ArrayBuffer, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          processExcelBuffer(evt.target.result as ArrayBuffer, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleClear = () => {
    onFileUploaded([], '');
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Step Title Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-xl font-black text-slate-900 font-sans">
            رفع ملف المستخدمين الرئيسي
          </h2>
          <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            1
          </span>
          <span className="text-2xl">📥</span>
        </div>
        <p className="text-xs text-slate-500 font-medium max-w-lg mx-auto">
          ارفع ملف <span className="font-mono font-bold text-slate-700">Users.xlsx</span> الرئيسي (يتم استبعاد أي كرت يحتوي على تاريخ أول اتصال أو تاريخ فصل)
        </p>
      </div>

      {/* Yellow How-To Info Box (Matching Screenshot IMG_4772.png) */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-amber-900 text-xs font-medium space-y-3 shadow-2xs">
        <div className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>كيف تحصل على هذا الملف؟</span>
        </div>

        <ol className="space-y-2 pr-1 text-slate-800 list-decimal list-inside font-semibold">
          <li>اذهب لصفحة الديلر الخاصة بالمبادرة وقيم بتسجيل الدخول</li>
          <li>
            في الاختيار الخاص بالحالة، قم باختيار <span className="font-bold text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded">فعّال</span>
          </li>
          <li>اضغط على زر <span className="font-bold text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded">ابحث</span></li>
          <li>
            بعد الانتهاء من البحث، قم بتنزيل ملف الإكسل من خلال الضغط على أيقونة الإكسل الخضراء فوق جدول المستخدمين
          </li>
          <li>
            قم برفع هذا الملف والذي سيكون باسم <span className="font-mono font-bold text-amber-950 underline">Users.xlsx</span> هنا في الأسفل
          </li>
        </ol>
      </div>

      {/* File Upload Dropzone (Matching Screenshot) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${
          dragActive
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : currentFilename
            ? 'border-emerald-300 bg-emerald-50/30'
            : 'border-slate-300 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-400'
        }`}
      >
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />

        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
          <FileSpreadsheet className="w-9 h-9 text-emerald-600" />
        </div>

        {parsing ? (
          <div className="space-y-1">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            <p className="font-bold text-slate-800 text-sm">جاري قراءة الملف وتجميع الفئات...</p>
          </div>
        ) : currentFilename ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>تم تحميل الملف بنجاح: {currentFilename}</span>
            </div>
            <p className="text-xs text-slate-500">تم التعرف على البيانات، الخيارات متاحة الآن في الأسفل.</p>
            <button
              onClick={handleClear}
              className="mt-2 text-rose-600 hover:text-rose-700 text-xs font-bold underline"
            >
              حذف الملف والبدء من جديد
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-base font-bold text-blue-600">
              اسحب الملف هنا أو اضغط للاختيار
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              ملفات Excel فقط (.xlsx, .xls)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
