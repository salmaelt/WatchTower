using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using WatchtowerApi.Controllers;
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Auth;
using WatchtowerApi.Infrastructure.Repositories;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace WatchtowerApi.Tests.Controllers;

[TestFixture]
public class AuthControllerTests
{
    private Mock<IUserRepository> _userRepoMock;
    private Mock<IUserAuthService> _authServiceMock;
    private AuthController _controller;

    [SetUp]
    public void SetUp()
    {
        _userRepoMock = new Mock<IUserRepository>(MockBehavior.Strict);
        _authServiceMock = new Mock<IUserAuthService>(MockBehavior.Strict);
        _controller = new AuthController(_userRepoMock.Object, _authServiceMock.Object);
    }

    #region Register Tests

    [Test]
    public async Task Register_Returns201_WhenValid()
    {
        var req = new RegisterRequest { Username = "bob", Email = "bob@test.com", Password = "pw" };
        _userRepoMock.Setup(r => r.EmailExistsAsync("bob@test.com")).ReturnsAsync(false);
        _userRepoMock.Setup(r => r.UsernameExistsAsync("bob")).ReturnsAsync(false);
        var user = new User { Id = 1, Username = "bob", Email = "bob@test.com" };
        // Controller passes request.Email, request.Password, request.Username (original values)
        _userRepoMock.Setup(r => r.CreateAsync("bob@test.com", "pw", "bob")).ReturnsAsync(user);
        _authServiceMock.Setup(a => a.GenerateJwtToken(user)).Returns("token");

        var result = await _controller.Register(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(201));
        var authResp = obj.Value as AuthResponse;
        Assert.That(authResp, Is.Not.Null);
        Assert.That(authResp!.Token, Is.EqualTo("token"));
        Assert.That(authResp.Username, Is.EqualTo("bob"));
    }

    [Test]
    public async Task Register_Returns409_WhenEmailExists()
    {
        var req = new RegisterRequest { Username = "bob", Email = "bob@test.com", Password = "pw" };
        _userRepoMock.Setup(r => r.EmailExistsAsync("bob@test.com")).ReturnsAsync(true);

        var result = await _controller.Register(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(409));
    }

    [Test]
    public async Task Register_Returns409_WhenUsernameExists()
    {
        var req = new RegisterRequest { Username = "bob", Email = "bob@test.com", Password = "pw" };
        _userRepoMock.Setup(r => r.EmailExistsAsync("bob@test.com")).ReturnsAsync(false);
        _userRepoMock.Setup(r => r.UsernameExistsAsync("bob")).ReturnsAsync(true);

        var result = await _controller.Register(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(409));
    }

    [Test]
    public async Task Register_Returns400_WhenMissingFields()
    {
        var req = new RegisterRequest { Username = "", Email = "", Password = "" };

        var result = await _controller.Register(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public async Task Register_Returns500_WhenRepositoryThrowsException()
    {
        var req = new RegisterRequest { Username = "bob", Email = "bob@test.com", Password = "pw" };
        _userRepoMock.Setup(r => r.EmailExistsAsync("bob@test.com")).ReturnsAsync(false);
        _userRepoMock.Setup(r => r.UsernameExistsAsync("bob")).ReturnsAsync(false);
        _userRepoMock.Setup(r => r.CreateAsync("bob@test.com", "pw", "bob"))
                    .ThrowsAsync(new Exception("Database error"));

        var result = await _controller.Register(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task Register_TrimsWhitespaceFromUsernameAndEmail()
    {
        var req = new RegisterRequest { Username = "  bob  ", Email = "  bob@test.com  ", Password = "pw" };
        // Controller trims for existence checks
        _userRepoMock.Setup(r => r.EmailExistsAsync("bob@test.com")).ReturnsAsync(false);
        _userRepoMock.Setup(r => r.UsernameExistsAsync("bob")).ReturnsAsync(false);
        var user = new User { Id = 1, Username = "bob", Email = "bob@test.com" };
        // But passes original values to CreateAsync
        _userRepoMock.Setup(r => r.CreateAsync("  bob@test.com  ", "pw", "  bob  ")).ReturnsAsync(user);
        _authServiceMock.Setup(a => a.GenerateJwtToken(user)).Returns("token");

        var result = await _controller.Register(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(201));
    }

    //[TestCase(null, "email@test.com", "password")]
    [TestCase("", "email@test.com", "password")]
    [TestCase("   ", "email@test.com", "password")]
    //[TestCase("username", null, "password")]
    [TestCase("username", "", "password")]
    [TestCase("username", "   ", "password")]
   // [TestCase("username", "email@test.com", null)]
    [TestCase("username", "email@test.com", "")]
    [TestCase("username", "email@test.com", "   ")]
    public async Task Register_Returns400_ForInvalidInputs(string username, string email, string password)
    {
        var req = new RegisterRequest { Username = username, Email = email, Password = password };

        var result = await _controller.Register(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(400));
    }

    #endregion

    #region Login Tests

    [Test]
    public async Task Login_Returns200_WhenValidCredentialsWithUsername()
    {
        var req = new LoginRequest { UsernameOrEmail = "bob", Password = "password" };
        var user = new User { Id = 1, Username = "bob", Email = "bob@test.com", PasswordHash = "hashedpw" };
        
        // Controller tries GetByUsernameAsync first and finds the user
        _userRepoMock.Setup(r => r.GetByUsernameAsync("bob")).ReturnsAsync(user);
        // GetByEmailAsync won't be called since GetByUsernameAsync returns a user
        _authServiceMock.Setup(a => a.VerifyPassword("password", "hashedpw")).Returns(true);
        _authServiceMock.Setup(a => a.GenerateJwtToken(user)).Returns("jwt-token");

        var result = await _controller.Login(req);

        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var authResp = okResult!.Value as AuthResponse;
        Assert.That(authResp, Is.Not.Null);
        Assert.That(authResp!.Token, Is.EqualTo("jwt-token"));
        Assert.That(authResp.Username, Is.EqualTo("bob"));
        Assert.That(authResp.Id, Is.EqualTo(1));
        Assert.That(authResp.ExpiresIn, Is.EqualTo(3600));
    }

    [Test]
    public async Task Login_Returns200_WhenValidCredentialsWithEmail()
    {
        var req = new LoginRequest { UsernameOrEmail = "bob@test.com", Password = "password" };
        var user = new User { Id = 1, Username = "bob", Email = "bob@test.com", PasswordHash = "hashedpw" };
        
        // Controller tries GetByUsernameAsync first (returns null), then GetByEmailAsync
        _userRepoMock.Setup(r => r.GetByUsernameAsync("bob@test.com")).ReturnsAsync((User?)null);
        _userRepoMock.Setup(r => r.GetByEmailAsync("bob@test.com")).ReturnsAsync(user);
        _authServiceMock.Setup(a => a.VerifyPassword("password", "hashedpw")).Returns(true);
        _authServiceMock.Setup(a => a.GenerateJwtToken(user)).Returns("jwt-token");

        var result = await _controller.Login(req);

        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var authResp = okResult!.Value as AuthResponse;
        Assert.That(authResp!.Token, Is.EqualTo("jwt-token"));
    }

    [Test]
    public async Task Login_Returns401_WhenUserNotFound()
    {
        var req = new LoginRequest { UsernameOrEmail = "nonexistent", Password = "password" };
        
        // Both repository calls return null
        _userRepoMock.Setup(r => r.GetByUsernameAsync("nonexistent")).ReturnsAsync((User?)null);
        _userRepoMock.Setup(r => r.GetByEmailAsync("nonexistent")).ReturnsAsync((User?)null);

        var result = await _controller.Login(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(401));
    }

    [Test]
    public async Task Login_Returns401_WhenPasswordIncorrect()
    {
        var req = new LoginRequest { UsernameOrEmail = "bob", Password = "wrongpassword" };
        var user = new User { Id = 1, Username = "bob", Email = "bob@test.com", PasswordHash = "hashedpw" };
        
        _userRepoMock.Setup(r => r.GetByUsernameAsync("bob")).ReturnsAsync(user);
        _authServiceMock.Setup(a => a.VerifyPassword("wrongpassword", "hashedpw")).Returns(false);

        var result = await _controller.Login(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(401));
    }

    //[TestCase(null, "password")]
    [TestCase("", "password")]
    [TestCase("   ", "password")]
    //[TestCase("username", null)]
    [TestCase("username", "")]
    [TestCase("username", "   ")]
    public async Task Login_Returns400_ForInvalidInputs(string usernameOrEmail, string password)
    {
        var req = new LoginRequest { UsernameOrEmail = usernameOrEmail, Password = password };

        var result = await _controller.Login(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public async Task Login_Returns500_WhenRepositoryThrowsException()
    {
        var req = new LoginRequest { UsernameOrEmail = "bob", Password = "password" };
        
        _userRepoMock.Setup(r => r.GetByUsernameAsync("bob")).ThrowsAsync(new Exception("Database error"));

        var result = await _controller.Login(req);

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region DeleteMe Tests

    [Test]
    public async Task DeleteMe_Returns204_WhenSuccessful()
    {
        // Setup controller context with claims
        var claims = new List<Claim>
        {
            new Claim("user_id", "123")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsIdentity(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(principal)
            }
        };

        // Mock AuthHelpers.GetUserId to return user ID
        // Note: You might need to make AuthHelpers.GetUserId testable or inject it
        _userRepoMock.Setup(r => r.DeleteAsync(It.IsAny<long>())).Returns(Task.CompletedTask);

        var result = await _controller.DeleteMe();

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task DeleteMe_Returns400_WhenInvalidToken()
    {
        // Setup empty claims to simulate invalid token
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        var result = await _controller.DeleteMe();

        // This test assumes AuthHelpers.GetUserId throws InvalidOperationException for bad tokens
        // You may need to adjust based on your actual AuthHelpers implementation
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public async Task DeleteMe_Returns500_WhenRepositoryThrowsException()
    {
        var claims = new List<Claim>
        {
            new Claim("user_id", "123")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsIdentity(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(principal)
            }
        };

        _userRepoMock.Setup(r => r.DeleteAsync(It.IsAny<long>()))
                    .ThrowsAsync(new Exception("Database error"));

        var result = await _controller.DeleteMe();

        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var obj = result as ObjectResult;
        Assert.That(obj!.StatusCode, Is.EqualTo(500));
    }

    #endregion

    [TearDown]
    public void TearDown()
    {
        _userRepoMock.VerifyAll();
        _authServiceMock.VerifyAll();
    }
}