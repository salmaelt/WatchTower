using NUnit.Framework;

namespace WatchtowerApi.Tests.Domain
{
    public class CommentTests
    {
        [Test]
        public void Constructor_SetsDefaultsCorrectly()
        {
            var comment = new WatchtowerApi.Domain.Comment();
            Assert.That(comment.Upvotes, Is.EqualTo(0));
            Assert.That(comment.UpvoteUsers, Is.Not.Null);
            Assert.That(comment.UpvoteUsers, Is.Empty);
        }

        [Test]
        public void CanAssignReportAndUserNavigationProperties()
        {
            var user = new WatchtowerApi.Domain.User { Id = 1, Username = "test", Email = "test@test.com", PasswordHash = "hash" };
            var report = new WatchtowerApi.Domain.Report { Id = 2, UserId = 1, User = user, Type = "incident", Description = "desc", OccurredAt = DateTimeOffset.UtcNow, Location = null!, Status = "open" };
            var comment = new WatchtowerApi.Domain.Comment { Id = 3, ReportId = 2, Report = report, UserId = 1, User = user, CommentText = "hello" };
            Assert.That(comment.Report, Is.EqualTo(report));
            Assert.That(comment.User, Is.EqualTo(user));
        }

        [Test]
        public void CanAddUpvoteUsers()
        {
            var comment = new WatchtowerApi.Domain.Comment { Id = 1, CommentText = "test" };
            var upvote = new WatchtowerApi.Domain.CommentUpvote { CommentId = 1, UserId = 2 };
            comment.UpvoteUsers.Add(upvote);
            Assert.That(comment.UpvoteUsers.Count, Is.EqualTo(1));
            Assert.That(comment.UpvoteUsers, Has.Member(upvote));
        }

        [Test]
        public void UpvotesCanBeIncremented()
        {
            var comment = new WatchtowerApi.Domain.Comment { Upvotes = 0 };
            comment.Upvotes++;
            Assert.That(comment.Upvotes, Is.EqualTo(1));
        }

        [Test]
        public void CreatedAt_IsSetToUtcNow()
        {
            var before = DateTimeOffset.UtcNow.AddSeconds(-1);
            var comment = new WatchtowerApi.Domain.Comment();
            var after = DateTimeOffset.UtcNow.AddSeconds(1);
            Assert.That(comment.CreatedAt, Is.GreaterThanOrEqualTo(before));
            Assert.That(comment.CreatedAt, Is.LessThanOrEqualTo(after));
        }
    }
}
