using System.Security.Claims;
using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Auth;

public interface IUserAuthService
{
    public string GenerateJwtToken(User user);
    public string HashPassword(string password);
    public bool VerifyPassword(string password, string hashedPassword);

}