using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using NUnit.Framework;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure;
using WatchtowerApi.Infrastructure.Repositories;
using WatchtowerApi.Tests.TestUtils;

namespace WatchtowerApi.Tests.Infrastructure
{
    public static class ReportTestHelpers
    {
        public static async Task<Report> CreateTestReport(this ReportRepository repo, long userId = 1,
            string type = "incident", string description = "desc", double lon = 0, double lat = 0)
        {
            return await repo.CreateAsync(userId, type, description, lon, lat);
        }
    }

    [TestFixture]
    public class ReportRepositoryTests
    {
        private AppDbContext _context = null!;
        private ReportRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            _context = TestDbContextFactory.CreateInMemoryDbContext();
            _repo = new ReportRepository(_context);
        }

        [TearDown]
        public void TearDown() => _context.Dispose();

        [Test]
        public async Task CreateAsync_CreatesReport()
        {
            var report = await _repo.CreateTestReport();

            Assert.That(report, Is.Not.Null);
            Assert.That(report.Id, Is.GreaterThan(0));
            Assert.That(report.Type, Is.EqualTo("incident"));
            Assert.That(report.Description, Is.EqualTo("desc"));
        }

        [Test]
        public async Task GetByIdAsync_ReturnsReport()
        {
            var created = await _repo.CreateTestReport();
            var found = await _repo.GetByIdAsync(created.Id);

            Assert.That(found, Is.Not.Null);
            Assert.That(found!.Id, Is.EqualTo(created.Id));
        }

        [Test]
        public async Task GetReportsAsync_FiltersByTypeAndStatus()
        {
            await _repo.CreateTestReport(type: "incident", description: "r1");
            await _repo.CreateTestReport(type: "other", description: "r2");

            var filtered = await _repo.GetReportsAsync(type: "incident", status: "open");

            Assert.That(filtered.Count(), Is.EqualTo(1));
            Assert.That(filtered.First().Type, Is.EqualTo("incident"));
        }

        [Test]
        public async Task GetReportsInBoundedBoxAsync_ReturnsReportsInsideBox()
        {
            await _repo.CreateTestReport(description: "inside", lon: 0, lat: 0);
            await _repo.CreateTestReport(description: "outside", lon: 50, lat: 50);

            var reports = await _repo.GetReportsInBoundedBoxAsync(-1, -1, 1, 1);

            Assert.That(reports.Count(), Is.EqualTo(1));
            Assert.That(reports.First().Description, Is.EqualTo("inside"));
        }

        [Test]
        public async Task GetReportsNearPointAsync_ReturnsNearbyReports()
        {
            await _repo.CreateTestReport(description: "near", lon: 0, lat: 0);
            await _repo.CreateTestReport(description: "far", lon: 50, lat: 50);

            var nearby = await _repo.GetReportsNearPointAsync(0, 0, 5); // 5 km radius

            Assert.That(nearby.Count(), Is.EqualTo(1));
            Assert.That(nearby.First().Description, Is.EqualTo("near"));
        }

        [Test]
        public async Task UpdateAsync_UpdatesDescription()
        {
            var report = await _repo.CreateTestReport(description: "old");

            var updated = await _repo.UpdateAsync(report.Id, "new");

            Assert.That(updated.Description, Is.EqualTo("new"));
            Assert.That(updated.UpdatedAt, Is.Not.Null);
        }

        [Test]
        public async Task DeleteAsync_RemovesReport()
        {
            var report = await _repo.CreateTestReport();

            await _repo.DeleteAsync(report.Id);
            var found = await _repo.GetByIdAsync(report.Id);

            Assert.That(found, Is.Null);
        }

        [Test]
        public async Task UpvoteAsync_IncrementsUpvotes()
        {
            var report = await _repo.CreateTestReport();

            var upvoted = await _repo.UpvoteAsync(report.Id, 2);

            Assert.That(upvoted.Upvotes, Is.EqualTo(1));
        }

        [Test]
        public async Task RemoveUpvoteAsync_DecrementsUpvotes()
        {
            var report = await _repo.CreateTestReport();
            await _repo.UpvoteAsync(report.Id, 2);

            var removed = await _repo.RemoveUpvoteAsync(report.Id, 2);

            Assert.That(removed.Upvotes, Is.EqualTo(0));
        }

        [Test]
        public async Task GetTotalCountAsync_ReturnsCorrectCount()
        {
            await _repo.CreateTestReport(description: "r1");
            await _repo.CreateTestReport(description: "r2");

            var total = await _repo.GetTotalCountAsync();

            Assert.That(total, Is.EqualTo(2));
        }
    }
}
