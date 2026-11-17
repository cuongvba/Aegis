using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aegis.API.Controllers
{
    [ApiController]
    [Route("api/kids")]
    public class KidsWorldController : ControllerBase
    {
        private readonly IKidsCurriculumService _kidsService;
        private readonly ITenantContext _tenant;

        public KidsWorldController(IKidsCurriculumService kidsService, ITenantContext tenant)
        {
            _kidsService = kidsService;
            _tenant = tenant;
        }

        [HttpGet("atoms")]
        [AllowAnonymous]
        public async Task<IActionResult> GetConceptAtoms([FromQuery] string? islandId, [FromQuery] string? ageBand)
        {
            var atoms = await _kidsService.GetConceptAtomsAsync(_tenant.CurrentTenantId, islandId, ageBand);
            return Ok(atoms);
        }

        [HttpPost("daily-adventure")]
        [AllowAnonymous]
        public async Task<IActionResult> GenerateDailyAdventure([FromBody] GenerateKidsAdventureRequestDto? request)
        {
            var plan = await _kidsService.GenerateDailyAdventureAsync(
                _tenant.CurrentTenantId,
                request ?? new GenerateKidsAdventureRequestDto());
            return Ok(plan);
        }

        [HttpPost("ai-build-curriculum")]
        [AllowAnonymous]
        public async Task<IActionResult> BuildCurriculumWithAi([FromBody] AiBuildKidsCurriculumRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TopicTitle))
                return BadRequest(new { error = "Vui lòng nhập chủ đề muốn tạo cho Kids World." });

            var result = await _kidsService.BuildCurriculumWithAiAsync(_tenant.CurrentTenantId, request);
            return Ok(result);
        }
    }
}
