using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NetTopologySuite.Geometries;
using NUnit.Framework;
using System.IdentityModel.Tokens.Jwt;
using WatchtowerApi.Contracts;
using WatchtowerApi.Controllers;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Repositories;

namespace WatchtowerApi.Tests.Controllers
{
    [TestFixture]
    public class ReportsControllerTests
    {
        private Mock<IReportRepository> _repo;
        private ReportsController _sut;

        [SetUp]
        public void SetUp()
        {
            _repo = new Mock<IReportRepository>(MockBehavior.Strict);
            _sut = new ReportsController(_repo.Object);
        }

        // ---------- Helpers ----------
        private static Report MakeReport(
            long id = 1,
            string type = "phone_theft",
            int upvotes = 5,
            string status = "open")
        => new()
        {
            Id = id,
            Type = type,
            Description = "desc",
            OccurredAt = DateTimeOffset.UtcNow,
            Location = new Point(0, 0) { SRID = 4326 },
            Status = status,
            CreatedAt = DateTimeOffset.UtcNow,
            Upvotes = upvotes,
            User = new User { Id = 42, Username = "alice" }
        };

        private void WithAuthenticatedUser(long userId = 7, string username = "bob")
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, username),
                new Claim(JwtRegisteredClaimNames.UniqueName, username),
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            _sut.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        // ---------- Tests ----------

        [Test]
        public async Task GetReports_ReturnsGeoJsonFeatureCollection()
        {
            // Arrange
            var query = new ReportListQuery { Bbox = "-180,-90,180,90" };
            var reports = new List<Report> { MakeReport() };

            // Repo signature: GetReportsInBoundedBoxAsync(minLng, minLat, maxLng, maxLat, string? type = null, string? status = null)
            _repo.Setup(r => r.GetReportsInBoundedBoxAsync(
                    -180, -90, 180, 90,
                    It.IsAny<string?>(),
                    It.IsAny<string?>()))
                 .ReturnsAsync(reports);

            // Act
            var result = await _sut.GetReports(query);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var ok = (OkObjectResult)result;
            Assert.That(ok.Value, Is.InstanceOf<GeoJsonFeatureCollection<ReportPropertiesDto>>());
            _repo.VerifyAll();
        }

        [TestCase("invalid")]
        [TestCase("0,0,1")]           // too few parts
        [TestCase("a,b,c,d")]         // non-numeric
        public async Task GetReports_InvalidBbox_ReturnsBadRequest(string bbox)
        {
            // Arrange
            var query = new ReportListQuery { Bbox = bbox };

            // Act
            var result = await _sut.GetReports(query);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            _repo.VerifyNoOtherCalls();
        }

        [Test]
        public async Task GetReports_EmptyList_ReturnsEmptyFeatureCollection()
        {
            // Arrange
            var query = new ReportListQuery { Bbox = "-10,50,0,60" };
            _repo.Setup(r => r.GetReportsInBoundedBoxAsync(
                    -10, 50, 0, 60,
                    It.IsAny<string?>(),
                    It.IsAny<string?>()))
                 .ReturnsAsync(new List<Report>());

            // Act
            var result = await _sut.GetReports(query);

            // Assert
            var ok = result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            var fc = ok!.Value as GeoJsonFeatureCollection<ReportPropertiesDto>;
            Assert.That(fc, Is.Not.Null);
            Assert.That(fc!.Features, Is.Empty);
            _repo.VerifyAll();
        }

        [Test]
        public async Task GetReport_ReturnsGeoJsonFeature()
        {
            // Arrange
            var report = MakeReport();
            _repo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(report); // <-- fixed parentheses/signature

            // Act
            var result = await _sut.GetReport(1);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var ok = (OkObjectResult)result;
            Assert.That(ok.Value, Is.InstanceOf<GeoJsonFeature<ReportPropertiesDto>>());
            _repo.VerifyAll();
        }

        [Test]
        public async Task GetReport_NotFound_ReturnsNotFound()
        {
            // Arrange
            _repo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Report?)null); // repo only takes id

            // Act
            var result = await _sut.GetReport(1);

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
            _repo.VerifyAll();
        }

        [Test]
        public async Task CreateReport_Returns201CreatedAt_GetReport_WithPayload()
        {
            // Arrange
            WithAuthenticatedUser(userId: 123, username: "reporter");

            var req = new CreateReportRequest
            {
                Type = "phone_theft",
                Description = "desc",
                OccurredAt = DateTimeOffset.UtcNow,
                Lat = 0,
                Lng = 0
            };

            var created = new Report
            {
                Id = 1,
                Status = "open",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = null
            };

            // Repo signature: CreateAsync(long userId, string type, string description, double longitude, double latitude, DateTime? occurredAt = null)
            _repo.Setup(r => r.CreateAsync(
                    123, req.Type, req.Description, req.Lng, req.Lat, req.OccurredAt.UtcDateTime))
                .ReturnsAsync(created);

            // Act
            var result = await _sut.CreateReport(req);

            // Assert
            var createdAt = result as CreatedAtActionResult;
            Assert.That(createdAt, Is.Not.Null, "Expected CreatedAtActionResult (201).");
            Assert.That(createdAt!.StatusCode, Is.EqualTo(201));

            // location/action metadata
            Assert.That(createdAt.ActionName, Is.EqualTo(nameof(ReportsController.GetReport)));
            Assert.That(createdAt.RouteValues, Is.Not.Null);
            Assert.That(createdAt.RouteValues!["id"], Is.EqualTo(1));

            // payload
            Assert.That(createdAt.Value, Is.InstanceOf<CreateReportResponse>());
            var dto = (CreateReportResponse)createdAt.Value!;
            Assert.That(dto.Id, Is.EqualTo(1));
            Assert.That(dto.Status, Is.EqualTo("open"));

            _repo.VerifyAll();
        }
    }
}
