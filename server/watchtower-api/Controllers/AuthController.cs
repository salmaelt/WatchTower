using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WatchtowerApi.Domain;
using WatchtowerApi.Contracts;
using WatchtowerApi.Infrastructure.Repositories;
using WatchtowerApi.Infrastructure.Auth;
using IUserAuthService = WatchtowerApi.Infrastructure.Auth.IUserAuthService;

namespace WatchtowerApi.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserAuthService _userAuthService;

        public AuthController(IUserRepository userRepository, IUserAuthService userAuthService)
        {
            _userRepository = userRepository;
            _userAuthService = userAuthService;
        }

        // POST: auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return Problem("Username, email, and password are required", statusCode: 400);
            }

            try
            {
                bool emailExists = await _userRepository.EmailExistsAsync(request.Email);
                bool usernameExists = await _userRepository.UsernameExistsAsync(request.Username);
                if (emailExists || usernameExists)
                {
                    return Problem("Username or email already exists", statusCode: 409);
                }

                //var hashedPassword = _userAuthService.HashPassword(request.Password);
                var newUser = await _userRepository.CreateAsync(request.Email, request.Password, request.Username);
                string token = _userAuthService.GenerateJwtToken(newUser);

                var response = new AuthResponse
                {
                    Id = newUser.Id,
                    Username = newUser.Username,
                    Token = token ?? "",
                    ExpiresIn = 3600
                };


                return StatusCode(201, response);
            }
            catch (Exception ex)
{
    // log ex.Message or ex.ToString() to console / logging system
    Console.WriteLine(ex);  // quick debugging
    return Problem("Registration failed: " + ex.Message, statusCode: 500);
}
        }

        // POST: auth/login
        [HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    if (string.IsNullOrWhiteSpace(request.UsernameOrEmail) ||
        string.IsNullOrWhiteSpace(request.Password))
    {
        return Problem("Username/email and password are required", statusCode: 400);
    }

    try
    {
        Console.WriteLine($"Login attempt for: {request.UsernameOrEmail}");
        
        // Fetch user by username 
        var user = await _userRepository.GetByUsernameAsync(request.UsernameOrEmail)
                   ?? await _userRepository.GetByEmailAsync(request.UsernameOrEmail);
        
        Console.WriteLine($"User found: {user != null}");
        if (user != null)
        {
            Console.WriteLine($"User ID: {user.Id}, Username: {user.Username}, Email: {user.Email}");
            Console.WriteLine($"Stored hash: {user.PasswordHash}");
            
            bool passwordMatch = _userAuthService.VerifyPassword(request.Password, user.PasswordHash);
            Console.WriteLine($"Password verification result: {passwordMatch}");
        }
        
        if (user == null || !_userAuthService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Problem("Invalid credentials", statusCode: 401);
        }

        string token = _userAuthService.GenerateJwtToken(user);

        var response = new AuthResponse
        {
            Token = token ?? "",
            ExpiresIn = 3600,
            Id = user.Id,
            Username = user.Username,
        };

        return Ok(response);
    }
    catch (Exception ex)
    {
        Console.WriteLine(ex); // Log for debugging
        return Problem("Login failed: " + ex.Message, statusCode: 500);
    }
}}
}
