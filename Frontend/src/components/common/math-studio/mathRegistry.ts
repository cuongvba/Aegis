import {
  MATH_STUDIO_CATEGORIES,
  type MathCategory,
  type MathTemplateItem,
} from './mathTemplates';

/**
 * [Open-Closed Principle (OCP) Math Registry]
 * Hệ thống mở rộng danh mục công thức toán học/khoa học không giới hạn.
 * Cho phép các module độc lập (Vật lý, Hóa học nâng cao, Kỹ thuật số, Thống kê sinh học...)
 * tự do đăng ký thêm palette mà không cần sửa đổi mã nguồn render cốt lõi.
 */
class MathCategoryRegistry {
  private categories: Map<string, MathCategory> = new Map();

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults(): void {
    this.categories.clear();
    for (const cat of MATH_STUDIO_CATEGORIES) {
      this.categories.set(cat.id, { ...cat, items: [...cat.items] });
    }
  }

  public getAll(): MathCategory[] {
    return Array.from(this.categories.values());
  }

  public getById(id: string): MathCategory | undefined {
    return this.categories.get(id);
  }

  public registerCategory(category: MathCategory): void {
    if (this.categories.has(category.id)) {
      const existing = this.categories.get(category.id)!;
      // Merge items if already present (dedup by id)
      const existingIds = new Set(existing.items.map(i => i.id));
      const newItems = category.items.filter(i => !existingIds.has(i.id));
      existing.items.push(...newItems);
    } else {
      this.categories.set(category.id, { ...category, items: [...category.items] });
    }
  }

  public registerItem(categoryId: string, item: MathTemplateItem): void {
    const cat = this.categories.get(categoryId);
    if (cat) {
      if (!cat.items.some(i => i.id === item.id)) {
        cat.items.push(item);
      }
    }
  }
}

export const mathRegistry = new MathCategoryRegistry();

