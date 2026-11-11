using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aegis.Application.Interfaces;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;

namespace Aegis.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MentorController : ControllerBase
    {
        private readonly IGeminiMentorService _mentorService;
        private readonly AegisDbContext _dbContext;

        public MentorController(IGeminiMentorService mentorService, AegisDbContext dbContext)
        {
            _mentorService = mentorService;
            _dbContext = dbContext;
        }

        [HttpPost("plan")]
        public async Task<IActionResult> GetPersonalizedStudyPlan([FromBody] StudyPlanRequest request)
        {
            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-7);
                var history = await _dbContext.QuestionAttempts
                    .Where(q => q.UserId == request.UserId && q.AttemptDate >= cutoffDate)
                    .ToListAsync();

                // [Fix bảo mật] Bỏ GenerateMockHistory() — không ghi dữ liệu giả vào production DB.
                // Nếu người dùng chưa có lịch sử, trả về thông báo thay vì simulate.
                if (history.Count == 0)
                {
                    return Ok(new { plan = "[Chưa có dữ liệu] Bạn chưa làm bài nào trong 7 ngày qua. Hãy bắt đầu luyện tập để nhận phân tích từ AI Mentor!" });
                }

                var planText = await _mentorService.GeneratePersonalizedStudyPlan(request.UserId, history, request.IsPremium);
                return Ok(new { plan = planText });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi khi sinh lộ trình: {ex.Message}" });
            }
        }
    }

    public class StudyPlanRequest
    {
        public Guid UserId { get; set; }
        public bool IsPremium { get; set; }
    }
}
