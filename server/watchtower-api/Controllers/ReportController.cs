using System.Security.Claims;
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
        private readonly IReportRepository _reportRepository;

        public ReportsController(IReportRepository reportRepository)
        {
            _reportRepository = reportRepository;
        }

        // GET /reports?bbox=...&type=...&from=...&to=...
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(GeoJsonFeatureCollection<ReportPropertiesDto>), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> GetReports([FromQuery] ReportListQuery query)
        {
           
            if (string.IsNullOrWhiteSpace(query.Bbox))
                return BadRequest("bbox parameter is required.");

            if (!TryParseBbox(query.Bbox, out var env))
                return BadRequest("Invalid bbox format. Expected minLng,minLat,maxLng,maxLat.");

            var reports = await _reportRepository.GetReportsInBoundedBoxAsync(
                env.MinY, env.MinX, env.MaxY, env.MaxX);

            if (query.Type != null && query.Type.Any())
                reports = reports.Where(r => query.Type.Contains(r.Type));

            if (query.From.HasValue)
                reports = reports.Where(r => r.OccurredAt >= query.From.Value.UtcDateTime);

            if (query.To.HasValue)
                reports = reports.Where(r => r.OccurredAt <= query.To.Value.UtcDateTime);

            // Get current user ID using JWT claims
            var currentUserId = GetUserId();

            var featureCollection = new GeoJsonFeatureCollection<ReportPropertiesDto>();
            foreach (var r in reports)
            {
                //
                bool upvotedByMe = currentUserId.HasValue && r.UpvoteUsers != null && 
                                   r.UpvoteUsers.Any(u => u.UserId == currentUserId.Value);
                
                featureCollection.Features.Add(new GeoJsonFeature<ReportPropertiesDto>
                {
                    Geometry = new GeoJsonPoint { Coordinates = new[] { r.Location.X, r.Location.Y } },
                    Properties = ToPropsDto(r, upvotedByMe)
                });
            }

            return Ok(featureCollection);
        }

        // GET /reports/{id}
        [HttpGet("{id:long}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(GeoJsonFeature<ReportPropertiesDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetReport(long id)
        {
            var report = await _reportRepository.GetByIdAsync((int)id);
            if (report == null)
                return NotFound();

            var currentUserId = GetUserId();
            bool upvotedByMe = currentUserId.HasValue && report.UpvoteUsers != null && 
                               report.UpvoteUsers.Any(u => u.UserId == currentUserId.Value);

            var feature = new GeoJsonFeature<ReportPropertiesDto>
            {
                Geometry = new GeoJsonPoint { Coordinates = new[] { report.Location.X, report.Location.Y } },
                Properties = ToPropsDto(report, upvotedByMe)
            };

            return Ok(feature);
        }

        // POST /reports
        [Authorize]
        [HttpPost]
        [ProducesResponseType(typeof(CreateReportResponse), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
        {
            var currentUserId = GetUserId();
            if (currentUserId == null)
                return Unauthorized();

            var report = await _reportRepository.CreateAsync(
                (int)currentUserId.Value,
                request.Type,
                request.Description,
                request.Lat,
                request.Lng,
                request.OccurredAt.UtcDateTime);

            var response = new CreateReportResponse
            {
                Id = report.Id,
                Status = report.Status,
                CreatedAt = report.CreatedAt,
                UpdatedAt = report.UpdatedAt
            };

            return CreatedAtAction(nameof(GetReport), new { id = report.Id }, response);
        }

        // PATCH /reports/{id}
        [Authorize]
        [HttpPatch("{id:long}")]
        [ProducesResponseType(typeof(UpdateReportResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateReport(long id, [FromBody] UpdateReportRequest body)
        {
            var currentUserId = GetUserId();
            if (currentUserId == null) return Unauthorized();

            var report = await _reportRepository.GetByIdAsync((int)id);
            if (report == null) return NotFound();

            if (report.UserId != currentUserId.Value && !User.IsInRole("admin"))
                return Forbid();

            await _reportRepository.UpdateAsync((int)id, report.Type, body.Description, report.Status);

            report = await _reportRepository.GetByIdAsync((int)id);

            return Ok(new UpdateReportResponse
            {
                Id = report.Id,
                UpdatedAt = report.UpdatedAt ?? report.CreatedAt
            });
        }

        // PUT /reports/{id}/upvote
        [Authorize]
        [HttpPut("{id:long}/upvote")]
        [ProducesResponseType(typeof(ReportUpvoteStateDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpvoteReport(long id)
        {
            var currentUserId = GetUserId();
            if (currentUserId == null) return Unauthorized();

            var report = await _reportRepository.GetByIdAsync((int)id);
            if (report == null) return NotFound();

            if (report.UserId == currentUserId.Value)
                return BadRequest("Cannot upvote your own report.");

            if (report.UpvoteUsers != null && !report.UpvoteUsers.Any(u => u.UserId == currentUserId.Value))
            {
                await _reportRepository.UpvoteAsync(id, (int)currentUserId.Value);
            }

            // Refresh report data
            report = await _reportRepository.GetByIdAsync((int)id);

            return Ok(new ReportUpvoteStateDto
            {
                Id = report.Id,
                Upvotes = report.UpvoteUsers?.Count ?? 0,
                UpvotedByMe = report.UpvoteUsers?.Any(u => u.UserId == currentUserId.Value) ?? false
            });
        }

        // DELETE /reports/{id}/upvote
        [Authorize]
        [HttpDelete("{id:long}/upvote")]
        [ProducesResponseType(typeof(ReportUpvoteStateDto), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> RemoveUpvote(long id)
        {
            var currentUserId = GetUserId();
            if (currentUserId == null) return Unauthorized();

            var report = await _reportRepository.GetByIdAsync((int)id);
            if (report == null) return NotFound();

            await _reportRepository.RemoveUpvoteAsync(id, (int)currentUserId.Value);

            // Refresh report data
            report = await _reportRepository.GetByIdAsync((int)id);

            return Ok(new ReportUpvoteStateDto
            {
                Id = report.Id,
                Upvotes = report.UpvoteUsers?.Count ?? 0,
                UpvotedByMe = false // Always false after removal
            });
        }

        // DELETE /reports/{id}
        [Authorize]
        [HttpDelete("{id:long}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> DeleteReport(long id)
        {
            var currentUserId = GetUserId();
            if (currentUserId == null) return Unauthorized();

            var report = await _reportRepository.GetByIdAsync((int)id);
            if (report == null) return NotFound();

            if (report.UserId != currentUserId.Value && !User.IsInRole("admin"))
                return Forbid();

            await _reportRepository.DeleteAsync((int)id);

            return NoContent();
        }

        // Helper Methods
        private static ReportPropertiesDto ToPropsDto(Report r, bool upvotedByMe) => new()
        {
            Id = r.Id,
            Type = r.Type,
            OccurredAt = r.OccurredAt,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            Status = r.Status,
            Upvotes = r.UpvoteUsers?.Count ?? 0, 
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
            var userIdClaim = User.FindFirstValue("sub");
            return !string.IsNullOrEmpty(userIdClaim) && long.TryParse(userIdClaim, out var id) ? id : null;
        }
    }
}