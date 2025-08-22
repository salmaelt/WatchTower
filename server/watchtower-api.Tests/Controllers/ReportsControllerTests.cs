using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Moq;
using NetTopologySuite.Geometries;
using NUnit.Framework;
using System.Security.Claims;
using WatchtowerApi.Controllers;
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Repositories;
using System.Reflection;

namespace WatchtowerApi.Tests.Controllers
{
    [TestFixture]
    public class ReportsControllerTests
    {
        private Mock<IReportRepository> _mockRepo;
        private ReportsController _controller;

        [SetUp]
        public void SetUp()
        {
            _mockRepo = new Mock<IReportRepository>();
            _controller = new ReportsController(_mockRepo.Object);
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
        public void Check_That_GetReports_ThrowsNotImplementedException()
        {
            Assert.ThrowsAsync<NotImplementedException>(() => 
                _controller.GetReports("1,2,3,4", null, null, null, CancellationToken.None));
        }

        [Test]
        public void Check_That_GetReport_ThrowsNotImplementedException()
        {
            Assert.ThrowsAsync<NotImplementedException>(() => 
                _controller.GetReport(1, CancellationToken.None));
        }

        [Test]
        public void Check_That_CreateReport_ThrowsNotImplementedException()
        {
            var request = new CreateReportRequest();
            Assert.ThrowsAsync<NotImplementedException>(() => 
                _controller.CreateReport(request, CancellationToken.None));
        }

        [Test]
        public void Check_That_UpdateReport_ThrowsNotImplementedException()
        {
            var request = new UpdateReportRequest();
            Assert.ThrowsAsync<NotImplementedException>(() => 
                _controller.UpdateReport(1, request, CancellationToken.None));
        }

        [Test]
        public void Check_That_ToggleUpvote_ThrowsNotImplementedException()
        {
            Assert.ThrowsAsync<NotImplementedException>(() => 
                _controller.ToggleUpvote(1, CancellationToken.None));
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
            var controller = CreateControllerWithUser(new Claim("userId", "456"));
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
            };

            var result = ToPropsDto(report, true);

            Assert.That(result.Id, Is.EqualTo(123));
            Assert.That(result.Type, Is.EqualTo("incident"));
            Assert.That(result.OccurredAt, Is.EqualTo(report.OccurredAt));
            Assert.That(result.CreatedAt, Is.EqualTo(report.CreatedAt));
            Assert.That(result.UpdatedAt, Is.EqualTo(report.UpdatedAt));
            Assert.That(result.Status, Is.EqualTo("active"));
            Assert.That(result.Upvotes, Is.EqualTo(5));
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