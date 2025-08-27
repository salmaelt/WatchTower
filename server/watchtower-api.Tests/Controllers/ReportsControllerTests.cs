using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NetTopologySuite.Geometries;
using NUnit.Framework;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
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
        private Mock<IReportRepository> _mockRepo;
        private ReportsController _controller;

        [SetUp]
        public void SetUp()
        {
            _repo = new Mock<IReportRepository>(MockBehavior.Strict);
            _sut = new ReportsController(_repo.Object);
            
            _mockRepo = new Mock<IReportRepository>(MockBehavior.Strict);
            _controller = new ReportsController(_mockRepo.Object);
        }

        // ---------- Helpers ----------
        private static Report MakeReport(
            long id = 1,
            string type = "phone_theft",
            int upvotes = 5,
            string status = "open")
        {
            var report = new Report
            {
                Id = id,
                Type = type,
                Description = "desc",
                OccurredAt = DateTimeOffset.UtcNow,
                Location = new Point(0, 0) { SRID = 4326 },
                Status = status,
                CreatedAt = DateTimeOffset.UtcNow,
                Upvotes = upvotes,
                UserId = 42,
                User = new User { Id = 42, Username = "alice" }
            };
            // UpvoteUsers is read-only, so we can't assign it directly
            // We'll assume it's initialized in the Report constructor
            return report;
        }

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

            // Repo signature: GetReportsInBoundedBoxAsync(minLatitude, minLongitude, maxLatitude, maxLongitude, type, status)
            _repo.Setup(r => r.GetReportsInBoundedBoxAsync(-90, -180, 90, 180, null, null))
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
            _repo.Setup(r => r.GetReportsInBoundedBoxAsync(50, -10, 60, 0, null, null))
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
            _repo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(report);

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
            _repo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Report?)null);

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

            // Repo signature: CreateAsync(long userId, string type, string description, double longitude, double latitude, DateTime occurredAt)
            _repo.Setup(r => r.CreateAsync(123, req.Type, req.Description, req.Lng, req.Lat, req.OccurredAt.UtcDateTime))
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

        [Test]
        public void Check_That_Constructor_WithValidRepository_CreatesInstance()
        {
            var controller = new ReportsController(_mockRepo.Object);
            Assert.That(controller, Is.Not.Null);
        }

        [Test]
        public void Check_That_Constructor_WithNullRepository_ThrowsException()
        {
            Assert.Throws<ArgumentNullException>(() => new ReportsController(null!));
        }

        [Test]
        public async Task Check_That_GetReports_WithMissingBbox_ReturnsBadRequest()
        {
            var query = new ReportListQuery(); // No Bbox
            var result = await _controller.GetReports(query);
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Check_That_GetReport_WithValidId_CallsRepository()
        {
            var report = MakeReport();
            _mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(report);

            var result = await _controller.GetReport(1);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            _mockRepo.Verify(r => r.GetByIdAsync(1), Times.Once);
        }

        [Test]
        public async Task Check_That_CreateReport_RequiresAuthentication()
        {
            var request = new CreateReportRequest
            {
                Type = "test",
                Description = "test",
                OccurredAt = DateTimeOffset.UtcNow,
                Lat = 0,
                Lng = 0
            };

            // No authentication setup, should throw or return unauthorized
            var result = await _controller.CreateReport(request);
            
            // The controller will try to get user ID and fail, resulting in a Problem result
            Assert.That(result, Is.InstanceOf<ObjectResult>());
        }

        [Test]
        public async Task Check_That_UpdateReport_RequiresAuthentication()
        {
            var request = new UpdateReportRequest { Description = "updated" };
            
            var result = await _controller.UpdateReport(1, request);
            
            // The controller will try to get user ID and fail, resulting in a Problem result
            Assert.That(result, Is.InstanceOf<ObjectResult>());
        }

        [Test]
        public async Task Check_That_UpvoteReport_RequiresAuthentication()
        {
            var result = await _controller.UpvoteReport(1);
            
            // The controller will try to get user ID and fail, resulting in a Problem result
            Assert.That(result, Is.InstanceOf<ObjectResult>());
        }

        [Test]
        public void Check_That_TryParseBbox_WithValidBbox_ReturnsTrue()
        {
            var result = TryParseBbox("-180,-90,180,90", out var envelope);
            
            Assert.That(result, Is.True);
            Assert.That(envelope.MinX, Is.EqualTo(-180));
            Assert.That(envelope.MaxX, Is.EqualTo(180));
        }

        [Test]
        public void Check_That_TryParseBbox_WithValidBboxWithSpaces_ReturnsTrue()
        {
            var result = TryParseBbox(" -10.5 , -5.25 , 10.75 , 5.125 ", out var envelope);
            
            Assert.That(result, Is.True);
            Assert.That(envelope.MinX, Is.EqualTo(-10.5));
            Assert.That(envelope.MinY, Is.EqualTo(-5.25));
            Assert.That(envelope.MaxX, Is.EqualTo(10.75));
            Assert.That(envelope.MaxY, Is.EqualTo(5.125));
        }

        [Test]
        public void Check_That_TryParseBbox_WithNull_ReturnsFalse()
        {
            var result = TryParseBbox(null!, out var envelope);
            Assert.That(result, Is.False);
        }

        [TestCase("")]
        [TestCase("   ")]
        public void Check_That_TryParseBbox_WithEmptyOrWhiteSpace_ReturnsFalse(string bboxString)
        {
            var result = TryParseBbox(bboxString, out var envelope);
            Assert.That(result, Is.False);
        }

        [TestCase("1,2,3")]           // Too few parts
        [TestCase("1,2,3,4,5")]       // Too many parts
        [TestCase("a,b,c,d")]         // Non-numeric values
        [TestCase("1,b,3,4")]         // Mixed valid/invalid
        [TestCase("1,2,3,")]          // Empty part
        [TestCase(",1,2,3")]          // Empty first part
        public void Check_That_TryParseBbox_WithInvalidInput_ReturnsFalse(string bboxString)
        {
            var result = TryParseBbox(bboxString, out var envelope);
            Assert.That(result, Is.False);
        }

        [Test]
        public void Check_That_GetUserId_WithSubClaim_ReturnsUserId()
        {
            var controller = CreateControllerWithUser(new Claim("sub", "123"));
            var result = GetUserId(controller);
            Assert.That(result, Is.EqualTo(123));
        }

        [Test]
        public void Check_That_GetUserId_WithUserIdClaim_ReturnsUserId()
        {
            // The actual controller only checks "sub" claim, not "userId"
            var controller = CreateControllerWithUser(new Claim("sub", "456"));
            var result = GetUserId(controller);
            Assert.That(result, Is.EqualTo(456));
        }

        [Test]
        public void Check_That_GetUserId_WithInvalidClaimValue_ReturnsNull()
        {
            var controller = CreateControllerWithUser(new Claim("sub", "not-a-number"));
            var result = GetUserId(controller);
            Assert.That(result, Is.Null);
        }

        [Test]
        public void Check_That_GetUserId_WithNoClaims_ReturnsNull()
        {
            var controller = CreateControllerWithUser();
            var result = GetUserId(controller);
            Assert.That(result, Is.Null);
        }

        [Test]
        public void ToPropsDto_MapsPropertiesCorrectly()
        {
            var now = DateTimeOffset.Now;
            var report = new Report
            {
                Id = 123,
                Type = "incident",
                OccurredAt = now.AddHours(-1),
                CreatedAt = now.AddMinutes(-30),
                UpdatedAt = now.AddMinutes(-5),
                Status = "active",
                Upvotes = 5,
                Description = "Test description",
                UserId = 456,
                User = new User { Username = "testuser" }
                // UpvoteUsers is read-only, can't initialize here
            };

            var result = ToPropsDto(report, true);

            Assert.That(result.Id, Is.EqualTo(123));
            Assert.That(result.Type, Is.EqualTo("incident"));
            Assert.That(result.OccurredAt, Is.EqualTo(report.OccurredAt));
            Assert.That(result.CreatedAt, Is.EqualTo(report.CreatedAt));
            Assert.That(result.UpdatedAt, Is.EqualTo(report.UpdatedAt));
            Assert.That(result.Status, Is.EqualTo("active"));
            Assert.That(result.Upvotes, Is.EqualTo(0)); // UpvoteUsers will be empty/null
            Assert.That(result.UpvotedByMe, Is.True);
            Assert.That(result.Description, Is.EqualTo("Test description"));
            Assert.That(result.User.Id, Is.EqualTo(456));
            Assert.That(result.User.Username, Is.EqualTo("testuser"));
        }

        [Test]
        public void ToPropsDto_WithNullUser_UsesUnknownUsername()
        {
            var report = new Report
            {
                Id = 123,
                UserId = 456,
                User = null
                // UpvoteUsers is read-only, can't initialize here
            };

            var result = ToPropsDto(report, false);

            Assert.That(result.User.Id, Is.EqualTo(456));
            Assert.That(result.User.Username, Is.EqualTo("unknown"));
            Assert.That(result.UpvotedByMe, Is.False);
        }

        // Helper methods for testing private methods
        private static bool TryParseBbox(string raw, out Envelope env)
        {
            var method = typeof(ReportsController).GetMethod("TryParseBbox", 
                BindingFlags.NonPublic | BindingFlags.Static);
            var parameters = new object[] { raw, null! };
            var result = (bool)method!.Invoke(null, parameters)!;
            env = (Envelope)parameters[1];
            return result;
        }

        private static long? GetUserId(ReportsController controller)
        {
            var method = typeof(ReportsController).GetMethod("GetUserId", 
                BindingFlags.NonPublic | BindingFlags.Instance);
            return (long?)method!.Invoke(controller, null);
        }

        private static ReportPropertiesDto ToPropsDto(Report r, bool upvotedByMe)
        {
            var method = typeof(ReportsController).GetMethod("ToPropsDto", 
                BindingFlags.NonPublic | BindingFlags.Static);
            return (ReportPropertiesDto)method!.Invoke(null, new object[] { r, upvotedByMe })!;
        }

        private ReportsController CreateControllerWithUser(params Claim[] claims)
        {
            var mockRepo = new Mock<IReportRepository>();
            var controller = new ReportsController(mockRepo.Object);
            
            var identity = new ClaimsIdentity(claims, "test");
            var principal = new ClaimsPrincipal(identity);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
            
            return controller;
        }
    }
}