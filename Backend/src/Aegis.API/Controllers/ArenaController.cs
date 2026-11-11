using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Aegis.Application.Interfaces;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Arena;
using Aegis.Infrastructure.Data;

namespace Aegis.API.Controllers
{
    public class CreateArenaRoomRequest
    {
        public string GameCode { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public string HostUserId { get; set; } = string.Empty;
        public string HostName { get; set; } = string.Empty;
        public string? TopicCode { get; set; }
        public int QuestionCount { get; set; } = 15;
    }

    public class ArenaTournamentDto
    {
        public string Id { get; set; } = string.Empty;
        public string TopicCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TotalQuestions { get; set; }
        public string DefaultGameCode { get; set; } = "GOLDEN_BELL";
        public int Difficulty { get; set; } = 3;
        public string Badge { get; set; } = string.Empty;
        public string AccentGradient { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public bool IsRealData { get; set; } = true;
    }

    [ApiController]
    [Route("api/arena")]
    [AllowAnonymous]
    public class ArenaController : ControllerBase
    {
        private readonly ArenaRoomManager _roomManager;
        private readonly AegisDbContext _db;
        private readonly ILogger<ArenaController> _logger;

        public ArenaController(
            ArenaRoomManager roomManager,
            AegisDbContext db,
            ILogger<ArenaController> logger)
        {
            _roomManager = roomManager;
            _db = db;
            _logger = logger;
        }

        // ── GET api/arena/tournaments ─────────────────────────────────────────
        /// <summary>
        /// Danh sách các giải đấu Đấu Trường trực tiếp được nạp 100% dữ liệu câu hỏi thật từ cơ sở dữ liệu
        /// </summary>
        [HttpGet("tournaments")]
        public async Task<IActionResult> GetTournaments()
        {
            try
            {
                // Thống kê số câu hỏi thật theo từng CategoryCode
                var counts = await _db.Questions
                    .AsNoTracking()
                    .GroupBy(q => q.CategoryCode)
                    .Select(g => new { Code = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Code, x => x.Count);

                int totalAll = counts.Values.Sum();

                var tournaments = new List<ArenaTournamentDto>
                {
                    new()
                    {
                        Id = "tour-eng-thpt",
                        TopicCode = "TIENG_ANH",
                        Title = "Đại Chiến Tốt Nghiệp THPT: Tiếng Anh Quốc Gia",
                        Description = "40 câu hỏi trắc nghiệm ngữ âm, từ vựng, ngữ pháp và đọc hiểu chuẩn cấu trúc đề thi Bộ Giáo Dục & Đào Tạo 2026.",
                        Category = "NGOẠI NGỮ",
                        TotalQuestions = counts.GetValueOrDefault("TIENG_ANH", 40),
                        DefaultGameCode = "OLYMPIA",
                        Difficulty = 3,
                        Badge = "Chuẩn Bộ GD&ĐT",
                        AccentGradient = "from-indigo-600 via-purple-600 to-pink-500",
                        Icon = "🇬🇧"
                    },
                    new()
                    {
                        Id = "tour-bank-credit",
                        TopicCode = "TD_KHDN",
                        Title = "Đấu Trường Nghiệp Vụ Ngân Hàng: Tín Dụng Doanh Nghiệp",
                        Description = "240 câu hỏi thẩm định pháp lý, quy chế cho vay 656/QC-HĐTV, quản trị rủi ro hạn mức và phân tích báo cáo tài chính doanh nghiệp.",
                        Category = "TÀI CHÍNH - NGÂN HÀNG",
                        TotalQuestions = counts.GetValueOrDefault("TD_KHDN", 240),
                        DefaultGameCode = "GOLDEN_BELL",
                        Difficulty = 4,
                        Badge = "Chuyên Gia Ngân Hàng",
                        AccentGradient = "from-emerald-600 via-teal-600 to-cyan-500",
                        Icon = "🏦"
                    },
                    new()
                    {
                        Id = "tour-chemistry-peak",
                        TopicCode = "HOA_HOC",
                        Title = "Đấu Trường Khoa Học Tự Nhiên: Hóa Học Đỉnh Cao",
                        Description = "28 câu hỏi este, lipit, kim loại kiềm thổ, phản ứng điện phân và bài toán đồ thị Hóa học nâng cao.",
                        Category = "HÓA HỌC",
                        TotalQuestions = counts.GetValueOrDefault("HOA_HOC", 28),
                        DefaultGameCode = "LIGHTNING",
                        Difficulty = 4,
                        Badge = "Chinh Phục Điểm 9-10",
                        AccentGradient = "from-amber-500 via-orange-600 to-rose-600",
                        Icon = "🔬"
                    },
                    new()
                    {
                        Id = "tour-biology-olympiad",
                        TopicCode = "SINH_HOC_K09",
                        Title = "Đấu Trường Sinh Học & Công Nghệ Di Truyền",
                        Description = "28 câu hỏi quy luật Men-đen, đột biến gen, phiên mã dịch mã và sinh thái học quần thể chọn lọc.",
                        Category = "SINH HỌC",
                        TotalQuestions = counts.GetValueOrDefault("SINH_HOC_K09", 28),
                        DefaultGameCode = "TRIEU_PHU_AI",
                        Difficulty = 3,
                        Badge = "Olympic Sinh Học",
                        AccentGradient = "from-green-500 via-emerald-600 to-teal-700",
                        Icon = "🧬"
                    },
                    new()
                    {
                        Id = "tour-omniverse-allstar",
                        TopicCode = "ALL",
                        Title = "Đại Hội Siêu Trí Tuệ Toàn Năng (Aegis Omniverse All-Star)",
                        Description = $"Hơn {totalAll}+ câu hỏi thực tế đa lĩnh vực (Toán, Lý, Hóa, Ngoại ngữ, Kinh tế). Bốc ngẫu nhiên câu hỏi thử thách phản xạ.",
                        Category = "TỔNG HỢP TOÀN DIỆN",
                        TotalQuestions = totalAll,
                        DefaultGameCode = "GOLDEN_BELL",
                        Difficulty = 5,
                        Badge = "Thách Đấu Toàn Cầu",
                        AccentGradient = "from-cyan-500 via-blue-600 to-indigo-700",
                        Icon = "🌟"
                    }
                };

                return Ok(new { success = true, tournaments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lấy danh sách giải đấu thực tế");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── GET api/arena/available-topics ────────────────────────────────────
        /// <summary>
        /// Danh sách các chủ đề thật trong DB kèm số lượng câu hỏi để chọn khi tạo phòng thi
        /// </summary>
        [HttpGet("available-topics")]
        public async Task<IActionResult> GetAvailableTopics()
        {
            try
            {
                var topics = await _db.BankTopics
                    .AsNoTracking()
                    .Where(t => t.Enabled)
                    .Select(t => new
                    {
                        t.Code,
                        t.Name,
                        t.CategoryCode,
                        t.DomainCode,
                        t.MaterializedPath,
                        t.QuestionCountCached
                    })
                    .ToListAsync();

                var questionCounts = await _db.Questions
                    .AsNoTracking()
                    .GroupBy(q => q.CategoryCode)
                    .Select(g => new { Code = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Code, x => x.Count);

                var result = topics.Select(t => new
                {
                    t.Code,
                    t.Name,
                    t.DomainCode,
                    QuestionCount = questionCounts.GetValueOrDefault(t.Code, t.QuestionCountCached)
                })
                .Where(x => x.QuestionCount > 0 || !x.Code.StartsWith("STUDIO_202"))
                .OrderByDescending(x => x.QuestionCount)
                .ToList();

                return Ok(new { success = true, topics = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi nạp danh sách chủ đề thực tế");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── GET api/arena/games ───────────────────────────────────────────────
        [HttpGet("games")]
        public IActionResult GetAvailableGames()
        {
            var plugins = _roomManager.GetAvailablePlugins().Select(p => new
            {
                p.GameCode,
                p.DisplayName,
                p.Description,
                p.Icon,
                p.MinPlayers,
                p.MaxPlayers
            });
            return Ok(plugins);
        }

        // ── GET api/arena/rooms ───────────────────────────────────────────────
        [HttpGet("rooms")]
        public IActionResult GetActiveRooms([FromQuery] string? gameCode = null)
        {
            var rooms = _roomManager.ListActiveRooms();
            if (!string.IsNullOrEmpty(gameCode))
            {
                rooms = rooms.Where(r => r.GameCode.Equals(gameCode, StringComparison.OrdinalIgnoreCase));
            }

            var result = rooms.Select(r => new
            {
                r.RoomId,
                r.GameCode,
                r.RoomName,
                r.HostUserId,
                r.CurrentStage,
                PlayerCount = r.Players.Count,
                StageStartTime = r.StageStartTimeUtc
            });

            return Ok(result);
        }

        // ── POST api/arena/rooms ──────────────────────────────────────────────
        /// <summary>
        /// Khởi tạo phòng đấu trường với câu hỏi THỰC TẾ từ cơ sở dữ liệu
        /// </summary>
        [HttpPost("rooms")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateArenaRoomRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.GameCode))
                    return BadRequest(new { message = "GameCode không được để trống" });

                var hostId = string.IsNullOrWhiteSpace(request.HostUserId) ? Guid.NewGuid().ToString("N")[..8] : request.HostUserId;
                var hostName = string.IsNullOrWhiteSpace(request.HostName) ? "Kiện Tướng Host" : request.HostName;
                var pin = Random.Shared.Next(100000, 999999).ToString();
                var roomId = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
                int qCount = request.QuestionCount > 0 ? Math.Clamp(request.QuestionCount, 5, 50) : 15;

                // 1. Truy vấn câu hỏi THỰC TẾ từ Database
                IQueryable<QuestionBase> query = _db.Questions.AsNoTracking();

                if (!string.IsNullOrWhiteSpace(request.TopicCode) &&
                    !request.TopicCode.Equals("ALL", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(q => q.CategoryCode == request.TopicCode);
                }

                var pool = await query.Take(100).ToListAsync();

                // Fallback nếu topic chưa có câu hỏi: Lấy từ toàn bộ DB
                if (pool.Count == 0)
                {
                    pool = await _db.Questions.AsNoTracking().Take(100).ToListAsync();
                }

                // 2. Chuyển đổi sang danh sách ArenaQuestionItem
                List<ArenaQuestionItem> arenaQuestions;
                if (pool.Count > 0)
                {
                    var shuffled = pool.OrderBy(_ => Random.Shared.Next()).Take(qCount).ToList();
                    arenaQuestions = shuffled.Select((q, idx) => MapToArenaQuestionItem(q, request.GameCode, idx + 1)).ToList();
                }
                else
                {
                    arenaQuestions = new List<ArenaQuestionItem>();
                }

                // 3. Khởi tạo phòng đấu trường qua RoomManager
                ArenaRoomState room;
                if (arenaQuestions.Count > 0)
                {
                    room = _roomManager.CreateRoomWithCustomQuestions(
                        request.GameCode,
                        request.RoomName,
                        hostId,
                        hostName,
                        pin,
                        arenaQuestions,
                        roomId);

                    _logger.LogInformation("[Arena] Khởi tạo phòng {RoomId} với {Count} câu hỏi THẬT từ chủ đề {TopicCode}",
                        roomId, arenaQuestions.Count, request.TopicCode ?? "ALL");
                }
                else
                {
                    room = _roomManager.CreateRoom(request.GameCode, request.RoomName, hostId, hostName);
                }

                return Ok(new
                {
                    roomId = room.RoomId,
                    gameCode = room.GameCode,
                    roomName = room.RoomName,
                    pinCode = pin,
                    questionCount = room.Questions.Count,
                    isRealData = arenaQuestions.Count > 0,
                    topicCode = request.TopicCode ?? "ALL",
                    joinUrl = $"/arena/join?pin={pin}",
                    directArenaUrl = $"/arena/{room.GameCode}/{room.RoomId}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi tạo phòng thi đấu trường");
                return BadRequest(new { message = ex.Message });
            }
        }

        private static ArenaQuestionItem MapToArenaQuestionItem(QuestionBase q, string gameCode, int index)
        {
            var options = q.Options?.ToList() ?? new List<string>();
            string answer = q.CorrectOption ?? "";
            string explanation = "";

            if (q.Payload != null)
            {
                var root = q.Payload.RootElement;
                if (string.IsNullOrWhiteSpace(answer) && root.TryGetProperty("correctAnswer", out var ca))
                    answer = ca.GetString() ?? "";

                if (root.TryGetProperty("explanation", out var exp))
                    explanation = exp.GetString() ?? "";

                if (options.Count == 0 && root.TryGetProperty("options", out var optArr) && optArr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var elem in optArr.EnumerateArray())
                    {
                        if (elem.ValueKind == JsonValueKind.String)
                            options.Add(elem.GetString() ?? "");
                        else if (elem.ValueKind == JsonValueKind.Object && elem.TryGetProperty("text", out var t))
                            options.Add(t.GetString() ?? "");
                    }
                }
            }

            if (options.Count == 0 && q.QuestionType == "TRUE_FALSE")
            {
                options = new List<string> { "Đúng", "Sai" };
            }

            int timeLimit = gameCode.ToUpperInvariant() switch
            {
                "LIGHTNING"             => 12,
                "GOLDEN_BELL"           => 15,
                "OLYMPIA"               => 20,
                "TRIEU_PHU_AI"          => 30,
                "UNIVERSITY_CHALLENGE"  => 18,
                _                       => 20
            };

            return new ArenaQuestionItem
            {
                Content = $"[Câu {index}] {q.Content}",
                Options = options,
                AnswerRaw = !string.IsNullOrWhiteSpace(answer) ? answer : (options.Count > 0 ? options[0] : ""),
                Explanation = explanation,
                Points = q.Difficulty > 0 ? q.Difficulty * 10 : 10,
                TimeLimitSeconds = timeLimit,
                Category = q.CategoryCode ?? "CHUNG"
            };
        }

        // ── GET api/arena/rooms/{id} ──────────────────────────────────────────
        [HttpGet("rooms/{id}")]
        public IActionResult GetRoom(string id)
        {
            var room = _roomManager.GetRoom(id);
            if (room == null)
                return NotFound(new { message = "Không tìm thấy phòng đấu trường" });

            return Ok(room);
        }

        // ── GET api/arena/templates ───────────────────────────────────────────
        [HttpGet("templates")]
        public IActionResult GetTemplates()
        {
            var templates = _roomManager.GetAllTemplates();
            return Ok(templates);
        }

        // ── GET api/arena/templates/{gameCode} ────────────────────────────────
        [HttpGet("templates/{gameCode}")]
        public IActionResult GetTemplate(string gameCode)
        {
            var template = _roomManager.GetTemplate(gameCode);
            if (template == null)
                return NotFound(new { message = $"Không tìm thấy template: {gameCode}" });

            return Ok(template);
        }

        // ── POST api/arena/templates ──────────────────────────────────────────
        [HttpPost("templates")]
        public IActionResult SaveTemplate([FromBody] GameshowManifest manifest)
        {
            if (string.IsNullOrWhiteSpace(manifest.GameCode))
                return BadRequest(new { message = "GameCode không được để trống" });

            if (string.IsNullOrWhiteSpace(manifest.DisplayName))
                return BadRequest(new { message = "DisplayName không được để trống" });

            manifest.GameCode = manifest.GameCode.Trim().ToUpperInvariant();
            bool saved = _roomManager.SaveTemplate(manifest);
            if (!saved)
                return BadRequest(new { message = "Không thể lưu template" });

            return Ok(new { message = "Đã lưu template gameshow thành công", template = manifest });
        }

        // ── DELETE api/arena/templates/{gameCode} ─────────────────────────────
        [HttpDelete("templates/{gameCode}")]
        public IActionResult DeleteTemplate(string gameCode)
        {
            bool deleted = _roomManager.DeleteTemplate(gameCode);
            if (!deleted)
                return BadRequest(new { message = "Không thể xóa template (template không tồn tại hoặc là preset hệ thống)" });

            return Ok(new { message = $"Đã xóa template {gameCode} thành công" });
        }
    }
}
