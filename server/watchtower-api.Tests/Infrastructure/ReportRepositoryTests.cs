using NUnit.Framework;

namespace WatchtowerApi.Tests.Infrastructure
{
    public class ReportRepositoryTests
    {
        [Test]
        public async Task CreateAsync_CreatesReport()
        {
            var db = TestUtils.TestDbContextFactory.CreateInMemoryDbContext();
            var repo = new WatchtowerApi.Infrastructure.Repositories.ReportRepository(db);
            var report = await repo.CreateAsync(1, "incident", "desc", 0, 0, DateTime.UtcNow);
            Assert.That(report, Is.Not.Null);
            Assert.That(report.Id, Is.GreaterThan(0));
            Assert.That(report.Type, Is.EqualTo("incident"));
            Assert.That(report.Description, Is.EqualTo("desc"));
            Assert.That(report.Location.X, Is.EqualTo(0));
            Assert.That(report.Location.Y, Is.EqualTo(0));
        }

        [Test]
        public async Task GetByIdAsync_ReturnsReport()
        {
            var db = TestUtils.TestDbContextFactory.CreateInMemoryDbContext();
            var repo = new WatchtowerApi.Infrastructure.Repositories.ReportRepository(db);
            var created = await repo.CreateAsync(1, "incident", "desc", 0, 0, DateTime.UtcNow);
            var found = await repo.GetByIdAsync(created.Id);
            Assert.That(found, Is.Not.Null);
            Assert.That(found!.Id, Is.EqualTo(created.Id));
        }

        [Test]
        public async Task GetReportsInBoundedBoxAsync_ReturnsReports()
        {
            var db = TestUtils.TestDbContextFactory.CreateInMemoryDbContext();
            var repo = new WatchtowerApi.Infrastructure.Repositories.ReportRepository(db);
            await repo.CreateAsync(1, "incident", "desc", 0, 0, DateTime.UtcNow);
            var reports = await repo.GetReportsInBoundedBoxAsync(-1, -1, 1, 1);
            Assert.That(reports, Is.Not.Null);
            Assert.That(reports.Count(), Is.GreaterThanOrEqualTo(1));
        }
    }
}
