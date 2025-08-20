using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Auth;

public sealed class JwtUserAuthService : IUserAuthService
{
    private readonly string _issuer;
    private readonly string _audience;
    private readonly string _signingKey;
    private const int ExpMinutes = 60;

    public JwtUserAuthService(IConfiguration cfg)
    {
        // Prefer appsettings; fall back to dev defaults
        _issuer = cfg["Jwt:Issuer"]    ?? "watchtower-api";
        _audience = cfg["Jwt:Audience"]?? "watchtower-web";
        _signingKey = cfg["Jwt:Key"]   ?? "dev-only-super-secret-change-me-please";
    }

    public string HashPassword(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password);

    public bool VerifyPassword(string password, string hashedPassword) =>
        BCrypt.Net.BCrypt.Verify(password, hashedPassword);

    public string GenerateJwtToken(User user)
    {
        var now = DateTime.UtcNow;
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.IsAdmin ? "admin" : "user"),
        };

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_signingKey)),
            SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            notBefore: now,
            expires: now.AddMinutes(ExpMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }
}
