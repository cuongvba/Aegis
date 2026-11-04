// ─── AEGIS SOVEREIGN ERROR VAULT & FSRS v5 REPETITION SERVICE ───────────────
export interface ErrorVaultItem {
  id: string;
  questionId: string;
  examId?: string;
  content: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  category: string;
  distractorMisconception?: string;
  addedAt: string;
  lastReviewedAt?: string;
  repetitionStage: number; // 0: ngày 1, 1: ngày 3, 2: ngày 7, 3: Đã thuần thục
  nextReviewDate: string;
  status: 'PENDING' | 'LEARNING' | 'MASTERED';
}

const STORAGE_KEY = 'aegis_error_vault_items';

export const errorVaultService = {
  getItems(): ErrorVaultItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addItem(item: Omit<ErrorVaultItem, 'addedAt' | 'repetitionStage' | 'nextReviewDate' | 'status'>): ErrorVaultItem {
    const items = this.getItems();
    const existingIdx = items.findIndex((x) => x.questionId === item.questionId);
    
    // Tính ngày ôn tiếp theo: ngày mai (+1 ngày)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);

    const newItem: ErrorVaultItem = {
      ...item,
      addedAt: new Date().toISOString(),
      repetitionStage: 0,
      nextReviewDate: nextDate.toISOString(),
      status: 'LEARNING',
    };

    if (existingIdx >= 0) {
      items[existingIdx] = newItem;
    } else {
      items.unshift(newItem);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Lỗi lưu ErrorVault:', e);
    }
    return newItem;
  },

  promoteItem(questionId: string): void {
    const items = this.getItems();
    const idx = items.findIndex((x) => x.questionId === questionId);
    if (idx === -1) return;

    const it = items[idx];
    const intervals = [1, 3, 7]; // FSRS Spaced Repetition Days
    it.repetitionStage += 1;
    it.lastReviewedAt = new Date().toISOString();

    if (it.repetitionStage >= intervals.length) {
      it.status = 'MASTERED';
    } else {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + intervals[it.repetitionStage]);
      it.nextReviewDate = nextDate.toISOString();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  isSaved(questionId: string): boolean {
    const items = this.getItems();
    return items.some((x) => x.questionId === questionId);
  },

  getDueItems(): ErrorVaultItem[] {
    const now = new Date();
    return this.getItems().filter(
      (x) => x.status !== 'MASTERED' && new Date(x.nextReviewDate) <= now
    );
  },
};

