import api from '@/services/api';

export interface MathTypeClipboardResponse {
  success: boolean;
  source?: string;
  formulas: string[];
  singleLatex: string | null;
}

/**
 * Trích xuất các khối dữ liệu nhị phân Hex của đối tượng MathType từ luồng text/rtf của Microsoft Word.
 * Mỗi đối tượng MathType trong RTF có 1 khối \objdata (chứa OLE Equation Native MTEF v5) và/hoặc \wmetafile8.
 */
export function extractMathTypeRtfHexChunks(rtf: string): string[] {
  if (!rtf || rtf.length < 64) return [];
  const chunks: string[] = [];

  // 1. Ưu tiên trích xuất từng khối \objdata (1-1 với mỗi đối tượng OLE MathType trong câu)
  const objDataRegex = /\\objdata\b[\s\r\n]+([0-9a-fA-F\s\r\n]{64,})/g;
  let match: RegExpExecArray | null;
  while ((match = objDataRegex.exec(rtf)) !== null) {
    const cleanHex = match[1].replace(/[^0-9a-fA-F]/g, '');
    if (cleanHex.length >= 64) {
      chunks.push(cleanHex);
    }
  }
  if (chunks.length > 0) return chunks;

  // 2. Fallback: Nếu RTF chỉ nhúng \wmetafile8 mà không bọc \objdata
  const wmfRegex = /\\wmetafile\d*[^}\\]{0,120}?[\s\r\n]+([0-9a-fA-F\s\r\n]{128,})/g;
  while ((match = wmfRegex.exec(rtf)) !== null) {
    const cleanHex = match[1].replace(/[^0-9a-fA-F]/g, '');
    if (cleanHex.length >= 128) {
      chunks.push(cleanHex);
    }
  }

  return chunks;
}

/**
 * Nhận diện dấu vân tay của đối tượng MathType OLE trong luồng text/html từ Microsoft Word
 * (<v:shape ... o:ole="">, file:///.../clip_image001.wmz, Equation.DSMT4).
 */
export function extractWordMathTypeHtmlMetadata(html: string): {
  hasMathTypeOle: boolean;
  localWmzPaths: string[];
} {
  if (!html) return { hasMathTypeOle: false, localWmzPaths: [] };

  const hasOleAttr = /\bo:ole\b/i.test(html) || /Equation\.DSMT/i.test(html);
  const wmzMatches = [...html.matchAll(/src=["'](file:\/\/\/[^"']+\.(?:wmz|wmf|emz))["']/gi)];
  const localWmzPaths = wmzMatches.map(m => m[1]);

  return {
    hasMathTypeOle: hasOleAttr || localWmzPaths.length > 0,
    localWmzPaths,
  };
}

/**
 * Phân tích đặc trưng điểm ảnh (Pixel Distribution Signature) trong < 2ms để phân biệt:
 * - Ảnh chụp công thức toán học / đối tượng MathType rời (Nét mực đen/xám trên nền trắng/trong suốt, kích thước vừa phải)
 * - Ảnh minh họa màu / Tranh ảnh hoạt hình / Biểu đồ màu (Có tỷ lệ điểm ảnh đa sắc cao hoặc kích thước lớn)
 */
export async function inspectImageMathSignature(
  file: Blob,
  dataUri: string
): Promise<{ isLikelyFormula: boolean }> {
  return new Promise(resolve => {
    const img = new Image();
    img.onerror = () => resolve({ isLikelyFormula: false });
    img.onload = () => {
      const { width, height } = img;
      // Công thức toán học đơn lẻ hoặc hệ phương trình thường có chiều cao <= 380px
      if (width < 12 || height < 10 || height > 380 || width > 1600) {
        resolve({ isLikelyFormula: false });
        return;
      }

      const sampleW = Math.min(width, 240);
      const sampleH = Math.min(height, 120);
      const canvas = document.createElement('canvas');
      canvas.width = sampleW;
      canvas.height = sampleH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ isLikelyFormula: false });
        return;
      }

      ctx.drawImage(img, 0, 0, sampleW, sampleH);
      const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
      const totalPixels = sampleW * sampleH;
      let colorfulPixels = 0;
      let bgPixels = 0;
      let inkPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 45 || (r > 235 && g > 235 && b > 235)) {
          bgPixels++;
          continue;
        }

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        if (maxC - minC > 32) {
          colorfulPixels++;
        }
        if (r < 195 || g < 195 || b < 195) {
          inkPixels++;
        }
      }

      const colorfulRatio = colorfulPixels / totalPixels;
      const bgRatio = bgPixels / totalPixels;
      const inkRatio = inkPixels / totalPixels;

      // Công thức MathType: hầu như đơn sắc (colorfulRatio < 3.5%), nền sáng/trong suốt (> 50%), mật độ nét chữ 0.5% - 42%
      const isLikelyFormula =
        colorfulRatio < 0.035 &&
        bgRatio >= 0.50 &&
        inkRatio >= 0.005 &&
        inkRatio <= 0.42;

      resolve({ isLikelyFormula });
    };
    img.src = dataUri;
  });
}

export async function transpileClipboardMathTypeViaApi(payload: {
  rtfHexChunks?: string[];
  localWmzPaths?: string[];
  imageDataUri?: string;
}): Promise<MathTypeClipboardResponse> {
  try {
    const res = await api.post<MathTypeClipboardResponse>(
      '/api/quiz/questions/clipboard-mathtype',
      payload
    );
    return res.data;
  } catch {
    return { success: false, formulas: [], singleLatex: null };
  }
}

