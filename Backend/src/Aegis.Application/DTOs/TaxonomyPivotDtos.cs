using System;
using System.Collections.Generic;

namespace Aegis.Application.DTOs
{
    /// <summary>
    /// Nút phả hệ đa lăng kính xoay trục (Subject-Centric / Grade-Centric / Term-Centric)
    /// </summary>
    public class TaxonomyPivotTreeNodeDto
    {
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        /// <summary>Kiểu phân cấp nút: DOMAIN | TOPIC | GRADE | TERM | SERIES | LEAF</summary>
        public string NodeType { get; set; } = "TOPIC";
        public string? MaterializedPath { get; set; }
        public int QuestionCount { get; set; } = 0;
        public List<TaxonomyPivotTreeNodeDto> Children { get; set; } = new();
    }

    /// <summary>
    /// Bảng ma trận 2 chiều tổng quan toàn diện tri thức: Môn học (Rows) x Khối lớp (Columns)
    /// </summary>
    public class TaxonomyMatrixSummaryDto
    {
        public string DomainCode { get; set; } = "EDUCATION";
        public List<string> Grades { get; set; } = new();
        public List<TaxonomyMatrixRowDto> Rows { get; set; } = new();
        public int GrandTotalQuestions { get; set; } = 0;
    }

    public class TaxonomyMatrixRowDto
    {
        public string TopicCode { get; set; } = string.Empty;
        public string TopicName { get; set; } = string.Empty;
        public Dictionary<string, int> CountsByGrade { get; set; } = new();
        public int TotalQuestions { get; set; } = 0;
    }
}
