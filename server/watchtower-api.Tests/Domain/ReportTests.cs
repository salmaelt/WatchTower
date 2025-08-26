using System;
using NUnit.Framework;
using WatchtowerApi.Domain;
using NetTopologySuite.Geometries;

namespace WatchtowerApi.Tests.Domain
{
    public class ReportTests
    {
        [Test]
        public void Constructor_SetsDefaultsCorrectly()
        {
            var report = new Report();

            Assert.Multiple(() =>
            {
                Assert.That(report.Status, Is.EqualTo("open"));
                Assert.That(report.Upvotes, Is.EqualTo(0));
                Assert.That(report.UpvoteUsers, Is.Not.Null);
                Assert.That(report.UpvoteUsers, Is.Empty);
            });
        }

        [Test]
        public void CreatedAt_IsSetToUtcNow()
        {
            var before = DateTimeOffset.UtcNow.AddSeconds(-1);
            var report = new Report();
            var after = DateTimeOffset.UtcNow.AddSeconds(1);

            Assert.That(report.CreatedAt, Is.GreaterThanOrEqualTo(before));
            Assert.That(report.CreatedAt, Is.LessThanOrEqualTo(after));
        }

        [Test]
        public void CanAssignPrimitiveProperties()
        {
            var occurredAt = DateTimeOffset.UtcNow.AddHours(-2);
            var location = new Point(10, 20) { SRID = 4326 };
            var updatedAt = DateTimeOffset.UtcNow;

            var report = new Report
            {
                Id = 1,
                UserId = 2,
                Type = "incident",
                Description = "Test description",
                OccurredAt = occurredAt,
                Location = location,
                Status = "closed",
                Upvotes = 5,
                UpdatedAt = updatedAt
            };

            Assert.Multiple(() =>
            {
                Assert.That(report.Id, Is.EqualTo(1));
                Assert.That(report.UserId, Is.EqualTo(2));
                Assert.That(report.Type, Is.EqualTo("incident"));
                Assert.That(report.Description, Is.EqualTo("Test description"));
                Assert.That(report.OccurredAt, Is.EqualTo(occurredAt));
                Assert.That(report.Location, Is.EqualTo(location));
                Assert.That(report.Status, Is.EqualTo("closed"));
                Assert.That(report.Upvotes, Is.EqualTo(5));
                Assert.That(report.UpdatedAt, Is.EqualTo(updatedAt));
            });
        }

        [Test]
        public void CanAssignUserNavigationProperty()
        {
            var user = new User { Id = 1, Username = "testuser", Email = "test@test.com", PasswordHash = "hash" };
            var report = new Report { UserId = 1, User = user };

            Assert.That(report.User, Is.EqualTo(user));
        }

        [Test]
        public void CanAddUpvoteUsers()
        {
            var report = new Report();
            var upvote = new ReportUpvote { ReportId = 1, UserId = 2 };

            report.UpvoteUsers.Add(upvote);

            Assert.Multiple(() =>
            {
                Assert.That(report.UpvoteUsers, Has.Member(upvote));
                Assert.That(report.UpvoteUsers.Count, Is.EqualTo(1));
            });
        }

        [Test]
        public void UpvotesCanBeIncremented()
        {
            var report = new Report { Upvotes = 0 };
            report.Upvotes++;
            Assert.That(report.Upvotes, Is.EqualTo(1));
        }

        [Test]
        public void NavigationCollections_ShouldBeInitialized()
        {
            var report = new Report();
            Assert.Multiple(() =>
            {
                Assert.That(report.UpvoteUsers, Is.Not.Null);
                Assert.That(report.UpvoteUsers, Is.Empty);
            });
        }
    }
}
