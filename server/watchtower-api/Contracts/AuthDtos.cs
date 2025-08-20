//Contracts/AuthDtos.cs
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace WatchtowerApi.Contracts
{
    // Incoming for register endpoint
    public sealed class RegisterRequest
    {
        [Required, MinLength(3)]
        [JsonPropertyName("username")] public string Username { get; set; } = default!;


        [Required, EmailAddress]
        [JsonPropertyName("email")] public string Email { get; set; } = default!;


        [Required, MinLength(8)]
        [JsonPropertyName("password")] public string Password { get; set; } = default!;
    }


    // Incoming for login endpoint
    public sealed class LoginRequest
    {
        [Required]
        [JsonPropertyName("usernameOrEmail")] public string UsernameOrEmail { get; set; } = default!;

        [Required]
        [JsonPropertyName("password")] public string Password { get; set; } = default!;
    }


    // Outgoing for register/login endpoint
    public sealed class AuthResponse
    {
        [JsonPropertyName("id")] public long Id { get; init; }
        [JsonPropertyName("username")] public string Username { get; init; } = default!;
        [JsonPropertyName("token")] public string Token { get; init; } = default!;
        [JsonPropertyName("tokenType")] public string TokenType { get; init; } = "Bearer";
        // Seconds until expiry
        [JsonPropertyName("expiresIn")] public int ExpiresIn { get; init; }
    }
}