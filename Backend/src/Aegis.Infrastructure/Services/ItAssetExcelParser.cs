using System;
using System.Collections.Generic;
using System.IO;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;

namespace Aegis.Infrastructure.Services
{
    public class ParsedItAssetItem
    {
        public string Id { get; set; } = string.Empty;
        public string AssetCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = "PHYSICAL"; // SYSTEM, SOFTWARE, PHYSICAL, DATA
        public string Classification { get; set; } = "INTERNAL";
        public string Location { get; set; } = string.Empty;
        public string WarrantyStatus { get; set; } = string.Empty;
        public string SystemName { get; set; } = string.Empty;
        public string Owner { get; set; } = string.Empty;
        public string ControlNote { get; set; } = string.Empty;
    }

    public static class ItAssetExcelParser
    {
        public static List<ParsedItAssetItem> ParseDanhMucTaiSan(Stream xlsxStream)
        {
            var items = new List<ParsedItAssetItem>();
            using var wb = new XSSFWorkbook(xlsxStream);

            for (int s = 0; s < wb.NumberOfSheets; s++)
            {
                var sheet = wb.GetSheetAt(s);
                string sheetName = sheet.SheetName ?? string.Empty;
                int headerRowIdx = FindHeaderRow(sheet);
                if (headerRowIdx < 0) continue;

                for (int r = headerRowIdx + 1; r <= sheet.LastRowNum; r++)
                {
                    var row = sheet.GetRow(r);
                    if (row == null) continue;
                    string col0 = CellStr(row, 0);
                    string col1 = CellStr(row, 1);
                    string col2 = CellStr(row, 2);
                    if (string.IsNullOrWhiteSpace(col1) && string.IsNullOrWhiteSpace(col2)) continue;
                    if (!int.TryParse(col0.Trim(), out int stt) || stt <= 0) continue;

                    if (sheetName.Contains("DMHTTT", StringComparison.OrdinalIgnoreCase))
                    {
                        items.Add(new ParsedItAssetItem
                        {
                            Id = $"ast-sys-{stt}",
                            AssetCode = $"HTTT-{stt:D2}",
                            Name = col1,
                            Category = "SYSTEM",
                            Classification = string.IsNullOrWhiteSpace(col2) ? "CAP_DO_2" : $"CAP_DO_{col2}",
                            SystemName = col1,
                            Owner = CellStr(row, 4),
                            ControlNote = CellStr(row, 3)
                        });
                    }
                    else if (sheetName.Contains("TSPM", StringComparison.OrdinalIgnoreCase))
                    {
                        items.Add(new ParsedItAssetItem
                        {
                            Id = $"ast-sw-{stt}",
                            AssetCode = $"TSPM-{stt:D2}",
                            Name = col1,
                            Category = "SOFTWARE",
                            Classification = "INTERNAL",
                            Location = CellStr(row, 5),
                            Owner = CellStr(row, 6),
                            SystemName = CellStr(row, 7),
                            ControlNote = $"{CellStr(row, 3)} | {CellStr(row, 4)}".Trim(' ', '|')
                        });
                    }
                    else if (sheetName.Contains("TSVL", StringComparison.OrdinalIgnoreCase))
                    {
                        string code = string.IsNullOrWhiteSpace(col1) ? $"TSVL-{stt:D2}" : col1;
                        items.Add(new ParsedItAssetItem
                        {
                            Id = $"ast-phy-{code}",
                            AssetCode = code,
                            Name = string.IsNullOrWhiteSpace(col2) ? code : col2,
                            Category = "PHYSICAL",
                            Classification = "INTERNAL",
                            Location = CellStr(row, 3),
                            WarrantyStatus = CellStr(row, 5),
                            Owner = CellStr(row, 6),
                            SystemName = CellStr(row, 7),
                            ControlNote = CellStr(row, 4)
                        });
                    }
                    else if (sheetName.Contains("TSTT", StringComparison.OrdinalIgnoreCase))
                    {
                        string clsRaw = col2.ToLowerInvariant();
                        string cls = clsRaw.Contains("cá nhân") || clsRaw.Contains("mật") ? "CONFIDENTIAL" : "INTERNAL";
                        items.Add(new ParsedItAssetItem
                        {
                            Id = $"ast-dat-{stt}",
                            AssetCode = $"TSTT-{stt:D2}",
                            Name = col1,
                            Category = "DATA",
                            Classification = cls,
                            Location = CellStr(row, 4),
                            SystemName = CellStr(row, 6),
                            Owner = CellStr(row, 7),
                            ControlNote = $"{col2} | {CellStr(row, 5)}".Trim(' ', '|')
                        });
                    }
                }
            }

            return items;
        }

        private static int FindHeaderRow(ISheet sheet)
        {
            for (int r = 0; r <= Math.Min(12, sheet.LastRowNum); r++)
            {
                var row = sheet.GetRow(r);
                if (row == null) continue;
                if (CellStr(row, 0).Equals("Stt", StringComparison.OrdinalIgnoreCase)) return r;
            }
            return -1;
        }

        private static string CellStr(IRow row, int idx)
        {
            var cell = row.GetCell(idx);
            if (cell == null) return string.Empty;
            return cell.CellType switch
            {
                CellType.Numeric => cell.NumericCellValue.ToString(),
                CellType.Boolean => cell.BooleanCellValue.ToString(),
                _ => cell.ToString()?.Trim() ?? string.Empty
            };
        }
    }
}
