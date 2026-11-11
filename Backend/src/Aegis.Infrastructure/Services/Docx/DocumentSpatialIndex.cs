using System;
using System.Collections.Generic;
using System.Linq;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Aegis.Infrastructure.Services.Docx
{
    /// <summary>
    /// [SSoT Infrastructure Engine] Bộ Đăng ký & Định vị Không Gian Toàn Cục của toàn bộ tài liệu DOCX.
    /// Vận hành theo mô hình 5D Invariant Spatial Tensor (E_P_S_D_Q).
    /// Khởi tạo 1 lần ở đầu phiên phân tích tài liệu, tồn tại vĩnh viễn và không bao giờ bị Clear() khi đổi đề.
    /// </summary>
    public class DocumentSpatialIndex : IDocumentSpatialIndex
    {
        private readonly ILogger? _logger;

        // 1. Chỉ mục Tuyệt đối 5D: "E_P_S_D_Q" (vd: "103_2_0_0_1") -> Khớp 100% trong 0ms
        private readonly Dictionary<string, DocxImportPreviewDto> _byFullIndex = new(StringComparer.OrdinalIgnoreCase);

        // 2. Chỉ mục Đề & Phần & Câu: "E_P_Q" (vd: "103_2_1") -> Hỗ trợ lời giải bỏ qua SubPart/Directive
        private readonly Dictionary<string, List<DocxImportPreviewDto>> _byExamPartQ = new(StringComparer.OrdinalIgnoreCase);

        // 3. Chỉ mục Đề & Số câu: "E_Q" (vd: "103_1") -> Hỗ trợ đề đánh số 1..N liên tục xuyên suốt các phần
        private readonly Dictionary<string, List<DocxImportPreviewDto>> _byExamQ = new(StringComparer.OrdinalIgnoreCase);

        // 4. Danh mục theo Section 4 cấp: "E_P_S_D" -> Danh sách câu hỏi trong Section
        private readonly Dictionary<string, List<DocxImportPreviewDto>> _bySection = new(StringComparer.OrdinalIgnoreCase);

        // 5. Danh mục theo Mã đề (ExamRank)
        private readonly Dictionary<int, List<DocxImportPreviewDto>> _byExam = new();

        public int TotalRegisteredQuestions => _byFullIndex.Count;

        public DocumentSpatialIndex(ILogger? logger = null)
        {
            _logger = logger;
        }

        public void Clear()
        {
            _byFullIndex.Clear();
            _byExamPartQ.Clear();
            _byExamQ.Clear();
            _bySection.Clear();
            _byExam.Clear();
        }

        public void Register(DocxImportPreviewDto q, QuestionAddress addr)
        {
            if (q == null) return;
            q.HierarchyIndex = addr.SectionKey;
            q.SourceQuestionNo = addr.Q.ToString();
            Register(q);
        }

        /// <summary>
        /// Đăng ký câu hỏi vào không gian tọa độ 5 chiều. Hoạt động Idempotent an toàn.
        /// </summary>
        public void Register(DocxImportPreviewDto q)
        {
            if (q == null) return;

            string hierarchyIndex = q.HierarchyIndex ?? "0_0_0_0";
            string qNum = q.SourceQuestionNo ?? "0";
            string fullKey = $"{hierarchyIndex}_{qNum}";

            // Idempotent guard: nếu câu hỏi này đã được đăng ký, không thêm lặp
            if (_byFullIndex.TryGetValue(fullKey, out var existing) && ReferenceEquals(existing, q))
            {
                return;
            }

            _byFullIndex[fullKey] = q;

            // Đăng ký vào Section 4 cấp
            if (!_bySection.TryGetValue(hierarchyIndex, out var secList))
            {
                secList = new List<DocxImportPreviewDto>();
                _bySection[hierarchyIndex] = secList;
            }
            if (!secList.Contains(q)) secList.Add(q);

            // Phân rã để đăng ký các tầng tra cứu Thác đổ (Waterfall)
            if (QuestionAddress.TryParse(fullKey, out var addr))
            {
                // Đăng ký T2: E_P_Q
                string epKey = addr.ExamPartKey;
                if (!_byExamPartQ.TryGetValue(epKey, out var epList))
                {
                    epList = new List<DocxImportPreviewDto>();
                    _byExamPartQ[epKey] = epList;
                }
                if (!epList.Contains(q)) epList.Add(q);

                // Đăng ký T3: E_Q
                string eqKey = addr.ExamKey;
                if (!_byExamQ.TryGetValue(eqKey, out var eqList))
                {
                    eqList = new List<DocxImportPreviewDto>();
                    _byExamQ[eqKey] = eqList;
                }
                if (!eqList.Contains(q)) eqList.Add(q);

                // Đăng ký theo ExamRank
                if (!_byExam.TryGetValue(addr.E, out var examList))
                {
                    examList = new List<DocxImportPreviewDto>();
                    _byExam[addr.E] = examList;
                }
                if (!examList.Contains(q)) examList.Add(q);
            }
        }

        /// <summary>
        /// Tra cứu câu hỏi mục tiêu trong O(1) theo thuật toán Thác đổ có Cổng duy nhất (Uniqueness-Gated Waterfall).
        /// </summary>
        public SpatialResolution Resolve(QuestionAddress address)
        {
            // Tầng 1: Khớp Tuyệt Đối 5D (Exact 5D)
            string exactKey = address.FullKey;
            if (_byFullIndex.TryGetValue(exactKey, out var exactQ))
            {
                return new SpatialResolution(exactQ, SpatialResolutionTier.Exact5D);
            }

            // Tầng 2: Khớp Đề + Phần + Số câu (ExamPartQ) - Cổng duy nhất (Count == 1)
            string epKey = address.ExamPartKey;
            if (_byExamPartQ.TryGetValue(epKey, out var epCandidates))
            {
                if (epCandidates.Count == 1)
                {
                    return new SpatialResolution(epCandidates[0], SpatialResolutionTier.ExamPartQ);
                }
                if (epCandidates.Count > 1)
                {
                    _logger?.LogWarning("[DocumentSpatialIndex] Ambiguous match | addr={Addr} -> {Count} candidates in Part {P}", address.FullKey, epCandidates.Count, address.P);
                    return new SpatialResolution(null, SpatialResolutionTier.Ambiguous, $"Ambiguous: {epCandidates.Count} questions match Part key '{epKey}'");
                }
            }

            // Tầng 3: Khớp Đề + Số câu (ExamQ) - Cổng duy nhất (Count == 1)
            string eqKey = address.ExamKey;
            if (_byExamQ.TryGetValue(eqKey, out var eqCandidates))
            {
                if (eqCandidates.Count == 1)
                {
                    return new SpatialResolution(eqCandidates[0], SpatialResolutionTier.ExamQ);
                }
                if (eqCandidates.Count > 1)
                {
                    _logger?.LogWarning("[DocumentSpatialIndex] Ambiguous match across parts | addr={Addr} -> {Count} candidates in Exam {E}", address.FullKey, eqCandidates.Count, address.E);
                    return new SpatialResolution(null, SpatialResolutionTier.Ambiguous, $"Ambiguous: {eqCandidates.Count} questions match Exam key '{eqKey}' across different parts");
                }
            }

            return new SpatialResolution(null, SpatialResolutionTier.NotFound, $"NotFound: No question registered at address '{address.FullKey}'");
        }

        public IReadOnlyList<DocxImportPreviewDto> GetSectionQuestions(string sectionKey)
        {
            return _bySection.TryGetValue(sectionKey ?? string.Empty, out var list) ? list : Array.Empty<DocxImportPreviewDto>();
        }

        public IReadOnlyList<DocxImportPreviewDto> GetExamQuestions(int examRank)
        {
            return _byExam.TryGetValue(examRank, out var list) ? list : Array.Empty<DocxImportPreviewDto>();
        }
    }
}
