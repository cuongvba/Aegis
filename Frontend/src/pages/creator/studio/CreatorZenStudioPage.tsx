import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, AlertCircle, Coffee, ShieldCheck, Database, FileUp } from 'lucide-react';
import { useZenStudio } from './hooks/useZenStudio';
import { ZenStudioHero } from './components/ZenStudioHero';
import { ZenDropZone } from './components/ZenDropZone';
import { ZenSavedBankSelector } from './components/ZenSavedBankSelector';
import { ZenExamPreview } from './components/ZenExamPreview';
import { ZenRoomLauncherModal } from './components/ZenRoomLauncherModal';
import { ZenBankSaveModal } from './components/ZenBankSaveModal';
import { ZenHomeworkConfigModal } from './components/ZenHomeworkConfigModal';
import { ZenArenaGameSelectorModal } from './components/ZenArenaGameSelectorModal';
import { ZenExamExportModal } from './components/ZenExamExportModal';
import { ZenPureBankSuccessModal } from './components/ZenPureBankSuccessModal';
import { TeacherCoffeeModal } from './components/TeacherCoffeeModal';
import { ZenStudioTopBar } from './components/ZenStudioTopBar';
import { CreatorWorkspaceNav } from '../components/CreatorWorkspaceNav';
import { ExamMatrixWizardModal } from './components/ExamMatrixWizardModal';
import { antiScrapingGuardService, IngestionQuotaStatus } from '@/services/antiScrapingGuard.service';

export const CreatorZenStudioPage: React.FC = () => {
  const { t } = useTranslation('creator');
  const [showCoffeeModal, setShowCoffeeModal] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [studioMode, setStudioMode] = useState<'upload' | 'saved'>('upload');
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
    handleOpenArenaSelectorWithPayload,
    stagedLaunchPayload,
    handleCloseArenaSelector,
    homeworkConfig,
    isHomeworkModalOpen,
    handleOpenHomeworkModal,
    handleCloseHomeworkModal,
    handleSaveToBank,
    handleCloseBankModal,
    handleLaunchArenaFromSaved,
    handleAssignHomeworkFromSaved,
    handleLoadIntoStudio,
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
        {/* Thanh điều hướng Hệ sinh thái Creator: Zen Studio | ZenTopics | ZenQuestions | Đội Nhóm & Học Viên */}
        <CreatorWorkspaceNav />

        {/* Top Control Bar: Hạn mức bảo vệ bản quyền & Nút Mời Cafe */}
        <ZenStudioTopBar
          quotaStatus={quotaStatus}
          partnership={partnership}
          onOpenCoffeeModal={() => setShowCoffeeModal(true)}
        />

        {/* Khi CHƯA upload: Hiển thị Hero Banner & Gói Đối Tác đầy đủ */}
        {!uploadResult && <ZenStudioHero partnership={partnership} />}

        {/* Error message alert */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs md:text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Workspace Mode Switcher (Khi chưa có preview) */}
        {!uploadResult && (
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-xl mx-auto shadow-md">
            <button
              type="button"
              onClick={() => setStudioMode('upload')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                studioMode === 'upload'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileUp size={14} />
              <span>{t('modeSwitcher.upload', 'File Word/Excel')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMatrixModalOpen(true)}
              className="flex-1 min-w-[150px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/30"
            >
              <Sparkles size={14} />
              <span>{t('modeSwitcher.matrixWizard', 'Ma Trận GDPT 2025')}</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioMode('saved')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                studioMode === 'saved'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database size={14} />
              <span>{t('modeSwitcher.savedBank', 'Đề Đã Lưu')}</span>
            </button>
          </div>
        )}

        {/* Main Workspace: DropZone OR SavedBankSelector OR Preview */}
        {!uploadResult ? (
          studioMode === 'upload' ? (
            <ZenDropZone onFileSelected={guardedUploadFile} isLoading={isUploading} />
          ) : (
            <ZenSavedBankSelector
              onLaunchArena={handleLaunchArenaFromSaved}
              onAssignHomework={handleAssignHomeworkFromSaved}
              onLoadIntoStudio={handleLoadIntoStudio}
            />
          )
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

        {/* 0. Modal Xuất Đề Thi Word & Trộn Đề */}
        <ZenExamExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          questions={uploadResult?.questions ?? []}
          defaultTitle={uploadResult?.examTitle || 'ĐỀ KHẢO SÁT CHẤT LƯỢNG HỌC KỲ'}
          defaultSubject={(uploadResult as any)?.subjectName || 'MÔN: TOÁN HỌC'}
        />

        {/* 1. Modal Thể thức Gameshow Đấu Trường Realtime */}
        <ZenArenaGameSelectorModal
          isOpen={isArenaSelectorOpen}
          isLoading={isLaunching}
          totalQuestions={stagedLaunchPayload?.totalQuestions ?? uploadResult?.totalQuestions ?? 0}
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

        {/* 7. Modal Trợ Lý Soạn Đề Theo Ma Trận GDPT 2025 */}
        <ExamMatrixWizardModal
          isOpen={isMatrixModalOpen}
          onClose={() => setIsMatrixModalOpen(false)}
          onMatrixGenerated={(res) => {
            setIsMatrixModalOpen(false);
            handleLoadIntoStudio(res.questions as any, { name: res.examTitle, code: 'GDPT_2025' } as any);
          }}
        />
      </div>
    </div>
  );
};

export default CreatorZenStudioPage;
