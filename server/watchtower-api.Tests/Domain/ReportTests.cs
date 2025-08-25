using NUnit.Framework;

namespace WatchtowerApi.Tests.Domain
{
    public class ReportTests
    {
        [Test]
        public void Constructor_SetsDefaultsCorrectly()
        {
            var report = new WatchtowerApi.Domain.Report();
            Assert.That(report.Status, Is.EqualTo("open"));
            Assert.That(report.Upvotes, Is.EqualTo(0));
            Assert.That(report.CreatedAt, Is.Not.Null);
            Assert.That(report.UpvoteUsers, Is.Not.Null);
            Assert.That(report.UpvoteUsers, Is.Empty);
        }

        [Test]
        public void Location_IsRequired()
        {
            var report = new WatchtowerApi.Domain.Report();
            Assert.Throws<ArgumentNullException>(() => report.Location = null!);
        }

        [Test]
        public void CanAssignUserNavigationProperty()
        {
            var user = new WatchtowerApi.Domain.User { Id = 1, Username = "test", Email = "test@test.com", PasswordHash = "hash" };
            var report = new WatchtowerApi.Domain.Report { Id = 2, UserId = 1, User = user, Type = "incident", Description = "desc", OccurredAt = DateTimeOffset.UtcNow, Location = new NetTopologySuite.Geometries.Point(0,0) { SRID = 4326 }, Status = "open" };
            Assert.That(report.User, Is.EqualTo(user));
        }

        [Test]
        public void CanAddUpvoteUsers()
        {
            var report = new WatchtowerApi.Domain.Report { Id = 1, Type = "incident", Description = "desc", Location = new NetTopologySuite.Geometries.Point(0,0) { SRID = 4326 }, Status = "open" };
            var upvote = new WatchtowerApi.Domain.ReportUpvote { ReportId = 1, UserId = 2 };
            report.UpvoteUsers.Add(upvote);
            Assert.That(report.UpvoteUsers.Count, Is.EqualTo(1));
            Assert.That(report.UpvoteUsers, Has.Member(upvote));
        }

        [Test]
        public void UpvotesCanBeIncremented()
        {
            var report = new WatchtowerApi.Domain.Report { Upvotes = 0 };
            report.Upvotes++;
            Assert.That(report.Upvotes, Is.EqualTo(1));
        }

        [Test]
        public void CreatedAt_IsSetToUtcNow()
        {
            var before = DateTimeOffset.UtcNow.AddSeconds(-1);
            var report = new WatchtowerApi.Domain.Report();
            var after = DateTimeOffset.UtcNow.AddSeconds(1);
            Assert.That(report.CreatedAt, Is.GreaterThanOrEqualTo(before));
            Assert.That(report.CreatedAt, Is.LessThanOrEqualTo(after));
        }
    }
}
