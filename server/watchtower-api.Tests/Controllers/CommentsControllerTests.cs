using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.IdentityModel.Tokens.Jwt;

using WatchtowerApi.Contracts;
using WatchtowerApi.Controllers;
using WatchtowerApi.Infrastructure.Repositories;

namespace WatchtowerApi.Tests.Controllers
{
    [TestFixture]
    public class CommentsControllerTests
    {
        private Mock<ICommentRepository> _repo;
        private CommentsController _sut;

        [SetUp]
        public void SetUp()
        {
            _repo = new Mock<ICommentRepository>(MockBehavior.Strict);
            _sut = new CommentsController(_repo.Object);
        }

        // ---------- helpers ----------
        private void WithUser(long id = 42, string username = "alice", bool admin = false)
        {
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, id.ToString()),
                new(JwtRegisteredClaimNames.UniqueName, username),
                new(ClaimTypes.Name, username),
            };

            if (admin)
                claims.Add(new Claim(ClaimTypes.Role, "admin"));

            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            _sut.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        // ---------- ListForReport ----------
        [Test]
        public async Task ListForReport_ReportMissing_Returns404()
        {
            _repo.Setup(r => r.ReportExistsAsync(1)).ReturnsAsync(false);

            var result = await _sut.ListForReport(1);

            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
            _repo.VerifyAll();
        }

        [Test]
        public async Task ListForReport_ReturnsOkWithItems()
        {
            _repo.Setup(r => r.ReportExistsAsync(1)).ReturnsAsync(true);
            // caller unauthenticated → callerId null
            _repo.Setup(r => r.ListByReportAsync(1, null)).ReturnsAsync(new List<CommentDto>
            {
                new CommentDto { Id = 10, UserId = 2, Username = "bob", CommentText = "hi", Upvotes = 0, UpvotedByMe = false, CreatedAt = DateTimeOffset.UtcNow }
            });

            var result = await _sut.ListForReport(1);

            var ok = result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            var items = ok!.Value as List<CommentDto>;
            Assert.That(items, Is.Not.Null);
            Assert.That(items!.Count, Is.EqualTo(1));
            _repo.VerifyAll();
        }

        [Test]
        public async Task ListForReport_WithAuth_PassesCallerId()
        {
            WithUser(id: 77, username: "carol");
            _repo.Setup(r => r.ReportExistsAsync(1)).ReturnsAsync(true);
            _repo.Setup(r => r.ListByReportAsync(1, 77)).ReturnsAsync(new List<CommentDto>());

            var result = await _sut.ListForReport(1);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            _repo.VerifyAll();
        }

        // ---------- Create ----------
        [Test]
        public async Task Create_EmptyBody_Returns400()
        {
            WithUser(); // auth is required
            var result = await _sut.Create(1, new CreateCommentRequest { CommentText = "  " });

            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var problem = (ObjectResult)result;
            Assert.That(problem.StatusCode, Is.EqualTo(400));
        }

        [Test]
        public async Task Create_ReportMissing_Returns404()
        {
            WithUser(id: 100, username: "u1");
            _repo.Setup(r => r.ReportExistsAsync(1)).ReturnsAsync(false);

            var result = await _sut.Create(1, new CreateCommentRequest { CommentText = "test" });

            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
            _repo.VerifyAll();
        }

        [Test]
        public async Task Create_Valid_Returns201WithDto()
        {
            WithUser(id: 100, username: "u1");
            _repo.Setup(r => r.ReportExistsAsync(1)).ReturnsAsync(true);
            _repo.Setup(r => r.CreateAsync(1, 100, "u1", "test", It.IsAny<DateTimeOffset?>()))
                 .ReturnsAsync(new CommentDto { Id = 5, UserId = 100, Username = "u1", CommentText = "test", Upvotes = 0, UpvotedByMe = false, CreatedAt = DateTimeOffset.UtcNow });

            var result = await _sut.Create(1, new CreateCommentRequest { CommentText = "test" });

            var created = result as ObjectResult;
            Assert.That(created, Is.Not.Null);
            Assert.That(created!.StatusCode, Is.EqualTo(201));
            Assert.That(created.Value, Is.InstanceOf<CommentDto>());
            var dto = (CommentDto)created.Value!;
            Assert.That(dto.Id, Is.EqualTo(5));
            _repo.VerifyAll();
        }

        // ---------- Upvote ----------
        [Test]
        public async Task Upvote_NotFound_Returns404()
        {
            WithUser(id: 11, username: "u2");
            _repo.Setup(r => r.UpvoteAsync(99, 11)).ReturnsAsync((CommentUpvoteStateDto?)null);

            var result = await _sut.Upvote(99);

            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
            _repo.VerifyAll();
        }

        [Test]
        public async Task Upvote_SelfUpvote_ThrowsInvalidOp_Returns400()
        {
            WithUser(id: 11, username: "u2");
            _repo.Setup(r => r.UpvoteAsync(1, 11)).ThrowsAsync(new InvalidOperationException("self upvote"));

            var result = await _sut.Upvote(1);

            var problem = result as ObjectResult;
            Assert.That(problem, Is.Not.Null);
            Assert.That(problem!.StatusCode, Is.EqualTo(400));
            _repo.VerifyAll();
        }

        [Test]
        public async Task Upvote_Ok_ReturnsState()
        {
            WithUser(id: 11, username: "u2");
            var state = new CommentUpvoteStateDto { Id = 1, Upvotes = 3, UpvotedByMe = true };
            _repo.Setup(r => r.UpvoteAsync(1, 11)).ReturnsAsync(state);

            var result = await _sut.Upvote(1);

            var ok = result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            Assert.That(ok!.Value, Is.EqualTo(state));
            _repo.VerifyAll();
        }

        // ---------- RemoveUpvote ----------
        [Test]
        public async Task RemoveUpvote_NotFound_Returns404()
        {
            WithUser(id: 9, username: "u3");
            _repo.Setup(r => r.RemoveUpvoteAsync(50, 9)).ReturnsAsync((CommentUpvoteStateDto?)null);

            var result = await _sut.RemoveUpvote(50);

            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
            _repo.VerifyAll();
        }

        [Test]
        public async Task RemoveUpvote_Ok_ReturnsState()
        {
            WithUser(id: 9, username: "u3");
            var state = new CommentUpvoteStateDto { Id = 50, Upvotes = 0, UpvotedByMe = false };
            _repo.Setup(r => r.RemoveUpvoteAsync(50, 9)).ReturnsAsync(state);

            var result = await _sut.RemoveUpvote(50);

            var ok = result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            Assert.That(ok!.Value, Is.EqualTo(state));
            _repo.VerifyAll();
        }

        // ---------- Delete ----------
        [Test]
        public async Task Delete_NotFound_Returns404()
        {
            WithUser(id: 77, username: "owner");
            _repo.Setup(r => r.DeleteOwnedAsync(123, 77, false)).ReturnsAsync(false);

            var result = await _sut.Delete(123);

            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
            _repo.VerifyAll();
        }

        [Test]
        public async Task Delete_Ok_AsOwner_Returns204()
        {
            WithUser(id: 77, username: "owner");
            _repo.Setup(r => r.DeleteOwnedAsync(123, 77, false)).ReturnsAsync(true);

            var result = await _sut.Delete(123);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _repo.VerifyAll();
        }

        [Test]
        public async Task Delete_Ok_AsAdmin_Returns204()
        {
            WithUser(id: 2, username: "admin", admin: true);
            _repo.Setup(r => r.DeleteOwnedAsync(123, 2, true)).ReturnsAsync(true);

            var result = await _sut.Delete(123);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _repo.VerifyAll();
        }
    }
}