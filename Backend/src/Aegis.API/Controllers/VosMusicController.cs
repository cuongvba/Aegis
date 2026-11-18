using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aegis.API.Controllers
{
    [ApiController]
    [Route("api/music-studio")]
    public class VosMusicController : ControllerBase
    {
        private readonly IVosMusicService _vosMusicService;

        public VosMusicController(IVosMusicService vosMusicService)
        {
            _vosMusicService = vosMusicService;
        }

        [HttpGet("kernel")]
        [AllowAnonymous]
        public IActionResult GetKernel()
        {
            return Ok(_vosMusicService.GetGroundedKernelDocs());
        }

        [HttpPost("compile")]
        [AllowAnonymous]
        public async Task<IActionResult> Compile([FromBody] VosCompileRequestDto request, CancellationToken ct)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.InputText))
                return BadRequest(new { error = "Vui lòng nhập ý niệm, lời thơ hoặc nội dung cần biên dịch V-OS." });

            var result = await _vosMusicService.CompileAsync(request, ct);
            return Ok(result);
        }
    }
}
