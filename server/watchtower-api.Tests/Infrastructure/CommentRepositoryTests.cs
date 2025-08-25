using NUnit.Framework;

namespace WatchtowerApi.Tests.Infrastructure
{
    public class CommentRepositoryTests
    {
        [Test]
        public async Task CreateAsync_CreatesComment()
        {
            var db = TestUtils.TestDbContextFactory.CreateInMemoryDbContext();
            var repo = new WatchtowerApi.Infrastructure.Repositories.CommentRepository(db);
            var comment = await repo.CreateAsync(1, 2, "user", "test comment");
            Assert.That(comment, Is.Not.Null);
            Assert.That(comment.Id, Is.GreaterThan(0));
            Assert.That(comment.CommentText, Is.EqualTo("test comment"));
            Assert.That(comment.UserId, Is.EqualTo(2));
        }

        [Test]
        public async Task ListByReportAsync_ReturnsComments()
        {
            var db = TestUtils.TestDbContextFactory.CreateInMemoryDbContext();
            var repo = new WatchtowerApi.Infrastructure.Repositories.CommentRepository(db);
            await repo.CreateAsync(1, 2, "user", "test comment");
            var comments = await repo.ListByReportAsync(1, 2);
            Assert.That(comments, Is.Not.Null);
            Assert.That(comments.Count, Is.GreaterThanOrEqualTo(1));
        }
    }
}
