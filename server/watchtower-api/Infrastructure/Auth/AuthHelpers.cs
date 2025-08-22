using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace WatchtowerApi.Infrastructure.Auth
{
    public class AuthHelpers
    {
        public static long GetUserId(ClaimsPrincipal principal)
        {
            var sub = principal.FindFirst(JwtRegisteredClaimNames.Sub);
            if (sub == null || !long.TryParse(sub.Value, out long id))
                throw new InvalidOperationException("Missing/invalid sub claim");
            return id;
        }

        public static string GetUsername(ClaimsPrincipal principal)
        {
            var uname = principal.FindFirst(JwtRegisteredClaimNames.UniqueName);
            if (uname == null || string.IsNullOrWhiteSpace(uname.Value))
                throw new InvalidOperationException("Missing/invalid unique_name claim");
            return uname.Value;
        }
    }
}