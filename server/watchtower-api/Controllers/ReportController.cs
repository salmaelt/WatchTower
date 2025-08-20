// Controllers/ReportsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Geometries;
using System.Globalization;
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;

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
            if (!TryParseBbox(bbox, out var env))
                return Problem("Invalid bbox", statusCode: 400);

            var userId = GetUserId();
            var result = await _repo.QueryInBBoxAsync(env, type, from, to, userId, ct);

            var fc = new GeoJsonFeatureCollection<ReportPropertiesDto>
            {
                Features = result.Items.Select(r =>
                    new GeoJsonFeature<ReportPropertiesDto>
                    {
                        Geometry = new GeoJsonPoint { Coordinates = [r.Location.X, r.Location.Y] },
                        Properties = ToPropsDto(r, result.UpvotedIds.Contains(r.Id))
                    }).ToList()
            };
            return Ok(fc);
        }

        // GET /reports/{id}
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(GeoJsonFeature<ReportPropertiesDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetReport(long id, CancellationToken ct)
        {
            var userId = GetUserId();
            var r = await _repo.GetByIdAsync(id, ct);
            if (r is null) return NotFound();

            var upvotedByMe = userId.HasValue && await _repo.HasUserUpvotedAsync(id, userId.Value, ct);

            return Ok(new GeoJsonFeature<ReportPropertiesDto>
            {
                Geometry = new GeoJsonPoint { Coordinates = [r.Location.X, r.Location.Y] },
                Properties = ToPropsDto(r, upvotedByMe)
            });
        }

        // POST /reports
        [Authorize]
        [HttpPost]
        [ProducesResponseType(typeof(CreateReportResponse), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest body, CancellationToken ct)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var userId = GetUserId();
            if (!userId.HasValue) return Unauthorized();

            var entity = new Report
            {
                UserId = userId.Value,
                Type = body.Type.Trim(),
                Description = body.Description.Trim(),
                OccurredAt = body.OccurredAt,
                Location = new Point(body.Lng, body.Lat) { SRID = 4326 },
                Status = "open",
                CreatedAt = DateTimeOffset.UtcNow
            };

            var created = await _repo.AddAsync(entity, ct);
            var response = new CreateReportResponse
            {
                Id = created.Id,
                Status = created.Status,
                CreatedAt = created.CreatedAt,
                UpdatedAt = created.UpdatedAt
            };

            return CreatedAtAction(nameof(GetReport), new { id = created.Id }, response);
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
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var userId = GetUserId();
            if (!userId.HasValue) return Unauthorized();

            var r = await _repo.GetByIdAsync(id, ct);
            if (r is null) return NotFound();
            if (r.UserId != userId && !User.IsInRole("admin")) return Forbid();

            r.Description = body.Description.Trim();
            r.UpdatedAt = DateTimeOffset.UtcNow;
            await _repo.UpdateAsync(r, ct);

            return Ok(new UpdateReportResponse { Id = r.Id, UpdatedAt = r.UpdatedAt!.Value });
        }

        // PATCH /reports/{id}/upvote
        [Authorize]
        [HttpPatch("{id:long}/upvote")]
        [ProducesResponseType(typeof(ReportUpvoteStateDto), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> ToggleUpvote(long id, CancellationToken ct)
        {
            var userId = GetUserId();
            if (!userId.HasValue) return Unauthorized();

            var exists = await _repo.ExistsAsync(id, ct);
            if (!exists) return NotFound();

            var state = await _repo.ToggleUpvoteAsync(id, userId.Value, ct);
            return Ok(new ReportUpvoteStateDto { Id = id, Upvotes = state.Upvotes, UpvotedByMe = state.UpvotedByMe });
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

    // Repository contract (simplified)
    public interface IReportRepository
    {
        Task<BboxQueryResult> QueryInBBoxAsync(Envelope bbox, List<string>? types, DateTimeOffset? from, DateTimeOffset? to, long? currentUserId, CancellationToken ct);
        Task<Report?> GetByIdAsync(long id, CancellationToken ct);
        Task<bool> ExistsAsync(long id, CancellationToken ct);
        Task<bool> HasUserUpvotedAsync(long reportId, long userId, CancellationToken ct);
        Task<Report> AddAsync(Report report, CancellationToken ct);
        Task UpdateAsync(Report report, CancellationToken ct);
        Task<UpvoteState> ToggleUpvoteAsync(long reportId, long userId, CancellationToken ct);
    }

    public record BboxQueryResult(IEnumerable<Report> Items, HashSet<long> UpvotedIds);
    public record UpvoteState(int Upvotes, bool UpvotedByMe);
}
