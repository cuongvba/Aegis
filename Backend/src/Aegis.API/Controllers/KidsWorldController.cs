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
        public async Task<IActionResult> GetConceptAtoms(
            [FromQuery] string? islandId,
            [FromQuery] string? ageBand,
            [FromQuery] bool includePending = false)
        {
            var atoms = await _kidsService.GetConceptAtomsAsync(_tenant.CurrentTenantId, islandId, ageBand, includePending);
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

        [HttpGet("stages")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStageThemes([FromQuery] bool includePending = false)
        {
            var stages = await _kidsService.GetStageThemesAsync(_tenant.CurrentTenantId, includePending);
            return Ok(stages);
        }

        [HttpPost("stages")]
        [AllowAnonymous]
        public async Task<IActionResult> SaveStageTheme([FromBody] KidsStageThemeDto stage)
        {
            if (stage == null || string.IsNullOrWhiteSpace(stage.TitleVi))
                return BadRequest(new { error = "Vui lòng nhập tên sân khấu." });

            var saved = await _kidsService.SaveStageThemeAsync(_tenant.CurrentTenantId, stage);
            return Ok(saved);
        }

        [HttpPost("creator/submit-bundle")]
        [AllowAnonymous]
        public async Task<IActionResult> SubmitCreatorBundle([FromBody] SubmitKidsCreatorBundleDto bundle)
        {
            if (bundle == null) return BadRequest(new { error = "Thiếu dữ liệu sáng tác." });
            var res = await _kidsService.SubmitCreatorBundleAsync(_tenant.CurrentTenantId, bundle);
            return Ok(res);
        }

        [HttpPost("contributions/{code}/moderate")]
        [AllowAnonymous]
        public async Task<IActionResult> ModerateContribution(string code, [FromQuery] bool approve = true)
        {
            bool ok = await _kidsService.ModerateContributionAsync(_tenant.CurrentTenantId, code, approve);
            return ok ? Ok(new { moderated = true, approved = approve }) : NotFound();
        }

        [HttpPost("contributions/{code}/gratitude")]
        [AllowAnonymous]
        public async Task<IActionResult> GiveGratitude(string code)
        {
            int count = await _kidsService.GiveGratitudeAsync(_tenant.CurrentTenantId, code);
            return Ok(new { gratitudeCount = count });
        }

        [HttpPost("ai-synthesize-bundle")]
        [AllowAnonymous]
        public async Task<IActionResult> AiSynthesizeBundle([FromBody] AiBuildKidsCurriculumRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TopicTitle))
                return BadRequest(new { error = "Vui lòng nhập chủ đề giáo án." });

            var draft = await _kidsService.AiSynthesizeCreatorBundleAsync(_tenant.CurrentTenantId, request);
            return Ok(draft);
        }

        [HttpGet("locales")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLocaleProfiles()
        {
            var locales = await _kidsService.GetLocaleProfilesAsync(_tenant.CurrentTenantId);
            return Ok(locales);
        }

        [HttpPost("locales")]
        [AllowAnonymous]
        public async Task<IActionResult> SaveLocaleProfile([FromBody] KidsLocaleProfileDto profile)
        {
            if (profile == null || string.IsNullOrWhiteSpace(profile.LocaleCode) || string.IsNullOrWhiteSpace(profile.NativeName))
                return BadRequest(new { error = "Vui lòng nhập LocaleCode (VD: th-TH) và tên ngôn ngữ." });

            var saved = await _kidsService.SaveLocaleProfileAsync(_tenant.CurrentTenantId, profile);
            return Ok(saved);
        }
    }
}
