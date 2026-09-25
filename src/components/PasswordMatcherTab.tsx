import React, { useState, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Key,
  FileText,
  Printer,
  Search,
  Sparkles,
  ArrowRightLeft,
  Eye,
  Check,
  Copy,
  Layers,
  HelpCircle,
  X,
  FileCheck,
  History,
  Clock,
  Trash2,
  Filter,
  Tag,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { UserExcelRow, OperationLogEntry } from '../types';

interface PasswordMatcherTabProps {
  initialExtractedCards?: UserExcelRow[];
}

interface MatchedCardResult {
  index: number;
  username: string;
  password: string;
  profileName: string;
  packageTime?: string;
  createdAt?: string;
  status: 'matched' | 'unmatched';
  originalRow1?: any;
  originalRow2?: any;
}

export const PasswordMatcherTab: React.FC<PasswordMatcherTabProps> = ({
  initialExtractedCards = [],
}) => {
  // File 1 State (Extracted file from site)
  const [file1Name, setFile1Name] = useState<string | null>(
    initialExtractedCards.length > 0 ? 'كروت مستخرجة من التبويب السابق' : null
  );
  const [file1Rows, setFile1Rows] = useState<any[]>(
    initialExtractedCards.length > 0
      ? initialExtractedCards.map((c, i) => ({
          '#': i + 1,
          'اسم المستخدم': c.username,
          'اسم الحزمة': c.profileName,
          'وقت الحزمة': c.packageTime || '',
          'تاريخ الإنشاء': c.createdAt || '',
        }))
      : []
  );
  const [file1Headers, setFile1Headers] = useState<string[]>(
    initialExtractedCards.length > 0 ? ['اسم المستخدم', 'اسم الحزمة', 'وقت الحزمة', 'تاريخ الإنشاء'] : []
  );
  const [file1UsernameCol, setFile1UsernameCol] = useState<string>('اسم المستخدم');

  // File 2 State (Source database / cards file with passwords)
  const [file2Name, setFile2Name] = useState<string | null>(null);
  const [file2Rows, setFile2Rows] = useState<any[]>([]);
  const [file2Headers, setFile2Headers] = useState<string[]>([]);
  const [file2UsernameCol, setFile2UsernameCol] = useState<string>('');
  const [file2PasswordCol, setFile2PasswordCol] = useState<string>('');
  const [file2ProfileCol, setFile2ProfileCol] = useState<string>('');

  // Operations Log State (persisted in localStorage)
  const [operationLogs, setOperationLogs] = useState<OperationLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('smart_net_operation_logs');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'seed-1',
        type: 'match',
        title: 'نظام المطابقة جاهز للعمل',
        description: 'تم تجهيز نظام مطابقة الكروت وسحب كلمات المرور بنجاح',
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsSearchQuery, setLogsSearchQuery] = useState('');
  const [logsFilterType, setLogsFilterType] = useState<string>('all');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [exactMatch, setExactMatch] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'voucher_preview'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<
    'voucher_repeating' | 'standard_columns' | 'arabic_columns' | 'detailed'
  >('voucher_repeating');
  const [defaultFallbackPassword, setDefaultFallbackPassword] = useState('123456');
  const [useFallbackForUnmatched, setUseFallbackForUnmatched] = useState(false);

  // Recent searches (persisted in localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('smart_net_recent_searches');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Helper to add to operations log
  const addOperationLog = (
    entry: Omit<OperationLogEntry, 'id' | 'timestamp'> & { timestamp?: string }
  ) => {
    const newLog: OperationLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      type: entry.type,
      title: entry.title,
      description: entry.description,
      details: entry.details,
    };
    setOperationLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 50);
      try {
        localStorage.setItem('smart_net_operation_logs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Helper to clear operation logs
  const clearOperationLogs = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح جميع سجلات العمليات والبحث؟')) {
      setOperationLogs([]);
      try {
        localStorage.removeItem('smart_net_operation_logs');
      } catch (e) {}
    }
  };

  // Helper to save recent search query
  const handleSaveRecentSearch = (term: string) => {
    const q = term.trim();
    if (!q) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== q.toLowerCase());
      const updated = [q, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('smart_net_recent_searches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Helper to trigger and log search
  const handleTriggerSearch = (q: string) => {
    if (q.trim()) {
      handleSaveRecentSearch(q);
      addOperationLog({
        type: 'search',
        title: 'بحث عن اسم مستخدم',
        description: `تم البحث عن اسم المستخدم: "${q.trim()}"`,
        details: { searchQuery: q.trim() },
      });
    }
  };

  // Helper to highlight matching text in usernames
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const q = query.trim();
    const index = text.toLowerCase().indexOf(q.toLowerCase());
    if (index === -1) return text;
    const before = text.substring(0, index);
    const match = text.substring(index, index + q.length);
    const after = text.substring(index + q.length);
    return (
      <>
        {before}
        <mark className="bg-amber-300 text-amber-950 font-black px-1 py-0.5 rounded shadow-2xs">
          {match}
        </mark>
        {after}
      </>
    );
  };

  // Helper to normalize values for matching
  const normalizeKey = (val: any): string => {
    if (val === undefined || val === null) return '';
    let str = String(val).trim();
    // If it's a number ending with .0 e.g. 12345.0, strip it
    if (str.endsWith('.0') && !isNaN(Number(str))) {
      str = str.slice(0, -2);
    }
    return str.toLowerCase();
  };

  // Helper to find best matching header
  const findBestHeader = (headers: string[], candidates: string[]): string => {
    for (const cand of candidates) {
      const found = headers.find((h) => {
        const clean = h.trim().toLowerCase();
        return clean === cand.toLowerCase() || clean.includes(cand.toLowerCase());
      });
      if (found) return found;
    }
    return headers[0] || '';
  };

  // Handle upload of File 1 (Extracted Cards)
  const handleFile1Upload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!json || json.length === 0) {
          alert('الملف فارغ أو غير متوافق!');
          return;
        }

        const headers = Object.keys(json[0] || {});
        setFile1Rows(json);
        setFile1Headers(headers);
        setFile1Name(file.name);

        const detectedUsername = findBestHeader(headers, [
          'إسم المستخدم',
          'اسم المستخدم',
          'المستخدم',
          'username',
          'user',
          'pin',
          'id',
          'login',
          'كود',
        ]);
        setFile1UsernameCol(detectedUsername);

        addOperationLog({
          type: 'file_upload',
          title: 'رفع ملف الكروت المستخرجة',
          description: `تم رفع ملف: "${file.name}" واستيراد ${json.length} كرت بنجاح`,
          details: { fileName: file.name, totalCards: json.length },
        });
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف، يرجى التأكد من صيغة Excel أو CSV');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle upload of File 2 (Source file with Passwords)
  const handleFile2Upload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!json || json.length === 0) {
          alert('الملف فارغ أو غير متوافق!');
          return;
        }

        const headers = Object.keys(json[0] || {});
        setFile2Rows(json);
        setFile2Headers(headers);
        setFile2Name(file.name);

        // Auto detect columns
        const detectedUser = findBestHeader(headers, [
          'إسم المستخدم',
          'اسم المستخدم',
          'المستخدم',
          'username',
          'user',
          'pin',
          'id',
          'اسم الدخول',
          'كود',
        ]);
        const detectedPass = findBestHeader(headers, [
          'كلمة المرور',
          'كلمة السر',
          'السر',
          'رمز المرور',
          'password',
          'pass',
          'pin2',
          'secret',
          'كود السر',
        ]);
        const detectedProfile = findBestHeader(headers, [
          'اسم الحزمة',
          'الحزمة',
          'الباقة',
          'profile',
          'package',
          'فئة الكرت',
        ]);

        setFile2UsernameCol(detectedUser);
        setFile2PasswordCol(detectedPass);
        setFile2ProfileCol(detectedProfile);

        addOperationLog({
          type: 'file_upload',
          title: 'رفع ملف كلمات المرور الثاني',
          description: `تم استيراد ${json.length} سجل من ملف كلمات المرور: "${file.name}"`,
          details: { fileName: file.name, totalCards: json.length },
        });
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف، يرجى التأكد من صيغة Excel أو CSV');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Build password lookup map from File 2
  const file2Map = useMemo(() => {
    const map = new Map<string, any>();
    if (!file2UsernameCol || file2Rows.length === 0) return map;

    file2Rows.forEach((row) => {
      const uKey = normalizeKey(row[file2UsernameCol]);
      if (uKey && !map.has(uKey)) {
        map.set(uKey, row);
      }
    });
    return map;
  }, [file2Rows, file2UsernameCol]);

  // Execute matching
  const matchedResults = useMemo<MatchedCardResult[]>(() => {
    if (file1Rows.length === 0 || !file1UsernameCol) return [];

    return file1Rows.map((row1, idx) => {
      const rawUser = row1[file1UsernameCol];
      const normUser = normalizeKey(rawUser);
      const row2 = normUser ? file2Map.get(normUser) : undefined;

      const rawPass = row2 && file2PasswordCol ? row2[file2PasswordCol] : '';
      const hasPass = Boolean(rawPass !== undefined && rawPass !== null && String(rawPass).trim() !== '');

      const password = hasPass
        ? String(rawPass).trim()
        : useFallbackForUnmatched
        ? defaultFallbackPassword
        : '';

      const profileName =
        row1['اسم الحزمة'] ||
        row1['الباقة'] ||
        (row2 && file2ProfileCol ? row2[file2ProfileCol] : '') ||
        'كرت إنترنت Smart Net';

      const packageTime =
        row1['وقت الحزمة'] ||
        row1['الوقت'] ||
        (row2 ? row2['وقت الحزمة'] || row2['الوقت'] || row2['الصلاحية'] : '') ||
        '';

      const createdAt =
        row1['تاريخ إنشاء المستخدم'] ||
        row1['تاريخ الإنشاء'] ||
        (row2 ? row2['تاريخ الإنشاء'] || row2['Created'] : '') ||
        '';

      return {
        index: idx + 1,
        username: String(rawUser || '').trim(),
        password,
        profileName: String(profileName),
        packageTime: String(packageTime),
        createdAt: String(createdAt),
        status: hasPass ? 'matched' : 'unmatched',
        originalRow1: row1,
        originalRow2: row2,
      };
    });
  }, [
    file1Rows,
    file1UsernameCol,
    file2Map,
    file2PasswordCol,
    file2ProfileCol,
    useFallbackForUnmatched,
    defaultFallbackPassword,
  ]);

  // Stats calculation
  const totalCards = matchedResults.length;
  const matchedCount = useMemo(
    () => matchedResults.filter((r) => r.status === 'matched').length,
    [matchedResults]
  );
  const unmatchedCount = totalCards - matchedCount;
  const matchRate = totalCards > 0 ? Math.round((matchedCount / totalCards) * 100) : 0;

  // Available Profiles
  const availableProfiles = useMemo(() => {
    const set = new Set<string>();
    matchedResults.forEach((r) => {
      if (r.profileName && r.profileName.trim()) {
        set.add(r.profileName.trim());
      }
    });
    return Array.from(set);
  }, [matchedResults]);

  // Filtered Results with Search by Username, Exact Match, Status, and Package
  const filteredResults = useMemo(() => {
    return matchedResults.filter((item) => {
      // Type filter
      if (filterType === 'matched' && item.status !== 'matched') return false;
      if (filterType === 'unmatched' && item.status !== 'unmatched') return false;

      // Profile filter
      if (selectedProfile && item.profileName !== selectedProfile) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const user = (item.username || '').toLowerCase().trim();
        const pass = (item.password || '').toLowerCase().trim();
        const prof = (item.profileName || '').toLowerCase().trim();

        if (exactMatch) {
          // Exact match on username
          return user === q || user.replace(/\.0$/, '') === q;
        }

        // Partial match
        return user.includes(q) || pass.includes(q) || prof.includes(q);
      }
      return true;
    });
  }, [matchedResults, filterType, selectedProfile, searchQuery, exactMatch]);

  // Filtered Operations Logs
  const filteredLogs = useMemo(() => {
    return operationLogs.filter((log) => {
      if (logsFilterType === 'match' && log.type !== 'match') return false;
      if (logsFilterType === 'file_upload' && log.type !== 'file_upload') return false;
      if (logsFilterType === 'export' && !log.type.startsWith('export')) return false;
      if (logsFilterType === 'search' && log.type !== 'search') return false;

      if (logsSearchQuery.trim()) {
        const q = logsSearchQuery.toLowerCase().trim();
        return (
          log.title.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          (log.details?.fileName && log.details.fileName.toLowerCase().includes(q)) ||
          (log.details?.searchQuery && log.details.searchQuery.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [operationLogs, logsFilterType, logsSearchQuery]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Download Excel (.xlsx) - Exactly matching the user's requested template
  const handleDownloadExcel = () => {
    if (matchedResults.length === 0) return;

    const workbook = XLSX.utils.book_new();
    let worksheet: XLSX.WorkSheet;

    if (exportFormat === 'voucher_repeating') {
      // 1. Exact template from user's screenshot:
      // Alternating header & data rows without index column:
      // Row 1: Username | Password | Package
      // Row 2: <username> | <password> | <profileName>
      // Row 3: Username | Password | Package
      // Row 4: <username> | <password> | <profileName>
      const rows: (string | number)[][] = [];
      matchedResults.forEach((r) => {
        rows.push(['Username', 'Password', 'Package']);
        rows.push([
          String(r.username || '').trim(),
          String(r.password || '').trim(),
          String(r.profileName || '').trim(),
        ]);
      });

      worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 22 }, // Column A: Username
        { wch: 20 }, // Column B: Password
        { wch: 26 }, // Column C: Package
      ];
    } else if (exportFormat === 'standard_columns') {
      // 2. Direct table with single header row: Username | Password | Package
      const rows: (string | number)[][] = [
        ['Username', 'Password', 'Package'],
        ...matchedResults.map((r) => [
          String(r.username || '').trim(),
          String(r.password || '').trim(),
          String(r.profileName || '').trim(),
        ]),
      ];
      worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 22 },
        { wch: 20 },
        { wch: 26 },
      ];
    } else if (exportFormat === 'arabic_columns') {
      // 3. Arabic headers table
      const rows: (string | number)[][] = [
        ['اسم المستخدم', 'كلمة المرور', 'اسم الحزمة'],
        ...matchedResults.map((r) => [
          String(r.username || '').trim(),
          String(r.password || '').trim(),
          String(r.profileName || '').trim(),
        ]),
      ];
      worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 22 },
        { wch: 20 },
        { wch: 26 },
      ];
    } else {
      // 4. Detailed format
      const excelData = matchedResults.map((r, i) => ({
        '#': i + 1,
        'Username': r.username,
        'Password': r.password,
        'Package': r.profileName,
        'Package Time': r.packageTime || '08:00',
        'Created Date': r.createdAt || '',
        'Status': r.status === 'matched' ? 'متطابق - جاهز' : 'بدون كلمة مرور',
      }));
      worksheet = XLSX.utils.json_to_sheet(excelData);
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'بطاقات الإنترنت');
    XLSX.writeFile(workbook, `Smart_Net_Cards_${Date.now()}.xlsx`);

    // Log the operation
    addOperationLog({
      type: 'export_excel',
      title: 'تصدير ملف Excel بالترتيب المعتمد',
      description: `تم تصدير ${matchedResults.length} كرت بنجاح بالترتيب المعتمد كالصورة (${matchedCount} متطابق)`,
      details: {
        totalCards: matchedResults.length,
        matchedCount,
        exportFormat,
      },
    });

    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Download Text (.txt)
  const handleDownloadTxt = () => {
    if (matchedResults.length === 0) return;

    let content = `=== Smart Net - كروت الإنترنت المكتملة (اسم المستخدم وكلمة المرور) ===\n`;
    content += `تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}\n`;
    content += `إجمالي الكروت: ${matchedResults.length} | المتطابقة: ${matchedCount}\n\n`;

    matchedResults.forEach((r, i) => {
      content += `${i + 1}. المستخدم: ${r.username} | كلمة السر: ${r.password || '---'} | ${r.profileName}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Smart_Net_Completed_Cards_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    addOperationLog({
      type: 'export_txt',
      title: 'تصدير كروت بصيغة ملف نصي (.txt)',
      description: `تم تصدير ${matchedResults.length} كرت في ملف نصي`,
      details: { totalCards: matchedResults.length },
    });
  };

  // Download MikroTik User Manager CSV
  const handleDownloadMikrotikCSV = () => {
    if (matchedResults.length === 0) return;

    let csvContent = `username,password,profile,comment\n`;
    matchedResults.forEach((r) => {
      csvContent += `"${r.username}","${r.password}","${r.profileName}","Smart Net"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Smart_Net_Mikrotik_Import_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    addOperationLog({
      type: 'export_csv',
      title: 'تصدير MikroTik CSV',
      description: `تم تصدير ${matchedResults.length} كرت متوافق مع سيرفر MikroTik User Manager`,
      details: { totalCards: matchedResults.length },
    });
  };

  // Load from Tab 1 if available
  const handleLoadFromTab1 = () => {
    if (initialExtractedCards.length === 0) {
      alert('لم يتم استخراج كروت بعد من التبويب الأول. يمكنك استخراجها أولاً أو رفع ملف Excel.');
      return;
    }
    const rows = initialExtractedCards.map((c, i) => ({
      '#': i + 1,
      'اسم المستخدم': c.username,
      'اسم الحزمة': c.profileName,
      'وقت الحزمة': c.packageTime || '',
      'تاريخ الإنشاء': c.createdAt || '',
    }));
    setFile1Rows(rows);
    setFile1Headers(['اسم المستخدم', 'اسم الحزمة', 'وقت الحزمة', 'تاريخ الإنشاء']);
    setFile1Name('الكروت المستخرجة من التبويب الأول');
    setFile1UsernameCol('اسم المستخدم');

    addOperationLog({
      type: 'file_upload',
      title: 'استيراد كروت التبويب الأول',
      description: `تم استيراد ${initialExtractedCards.length} كرت مستعاد من استعادة الكروت القديمة`,
      details: { totalCards: initialExtractedCards.length },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Intro Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100 mb-1">
              <Key className="w-3.5 h-3.5" />
              <span>إكمال بطاقات الإنترنت</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-sans">
              مطابقة اسم المستخدم وجلب كلمة المرور
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              ارفع ملف الكروت المستخرجة وملف كلمات المرور ليتم جلب كلمة المرور وتصدير ملف Excel متكامل جاهز للبيع والطباعة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowLogsModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer shrink-0"
              title="عرض سجل العمليات السابقة والبحث"
            >
              <History className="w-4 h-4 text-amber-300" />
              <span>سجل العمليات والبحث</span>
              {operationLogs.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono text-[10px] font-black">
                  {operationLogs.length}
                </span>
              )}
            </button>

            {initialExtractedCards.length > 0 && (
              <button
                onClick={handleLoadFromTab1}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer shrink-0"
              >
                <FileCheck className="w-4 h-4 text-rose-200" />
                <span>استيراد كروت التبويب الأول ({initialExtractedCards.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload 2 Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box 1: Extracted File (File 1) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                الملف الأول (1)
              </span>
              {file1Name && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم التحميل ({file1Rows.length} كرت)
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              ملف الكروت المستخرجة من الموقع
            </h3>
            <p className="text-xs text-slate-500">
              الملف الذي يحتوي على أسماء المستخدمين (PIN / Username) المستعادة.
            </p>
          </div>

          {/* Upload Input Area */}
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile1Upload(e.target.files[0]);
              }}
            />
            <FileSpreadsheet className="w-8 h-8 text-blue-500" />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 block">
                {file1Name ? file1Name : 'اضغط لاختيار ملف الكروت المستخرجة'}
              </span>
              <span className="text-[11px] text-slate-400">يدعم صيغ .xlsx أو .xls أو .csv</span>
            </div>
          </label>

          {/* Column Selector for File 1 */}
          {file1Headers.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
              <label className="text-[11px] font-bold text-slate-700 block">
                عمود "اسم المستخدم" في الملف الأول:
              </label>
              <select
                value={file1UsernameCol}
                onChange={(e) => setFile1UsernameCol(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-rose-500"
              >
                {file1Headers.map((h) => (
                  <option key={h} value={h}>
                    {h} (مثال: {String(file1Rows[0]?.[h] || '').slice(0, 15)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Box 2: Passwords File (File 2) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                الملف الثاني (2)
              </span>
              {file2Name && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم التحميل ({file2Rows.length} سجل)
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              ملف الكروت الذي يحتوي على كلمات المرور
            </h3>
            <p className="text-xs text-slate-500">
              ملف الديلر الأصلي أو قاعدة البيانات التي تحتوي على (Username & Password).
            </p>
          </div>

          {/* Upload Input Area */}
          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile2Upload(e.target.files[0]);
              }}
            />
            <Key className="w-8 h-8 text-emerald-500" />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 block">
                {file2Name ? file2Name : 'اضغط لاختيار ملف كلمات المرور'}
              </span>
              <span className="text-[11px] text-slate-400">يدعم صيغ .xlsx أو .xls أو .csv</span>
            </div>
          </label>

          {/* Column Selectors for File 2 */}
          {file2Headers.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  عمود "اسم المستخدم" في الملف الثاني:
                </label>
                <select
                  value={file2UsernameCol}
                  onChange={(e) => setFile2UsernameCol(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800 focus:outline-emerald-500"
                >
                  {file2Headers.map((h) => (
                    <option key={h} value={h}>
                      {h} (مثال: {String(file2Rows[0]?.[h] || '').slice(0, 15)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-emerald-800 block mb-1">
                  عمود "كلمة المرور / كلمة السر" (Password):
                </label>
                <select
                  value={file2PasswordCol}
                  onChange={(e) => setFile2PasswordCol(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-lg p-1.5 text-xs font-bold text-slate-800 focus:outline-emerald-500"
                >
                  {file2Headers.map((h) => (
                    <option key={h} value={h}>
                      {h} (مثال: {String(file2Rows[0]?.[h] || '').slice(0, 15)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Matching Stats Overview Banner */}
      {totalCards > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-base text-slate-900">
                نتائج مطابقة الكروت وسحب كلمات المرور
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">نسبة التطابق:</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-black">
                {matchRate}%
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <div className="text-[11px] text-slate-500 font-bold mb-1">إجمالي الكروت المطلوبة</div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {totalCards.toLocaleString('ar-EG')}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <div className="text-[11px] text-emerald-700 font-bold mb-1">عُثر على كلمة المرور</div>
              <div className="text-lg font-black text-emerald-800 font-mono">
                {matchedCount.toLocaleString('ar-EG')}
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <div className="text-[11px] text-amber-700 font-bold mb-1">بدون كلمة مرور</div>
              <div className="text-lg font-black text-amber-800 font-mono">
                {unmatchedCount.toLocaleString('ar-EG')}
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-center">
              <div className="text-[11px] text-blue-700 font-bold mb-1">سجلات ملف كلمات المرور</div>
              <div className="text-lg font-black text-blue-900 font-mono">
                {file2Rows.length.toLocaleString('ar-EG')}
              </div>
            </div>
          </div>

          {/* Options: Fallback Password for Unmatched */}
          {unmatchedCount > 0 && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  يوجد <strong>{unmatchedCount}</strong> كرت لم يتم العثور على كلمة مرور لها في الملف الثاني.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={useFallbackForUnmatched}
                    onChange={(e) => setUseFallbackForUnmatched(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>وضع كلمة مرور افتراضية:</span>
                </label>
                <input
                  type="text"
                  value={defaultFallbackPassword}
                  onChange={(e) => setDefaultFallbackPassword(e.target.value)}
                  disabled={!useFallbackForUnmatched}
                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-md font-mono text-center text-xs disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Export Actions Bar & Format Selection */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            {/* Format Selection Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-900">
                    تنسيق ملف Excel عند التصدير:
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  اضغط على النموذج المطلوب لاعتماده عند التصدير
                </span>
              </div>

              {/* Responsive 4-Column Grid for Format Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('voucher_repeating')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    exportFormat === 'voucher_repeating'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-2xs ring-2 ring-rose-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">قالب كروت الميكروتك ★</span>
                    {exportFormat === 'voucher_repeating' && (
                      <Check className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans">
                    ترويسة مكررة Username | Password | Package لكل كرت كالصورة
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('standard_columns')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    exportFormat === 'standard_columns'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-2xs ring-2 ring-rose-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">جدول مباشر (إنجليزية)</span>
                    {exportFormat === 'standard_columns' && (
                      <Check className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans">
                    ترويسة واحدة: Username | Password | Package
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('arabic_columns')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    exportFormat === 'arabic_columns'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-2xs ring-2 ring-rose-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">جدول مباشر (عربية)</span>
                    {exportFormat === 'arabic_columns' && (
                      <Check className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans">
                    ترويسة واحدة: اسم المستخدم | كلمة المرور | اسم الحزمة
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('detailed')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    exportFormat === 'detailed'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-2xs ring-2 ring-rose-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">جدول تفصيلي كامل</span>
                    {exportFormat === 'detailed' && (
                      <Check className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans">
                    يشمل وقت الحزمة، تاريخ الإنشاء، وحالة التطابق
                  </span>
                </button>
              </div>
            </div>

            {/* Action Buttons Grid (Spacious, well-separated, never overlapping) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Excel Download Button */}
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100 shrink-0" />
                <span className="truncate">تصدير ملف Excel (.xlsx)</span>
              </button>

              {/* TXT Download Button */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                <span className="truncate">تصدير ملف نصي (.txt)</span>
              </button>

              {/* MikroTik CSV Download */}
              <button
                type="button"
                onClick={handleDownloadMikrotikCSV}
                className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
                title="تصدير ملف متوافق مع سيرفر MikroTik User Manager"
              >
                <Download className="w-4 h-4 text-blue-200 shrink-0" />
                <span className="truncate">تصدير MikroTik CSV</span>
              </button>

              {/* Printable Vouchers Preview */}
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Printer className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="truncate">معاينة وطباعة الكروت</span>
              </button>
            </div>

            {/* Ordering Reminder Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 font-sans">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>
                  ترتيب الأعمدة المعتمد للتصدير:
                  <strong className="text-slate-900 font-mono mx-1">1. Username</strong>
                  ←
                  <strong className="text-slate-900 font-mono mx-1">2. Password</strong>
                  ←
                  <strong className="text-slate-900 font-mono mx-1">3. Package</strong>
                  (مطابق للصورة)
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                جاهز للطباعة والاستيراد المباشر
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Search & Username Finder Bar */}
      {totalCards > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  شريط البحث في قائمة الكروت المدمجة
                </h3>
                <p className="text-[11px] text-slate-500">
                  ابحث عن اسم مستخدم معين (Username) أو كلمة مرور في القائمة الطويلة
                </p>
              </div>
            </div>

            {/* Search Results Summary Counter */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 font-bold">النتائج المعروضة:</span>
              <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-mono font-black">
                {filteredResults.length.toLocaleString('ar-EG')} / {totalCards.toLocaleString('ar-EG')}
              </span>
            </div>
          </div>

          {/* Search Inputs & Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Main Username Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTriggerSearch(searchQuery);
                  }
                }}
                placeholder="أدخل اسم المستخدم (Username) المطلوب للبحث..."
                className="w-full pr-10 pl-9 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-rose-500 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  title="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Package Filter Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-rose-500 rounded-2xl py-2.5 px-3 text-xs font-bold text-slate-700 focus:outline-none transition-all shadow-2xs"
              >
                <option value="">جميع الحزم / الباقات ({availableProfiles.length})</option>
                {availableProfiles.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Exact Match Toggle */}
            <div className="md:col-span-3 flex items-center justify-between sm:justify-start gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={exactMatch}
                  onChange={(e) => setExactMatch(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span>تطابق تام للاسم</span>
              </label>
              <span className="text-[10px] text-slate-400 font-normal">Exact match</span>
            </div>
          </div>

          {/* Recent Searches Chips */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                عمليات بحث سابقة:
              </span>
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearchQuery(term);
                    handleTriggerSearch(term);
                  }}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-mono text-[11px] font-bold transition-colors border border-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <span>{term}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setRecentSearches([]);
                  localStorage.removeItem('smart_net_recent_searches');
                }}
                className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors mr-auto cursor-pointer"
              >
                مسح السجل
              </button>
            </div>
          )}

          {/* Quick Found Card Highlight (If user searched for a specific username and 1 card was found) */}
          {searchQuery.trim() && filteredResults.length === 1 && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] text-emerald-700 font-bold">
                    تم العثور على الكرت المطلوب بنجاح:
                  </div>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-sm mt-0.5">
                    <span className="font-black text-slate-900">
                      المستخدم: {filteredResults[0].username}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      كلمة السر: {filteredResults[0].password || 'بدون كلمة سر'}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs text-slate-600 font-sans">
                      {filteredResults[0].profileName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCopy(
                      `${filteredResults[0].username}\t${filteredResults[0].password}`,
                      'found-card'
                    )
                  }
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  {copiedId === 'found-card' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ اسم المستخدم وكلمة المرور</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Matched Data Preview Table */}
      {totalCards > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Controls Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Pills & View Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  الكل ({totalCards})
                </button>
                <button
                  onClick={() => setFilterType('matched')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'matched'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  مع كلمة مرور ({matchedCount})
                </button>
                <button
                  onClick={() => setFilterType('unmatched')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'unmatched'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  بدون كلمة مرور ({unmatchedCount})
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="عرض الأعمدة المباشر"
                >
                  جدول الأعمدة
                </button>
                <button
                  onClick={() => setViewMode('voucher_preview')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'voucher_preview'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="عرض كروت الميكروتك كالصورة المرفقة (ترويسة + بيانات)"
                >
                  نمط كروت الصورة
                </button>
              </div>
            </div>

            {/* Quick Keyword Search inside Table */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTriggerSearch(searchQuery);
                  }
                }}
                placeholder="تصفية سريعة باسم المستخدم..."
                className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-rose-500 font-sans"
              />
            </div>
          </div>

          {/* Table / Voucher Mode Body */}
          {viewMode === 'table' ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/90 sticky top-0 z-10 text-slate-800 font-bold border-b border-slate-200 font-sans">
                  <tr>
                    <th className="py-2.5 px-4 text-right">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-slate-900 font-black">Username</span>
                        <span className="text-[10px] text-slate-500 font-normal">(اسم المستخدم)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-4 text-right">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-emerald-800 font-black">Password</span>
                        <span className="text-[10px] text-slate-500 font-normal">(كلمة المرور)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-4 text-right">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-blue-900 font-black">Package</span>
                        <span className="text-[10px] text-slate-500 font-normal">(اسم الحزمة)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-center">الحالة</th>
                    <th className="py-2.5 px-3 text-center w-16">نسخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                        لا توجد كروت مطابقة لمعايير البحث الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((item) => (
                      <tr
                        key={item.index}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-bold text-slate-900 font-mono select-all">
                          {highlightMatch(item.username, searchQuery)}
                        </td>
                        <td className="py-2.5 px-4 font-bold font-mono">
                          {item.password ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 select-all">
                              {item.password}
                            </span>
                          ) : (
                            <span className="text-amber-500 font-sans text-[11px]">
                              غير متوفر
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 font-sans text-xs">
                          {item.profileName}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.status === 'matched' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-sans">
                              <CheckCircle2 className="w-3 h-3" />
                              متطابق
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-sans">
                              مفقود
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() =>
                              handleCopy(
                                `${item.username}\t${item.password}`,
                                String(item.index)
                              )
                            }
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="نسخ اسم المستخدم وكلمة المرور"
                          >
                            {copiedId === String(item.index) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Alternating Voucher / Screenshot Grid View */
            <div className="p-4 max-h-96 overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredResults.map((item) => (
                  <div
                    key={item.index}
                    className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs font-mono text-xs"
                  >
                    {/* Header Row: Username | Password | Package */}
                    <div className="grid grid-cols-3 bg-slate-200/90 text-slate-700 font-black text-center py-1.5 border-b border-slate-300 text-[11px]">
                      <div>Username</div>
                      <div className="border-x border-slate-300">Password</div>
                      <div>Package</div>
                    </div>
                    {/* Data Row */}
                    <div className="grid grid-cols-3 text-center py-2 items-center bg-white font-bold text-slate-800">
                      <div className="truncate px-1 select-all">
                        {highlightMatch(item.username, searchQuery)}
                      </div>
                      <div className="truncate px-1 border-x border-slate-200 text-emerald-700 select-all">
                        {item.password || '---'}
                      </div>
                      <div className="truncate px-1 text-slate-600 text-[11px] font-sans">
                        {item.profileName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
            يتم عرض {filteredResults.length} من أصل {totalCards} كرت
          </div>
        </div>
      )}

      {/* Printable Vouchers Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">
                  معاينة كروت الإنترنت الجاهزة للطباعة ({matchedResults.length} كرت)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-white text-rose-700 font-bold text-xs rounded-lg shadow-xs hover:bg-rose-50"
                >
                  طباعة فورية
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1 text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cards Grid for Printing */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 print:bg-white print:p-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2">
                {matchedResults.slice(0, 90).map((card, i) => (
                  <div
                    key={i}
                    className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-3 flex flex-col justify-between space-y-2 shadow-2xs relative print:border-black print:rounded-none"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="font-black text-rose-600 text-xs tracking-tight uppercase">
                        Smart Net
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">
                        {card.profileName.slice(0, 20)}
                      </span>
                    </div>

                    <div className="space-y-1.5 py-1">
                      <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200 text-center">
                        <div className="text-[9px] text-slate-400 font-sans">اسم المستخدم / PIN</div>
                        <div className="font-mono font-black text-slate-900 text-sm tracking-wider">
                          {card.username}
                        </div>
                      </div>

                      <div className="bg-emerald-50/60 rounded-lg p-1.5 border border-emerald-200 text-center">
                        <div className="text-[9px] text-emerald-700 font-sans">كلمة المرور / Pass</div>
                        <div className="font-mono font-black text-emerald-900 text-sm tracking-wider">
                          {card.password || '123456'}
                        </div>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-400 text-center border-t border-slate-100 pt-1 font-sans">
                      أهلاً بك في شبكة Smart Net
                    </div>
                  </div>
                ))}
              </div>

              {matchedResults.length > 90 && (
                <div className="mt-4 text-center text-xs text-slate-500 font-bold no-print">
                  يتم عرض أول 90 كرت للمعاينة السريعة، وتتوفر جميع الكروت في ملف Excel أو الطباعة الكاملة.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Operations History & Search Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base font-sans">
                    سجل العمليات والأنشطة والبحث
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    أرشيف بجميع عمليات الرفع والمطابقة والتصدير والبحث السابقة
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLogsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls (Search & Filter inside Logs) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              {/* Search Inside Logs */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logsSearchQuery}
                  onChange={(e) => setLogsSearchQuery(e.target.value)}
                  placeholder="ابحث في سجل العمليات (باسم الملف، التاريخ، نوع العملية، أو استعلام البحث)..."
                  className="w-full pr-10 pl-9 py-2 bg-white border border-slate-300 focus:border-rose-500 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs font-sans"
                />
                {logsSearchQuery && (
                  <button
                    onClick={() => setLogsSearchQuery('')}
                    className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setLogsFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      logsFilterType === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    الكل ({operationLogs.length})
                  </button>
                  <button
                    onClick={() => setLogsFilterType('match')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      logsFilterType === 'match'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                    }`}
                  >
                    مطابقة الكروت
                  </button>
                  <button
                    onClick={() => setLogsFilterType('file_upload')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      logsFilterType === 'file_upload'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                    }`}
                  >
                    رفع الملفات
                  </button>
                  <button
                    onClick={() => setLogsFilterType('export')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      logsFilterType === 'export'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    عمليات التصدير
                  </button>
                  <button
                    onClick={() => setLogsFilterType('search')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      logsFilterType === 'search'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
                    }`}
                  >
                    عمليات البحث
                  </button>
                </div>

                {operationLogs.length > 0 && (
                  <button
                    onClick={clearOperationLogs}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body (Logs Timeline List) */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <History className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-600">
                    لا توجد سجلات مطابقة للبحث
                  </div>
                  <div className="text-xs text-slate-400">
                    يتم تسجيل عمليات الرفع والمطابقة والبحث والتصدير تلقائياً فور إجرائها.
                  </div>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const date = new Date(log.timestamp);
                  const formattedTime = date.toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const formattedDate = date.toLocaleDateString('ar-EG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={log.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            log.type === 'match'
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : log.type === 'file_upload'
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : log.type.startsWith('export')
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : log.type === 'search'
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.type === 'match' ? (
                            <ArrowRightLeft className="w-4 h-4" />
                          ) : log.type === 'file_upload' ? (
                            <Upload className="w-4 h-4" />
                          ) : log.type === 'export_excel' ? (
                            <FileSpreadsheet className="w-4 h-4" />
                          ) : log.type === 'export_txt' ? (
                            <FileText className="w-4 h-4" />
                          ) : log.type === 'export_csv' ? (
                            <Download className="w-4 h-4" />
                          ) : log.type === 'print' ? (
                            <Printer className="w-4 h-4" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {log.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                              {formattedTime} - {formattedDate}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed font-sans">
                            {log.description}
                          </p>

                          {log.details?.searchQuery && (
                            <button
                              onClick={() => {
                                setSearchQuery(log.details!.searchQuery!);
                                setShowLogsModal(false);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-bold mt-1 cursor-pointer"
                            >
                              <span>تطبيق هذا البحث الآن:</span>
                              <span className="font-mono bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                {log.details.searchQuery}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Detail metrics badge if any */}
                      {log.details?.totalCards && (
                        <div className="self-end sm:self-center shrink-0 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
                          {log.details.totalCards.toLocaleString('ar-EG')} كرت
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">
                إجمالي العمليات المسجلة: <strong>{operationLogs.length}</strong>
              </span>

              <button
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 font-bold rounded-xl text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
