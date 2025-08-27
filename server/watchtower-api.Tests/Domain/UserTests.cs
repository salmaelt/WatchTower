using System;
using NUnit.Framework;
using WatchtowerApi.Domain;
using NetTopologySuite.Geometries;

namespace WatchtowerApi.Tests.Domain
{
    public class UserTests
    {
        [Test]
        public void Constructor_SetsDefaultsCorrectly()
        {
            var user = new User();

            Assert.Multiple(() =>
            {
                Assert.That(user.IsAdmin, Is.False);
                Assert.That(user.CreatedAt, Is.Not.EqualTo(default(DateTimeOffset)));
                Assert.That(user.Reports, Is.Not.Null);
                Assert.That(user.Comments, Is.Not.Null);
                Assert.That(user.ReportUpvotes, Is.Not.Null);
                Assert.That(user.CommentUpvotes, Is.Not.Null);
            });
        }

        [Test]
        public void CreatedAt_Works()
        {
            var before = DateTimeOffset.UtcNow;
            var user = new User();
            var after = DateTimeOffset.UtcNow;

            Assert.That(user.CreatedAt, Is.InRange(before, after));
        }

        [Test]
        public void CanAssignPrimitiveProperties()
        {
            var user = new User
            {
                Id = 10,
                Username = "tester",
                Email = "tester@example.com",
                PasswordHash = "hash123",
                IsAdmin = true
            };

            Assert.Multiple(() =>
            {
                Assert.That(user.Id, Is.EqualTo(10));
                Assert.That(user.Username, Is.EqualTo("tester"));
                Assert.That(user.Email, Is.EqualTo("tester@example.com"));
                Assert.That(user.PasswordHash, Is.EqualTo("hash123"));
                Assert.That(user.IsAdmin, Is.True);
            });
        }

        [Test]
        public void CanAssignNavigationProperties()
        {
            var report = new Report
            {
                Id = 1,
                Type = "incident",
                Description = "desc",
                Location = new Point(0, 0) { SRID = 4326 },
                Status = "open"
            };

            var comment = new Comment
            {
                Id = 2,
                CommentText = "test"
            };

            var user = new User
            {
                Id = 3,
                Username = "test",
                Email = "test@test.com",
                PasswordHash = "hash"
            };

            user.Reports.Add(report);
            user.Comments.Add(comment);

            Assert.Multiple(() =>
            {
                Assert.That(user.Reports, Has.Member(report));
                Assert.That(user.Comments, Has.Member(comment));
            });
        }

        [Test]
        public void NavigationCollections_ShouldBeInitialized()
        {
            var user = new User();

            Assert.Multiple(() =>
            {
                Assert.That(user.Reports, Is.Not.Null);
                Assert.That(user.Comments, Is.Not.Null);
                Assert.That(user.ReportUpvotes, Is.Not.Null);
                Assert.That(user.CommentUpvotes, Is.Not.Null);
            });
        }
    }
}
