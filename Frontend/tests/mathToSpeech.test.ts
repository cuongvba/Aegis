import { describe, expect, it } from 'vitest';
import { latexToSpeech } from '../src/components/kids/mathToSpeech';

describe('latexToSpeech', () => {
  it('converts Vietnamese math expressions into natural spoken Vietnamese', () => {
    const res = latexToSpeech('Tìm nghiệm của $x^2 + \\frac{1}{2} = \\sqrt{9}$ với $\\forall x \\in \\mathbb{R}$.', 'vi');
    expect(res).toContain('x bình phương');
    expect(res).toContain('1 phần 2');
    expect(res).toContain('căn bậc hai của 9');
    expect(res).toContain('với mọi x thuộc R');
    expect(res).not.toContain('$');
  });

  it('converts integrals and Greek letters in English', () => {
    const res = latexToSpeech('Evaluate $\\int_{0}^{1} \\alpha x^3 dx \\le \\pi$.', 'en-US');
    expect(res).toContain('integral from 0 to 1 of');
    expect(res).toContain('alpha');
    expect(res).toContain('x cubed');
    expect(res).toContain('less than or equal to pi');
  });
});
