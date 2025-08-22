// Controllers/ReportsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Geometries;
using System.Globalization;
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Repositories;

namespace WatchtowerApi.Controllers
{
    [ApiController]
    [Route("reports")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportRepository _repo;

        public ReportsController(IReportRepository repo)
        {
            _repo = repo;
        }

        // GET /reports?bbox=...&type=...&from=...&to=...
        [HttpGet]
        [ProducesResponseType(typeof(GeoJsonFeatureCollection<ReportPropertiesDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetReports(
            [FromQuery] string bbox,
            [FromQuery] List<string>? type,
            [FromQuery] DateTimeOffset? from,
            [FromQuery] DateTimeOffset? to,
            CancellationToken ct)
        {
            throw new NotImplementedException();
        }

        // GET /reports/{id}
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(GeoJsonFeature<ReportPropertiesDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetReport(long id, CancellationToken ct)
        {
            throw new NotImplementedException();
        }

        // POST /reports
        [Authorize]
        [HttpPost]
        [ProducesResponseType(typeof(CreateReportResponse), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest body, CancellationToken ct)
        {
            throw new NotImplementedException();
        }

        // PATCH /reports/{id}
        [Authorize]
        [HttpPatch("{id:long}")]
        [ProducesResponseType(typeof(UpdateReportResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateReport(long id, [FromBody] UpdateReportRequest body, CancellationToken ct)
        {
            throw new NotImplementedException();
        }

        // PATCH /reports/{id}/upvote
        [Authorize]
        [HttpPatch("{id:long}/upvote")]
        [ProducesResponseType(typeof(ReportUpvoteStateDto), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> ToggleUpvote(long id, CancellationToken ct)
        {
            throw new NotImplementedException();
        }

        // Helpers
        private static ReportPropertiesDto ToPropsDto(Report r, bool upvotedByMe) =>
            new()
            {
                Id = r.Id,
                Type = r.Type,
                OccurredAt = r.OccurredAt,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                Status = r.Status,
                Upvotes = r.Upvotes,
                UpvotedByMe = upvotedByMe,
                Description = r.Description,
                User = new ReportUserDto { Id = r.UserId, Username = r.User?.Username ?? "unknown" }
            };

        private static bool TryParseBbox(string raw, out Envelope env)
        {
            env = default!;
            if (string.IsNullOrWhiteSpace(raw)) return false;
            var parts = raw.Split(',', StringSplitOptions.TrimEntries);
            if (parts.Length != 4) return false;
            if (!double.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var minLng)) return false;
            if (!double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var minLat)) return false;
            if (!double.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var maxLng)) return false;
            if (!double.TryParse(parts[3], NumberStyles.Float, CultureInfo.InvariantCulture, out var maxLat)) return false;
            env = new Envelope(minLng, maxLng, minLat, maxLat);
            return true;
        }

        private long? GetUserId()
        {
            var idClaim = User?.Claims?.FirstOrDefault(c => c.Type == "sub" || c.Type == "userId");
            return long.TryParse(idClaim?.Value, out var id) ? id : null;
        }
    }
}
