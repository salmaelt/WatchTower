using Microsoft.EntityFrameworkCore;
using WatchtowerApi.Infrastructure; // for AppDbContext

namespace WatchtowerApi.Tests.TestUtils
{
    public static class TestDbContextFactory
    {
        public static AppDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString()) // unique name for isolation
                .Options;

            return new AppDbContext(options);
        }
    }
}