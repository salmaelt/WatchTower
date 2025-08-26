using System;
using NUnit.Framework;
using WatchtowerApi.Domain;

namespace WatchtowerApi.Tests.Domain
{
    public class CommentTests
    {
        [Test]
        public void Constructor_SetsDefaultsCorrectly()
        {
            var comment = new Comment();

            Assert.Multiple(() =>
            {
                Assert.That(comment.Upvotes, Is.EqualTo(0));
                Assert.That(comment.UpvoteUsers, Is.Not.Null);
                Assert.That(comment.UpvoteUsers, Is.Empty);
                Assert.That(comment.CreatedAt, Is.Not.EqualTo(default(DateTimeOffset)));
            });
        }

        [Test]
        public void CreatedAt_IsSetToUtcNow()
        {
            var before = DateTimeOffset.UtcNow.AddSeconds(-1);
            var comment = new Comment();
            var after = DateTimeOffset.UtcNow.AddSeconds(1);

            Assert.That(comment.CreatedAt, Is.GreaterThanOrEqualTo(before));
            Assert.That(comment.CreatedAt, Is.LessThanOrEqualTo(after));
        }

        [Test]
        public void CanAssignPrimitiveProperties()
        {
            var comment = new Comment
            {
                Id = 1,
                ReportId = 2,
                UserId = 3,
                CommentText = "Test comment"
            };

            Assert.Multiple(() =>
            {
                Assert.That(comment.Id, Is.EqualTo(1));
                Assert.That(comment.ReportId, Is.EqualTo(2));
                Assert.That(comment.UserId, Is.EqualTo(3));
                Assert.That(comment.CommentText, Is.EqualTo("Test comment"));
            });
        }

        [Test]
        public void CanAssignNavigationProperties()
        {
            var user = new User { Id = 1, Username = "testuser", Email = "test@test.com", PasswordHash = "hash" };
            var report = new Report { Id = 2, UserId = 1, Type = "incident", Description = "desc", OccurredAt = DateTimeOffset.UtcNow, Location = null!, Status = "open" };

            var comment = new Comment
            {
                Id = 3,
                ReportId = 2,
                Report = report,
                UserId = 1,
                User = user,
                CommentText = "Hello"
            };

            Assert.Multiple(() =>
            {
                Assert.That(comment.Report, Is.EqualTo(report));
                Assert.That(comment.User, Is.EqualTo(user));
            });
        }

        [Test]
        public void CanAddUpvoteUsers()
        {
            var comment = new Comment { Id = 1, CommentText = "test" };
            var upvote = new CommentUpvote { CommentId = 1, UserId = 2 };

            comment.UpvoteUsers.Add(upvote);

            Assert.Multiple(() =>
            {
                Assert.That(comment.UpvoteUsers.Count, Is.EqualTo(1));
                Assert.That(comment.UpvoteUsers, Has.Member(upvote));
            });
        }

        [Test]
        public void UpvotesCanBeIncremented()
        {
            var comment = new Comment { Upvotes = 0 };
            comment.Upvotes++;
            Assert.That(comment.Upvotes, Is.EqualTo(1));
        }

        [Test]
        public void CommentUpvote_CreatedAt_IsSetToUtcNow()
        {
            var before = DateTimeOffset.UtcNow.AddSeconds(-1);
            var upvote = new CommentUpvote();
            var after = DateTimeOffset.UtcNow.AddSeconds(1);

            Assert.That(upvote.CreatedAt, Is.GreaterThanOrEqualTo(before));
            Assert.That(upvote.CreatedAt, Is.LessThanOrEqualTo(after));
        }

        [Test]
        public void NavigationCollections_ShouldBeInitialized()
        {
            var comment = new Comment();

            Assert.Multiple(() =>
            {
                Assert.That(comment.UpvoteUsers, Is.Not.Null);
                Assert.That(comment.UpvoteUsers, Is.Empty);
            });
        }
    }
}
