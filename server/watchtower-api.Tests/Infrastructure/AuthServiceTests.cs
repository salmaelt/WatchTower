using NUnit.Framework;
using Microsoft.Extensions.Configuration;
using WatchtowerApi.Infrastructure.Auth;
using WatchtowerApi.Domain;

namespace WatchtowerApi.Tests.Infrastructure
{
    [TestFixture]
    public class AuthServiceTests
    {
        private JwtUserAuthService CreateService()
        {
            // Note: values are string? to match AddInMemoryCollection's nullable signature
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Jwt:Issuer"] = "test-issuer",
                    ["Jwt:Audience"] = "test-audience",
                    ["Jwt:Key"] = "supersecretkey1234567890"
                })
                .Build();

            return new JwtUserAuthService(config);
        }

        [Test]
        public void GenerateJwtToken_ReturnsToken()
        {
            var service = CreateService();
            var user = new User
            {
                Id = 1,
                Username = "alice",
                Email = "alice@test.com",
                PasswordHash = "hash",
                IsAdmin = false
            };

            var token = service.GenerateJwtToken(user);

            Assert.That(token, Is.Not.Null.And.Not.Empty);
            Assert.That(token, Does.Contain(".")); // JWTs have dots
        }

        [Test]
        public void HashPassword_ReturnsHash()
        {
            var service = CreateService();
            var hash = service.HashPassword("password");

            Assert.That(hash, Is.Not.Null.And.Not.Empty);
            Assert.That(hash, Does.Not.Contain("password"));
        }

        [Test]
        public void VerifyPassword_ReturnsTrueIfValid()
        {
            var service = CreateService();
            var hash = service.HashPassword("password");
            var valid = service.VerifyPassword("password", hash);

            Assert.That(valid, Is.True);
        }

        [Test]
        public void VerifyPassword_ReturnsFalseIfInvalid()
        {
            var service = CreateService();
            var hash = service.HashPassword("password");
            var valid = service.VerifyPassword("wrongpassword", hash);

            Assert.That(valid, Is.False);
        }
    }
}