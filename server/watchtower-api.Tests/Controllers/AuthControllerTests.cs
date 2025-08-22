using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using WatchtowerApi.Controllers;
using WatchtowerApi.Contracts;
using WatchtowerApi.Infrastructure.Auth;
using WatchtowerApi.Infrastructure.Repositories;
using WatchtowerApi.Domain;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace WatchtowerApi.Tests.Controllers
{
    public class AuthControllerTests
    {
        private AuthController _authController;
        private Mock<IUserRepository> _mockUserRepository;
        private Mock<IUserAuthService> _mockUserAuthService;

        [SetUp]
        public void Setup()
        {
            // Create mocks for both dependencies
            _mockUserRepository = new Mock<IUserRepository>();
            _mockUserAuthService = new Mock<IUserAuthService>();

            // Create controller with both mocked dependencies
            _authController = new AuthController(_mockUserRepository.Object, _mockUserAuthService.Object);
        }

        [Test]
        public async Task Register_WithValidRequest_ReturnsCreated()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "testuser",
                Password = "TestPassword123!",
                Email = "test@example.com"
            };

            var expectedUser = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hashedpassword"
            };

            // Setup mocks
            _mockUserRepository.Setup(x => x.EmailExistsAsync(request.Email)).ReturnsAsync(false);
            _mockUserRepository.Setup(x => x.UsernameExistsAsync(request.Username)).ReturnsAsync(false);
            _mockUserRepository.Setup(x => x.CreateAsync(request.Email, request.Password, request.Username))
                              .ReturnsAsync(expectedUser);
            _mockUserAuthService.Setup(x => x.GenerateJwtToken(expectedUser))
                               .Returns("mock-jwt-token");

            // Act
            var result = await _authController.Register(request);

            // Assert
            Assert.That(result, Is.TypeOf<ObjectResult>());
            var objectResult = (ObjectResult)result;
            Assert.That(objectResult.StatusCode, Is.EqualTo(201));

            var response = objectResult.Value as AuthResponse;
            Assert.That(response, Is.Not.Null);
            Assert.That(response.Token, Is.EqualTo("mock-jwt-token"));
            Assert.That(response.Username, Is.EqualTo("testuser"));
            Assert.That(response.Id, Is.EqualTo(1));
            Assert.That(response.ExpiresIn, Is.EqualTo(3600));
        }

        [Test]
        public async Task Register_WithMissingUsername_ReturnsBadRequest()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "", // Empty username
                Password = "TestPassword123!",
                Email = "test@example.com"
            };

            // Act
            var result = await _authController.Register(request);

            // Assert
            Assert.That(result, Is.TypeOf<ObjectResult>());
            var objectResult = (ObjectResult)result;
            Assert.That(objectResult.StatusCode, Is.EqualTo(400));
        }

        [Test]
        public async Task Register_WithExistingEmail_ReturnsConflict()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "testuser",
                Password = "TestPassword123!",
                Email = "existing@example.com"
            };

            _mockUserRepository.Setup(x => x.EmailExistsAsync(request.Email)).ReturnsAsync(true);
            _mockUserRepository.Setup(x => x.UsernameExistsAsync(request.Username)).ReturnsAsync(false);

            // Act
            var result = await _authController.Register(request);

            // Assert
            Assert.That(result, Is.TypeOf<ObjectResult>());
            var objectResult = (ObjectResult)result;
            Assert.That(objectResult.StatusCode, Is.EqualTo(409));
        }

        [Test]
        public async Task Register_WithExistingUsername_ReturnsConflict()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "existinguser",
                Password = "TestPassword123!",
                Email = "test@example.com"
            };

            _mockUserRepository.Setup(x => x.EmailExistsAsync(request.Email)).ReturnsAsync(false);
            _mockUserRepository.Setup(x => x.UsernameExistsAsync(request.Username)).ReturnsAsync(true);

            // Act
            var result = await _authController.Register(request);

            // Assert
            Assert.That(result, Is.TypeOf<ObjectResult>());
            var objectResult = (ObjectResult)result;
            Assert.That(objectResult.StatusCode, Is.EqualTo(409));
        }

        [Test]
        public async Task Login_WithValidCredentials_ReturnsOkWithToken()
        {
            // Arrange
            var request = new LoginRequest
            {
                UsernameOrEmail = "testuser",
                Password = "TestPassword123!"
            };

            var user = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hashedpassword"
            };

            _mockUserRepository.Setup(x => x.GetByUsernameAsync(request.UsernameOrEmail))
                              .ReturnsAsync(user);
            _mockUserAuthService.Setup(x => x.VerifyPassword(request.Password, user.PasswordHash))
                               .Returns(true);
            _mockUserAuthService.Setup(x => x.GenerateJwtToken(user))
                               .Returns("mock-jwt-token");

            // Act
            var result = await _authController.Login(request);

            // Assert
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var okResult = (OkObjectResult)result;

            var response = okResult.Value as AuthResponse;
            Assert.That(response, Is.Not.Null);
            Assert.That(response.Token, Is.EqualTo("mock-jwt-token"));
            Assert.That(response.Username, Is.EqualTo("testuser"));
            Assert.That(response.Id, Is.EqualTo(1));
            Assert.That(response.ExpiresIn, Is.EqualTo(3600));
        }

        [Test]
        public async Task Login_WithEmail_ReturnsOkWithToken()
        {
            // Arrange
            var request = new LoginRequest
            {
                UsernameOrEmail = "test@example.com",
                Password = "TestPassword123!"
            };

            var user = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hashedpassword"
            };

            _mockUserRepository.Setup(x => x.GetByUsernameAsync(request.UsernameOrEmail))
                              .ReturnsAsync((User)null);
            _mockUserRepository.Setup(x => x.GetByEmailAsync(request.UsernameOrEmail))
                              .ReturnsAsync(user);
            _mockUserAuthService.Setup(x => x.VerifyPassword(request.Password, user.PasswordHash))
                               .Returns(true);
            _mockUserAuthService.Setup(x => x.GenerateJwtToken(user))
                               .Returns("mock-jwt-token");

            // Act
            var result = await _authController.Login(request);

            // Assert
            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var okResult = (OkObjectResult)result;

            var response = okResult.Value as AuthResponse;
            Assert.That(response, Is.Not.Null);
            Assert.That(response.Token, Is.EqualTo("mock-jwt-token"));
        }

        [Test]
        public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var request = new LoginRequest
            {
                UsernameOrEmail = "testuser",
                Password = "WrongPassword"
            };

            var user = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hashedpassword"
            };

            _mockUserRepository.Setup(x => x.GetByUsernameAsync(request.UsernameOrEmail))
                              .ReturnsAsync(user);
            _mockUserAuthService.Setup(x => x.VerifyPassword(request.Password, user.PasswordHash))
                               .Returns(false); // Password doesn't match

            // Act
            var result = await _authController.Login(request);

            // Assert
            Assert.That(result, Is.TypeOf<ObjectResult>());
            var objectResult = (ObjectResult)result;
            Assert.That(objectResult.StatusCode, Is.EqualTo(401));
        }

        [Test]
        public async Task Login_WithNonExistentUser_ReturnsUnauthorized()
        {
            // Arrange
            var request = new LoginRequest
            {
                UsernameOrEmail = "nonexistent",
                Password = "TestPassword123!"
            };

            _mockUserRepository.Setup(x => x.GetByUsernameAsync(request.UsernameOrEmail))
                              .ReturnsAsync((User)null);
            _mockUserRepository.Setup(x => x.GetByEmailAsync(request.UsernameOrEmail))
                              .ReturnsAsync((User)null);

            // Act
            var result = await _authController.Login(request);

            // Assert
            Assert.That(result, Is.TypeOf<ObjectResult>());
            var objectResult = (ObjectResult)result;
            Assert.That(objectResult.StatusCode, Is.EqualTo(401));
        }

        [Test]
        public async Task Login_WithMissingCredentials_ReturnsBadRequest()
        {
            // Arrange
            var request = new LoginRequest
            {
                UsernameOrEmail = "",
                Password = "TestPassword123!"
            };

            // Act
            var result = await _authController.Login(request);

            // Assert
            Assert.That(result, Is.TypeOf<ObjectResult>());
            var objectResult = (ObjectResult)result;
            Assert.That(objectResult.StatusCode, Is.EqualTo(400));
        }
    }
}
