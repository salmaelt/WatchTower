using System;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Auth;
using System.IdentityModel.Tokens.Jwt;


namespace WatchtowerApi.Tests.Infrastructure
{
    [TestFixture]
    public class AuthServiceTests
    {
        private JwtUserAuthService CreateService()
        {
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

        #region JwtUserAuthService tests

        [Test]
        public void GenerateJwtToken_ReturnsValidJwt()
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

            Assert.Multiple(() =>
            {
                Assert.That(token, Is.Not.Null.And.Not.Empty);
                Assert.That(token, Does.Contain(".")); // JWT has 3 parts
            });
        }

        [Test]
        public void HashPassword_ReturnsNonEmptyHash()
        {
            var service = CreateService();
            var hash = service.HashPassword("password");

            Assert.Multiple(() =>
            {
                Assert.That(hash, Is.Not.Null.And.Not.Empty);
                Assert.That(hash, Does.Not.Contain("password"));
            });
        }

        [Test]
        public void VerifyPassword_ReturnsTrueForCorrectPassword()
        {
            var service = CreateService();
            var hash = service.HashPassword("password");
            var valid = service.VerifyPassword("password", hash);

            Assert.That(valid, Is.True);
        }

        [Test]
        public void VerifyPassword_ReturnsFalseForIncorrectPassword()
        {
            var service = CreateService();
            var hash = service.HashPassword("password");
            var valid = service.VerifyPassword("wrongpassword", hash);

            Assert.That(valid, Is.False);
        }

        #endregion

        #region AuthHelpers tests

        [Test]
        public void GetUserId_ReturnsIdFromClaims()
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, "123")
            };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "jwt"));

            var id = AuthHelpers.GetUserId(principal);

            Assert.That(id, Is.EqualTo(123));
        }

        [Test]
        public void GetUserId_ThrowsIfMissing()
        {
            var principal = new ClaimsPrincipal(new ClaimsIdentity());

            Assert.Throws<InvalidOperationException>(() => AuthHelpers.GetUserId(principal));
        }

        [Test]
        public void GetUsername_ReturnsValueFromClaims()
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.UniqueName, "alice")
            };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "jwt"));

            var username = AuthHelpers.GetUsername(principal);

            Assert.That(username, Is.EqualTo("alice"));
        }

        [Test]
        public void GetUsername_ThrowsIfMissing()
        {
            var principal = new ClaimsPrincipal(new ClaimsIdentity());

            Assert.Throws<InvalidOperationException>(() => AuthHelpers.GetUsername(principal));
        }

        [Test]
        public void TryGetUserId_ReturnsIdIfAuthenticated()
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, "42")
            };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "jwt"));

            var id = AuthHelpers.TryGetUserId(principal);

            Assert.That(id, Is.EqualTo(42));
        }

        [Test]
        public void TryGetUserId_ReturnsNullIfNotAuthenticated()
        {
            var principal = new ClaimsPrincipal(new ClaimsIdentity());

            var id = AuthHelpers.TryGetUserId(principal);

            Assert.That(id, Is.Null);
        }

        [Test]
        public void TryGetUserId_ReturnsNullIfInvalidClaim()
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, "abc") // not a number
            };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "jwt"));

            var id = AuthHelpers.TryGetUserId(principal);

            Assert.That(id, Is.Null);
        }

        #endregion
    }
}
