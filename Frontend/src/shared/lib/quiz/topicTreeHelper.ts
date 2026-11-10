import type { BankTopic } from '@/pages/admin/questions/types';
import type { LearnerQuestion } from '@/types/quiz';

export interface HierarchicalTopicNode extends BankTopic {
  children: HierarchicalTopicNode[];
  level: number;
  directQuestionCount: number;
  totalQuestionCount: number;
  descendantCodes: string[];
  inferredParentId?: string;
}

/**
 * Kiểm tra một câu hỏi có thuộc về mã chủ đề `topicCode` hay không
 * (hỗ trợ cả CategoryCode trực tiếp, Tags #topic, LinkedTopicCodes và nhánh đóng góp Cộng đồng COM_*)
 */
export function doesQuestionMatchTopicCode(
  q: Partial<LearnerQuestion> & { categoryCode?: string; linkedTopicCodes?: string[] },
  topicCode: string
): boolean {
  if (!topicCode) return false;
  const target = topicCode.trim().toUpperCase();
  if (!target) return false;

  const qTopic = (q.topicCode || '').trim().toUpperCase();
  const qCat = (q.categoryCode || '').trim().toUpperCase();
  if (qTopic === target || qCat === target) return true;

  // Hỗ trợ kiểm tra qua Tags (#CODE, #topic:CODE, CODE)
  const tagTarget1 = `#${target}`;
  const tagTarget2 = `#TOPIC:${target}`;
  if (Array.isArray(q.tags)) {
    for (const rawTag of q.tags) {
      const t = (rawTag || '').trim().toUpperCase();
      if (t === target || t === tagTarget1 || t === tagTarget2) return true;
    }
  }

  // Hỗ trợ LinkedTopicCodes
  if (Array.isArray(q.linkedTopicCodes)) {
    if (q.linkedTopicCodes.some((c) => (c || '').trim().toUpperCase() === target)) {
      return true;
    }
  }

  // Hỗ trợ Materialized TreePath trên câu hỏi
  if (q.treePath && q.treePath.toUpperCase().includes(`/${target}/`)) {
    return true;
  }

  // Hỗ trợ nhánh Cộng đồng COM_{SourceCode} ánh xạ từ đề gốc
  if (target.startsWith('COM_') && target.length > 4) {
    const sourceCode = target.substring(4);
    if (qTopic === sourceCode || qCat === sourceCode) return true;
  }

  return false;
}

/**
 * Tự động suy luận `parentId` nếu dữ liệu cũ thiếu `parentId` nhưng có `materializedPath` hoặc tiền tố chuẩn
 */
function resolveEffectiveParentId(topic: BankTopic, allTopics: BankTopic[]): string | undefined {
  const byId = new Map(allTopics.map((t) => [t.id, t]));
  if (topic.parentId && byId.has(topic.parentId) && topic.parentId !== topic.id) {
    return topic.parentId;
  }

  const byCode = new Map(allTopics.map((t) => [t.code.toUpperCase(), t]));
  const codeUpper = topic.code.toUpperCase();

  // 1. Suy luận từ MaterializedPath (vd: /STUDIO/20261105/CRTEC4DD2/TP4C914D34/)
  if (topic.materializedPath) {
    const segments = topic.materializedPath
      .split('/')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (segments.length >= 2) {
      const parentSeg = segments[segments.length - 2];
      // Thử khớp trực tiếp mã cha hoặc tổ hợp STUDIO_YYYYMMDD_CRT
      if (byCode.has(parentSeg) && byCode.get(parentSeg)!.id !== topic.id) {
        return byCode.get(parentSeg)!.id;
      }
      if (segments[0] === 'STUDIO' && segments.length >= 3) {
        const candidateCreatorCode = `STUDIO_${segments[1]}_${segments[2]}`;
        if (segments.length === 4 && byCode.has(candidateCreatorCode)) {
          return byCode.get(candidateCreatorCode)!.id;
        }
        const candidateDateCode = `STUDIO_${segments[1]}`;
        if (segments.length === 3 && byCode.has(candidateDateCode)) {
          return byCode.get(candidateDateCode)!.id;
        }
      }
    }
  }

  // 2. Suy luận từ quy ước tiền tố mã (COM_*, STUDIO_YYYYMMDD_CRT*, STUDIO_YYYYMMDD)
  if (codeUpper.startsWith('COM_') && codeUpper !== 'COMMUNITY' && byCode.has('COMMUNITY')) {
    return byCode.get('COMMUNITY')!.id;
  }

  const studioCreatorMatch = codeUpper.match(/^(STUDIO_\d{8})_.+$/);
  if (studioCreatorMatch && byCode.has(studioCreatorMatch[1])) {
    return byCode.get(studioCreatorMatch[1])!.id;
  }

  if (/^STUDIO_\d{8}$/.test(codeUpper) && byCode.has('STUDIO')) {
    return byCode.get('STUDIO')!.id;
  }

  // 3. Suy luận tiền tố phân cấp chung có dấu gạch dưới (vd: TOAN12_CHUONG1_BAI1 -> TOAN12_CHUONG1 -> TOAN12)
  if (codeUpper.includes('_')) {
    const parts = codeUpper.split('_');
    for (let i = parts.length - 1; i >= 1; i--) {
      const prefix = parts.slice(0, i).join('_');
      const candidate = byCode.get(prefix);
      if (candidate && candidate.id !== topic.id) {
        return candidate.id;
      }
    }
  }

  return undefined;
}

/**
 * Xây dựng Cây Chủ Đề Phân Cấp (Hierarchical Topic Tree) kèm cộng dồn số lượng câu hỏi (Roll-up Count)
 */
export function buildHierarchicalTopicTree(
  topics: BankTopic[],
  questions: Array<Partial<LearnerQuestion> & { id?: string; categoryCode?: string }> = []
): {
  roots: HierarchicalTopicNode[];
  nodeById: Map<string, HierarchicalTopicNode>;
  nodeByCode: Map<string, HierarchicalTopicNode>;
  allParentIds: Set<string>;
} {
  const nodeById = new Map<string, HierarchicalTopicNode>();
  const nodeByCode = new Map<string, HierarchicalTopicNode>();
  const allParentIds = new Set<string>();

  // Khởi tạo toàn bộ node
  for (const top of topics) {
    const directMatches = questions.length > 0
      ? questions.filter((q) => doesQuestionMatchTopicCode(q, top.code)).length
      : (top.questionCountCached || 0);

    const node: HierarchicalTopicNode = {
      ...top,
      children: [],
      level: 0,
      directQuestionCount: directMatches,
      totalQuestionCount: directMatches,
      descendantCodes: [top.code],
      inferredParentId: resolveEffectiveParentId(top, topics),
    };
    nodeById.set(top.id, node);
    nodeByCode.set(top.code.toUpperCase(), node);
  }

  const roots: HierarchicalTopicNode[] = [];

  // Liên kết Cha -> Con (chống chu trình lặp)
  for (const top of topics) {
    const node = nodeById.get(top.id)!;
    const pid = node.inferredParentId;

    if (pid && nodeById.has(pid) && pid !== node.id) {
      // Kiểm tra chống chu trình
      let curr: string | undefined = pid;
      let hasCycle = false;
      const visited = new Set<string>([node.id]);
      while (curr) {
        if (visited.has(curr)) {
          hasCycle = true;
          break;
        }
        visited.add(curr);
        curr = nodeById.get(curr)?.inferredParentId;
      }

      if (!hasCycle) {
        const parent = nodeById.get(pid)!;
        parent.children.push(node);
        allParentIds.add(parent.id);
        continue;
      }
    }
    roots.push(node);
  }

  // Đệ quy tính level, descendantCodes và Roll-up totalQuestionCount (khử trùng lặp câu hỏi theo id)
  function computeSubtreeMetrics(node: HierarchicalTopicNode, level: number): Set<string> {
    node.level = level;
    const descCodes = new Set<string>([node.code]);
    const matchedQuestionIds = new Set<string>();

    if (questions.length > 0) {
      questions.forEach((q, idx) => {
        if (doesQuestionMatchTopicCode(q, node.code)) {
          matchedQuestionIds.add(q.id || `${node.code}_${idx}`);
        }
      });
    }

    // Sắp xếp con theo thứ tự tự nhiên
    node.children.sort((a, b) =>
      a.code.localeCompare(b.code, 'vi', { numeric: true, sensitivity: 'base' })
    );

    let fallbackCachedSum = node.directQuestionCount;
    for (const child of node.children) {
      const childQIds = computeSubtreeMetrics(child, level + 1);
      child.descendantCodes.forEach((c) => descCodes.add(c));
      childQIds.forEach((qid) => matchedQuestionIds.add(qid));
      fallbackCachedSum += child.totalQuestionCount;
    }

    node.descendantCodes = Array.from(descCodes);
    node.totalQuestionCount = questions.length > 0 ? matchedQuestionIds.size : fallbackCachedSum;
    return matchedQuestionIds;
  }

  roots.sort((a, b) => {
    const priority = (code: string) =>
      code === 'STUDIO' ? 0 : code === 'COMMUNITY' ? 1 : 2;
    const pa = priority(a.code.toUpperCase());
    const pb = priority(b.code.toUpperCase());
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' });
  });

  for (const r of roots) {
    computeSubtreeMetrics(r, 0);
  }

  return { roots, nodeById, nodeByCode, allParentIds };
}

/**
 * Lấy toàn bộ câu hỏi thuộc một chủ đề HOẶC bất kỳ chủ đề con/cháu nào trong nhánh của nó
 */
export function getQuestionsForTopicSubtree<T extends Partial<LearnerQuestion> & { categoryCode?: string }>(
  topicCodeOrId: string,
  topics: BankTopic[],
  questions: T[]
): T[] {
  if (!topicCodeOrId) return questions;
  const { nodeById, nodeByCode } = buildHierarchicalTopicTree(topics, questions);
  const targetNode =
    nodeById.get(topicCodeOrId) ||
    nodeByCode.get(topicCodeOrId.trim().toUpperCase());

  const codesToMatch = targetNode ? targetNode.descendantCodes : [topicCodeOrId];
  return questions.filter((q) => codesToMatch.some((code) => doesQuestionMatchTopicCode(q, code)));
}

/**
 * Làm phẳng cây chủ đề thành danh sách hiển thị có ký hiệu nhánh cây (`├─`, `└─`) cho `<select>`
 */
export function flattenTopicTreeForSelect(
  topics: BankTopic[],
  questions: Array<Partial<LearnerQuestion> & { id?: string; categoryCode?: string }> = []
): Array<{ topic: HierarchicalTopicNode; label: string; indentPrefix: string }> {
  const { roots } = buildHierarchicalTopicTree(topics, questions);
  const result: Array<{ topic: HierarchicalTopicNode; label: string; indentPrefix: string }> = [];

  function walk(nodes: HierarchicalTopicNode[], prefix = '') {
    nodes.forEach((node, idx) => {
      const isLast = idx === nodes.length - 1;
      const branchSymbol = node.level === 0 ? '' : isLast ? '└─ ' : '├─ ';
      const indentPrefix = node.level === 0 ? '' : `${prefix}${branchSymbol}`;
      const countText = `${node.totalQuestionCount} câu`;
      result.push({
        topic: node,
        indentPrefix,
        label: `${indentPrefix}${node.name} (${node.code} • ${countText})`,
      });
      if (node.children.length > 0) {
        const nextPrefix = node.level === 0 ? '' : `${prefix}${isLast ? '   ' : '│  '}`;
        walk(node.children, nextPrefix);
      }
    });
  }

  walk(roots);
  return result;
}

