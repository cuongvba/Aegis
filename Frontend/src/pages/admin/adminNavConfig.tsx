import React from 'react';
import {
  LayoutDashboard,
  FileQuestion,
  BookOpen,
  Users,
  CreditCard,
  FileText,
  Atom,
  Brain,
  Zap,
  Network,
  Building2,
  Palette,
  Cpu
} from 'lucide-react';
import { FeatureKey, type FeatureKeyType } from '@/types/entitlement';

export interface AdminNavDef {
  href: string;
  i18nKey: string;
  defaultLabel: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  feature?: FeatureKeyType;
}

export interface AdminNavGroup {
  id: string;
  titleKey: string;
  defaultTitle: string;
  items: AdminNavDef[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'OPERATIONS',
    titleKey: 'nav.groupOperations',
    defaultTitle: 'ĐIỀU HÀNH & TÀI CHÍNH',
    items: [
      { href: '/admin', i18nKey: 'nav.overview', defaultLabel: 'Tổng quan Hệ thống', icon: <LayoutDashboard size={17} /> },
      { href: '/admin/payments', i18nKey: 'nav.payments', defaultLabel: 'Doanh thu & Đối soát', icon: <CreditCard size={17} />, adminOnly: true },
    ],
  },
  {
    id: 'KNOWLEDGE',
    titleKey: 'nav.groupKnowledge',
    defaultTitle: 'TRI THỨC & KHẢO THÍ',
    items: [
      { href: '/admin/questions', i18nKey: 'nav.questionBank', defaultLabel: 'Ngân hàng Câu hỏi', icon: <FileQuestion size={17} /> },
      { href: '/admin/topics', i18nKey: 'nav.topicTree', defaultLabel: 'Cây Phân Cấp Chủ Đề', icon: <Network size={17} /> },
      { href: '/admin/exams', i18nKey: 'nav.exams', defaultLabel: 'Đề thi & Phòng thi', icon: <FileText size={17} /> },
      { href: '/admin/notebooks', i18nKey: 'nav.notebooks', defaultLabel: 'Giáo trình (PDF RAG)', icon: <BookOpen size={17} />, adminOnly: true },
    ],
  },
  {
    id: 'AI_SWARM',
    titleKey: 'nav.groupAi',
    defaultTitle: 'TRÍ TUỆ NHÂN TẠO BIỆN CHỨNG',
    items: [
      { href: '/admin/ai-settings', i18nKey: 'nav.aiSettings', defaultLabel: 'Bầy Sói AI & FinOps', icon: <Brain size={17} />, adminOnly: true, feature: FeatureKey.AiSymposium },
      { href: '/admin/symposium', i18nKey: 'nav.symposium', defaultLabel: 'Đại Hội Thảo AI', icon: <Atom size={17} />, feature: FeatureKey.AiSymposium },
      { href: '/admin/prompt-forge', i18nKey: 'nav.promptForge', defaultLabel: 'Xưởng Prompt Tầng 0', icon: <Zap size={17} />, adminOnly: true, feature: FeatureKey.AiSymposium },
      { href: '/admin/parsing-rules', i18nKey: 'nav.parsingRules', defaultLabel: 'Quy Tắc Bóc Tách CIG', icon: <Cpu size={17} />, adminOnly: true },
    ],
  },
  {
    id: 'ENTERPRISE',
    titleKey: 'nav.groupEnterprise',
    defaultTitle: 'PHÁO ĐÀI DOANH NGHIỆP',
    items: [
      { href: '/admin/tenants', i18nKey: 'nav.tenants', defaultLabel: 'Khách thuê & Nhãn trắng', icon: <Building2 size={17} />, adminOnly: true },
      { href: '/admin/org-units', i18nKey: 'nav.orgUnits', defaultLabel: 'Cây Cơ Cấu Tổ Chức O(1)', icon: <Network size={17} />, adminOnly: true, feature: FeatureKey.HierarchyTree },
      { href: '/admin/users', i18nKey: 'nav.users', defaultLabel: 'Người dùng & Phân quyền IAM', icon: <Users size={17} />, adminOnly: true },
      { href: '/admin/white-label', i18nKey: 'nav.whiteLabel', defaultLabel: 'Bản sắc Thương hiệu', icon: <Palette size={17} />, adminOnly: true, feature: FeatureKey.WhiteLabelTheming },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavDef[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);
