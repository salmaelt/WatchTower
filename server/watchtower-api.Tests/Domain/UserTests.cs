using NUnit.Framework;

namespace WatchtowerApi.Tests.Domain
{
    public class UserTests
    {
        [Test]
        public void Constructor_SetsDefaultsCorrectly()
        {
            var user = new WatchtowerApi.Domain.User();
            Assert.That(user.IsAdmin, Is.False);
            Assert.That(user.CreatedAt, Is.Not.EqualTo(default(DateTimeOffset)));
            Assert.That(user.Reports, Is.Not.Null);
            Assert.That(user.Comments, Is.Not.Null);
            Assert.That(user.ReportUpvotes, Is.Not.Null);
            Assert.That(user.CommentUpvotes, Is.Not.Null);
        }

        [Test]
        public void Username_IsRequired()
        {
            var user = new WatchtowerApi.Domain.User();
            Assert.Throws<ArgumentNullException>(() => user.Username = null!);
        }

        [Test]
        public void Email_IsRequired()
        {
            var user = new WatchtowerApi.Domain.User();
            Assert.Throws<ArgumentNullException>(() => user.Email = null!);
        }

        [Test]
        public void CanAssignNavigationProperties()
        {
            var report = new WatchtowerApi.Domain.Report { Id = 1, Type = "incident", Description = "desc", Location = new NetTopologySuite.Geometries.Point(0,0) { SRID = 4326 }, Status = "open" };
            var comment = new WatchtowerApi.Domain.Comment { Id = 2, CommentText = "test" };
            var user = new WatchtowerApi.Domain.User { Id = 3, Username = "test", Email = "test@test.com", PasswordHash = "hash" };
            user.Reports.Add(report);
            user.Comments.Add(comment);
            Assert.That(user.Reports, Has.Member(report));
            Assert.That(user.Comments, Has.Member(comment));
        }
    }
}
