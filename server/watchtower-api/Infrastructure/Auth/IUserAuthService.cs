using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Auth;

public interface IUserAuthService
{
    string GenerateJwtToken(User user);
    string HashPassword(string password);
    bool VerifyPassword(string password, string hashedPassword);
}