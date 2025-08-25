using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using WatchtowerApi.Controllers;
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Auth;
using WatchtowerApi.Infrastructure.Repositories;

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

	[Test]
	public async Task Register_Returns201_WhenValid()
	{
		var req = new RegisterRequest { Username = "bob", Email = "bob@test.com", Password = "pw" };
		_userRepoMock.Setup(r => r.EmailExistsAsync("bob@test.com")).ReturnsAsync(false);
		_userRepoMock.Setup(r => r.UsernameExistsAsync("bob")).ReturnsAsync(false);
		var user = new User { Id = 1, Username = "bob", Email = "bob@test.com" };
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
}
