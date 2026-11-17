import React, { useEffect, useState } from 'react';
import { X, Sparkles, Sliders, Building2, GraduationCap, Save, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { ZenUploadResult, ZenQuestionPreview } from '../types/zen-studio.types';
import {
  examMatrixService,
  ExamMatrixBloomWeights,
  ExamMatrixSectionRule,
  ExamMatrixTemplate,
  MatrixSectionCoverage,
} from '../../../../services/examMatrix.service';
import { MatrixSectionEditor } from './MatrixSectionEditor';

interface ExamMatrixWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatrixGenerated: (result: ZenUploadResult) => void;
}

const DEFAULT_BLOOM: ExamMatrixBloomWeights = { recall: 40, comprehend: 30, apply: 20, highApply: 10 };

export const ExamMatrixWizardModal: React.FC<ExamMatrixWizardModalProps> = ({ isOpen, onClose, onMatrixGenerated }) => {
  const [templates, setTemplates] = useState<ExamMatrixTemplate[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('MOET_2025_TOAN');
  const [title, setTitle] = useState('Đề chuẩn Bộ GD&ĐT 2025 — Môn Toán THPT');
  const [domainCode, setDomainCode] = useState('EDUCATION');
  const [topicCode, setTopicCode] = useState('TOAN');
  const [targetLevel, setTargetLevel] = useState('K12');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [bloom, setBloom] = useState<ExamMatrixBloomWeights>(DEFAULT_BLOOM);
  const [sections, setSections] = useState<ExamMatrixSectionRule[]>([
    { code: 'PART_1', title: 'Phần I. Trắc nghiệm nhiều phương án lựa chọn', questionType: 'SINGLE', count: 12, pointsPerQuestion: 0.25 },
    { code: 'PART_2', title: 'Phần II. Trắc nghiệm Đúng / Sai (4 ý/câu)', questionType: 'MULTI_TRUE_FALSE', count: 4, pointsPerQuestion: 1.0 },
    { code: 'PART_3', title: 'Phần III. Trắc nghiệm trả lời ngắn', questionType: 'SHORT_ANSWER', count: 6, pointsPerQuestion: 0.5 },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [coverages, setCoverages] = useState<MatrixSectionCoverage[]>([]);

  const applyTemplate = (tpl: ExamMatrixTemplate) => {
    setSelectedCode(tpl.templateCode);
    setTitle(tpl.title);
    setDomainCode(tpl.domainCode);
    setTopicCode(tpl.topicCode);
    setTargetLevel(tpl.targetLevel || '');
    setDurationMinutes(tpl.durationMinutes);
    setBloom({ ...tpl.bloomWeights });
    setSections(tpl.sections.map((s) => ({ ...s })));
    setStatusMessage(null);
    setCoverages([]);
  };

  useEffect(() => {
    if (!isOpen) return;
    examMatrixService.getTemplates()
      .then((list) => {
        setTemplates(list);
        const initial = list.find((t) => t.templateCode === selectedCode) || list[0];
        if (initial) applyTemplate(initial);
      })
      .catch(() => setStatusMessage('Không tải được danh sách quy chuẩn từ máy chủ.'));
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedTemplate = templates.find((t) => t.templateCode === selectedCode);

  const handleSaveCompanyTemplate = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const code = selectedTemplate && !selectedTemplate.isSystemDefault
        ? selectedTemplate.templateCode
        : `COMP_${topicCode}_${Date.now().toString().slice(-4)}`;
      const saved = await examMatrixService.saveCustomTemplate({
        templateCode: code,
        title: title.trim() || `Quy chuẩn ${topicCode}`,
        category: 'COMPANY_POLICY',
        domainCode: domainCode.trim().toUpperCase(),
        topicCode: topicCode.trim().toUpperCase(),
        targetLevel: targetLevel.trim() || undefined,
        durationMinutes,
        isSystemDefault: false,
        bloomWeights: bloom,
        sections,
      });
      const updated = await examMatrixService.getTemplates();
      setTemplates(updated);
      applyTemplate(saved);
      setStatusMessage(`Đã lưu bộ quy chuẩn công ty "${saved.title}".`);
    } catch {
      setStatusMessage('Lưu bộ quy chuẩn thất bại. Kiểm tra đăng nhập hoặc quyền Tenant.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate || selectedTemplate.isSystemDefault) return;
    try {
      await examMatrixService.deleteCustomTemplate(selectedTemplate.templateCode);
      const updated = await examMatrixService.getTemplates();
      setTemplates(updated);
      if (updated[0]) applyTemplate(updated[0]);
      setStatusMessage('Đã xóa bộ quy chuẩn tùy chỉnh.');
    } catch {
      setStatusMessage('Không thể xóa bộ quy chuẩn.');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      const res = await examMatrixService.generateFromRealBank({
        templateCode: selectedCode,
        examTitle: title,
        domainCode,
        topicCode,
        targetLevel: targetLevel || undefined,
        durationMinutes,
        bloomWeights: bloom,
        sections,
      });
      setCoverages(res.sectionCoverages || []);

      if (!res.questions || res.questions.length === 0) {
        setStatusMessage(res.warningMessage || `Kho câu hỏi thật cho "${topicCode}" hiện chưa có câu hỏi phù hợp.`);
        return;
      }

      const mapped: ZenQuestionPreview[] = res.questions.map((q) => ({
        order: q.order,
        content: q.content,
        canonicalHash: q.questionId,
        isDuplicate: false,
        questionType: q.questionType,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        contextId: q.contextId,
        contextTitle: q.contextTitle,
        contextContent: q.contextContent,
      }));

      onMatrixGenerated({
        success: true,
        examTitle: res.examTitle,
        totalQuestions: mapped.length,
        duplicateCount: 0,
        uniqueCount: mapped.length,
        deduplicationRatePercentage: 0,
        questions: mapped,
      });

      if (res.missingTotal > 0 && res.warningMessage) {
        setStatusMessage(res.warningMessage);
      } else {
        onClose();
      }
    } catch {
      setStatusMessage('Lỗi khi gọi API sinh đề từ kho thật. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const bloomTotal = bloom.recall + bloom.comprehend + bloom.apply + bloom.highApply;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 text-slate-100">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              Sinh Đề Từ Kho Thật — Chuẩn Bộ GD&amp;ĐT &amp; Công Ty
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                REAL BANK
              </span>
            </h2>
            <p className="text-xs text-slate-400">Bốc câu hỏi thật từ kho theo Ma trận 3 phần GDPT 2025 hoặc Quy chuẩn riêng từng Công ty</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <select
              value={selectedCode}
              onChange={(e) => {
                const found = templates.find((t) => t.templateCode === e.target.value);
                if (found) applyTemplate(found);
              }}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:border-cyan-400 focus:outline-none"
            >
              <optgroup label="Chuẩn Bộ GD&ĐT (GDPT 2025)">
                {templates.filter((t) => t.category === 'MOET_2025').map((t) => (
                  <option key={t.templateCode} value={t.templateCode}>{t.title}</option>
                ))}
              </optgroup>
              <optgroup label="Quy chuẩn Công ty / Tổ chức">
                {templates.filter((t) => t.category !== 'MOET_2025').map((t) => (
                  <option key={t.templateCode} value={t.templateCode}>
                    {t.isSystemDefault ? '[Mẫu] ' : '[Công ty] '}{t.title}
                  </option>
                ))}
              </optgroup>
            </select>
            {selectedTemplate && !selectedTemplate.isSystemDefault && (
              <button type="button" onClick={handleDeleteTemplate} className="p-2 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" title="Xóa quy chuẩn này">
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên đề / Quy chuẩn" className="col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:border-cyan-400 focus:outline-none" />
            <input value={domainCode} onChange={(e) => setDomainCode(e.target.value.toUpperCase())} placeholder="Domain (EDUCATION/BANKING)" className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none" />
            <input value={topicCode} onChange={(e) => setTopicCode(e.target.value.toUpperCase())} placeholder="Mã môn (TOAN/VAT_LY)" className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-emerald-300 font-mono focus:border-cyan-400 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5">
              <GraduationCap size={14} className="text-indigo-400 shrink-0" />
              <input value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} placeholder="Khối / Cấp bậc (VD: K12, RM)" className="w-full bg-transparent text-white focus:outline-none" />
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5">
              <Building2 size={14} className="text-amber-400 shrink-0" />
              <span className="text-slate-400">Thời gian (phút):</span>
              <input type="number" min={5} max={240} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value) || 45)} className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-center text-white font-bold" />
            </div>
          </div>

          <MatrixSectionEditor sections={sections} onChange={setSections} />

          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="col-span-full flex items-center justify-between text-slate-300 font-bold">
              <span className="flex items-center gap-1"><Sliders size={12} className="text-indigo-400" /> Tỷ lệ Bloom (Tổng: {bloomTotal}%)</span>
            </div>
            {[
              { key: 'recall', label: 'Nhận biết' },
              { key: 'comprehend', label: 'Thông hiểu' },
              { key: 'apply', label: 'Vận dụng' },
              { key: 'highApply', label: 'Vận dụng cao' },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between bg-slate-900 rounded-lg px-2 py-1 border border-slate-800">
                <span className="text-slate-400">{item.label}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bloom[item.key as keyof ExamMatrixBloomWeights]}
                  onChange={(e) => setBloom({ ...bloom, [item.key]: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-12 bg-transparent text-right font-bold text-cyan-300 focus:outline-none"
                />
              </label>
            ))}
          </div>

          {statusMessage && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-amber-200 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p>{statusMessage}</p>
                {coverages.length > 0 && (
                  <p className="text-[11px] text-amber-300/80 mt-1">
                    {coverages.map((c) => `${c.sectionTitle}: ${c.matchedCount}/${c.requestedCount}`).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveCompanyTemplate}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Lưu Quy Chuẩn Công Ty
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-3 py-2 font-semibold text-slate-400 hover:text-white transition">Đóng</button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-black shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {isGenerating ? 'Đang bốc đề thật...' : 'Sinh Đề Từ Kho Thật'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
