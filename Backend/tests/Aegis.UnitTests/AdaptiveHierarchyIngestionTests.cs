using System.Collections.Generic;
using Aegis.Application.DTOs;
using Aegis.Infrastructure.Services.Docx;
using Xunit;

namespace Aegis.UnitTests
{
    public class AdaptiveHierarchyIngestionTests
    {
        [Fact]
        public void Test_Flat_Exam_Produces_Zero_Ranks_Hx000()
        {
            // Case 1: Đề thi phẳng hoàn toàn H(x, 0, 0, 0)
            var scopeManager = new CognitiveScopeManager();
            scopeManager.SetCurrentExam("DE_05");

            // Không gọi RegisterMacroSection, không RegisterSubPart, không IncrementDirectiveRank
            // Mọi câu hỏi thuộc đề này đều có HierarchyIndex là 5_0_0_0
            Assert.Equal(5, scopeManager.CurrentExamRank);
            Assert.Equal(0, scopeManager.CurrentPartRank);
            Assert.Equal(0, scopeManager.CurrentSubPartRank);
            Assert.Equal(0, scopeManager.CurrentDirectiveRank);
            Assert.Equal("5_0_0_0", scopeManager.GetHierarchyIndex());
        }

        [Fact]
        public void Test_Directive_Only_Exam_Produces_Hx00d()
        {
            // Case 2: Đề chỉ có Group Directive (như Đề 7) H(x, 0, 0, d)
            var scopeManager = new CognitiveScopeManager();
            scopeManager.SetCurrentExam("DE_07");

            scopeManager.IncrementDirectiveRank(); // Directive 1
            Assert.Equal("7_0_0_1", scopeManager.GetHierarchyIndex());

            scopeManager.IncrementDirectiveRank(); // Directive 2
            Assert.Equal("7_0_0_2", scopeManager.GetHierarchyIndex());

            for (int i = 3; i <= 6; i++) scopeManager.IncrementDirectiveRank();
            Assert.Equal("7_0_0_6", scopeManager.GetHierarchyIndex());
            Assert.Equal(0, scopeManager.CurrentPartRank);
            Assert.Equal(0, scopeManager.CurrentSubPartRank);
        }

        [Fact]
        public void Test_Part_Only_Exam_Produces_Hxp00()
        {
            // Case 3: Đề thi GDPT 2025 chuẩn có Phần I, Phần II, Phần III
            var scopeManager = new CognitiveScopeManager();
            scopeManager.SetCurrentExam("DE_01");

            scopeManager.RegisterMacroSection("SINGLE", "PHẦN I. CÂU HỎI TRẮC NGHIỆM");
            Assert.Equal("1_1_0_0", scopeManager.GetHierarchyIndex());

            scopeManager.RegisterMacroSection("MULTI_TRUE_FALSE", "PHẦN II. CÂU HỎI ĐÚNG SAI");
            Assert.Equal("1_2_0_0", scopeManager.GetHierarchyIndex());

            scopeManager.RegisterMacroSection("SHORT_ANSWER", "PHẦN III. TRẢ LỜI NGẮN");
            Assert.Equal("1_3_0_0", scopeManager.GetHierarchyIndex());
        }

        [Fact]
        public void Test_Full_Hierarchical_Exam_Produces_Hxpsd()
        {
            // Case 4: Đề thi phân cấp đầy đủ H(x, p, s, d)
            var scopeManager = new CognitiveScopeManager();
            scopeManager.SetCurrentExam("DE_02");

            scopeManager.RegisterMacroSection("SINGLE", "PHẦN I");
            scopeManager.RegisterSubPart("Chủ đề 1: Động học chất điểm");
            scopeManager.IncrementDirectiveRank();

            Assert.Equal("2_1_1_1", scopeManager.GetHierarchyIndex());

            // Sang chỉ thị thứ 2 trong cùng chủ đề
            scopeManager.IncrementDirectiveRank();
            Assert.Equal("2_1_1_2", scopeManager.GetHierarchyIndex());

            // Sang chủ đề 2
            scopeManager.RegisterSubPart("Chủ đề 2: Động lực học chất điểm");
            Assert.Equal("2_1_2_2", scopeManager.GetHierarchyIndex());
        }

        [Theory]
        [InlineData("Câu 1", 1)]
        [InlineData("Question 25", 25)]
        [InlineData("PHẦN I", 1)]
        [InlineData("PHẦN II", 2)]
        [InlineData("PART III", 3)]
        [InlineData("SECTION IV", 4)]
        [InlineData("PHẦN V", 5)]
        [InlineData("PHẦN X", 10)]
        [InlineData("SECTION XV", 15)]
        [InlineData("PART XX", 20)]
        [InlineData("PART A", 1)]
        [InlineData("SECTION B", 2)]
        [InlineData("PHẦN C", 3)]
        [InlineData("第一部分", 1)]
        [InlineData("第二部分", 2)]
        [InlineData("第十部分", 10)]
        public void Test_MultiLingual_Rank_Number_Parsing(string text, int expectedRank)
        {
            int actual = CognitiveScopeManager.ParseRankNumber(text);
            Assert.Equal(expectedRank, actual);
        }
    }
}

