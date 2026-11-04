/**
 * [World-Class Markdown Table Parser for Aegis Global Cognitive Infrastructure]
 * Tự động phân tích các khối bảng biểu thống kê Markdown:
 * | Header 1 | Header 2 | ... |
 * | :---     | :---:    | ---: |
 * | Val 1    | Val 2    | ... |
 *
 * Chuyển đổi thành Semantic HTML5 <table> có:
 * - Giao diện Dark/Light mode thích ứng, rounded-xl, viền border-slate-700
 * - Header màu text-sky-300 font-semibold
 * - Căn lề tự động (text-left, text-center, text-right)
 * - Khung cuộn ngang mượt mà (overflow-x-auto) trên màn hình mobile/tablet
 * - Tách ô an toàn State-Machine (splitTableCells) chống vỡ khi trong ô có thẻ KaTeX HTML hoặc escaped pipe
 */

/**
 * Tách các cột trong dòng bảng an toàn, bảo vệ dấu | nằm trong thẻ HTML (<...>) hoặc đứng sau dấu \
 */
export function splitTableCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let current = '';
  let inTag = false;
  let inEscape = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (inEscape) {
      current += char;
      inEscape = false;
      continue;
    }

    if (char === '\\') {
      inEscape = true;
      current += char;
      continue;
    }

    if (char === '<') {
      inTag = true;
      current += char;
      continue;
    }

    if (char === '>') {
      inTag = false;
      current += char;
      continue;
    }

    if (char === '|' && !inTag) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }
  cells.push(current.trim());
  return cells;
}

export function parseAndTokenizeTables(
  content: string,
  tableTokens: Record<string, string>
): string {
  if (!content || !content.includes('|')) return content;

  let counter = Object.keys(tableTokens).length;
  const lines = content.split(/\r?\n/);
  const resultLines: string[] = [];
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (tableBuffer.length === 0) return;

    // Kiểm tra xem tableBuffer có chứa dòng phân cách |--| không
    const hasSeparator = tableBuffer.some((l) => /^[ \t]*\|?[ \t]*:?[-]{2,}:?[ \t]*\|/.test(l));
    if (tableBuffer.length >= 2 && hasSeparator) {
      const sepIdx = tableBuffer.findIndex((l) => /^[ \t]*\|?[ \t]*:?[-]{2,}:?[ \t]*\|/.test(l));
      const headerLines = tableBuffer.slice(0, sepIdx);
      const sepLine = tableBuffer[sepIdx];
      const dataLines = tableBuffer.slice(sepIdx + 1);

      const headerCells = headerLines.length > 0 ? splitTableCells(headerLines[0]) : [];
      const alignLine = splitTableCells(sepLine);
      const alignments = alignLine.map((col) => {
        const startsWithColon = col.startsWith(':');
        const endsWithColon = col.endsWith(':');
        if (startsWithColon && endsWithColon) return 'text-center';
        if (endsWithColon) return 'text-right';
        if (startsWithColon) return 'text-left';
        return 'text-center'; // Mặc định bảng số liệu toán học/thống kê căn giữa
      });

      let html = '<div class="overflow-x-auto my-3 rounded-xl border border-slate-700/80 shadow-md bg-slate-900/60 max-w-full"><table class="w-full text-xs sm:text-sm border-collapse">';
      if (headerCells.length > 0) {
        html += '<thead><tr class="bg-slate-800/90 text-sky-300 font-semibold border-b border-slate-700">';
        headerCells.forEach((cell, idx) => {
          const align = alignments[idx] || 'text-center';
          html += `<th class="px-3.5 py-2.5 border-r border-slate-700/70 last:border-r-0 ${align}">${cell}</th>`;
        });
        html += '</tr></thead>';
      }
      html += '<tbody class="divide-y divide-slate-800/80">';
      dataLines.forEach((dLine, rIdx) => {
        const cells = splitTableCells(dLine);
        const rowBg = rIdx % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/30';
        html += `<tr class="${rowBg} hover:bg-slate-800/50 transition-colors">`;
        cells.forEach((cell, idx) => {
          const align = alignments[idx] || 'text-center';
          html += `<td class="px-3.5 py-2.5 border-r border-slate-800/70 last:border-r-0 ${align} text-slate-200">${cell}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';

      const token = `__AEGIS_TABLE_TOKEN_${counter++}__`;
      tableTokens[token] = html;
      resultLines.push(token);
    } else {
      resultLines.push(...tableBuffer);
    }
    tableBuffer = [];
  };

  for (const line of lines) {
    if (line.includes('|')) {
      tableBuffer.push(line);
    } else {
      flushTable();
      resultLines.push(line);
    }
  }
  flushTable();

  return resultLines.join('\n');
}
