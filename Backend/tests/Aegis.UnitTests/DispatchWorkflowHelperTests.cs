using System;
using Aegis.Infrastructure.Services;
using Xunit;

namespace Aegis.UnitTests
{
    public class DispatchWorkflowHelperTests
    {
        [Fact]
        public void ComputeCompletionScore_AppliesSlaQualityAndUrgencyFormula()
        {
            var onTime = DispatchWorkflowHelper.ComputeCompletionScore("2026-11-30", new DateTimeOffset(2026, 11, 25, 9, 0, 0, TimeSpan.Zero), 5, "HOA_TOC");
            Assert.Equal(100, onTime.SlaScore);
            Assert.Equal(100, onTime.QualityScore);
            Assert.Equal(100, onTime.FinalScore);

            var late = DispatchWorkflowHelper.ComputeCompletionScore("2026-11-10", new DateTimeOffset(2026, 11, 19, 9, 0, 0, TimeSpan.Zero), 4, "THUONG");
            Assert.Equal(50, late.SlaScore);
            Assert.Equal(80, late.QualityScore);
            // 0.40*50 + 0.45*80 + 0.15*75 = 20 + 36 + 11.25 = 67.25 -> 67.2 or 67.3
            Assert.InRange(late.FinalScore, 67.0, 67.5);
        }

        [Fact]
        public void ExtractDispatchMetadata_ExtractsNumberAndUrgencyFromOcrText()
        {
            var (num, urgency, summary) = DispatchWorkflowHelper.ExtractDispatchMetadata(
                "HỎA TỐC\nSố: 245/CV-GDĐT về việc triển khai chuyển đổi số năm học 2026",
                "cong_van_245.pdf");

            Assert.Equal("245/CV-GDĐT", num);
            Assert.Equal("HOA_TOC", urgency);
            Assert.False(string.IsNullOrWhiteSpace(summary));
        }

        [Fact]
        public void CanTransition_EnforcesStateMachineAndPreventsMutationAfterLock()
        {
            Assert.True(DispatchWorkflowHelper.CanTransition("RECEIVED_DRAFT", "SUBMITTED_TRIAGE"));
            Assert.True(DispatchWorkflowHelper.CanTransition("ASSIGNED", "IN_PROGRESS"));
            Assert.False(DispatchWorkflowHelper.CanTransition("EVALUATED_LOCKED", "IN_PROGRESS"));
        }
    }
}
