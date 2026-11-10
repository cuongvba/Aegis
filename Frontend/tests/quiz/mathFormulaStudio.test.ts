import { describe, it, expect, beforeEach } from 'vitest';
import katex from 'katex';
import { MATH_STUDIO_CATEGORIES } from '../../src/components/common/math-studio/mathTemplates';
import { mathRegistry } from '../../src/components/common/math-studio/mathRegistry';

describe('MathFormulaStudio Categories & Templates', () => {
  beforeEach(() => {
    mathRegistry.resetToDefaults();
  });

  it('should contain comprehensive math categories', () => {
    const categoryIds = MATH_STUDIO_CATEGORIES.map(c => c.id);
    expect(categoryIds).toContain('basic');
    expect(categoryIds).toContain('calculus');
    expect(categoryIds).toContain('trig');
    expect(categoryIds).toContain('geometry');
    expect(categoryIds).toContain('systems');
    expect(categoryIds).toContain('stats');
    expect(categoryIds).toContain('sets_logic');
    expect(categoryIds).toContain('greek');
    expect(categoryIds).toContain('chemistry');
    expect(categoryIds).toContain('templates');
  });

  it('should ensure all math template items render valid KaTeX without throwing', () => {
    for (const cat of MATH_STUDIO_CATEGORIES) {
      if (cat.id === 'chemistry') continue; // mhchem handled in runtime
      for (const item of cat.items) {
        expect(() => {
          katex.renderToString(item.label, { throwOnError: true });
        }).not.toThrow();
      }
    }
  });

  it('should properly format inline and block formulas', () => {
    const rawFormula = '\\frac{a}{b} + \\sqrt{x}';
    const inlineFormatted = `$${rawFormula}$`;
    const blockFormatted = `$$${rawFormula}$$`;

    expect(inlineFormatted.startsWith('$') && inlineFormatted.endsWith('$')).toBe(true);
    expect(blockFormatted.startsWith('$$') && blockFormatted.endsWith('$$')).toBe(true);

    const renderedInline = katex.renderToString(rawFormula, { displayMode: false });
    const renderedBlock = katex.renderToString(rawFormula, { displayMode: true });

    expect(renderedInline).toContain('katex');
    expect(renderedBlock).toContain('katex-display');
  });

  it('should support Open-Closed Principle (OCP) via dynamic category registration', () => {
    const initialCount = mathRegistry.getAll().length;

    // Register a new domain category (e.g., Quantum Physics)
    mathRegistry.registerCategory({
      id: 'quantum_physics',
      title: 'Vật lý Lượng tử',
      iconName: 'Atom',
      items: [
        {
          id: 'schrodinger',
          label: 'i\\hbar \\frac{\\partial}{\\partial t} \\Psi',
          latex: 'i\\hbar \\frac{\\partial}{\\partial t} \\Psi = \\hat{H}\\Psi',
          description: 'Phương trình Schrödinger',
        },
      ],
    });

    const updated = mathRegistry.getAll();
    expect(updated.length).toBe(initialCount + 1);
    expect(mathRegistry.getById('quantum_physics')).toBeDefined();
    expect(mathRegistry.getById('quantum_physics')?.items[0].id).toBe('schrodinger');
  });
});
