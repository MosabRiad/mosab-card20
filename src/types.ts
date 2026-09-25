export interface DealerUser {
  id: string;
  username: string;
  name: string;
  dealerId: string;
  remainingQuota: number; // e.g. 5000 cards
  totalExtractedCount: number;
}

export interface UserExcelRow {
  username: string; // PIN / Username (إسم المستخدم)
  password?: string;
  profileName: string; // Package e.g. "اشتراك يومى 8 ساعات 2 مي" (اسم الحزمة)
  packageTime?: string; // وقت الحزمة e.g. "08:00"
  saleStatus?: string; // حالة البيع e.g. "تم بيعه"
  createdAt: string; // تاريخ إنشاء المستخدم e.g. "15/04/2026 10:23:44"
  firstConnectAt?: string | null; // تاريخ أول اتصال
  disconnectAt?: string | null; // تاريخ الفصل
  status: string; // الحالة e.g. "Active"
}

export interface CardBatchGroup {
  id: string;
  profileName: string; // e.g. "اشتراك يومي 8 ساعات 2 ميجا"
  cardCount: number;
  createdDate: string; // "2026-09-20"
  createdTime: string; // "08:00"
  selected: boolean;
  cards: UserExcelRow[];
}

export interface LiveExtractionFeed {
  id: string;
  dealerName: string; // e.g. "m***i"
  count: number;
  timestamp: string;
}

export interface OperationLogEntry {
  id: string;
  type: 'match' | 'file_upload' | 'export_excel' | 'export_txt' | 'export_csv' | 'print' | 'search';
  title: string;
  description: string;
  timestamp: string;
  details?: {
    fileName?: string;
    totalCards?: number;
    matchedCount?: number;
    unmatchedCount?: number;
    matchRate?: number;
    searchQuery?: string;
    exportFormat?: string;
  };
}
