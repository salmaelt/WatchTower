using NUnit.Framework;

namespace WatchtowerApi.Tests.Infrastructure
{
    public class UserRepositoryTests
    {
        [Test]
        public async Task CreateAsync_CreatesUser()
        {
            var db = TestUtils.TestDbContextFactory.CreateInMemoryDbContext();
            var authMock = new Moq.Mock<WatchtowerApi.Infrastructure.Auth.IUserAuthService>();
            authMock.Setup(a => a.HashPassword(Moq.It.IsAny<string>())).Returns("hashed");
            var repo = new WatchtowerApi.Infrastructure.Repositories.UserRepository(db, authMock.Object);
            var user = await repo.CreateAsync("test@test.com", "password", "testuser");
            Assert.That(user, Is.Not.Null);
            Assert.That(user.Id, Is.GreaterThan(0));
            Assert.That(user.Email, Is.EqualTo("test@test.com"));
            Assert.That(user.Username, Is.EqualTo("testuser"));
            Assert.That(user.PasswordHash, Is.EqualTo("hashed"));
        }

        [Test]
        public async Task GetByIdAsync_ReturnsUser()
        {
            var db = TestUtils.TestDbContextFactory.CreateInMemoryDbContext();
            var authMock = new Moq.Mock<WatchtowerApi.Infrastructure.Auth.IUserAuthService>();
            authMock.Setup(a => a.HashPassword(Moq.It.IsAny<string>())).Returns("hashed");
            var repo = new WatchtowerApi.Infrastructure.Repositories.UserRepository(db, authMock.Object);
            var created = await repo.CreateAsync("test@test.com", "password", "testuser");
            var found = await repo.GetByIdAsync(created.Id);
            Assert.That(found, Is.Not.Null);
            Assert.That(found!.Id, Is.EqualTo(created.Id));
        }

        [Test]
        public async Task EmailExistsAsync_ReturnsTrueIfExists()
        {
            var db = TestUtils.TestDbContextFactory.CreateInMemoryDbContext();
            var authMock = new Moq.Mock<WatchtowerApi.Infrastructure.Auth.IUserAuthService>();
            authMock.Setup(a => a.HashPassword(Moq.It.IsAny<string>())).Returns("hashed");
            var repo = new WatchtowerApi.Infrastructure.Repositories.UserRepository(db, authMock.Object);
            await repo.CreateAsync("test@test.com", "password", "testuser");
            var exists = await repo.EmailExistsAsync("test@test.com");
            Assert.That(exists, Is.True);
        }
    }
}
