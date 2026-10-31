import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Sliders, 
  BookOpen, 
  Layers 
} from 'lucide-react';
import { 
  parsingRulesService, 
  type QuestionParsingRule, 
  type ParseSnippetResponse,
  type AiRuleAutopilotResponse 
} from '@/services/parsing-rules.service';
import { CigRuleEditorModal } from './CigRuleEditorModal';
import { DocumentStructureDictionaryTab } from './DocumentStructureDictionaryTab';
import { RuleStudioHeader } from './studio/RuleStudioHeader';
import { RuleSandboxPanel, PRESET_SNIPPETS } from './studio/RuleSandboxPanel';
import { RuleRegistryGrid } from './studio/RuleRegistryGrid';
import { DEFAULT_CLIENT_RULES } from './studio/defaultRules';

export const RuleStudioTab: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'sandbox' | 'rules' | 'taxonomy'>('sandbox');
  const [rules, setRules] = useState<QuestionParsingRule[]>(DEFAULT_CLIENT_RULES);
  const [loadingRules, setLoadingRules] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sandbox states
  const [snippetText, setSnippetText] = useState<string>(PRESET_SNIPPETS.R_GEN_DIRECTIVE_TEST);
  const [examHint, setExamHint] = useState<string>('');
  const [selectedRuleCode, setSelectedRuleCode] = useState<string>('GENERAL_UNIVERSAL_INGESTION');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseSnippetResponse | null>(null);

  // AI Autopilot states
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiAutopilotResult, setAiAutopilotResult] = useState<AiRuleAutopilotResponse | null>(null);
  const [isSavingRule, setIsSavingRule] = useState<boolean>(false);

  // Modal editor
  const [editingRule, setEditingRule] = useState<QuestionParsingRule | null>(null);

  const fetchRules = async () => {
    setLoadingRules(true);
    try {
      const data = await parsingRulesService.getAllRules();
      if (data && data.rules && data.rules.length > 0) {
        setRules(data.rules);
      }
    } catch {
      setRules(DEFAULT_CLIENT_RULES);
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleReloadEngine = async () => {
    setLoadingRules(true);
    try {
      const res = await parsingRulesService.reloadRules();
      setStatusMessage(`✨ ${res.message}`);
      await fetchRules();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      setStatusMessage('⚡ Đã nạp lại 14 bộ quy tắc chuẩn trong bộ nhớ cục bộ.');
      setRules(DEFAULT_CLIENT_RULES);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleResetAndReseed = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ quy tắc cũ trong CSDL và tái nạp 14 quy tắc chuẩn mới (PISA v7.0)?')) return;
    setLoadingRules(true);
    try {
      const res = await parsingRulesService.resetAndReseedRules();
      setStatusMessage(`✨ ${res.message}`);
      await fetchRules();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch {
      setStatusMessage('⚡ Đã thiết lập lại bộ quy tắc chuẩn cục bộ.');
      setRules(DEFAULT_CLIENT_RULES);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleDeleteRule = async (ruleCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa quy tắc [${ruleCode}]?`)) return;
    try {
      await parsingRulesService.deleteRule(ruleCode);
      setStatusMessage(`✨ Đã xóa quy tắc [${ruleCode}] thành công!`);
      await fetchRules();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      setStatusMessage('❌ Không thể xóa quy tắc.');
    }
  };

  const handleSaveModalRule = async (updatedRule: QuestionParsingRule) => {
    await parsingRulesService.saveCustomRule(updatedRule);
    setStatusMessage(`✨ Đã cập nhật và kích hoạt quy tắc [${updatedRule.ruleCode}] (0ms Hot-Reload)!`);
    await fetchRules();
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleRunSnippetTest = async () => {
    if (!snippetText.trim()) return;
    setIsParsing(true);
    try {
      const result = await parsingRulesService.testSnippet(snippetText, selectedRuleCode || undefined);
      setParseResult(result);
    } catch {
      setStatusMessage('❌ Không thể phân tích đoạn văn bản.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAiAutopilot = async () => {
    if (!snippetText.trim()) return;
    setIsAiGenerating(true);
    setAiAutopilotResult(null);
    try {
      const response = await parsingRulesService.aiGenerateRule({
        snippetText,
        examHint: examHint.trim() || undefined
      });
      setAiAutopilotResult(response);
      if (response.testedParseResult) {
        setParseResult(response.testedParseResult);
      }
      setStatusMessage(`🤖 AI Autopilot đã suy diễn quy tắc thành công! (Độ tin cậy: ${response.confidenceScore}%)`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch {
      setStatusMessage('⚠️ AI Autopilot tạm thời không khả dụng.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSaveCustomRule = async () => {
    if (!aiAutopilotResult?.generatedRule) return;
    setIsSavingRule(true);
    try {
      const res = await parsingRulesService.saveCustomRule(aiAutopilotResult.generatedRule);
      setStatusMessage(`✨ ${res.message}`);
      await fetchRules();
      setSelectedRuleCode(aiAutopilotResult.generatedRule.ruleCode);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch {
      setStatusMessage('❌ Lưu quy tắc thất bại.');
    } finally {
      setIsSavingRule(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Status banner */}
      {statusMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-400 text-sm font-bold flex items-center gap-2 animate-in fade-in duration-300">
          <CheckCircle2 size={18} />
          {statusMessage}
        </div>
      )}

      {/* Header Banner */}
      <RuleStudioHeader
        loadingRules={loadingRules}
        onReloadEngine={handleReloadEngine}
        onResetAndReseed={handleResetAndReseed}
      />

      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveMainTab('sandbox')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeMainTab === 'sandbox' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sliders size={15} /> 1. Live Sandbox & AI Autopilot
        </button>
        <button
          onClick={() => setActiveMainTab('rules')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeMainTab === 'rules' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <BookOpen size={15} /> 2. Quản Lý Quy Tắc CIG 4 Chiều ({rules.length})
        </button>
        <button
          onClick={() => setActiveMainTab('taxonomy')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeMainTab === 'taxonomy' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Layers size={15} /> 3. Từ Điển Cấu Trúc Toàn Diện (Taxonomy)
        </button>
      </div>

      {/* Tab 3: Document Structure Dictionary */}
      {activeMainTab === 'taxonomy' && <DocumentStructureDictionaryTab />}

      {/* Tab 1: Live Sandbox */}
      {activeMainTab === 'sandbox' && (
        <RuleSandboxPanel
          rules={rules}
          snippetText={snippetText}
          setSnippetText={setSnippetText}
          examHint={examHint}
          setExamHint={setExamHint}
          selectedRuleCode={selectedRuleCode}
          setSelectedRuleCode={setSelectedRuleCode}
          isParsing={isParsing}
          isAiGenerating={isAiGenerating}
          isSavingRule={isSavingRule}
          parseResult={parseResult}
          aiAutopilotResult={aiAutopilotResult}
          onRunTest={handleRunSnippetTest}
          onAiAutopilot={handleAiAutopilot}
          onSaveCustomRule={handleSaveCustomRule}
        />
      )}

      {/* Tab 2: Rules Registry Cards Section */}
      {(activeMainTab === 'rules' || activeMainTab === 'sandbox') && (
        <RuleRegistryGrid
          rules={rules}
          onEditRule={(rule) => setEditingRule(rule)}
          onDeleteRule={handleDeleteRule}
        />
      )}

      {/* Visual Rule Editor Modal */}
      {editingRule && (
        <CigRuleEditorModal
          rule={editingRule}
          isOpen={!!editingRule}
          onClose={() => setEditingRule(null)}
          onSave={handleSaveModalRule}
        />
      )}
    </div>
  );
};
