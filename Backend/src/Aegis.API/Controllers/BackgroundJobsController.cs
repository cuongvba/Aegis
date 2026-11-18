using Aegis.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aegis.API.Controllers
{
    [ApiController]
    [Route("api/system/jobs")]
    public class BackgroundJobsController : ControllerBase
    {
        private readonly IAegisBackgroundTaskQueue _queue;

        public BackgroundJobsController(IAegisBackgroundTaskQueue queue)
        {
            _queue = queue;
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult ListRecent([FromQuery] int take = 25)
        {
            return Ok(_queue.ListRecent(take));
        }

        [HttpGet("{jobId}")]
        [AllowAnonymous]
        public IActionResult GetStatus(string jobId)
        {
            var status = _queue.GetStatus(jobId);
            return status == null ? NotFound(new { error = "Job not found." }) : Ok(status);
        }
    }
}
