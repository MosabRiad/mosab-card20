import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { LiveStatsBanner } from './components/LiveStatsBanner';
import { Step1Upload } from './components/Step1Upload';
import { Step2SelectGroups } from './components/Step2SelectGroups';
import { ViewCardsModal } from './components/ViewCardsModal';
import { Step3ExtractionModal } from './components/Step3ExtractionModal';
import { PasswordMatcherTab } from './components/PasswordMatcherTab';
import { CardBatchGroup, DealerUser, UserExcelRow } from './types';
import { INITIAL_DEALER, INITIAL_BATCH_GROUPS } from './data/mockData';
import { RefreshCw, Shield, HelpCircle, Layers, Key, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [dealer, setDealer] = useState<DealerUser | null>(() => {
    try {
      const saved = localStorage.getItem('smartnet_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [lang, setLang] = useState<'AR' | 'EN'>('AR');
  const [activeTab, setActiveTab] = useState<'recovery' | 'matcher'>('recovery');
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);
  const [groups, setGroups] = useState<CardBatchGroup[]>([]);
  const [viewingGroup, setViewingGroup] = useState<CardBatchGroup | null>(null);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [extractedCardsHistory, setExtractedCardsHistory] = useState<UserExcelRow[]>([]);

  // Sync session with localStorage
  useEffect(() => {
    if (dealer) {
      localStorage.setItem('smartnet_session', JSON.stringify(dealer));
    } else {
      localStorage.removeItem('smartnet_session');
    }
  }, [dealer]);

  const handleLogout = () => {
    setDealer(null);
    localStorage.removeItem('smartnet_session');
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'AR' ? 'EN' : 'AR'));
  };

  const handleFileUploaded = (newGroups: CardBatchGroup[], filename: string) => {
    setGroups(newGroups);
    setCurrentFilename(filename);
  };

  const handleToggleGroup = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, selected: !g.selected } : g))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setGroups((prev) => prev.map((g) => ({ ...g, selected: select })));
  };

  const selectedGroups = useMemo(() => {
    return groups.filter((g) => g.selected);
  }, [groups]);

  const selectedCount = selectedGroups.length;

  const totalSelectedCards = useMemo(() => {
    return selectedGroups.reduce((sum, g) => sum + g.cardCount, 0);
  }, [selectedGroups]);

  const handleDeductQuota = (extractedCount: number) => {
    if (dealer) {
      setDealer({
        ...dealer,
        totalExtractedCount: dealer.totalExtractedCount + extractedCount,
      });
    }
  };

  // If dealer not logged in, show login page
  if (!dealer) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-rose-500 selection:text-white" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
        <Header dealer={null} onLogout={handleLogout} lang={lang} onToggleLang={handleToggleLang} />
        <LoginScreen onLoginSuccess={setDealer} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-rose-500 selection:text-white" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
      {/* Header Bar */}
      <Header
        dealer={dealer}
        onLogout={handleLogout}
        lang={lang}
        onToggleLang={handleToggleLang}
        onNavigateTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome & Unlimited Cards Banner */}
        <LiveStatsBanner dealerName={dealer.name} />

        {/* Tab Navigation Switcher */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('recovery')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'recovery'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. استعادة كروت المبادرة القديمة</span>
            {groups.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'recovery' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {groups.length} مجموعات
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('matcher')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'matcher'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>2. دمج ومطابقة كلمات المرور (إكمال الكروت)</span>
            {extractedCardsHistory.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'matcher' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {extractedCardsHistory.length} جاهز
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Recovery Workflow */}
        {activeTab === 'recovery' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Section Main Title */}
            <div className="text-center space-y-1 py-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">♻️</span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-sans">
                  استعادة كروت المبادرة القديمة
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                استخرج الكروت غير المستخدمة من ديلر المبادرة واعد بيعها
              </p>
            </div>

            {/* Step 1: Upload Users.xlsx file */}
            <Step1Upload
              onFileUploaded={handleFileUploaded}
              currentFilename={currentFilename}
            />

            {/* Step 2: Choose Groups & Filter - Only show if groups loaded */}
            {groups.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Step2SelectGroups
                  groups={groups}
                  onToggleGroup={handleToggleGroup}
                  onSelectAll={handleSelectAll}
                  onViewGroupCards={setViewingGroup}
                  onStartExtraction={() => setShowExtractionModal(true)}
                  selectedCount={selectedCount}
                  totalSelectedCards={totalSelectedCards}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Password Matcher Workflow */}
        {activeTab === 'matcher' && (
          <PasswordMatcherTab initialExtractedCards={extractedCardsHistory} />
        )}
      </main>

      {/* Viewing Group Cards Modal */}
      {viewingGroup && (
        <ViewCardsModal
          group={viewingGroup}
          onClose={() => setViewingGroup(null)}
        />
      )}

      {/* Step 3: Extraction Modal */}
      {showExtractionModal && (
        <Step3ExtractionModal
          selectedGroups={selectedGroups}
          onClose={() => setShowExtractionModal(false)}
          onDeductQuota={handleDeductQuota}
          onExtractedSuccess={(cards) => setExtractedCardsHistory(cards)}
          onGoToPasswordMatcher={(cards) => {
            setExtractedCardsHistory(cards);
            setActiveTab('matcher');
          }}
        />
      )}

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-3xl mx-auto px-4 space-y-1">
          <div className="font-bold text-slate-800">
            Smart Net
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            جميع الحقوق محفوظة © 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
