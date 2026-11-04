import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, AlertCircle, Coffee, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useZenStudio } from './hooks/useZenStudio';
import { ZenTrialBanner } from './components/ZenTrialBanner';
import { ZenDropZone } from './components/ZenDropZone';
import { ZenExamPreview } from './components/ZenExamPreview';
import { ZenRoomLauncherModal } from './components/ZenRoomLauncherModal';
import { ZenBankSaveModal } from './components/ZenBankSaveModal';
import { ZenHomeworkConfigModal } from './components/ZenHomeworkConfigModal';
import { ZenArenaGameSelectorModal } from './components/ZenArenaGameSelectorModal';
import { ZenPureBankSuccessModal } from './components/ZenPureBankSuccessModal';
import { TeacherCoffeeModal } from './components/TeacherCoffeeModal';
import { LanguageSwitcher } from '@/widgets/app-header/LanguageSwitcher';
import { antiScrapingGuardService, IngestionQuotaStatus } from '@/services/antiScrapingGuard.service';

export const CreatorZenStudioPage: React.FC = () => {
  const { t } = useTranslation('creator');
  const [showCoffeeModal, setShowCoffeeModal] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<IngestionQuotaStatus>(
    antiScrapingGuardService.getQuotaStatus()
  );

  const {
    partnership,
    isUploading,
    uploadResult,
    isLaunching,
    launchResult,
    errorMessage,
    handleUploadFile: originalUpload,
    handleLaunchRoom,
    handleReset,
    handleCloseModal,
    updateQuestion,
    isSavingToBank,
    bankSaveResult,
    isPureSavingToBank,
    pureSaveResult,
    handlePureSaveToBank,
    handleClosePureSaveModal,
    isArenaSelectorOpen,
    handleOpenArenaSelector,
    handleCloseArenaSelector,
    homeworkConfig,
    isHomeworkModalOpen,
    handleOpenHomeworkModal,
    handleCloseHomeworkModal,
    handleSaveToBank,
    handleCloseBankModal,
  } = useZenStudio();

  const refreshQuota = () => {
    setQuotaStatus(antiScrapingGuardService.getQuotaStatus());
  };

  const guardedUploadFile = async (file: File) => {
    const check = antiScrapingGuardService.canIngestExam();
    if (!check.allowed) {
      setShowCoffeeModal(true);
      return;
    }
    await originalUpload(file);
    antiScrapingGuardService.incrementDailyUsage();
    refreshQuota();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Control Bar: Hạn mức bảo vệ bản quyền, Language Switcher & Nút Mời Cafe */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <span className="text-slate-300 font-medium hidden sm:inline">
              {t('topBar.quotaLabel')}
            </span>
            <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {quotaStatus.dailyUsed}/{quotaStatus.isUnlimited ? t('topBar.unlimited') : `${quotaStatus.dailyLimit} ${t('topBar.examsPerDay')}`}
            </span>
            {partnership?.referralCode && (
              <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 hidden md:inline">
                ID: {partnership.referralCode}
              </span>
            )}
            <span className="text-[10px] text-slate-500 hidden lg:inline">
              {t('topBar.securityNote')}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => setShowCoffeeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{t('coffee.buttonLabel', { price: (partnership?.coffeePriceVnd || 25000).toLocaleString('vi-VN') })}</span>
            </button>
          </div>
        </div>

        {/* Khi CHƯA upload: Hiển thị Hero Banner & Gói Đối Tác đầy đủ */}
        {!uploadResult && (
          <>
            <div className="text-center space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('ecosystemTag')}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                {t('title')}
              </h1>
              <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
                {t('subtitle')}
              </p>
            </div>
            <ZenTrialBanner partnership={partnership} />
          </>
        )}

        {/* Error message alert */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs md:text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Workspace: DropZone OR Preview */}
        {!uploadResult ? (
          <ZenDropZone onFileSelected={guardedUploadFile} isLoading={isUploading} />
        ) : (
          <ZenExamPreview
            data={uploadResult}
            onOpenArenaSelector={handleOpenArenaSelector}
            onPureSaveToBank={handlePureSaveToBank}
            isPureSavingToBank={isPureSavingToBank}
            onOpenHomeworkConfig={handleOpenHomeworkModal}
            onReset={handleReset}
            onUpdateQuestion={updateQuestion}
            isLaunching={isLaunching}
          />
        )}

        {/* 1. Modal Thể thức Gameshow Đấu Trường Realtime */}
        <ZenArenaGameSelectorModal
          isOpen={isArenaSelectorOpen}
          isLoading={isLaunching}
          totalQuestions={uploadResult?.totalQuestions ?? 0}
          onClose={handleCloseArenaSelector}
          onConfirm={(gameCode: string, durationMinutes: number) => handleLaunchRoom(gameCode, durationMinutes)}
        />

        {/* 2. Modal Cấu hình Giao bài tập (Kids / Exam / Paper / Study) */}
        <ZenHomeworkConfigModal
          initialConfig={homeworkConfig}
          isOpen={isHomeworkModalOpen}
          isLoading={isSavingToBank}
          onClose={handleCloseHomeworkModal}
          onConfirm={(cfg) => handleSaveToBank(cfg)}
        />

        {/* 3. Modal Thông báo Lưu Ngân Hàng Thành Công (Pure Asset) */}
        {pureSaveResult && (
          <ZenPureBankSuccessModal
            result={pureSaveResult}
            onClose={handleClosePureSaveModal}
          />
        )}

        {/* 4. Modal Kết quả Khởi tạo Đấu Trường Trực Tiếp */}
        {launchResult && (
          <ZenRoomLauncherModal room={launchResult} onClose={handleCloseModal} />
        )}

        {/* 5. Modal Kết quả Giao Bài Tập (Link & QR Code) */}
        {bankSaveResult && (
          <ZenBankSaveModal result={bankSaveResult} onClose={handleCloseBankModal} />
        )}

        {/* 6. Modal Mời Cafe Đồng Hành (Mở Khóa Pro 1 Tuần) */}
        {showCoffeeModal && (
          <TeacherCoffeeModal
            partnership={partnership}
            onClose={() => setShowCoffeeModal(false)}
            onSuccess={() => {
              refreshQuota();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CreatorZenStudioPage;
