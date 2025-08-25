// Controllers/ReportsController.cs

// External Dependencies
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Geometries;
using System.Globalization;

// Internal Dependencies
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Repositories;
using WatchtowerApi.Infrastructure.Auth;

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
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetReports([FromQuery] ReportListQuery query)
        {
            try
            {
                // Check if call is anonymous, or gather user id
                long? currentUserId = AuthHelpers.TryGetUserId(User);

                if (string.IsNullOrWhiteSpace(query.Bbox))
                    return BadRequest("bbox parameter is required.");
                
                // Longitude is x axis, latitude is y axis DOUBLE CHECK!!!
                if (!TryParseBbox(query.Bbox, out var env))
                    return BadRequest("Invalid bbox format. Expected minLng,minLat,maxLng,maxLat.");

                var (minLng, minLat, maxLng, maxLat) = (env.MinX, env.MinY, env.MaxX, env.MaxY);
                var reports = await _reportRepository.GetReportsInBoundedBoxAsync(minLng, minLat, maxLng, maxLat);

                // Filter by type
                if (query.Type != null && query.Type.Any())
                    reports = reports.Where(r => query.Type.Contains(r.Type));

                // Filter by earliest occurence
                if (query.From.HasValue)
                    reports = reports.Where(r => r.OccurredAt >= query.From.Value.UtcDateTime);

                // Filter by latest occurence
                if (query.To.HasValue)
                    reports = reports.Where(r => r.OccurredAt <= query.To.Value.UtcDateTime);

                var featureCollection = new GeoJsonFeatureCollection<ReportPropertiesDto>();
                foreach (Report r in reports)
                {
                    bool upvotedByMe = false;
                    if (currentUserId != null)
                    {
                        upvotedByMe = r.UpvoteUsers.Any(u => u.UserId == currentUserId);
                    }

                    featureCollection.Features.Add(new GeoJsonFeature<ReportPropertiesDto>
                    {
                        Geometry = new GeoJsonPoint { Coordinates = [r.Location.X, r.Location.Y] },
                        Properties = ToPropsDto(r, upvotedByMe)
                    });
                }

                return Ok(featureCollection);
            }
            catch (Exception e)
            {
                // 500
                return Problem($"Server Error: {e.Message}", statusCode: 500);
            }
        }

        // GET /reports/{id}
        [HttpGet("{id:long}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(GeoJsonFeature<ReportPropertiesDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetReport(long id)
        {
            try
            {
                // Check if call is anonymous, or gather user id
                long? currentUserId = AuthHelpers.TryGetUserId(User);

                // Try to get report, return 404 if not found
                Report? report = await _reportRepository.GetByIdAsync(id);
                if (report == null)
                    return NotFound();

                // Change 
                bool upvotedByMe = false;
                if (currentUserId != null)
                {
                    upvotedByMe = report.UpvoteUsers.Any(u => u.UserId == currentUserId);
                }


                var feature = new GeoJsonFeature<ReportPropertiesDto>
                {
                    Geometry = new GeoJsonPoint { Coordinates = new[] { report.Location.X, report.Location.Y } },
                    Properties = ToPropsDto(report, upvotedByMe)
                };

                return Ok(feature);
            }
            catch (Exception e)
            {
                // 500
                return Problem($"Server Error: {e.Message}", statusCode: 500);
            }
        }

        // POST /reports
        [Authorize]
        [HttpPost]
        [ProducesResponseType(typeof(CreateReportResponse), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
        {
            try
            {
                // Get user id from token
                long currentUserId = AuthHelpers.GetUserId(User);

                // Create a report in the database
                Report created = await _reportRepository.CreateAsync(
                    currentUserId,
                    request.Type,
                    request.Description,
                    request.Lng,
                    request.Lat,
                    request.OccurredAt.UtcDateTime);

                // Construct outgoing DTO
                CreateReportResponse response = new CreateReportResponse
                {
                    Id = created.Id,
                    Status = created.Status,
                    CreatedAt = created.CreatedAt,
                    UpdatedAt = created.UpdatedAt
                };

                // Success response
                return CreatedAtAction(nameof(GetReport), new { id = created.Id }, response);
            }
            catch (InvalidOperationException e)
            {
                // 401
                return Problem($"Bad Token: ${e.Message}", statusCode: 401);
            }
            catch (Exception e)
            {
                // 500
                return Problem($"Server Error: {e.Message}", statusCode: 500);
            }
        }

        // PATCH /reports/{id}
        [Authorize]
        [HttpPatch("{id:long}")]
        [ProducesResponseType(typeof(UpdateReportResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> UpdateReport(long id, [FromBody] UpdateReportRequest body)
        {
            try
            {
                // Get user id from JWT
                long currentUserId = AuthHelpers.GetUserId(User);

                // Check there is a report with this id, return 404 if not
                Report? report = await _reportRepository.GetByIdAsync(id);
                if (report == null) return NotFound();

                // Check the frontend caller owns this report, 403 otherwise
                if (report.UserId != currentUserId)
                    return Forbid();

                // DB update
                Report updated_report = await _reportRepository.UpdateAsync(id, body.Description);

                return Ok(new UpdateReportResponse
                {
                    Id = report.Id,
                    UpdatedAt = (DateTimeOffset)updated_report.UpdatedAt!
                });
            }
            catch (InvalidOperationException e)
            {
                // 401
                return Problem($"Bad Token: ${e.Message}", statusCode: 401);
            }
            catch (Exception e)
            {
                // 500
                return Problem($"Server Error: {e.Message}", statusCode: 500);
            }
        }

        // PUT /reports/{id}/upvote
        [Authorize]
        [HttpPut("{id:long}/upvote")]
        [ProducesResponseType(typeof(ReportUpvoteStateDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> UpvoteReport(long id)
        {
            try
            {
                // Get user id from JWT
                long currentUserId = AuthHelpers.GetUserId(User);

                // Check there is a report with this id, return 404 if not
                Report? report = await _reportRepository.GetByIdAsync(id);
                if (report == null) return NotFound();

                // Check the frontend caller owns this report, 400 for trying to upvote own report
                if (report.UserId == currentUserId)
                {
                    return BadRequest("Cannot upvote your own report.");
                }

                // DB update
                Report updated_report = await _reportRepository.UpvoteAsync(report.Id, currentUserId);

                return Ok(new ReportUpvoteStateDto
                {
                    Id = updated_report.Id,
                    Upvotes = updated_report.Upvotes,
                    UpvotedByMe = true
                });
            }
            catch (InvalidOperationException e)
            {
                // 401
                return Problem($"Bad Token: ${e.Message}", statusCode: 401);
            }
            catch (Exception e)
            {
                // 500
                return Problem($"Server Error: {e.Message}", statusCode: 500);
            }
        }

        // DELETE /reports/{id}/upvote
        [Authorize]
        [HttpDelete("{id:long}/upvote")]
        [ProducesResponseType(typeof(ReportUpvoteStateDto), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> RemoveUpvoteReport(long id)
        {
            try
            {
                // Get user id from JWT
                long currentUserId = AuthHelpers.GetUserId(User);

                // Check there is a report with this id, return 404 if not
                Report? report = await _reportRepository.GetByIdAsync(id);
                if (report == null) return NotFound();

                // Check the frontend caller owns this report, 400 for trying to remove an upvote (shouldn't happen in first place) from own report
                if (report.UserId == currentUserId)
                {
                    return BadRequest("Cannot remove upvote from your own report.");
                }

                // DB update
                Report updated_report = await _reportRepository.RemoveUpvoteAsync(report.Id, currentUserId);

                return Ok(new ReportUpvoteStateDto
                {
                    Id = updated_report.Id,
                    Upvotes = updated_report.Upvotes,
                    UpvotedByMe = false
                });
            }
            catch (InvalidOperationException e)
            {
                // 401
                return Problem($"Bad Token: ${e.Message}", statusCode: 401);
            }
            catch (Exception e)
            {
                // 500
                return Problem($"Server Error: {e.Message}", statusCode: 500);
            }
        }

        // DELETE /reports/{id}
        [Authorize]
        [HttpDelete("{id:long}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> DeleteReport(long id)
        {
            try
            {
                // Get user id from JWT
                long currentUserId = AuthHelpers.GetUserId(User);

                // Check there is a report with this id, return 404 if not
                Report? report = await _reportRepository.GetByIdAsync(id);
                if (report == null) return NotFound();

                // Check the frontend caller owns this report, 403 otherwise
                if (report.UserId != currentUserId)
                {
                    return BadRequest("Cannot delete a report which user does not own.");
                }

                // DB delete
                await _reportRepository.DeleteAsync(id);

                return NoContent();
            }
            catch (InvalidOperationException e)
            {
                // 401
                return Problem($"Bad Token: ${e.Message}", statusCode: 401);
            }
            catch (Exception e)
            {
                // 500
                return Problem($"Server Error: {e.Message}", statusCode: 500);
            }
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