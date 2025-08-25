// External dependencies
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

// Internal dependencies
using WatchtowerApi.Contracts;
using WatchtowerApi.Infrastructure.Repositories;
using WatchtowerApi.Infrastructure.Auth;

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
        [ProducesResponseType(typeof(AuthResponse), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(409)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // Check DTO contains all relevant fields
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return Problem("Missing field: Username, email, and password are required", statusCode: 400);
            }

            string username = request.Username.Trim();
            string email = request.Email.Trim();

            // Check the email is available
            bool emailExists = await _userRepository.EmailExistsAsync(email);
            if (emailExists)
            {
                return Problem("An account with this email address already exists.", statusCode: 409);
            }

            // Check the username is available
            bool usernameExists = await _userRepository.UsernameExistsAsync(username);
            if (usernameExists)
            {
                return Problem("An account with this username already exists.", statusCode: 409);
            }

            try
            {
                // Create user, hashing password is handled by repository
                var newUser = await _userRepository.CreateAsync(request.Email, request.Password, request.Username);

                // Create jwt, tied directly to username and user_id, implemented through auth service.
                string token = _userAuthService.GenerateJwtToken(newUser);

                // Construct outgoing DTO, attach token.
                var response = new AuthResponse
                {
                    Id = newUser.Id,
                    Username = newUser.Username,
                    Token = token ?? "",
                    ExpiresIn = 3600
                };

                // Succesful response
                return StatusCode(201, response);
            }
            catch (Exception ex)
            {
                // Error handling, Could refactor a bit
                Console.WriteLine(ex);  // quick debugging
                return Problem("Registration failed: " + ex.Message, statusCode: 500);
            }
        }

        // POST: auth/login
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.UsernameOrEmail) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return Problem("Missing Field: Username/email and password are required", statusCode: 400);
            }

            try
            {
                // Write to centralised logger:
                //Console.WriteLine($"Login attempt for: {request.UsernameOrEmail}");

                // Fetch user by username  or email
                var user = await _userRepository.GetByUsernameAsync(request.UsernameOrEmail)
                        ?? await _userRepository.GetByEmailAsync(request.UsernameOrEmail);

                //Console.WriteLine($"User found: {user != null}");
                /*
                if (user != null)
                {
                    Console.WriteLine($"User ID: {user.Id}, Username: {user.Username}, Email: {user.Email}");
                    Console.WriteLine($"Stored hash: {user.PasswordHash}");

                    bool passwordMatch = _userAuthService.VerifyPassword(request.Password, user.PasswordHash);
                    Console.WriteLine($"Password verification result: {passwordMatch}");
                } */

                if (user == null || !_userAuthService.VerifyPassword(request.Password, user.PasswordHash))
                {
                    return Problem("Invalid credentials", statusCode: 401);
                }

                string token = _userAuthService.GenerateJwtToken(user);

                // Create outgoing DTO
                AuthResponse response = new AuthResponse
                {
                    Token = token ?? "",
                    ExpiresIn = 3600,
                    Id = user.Id,
                    Username = user.Username,
                };

                // Success response
                return Ok(response);
            }
            catch (Exception ex)
            {
                // Error handling and server failure response
                Console.WriteLine(ex); // Log for debugging
                return Problem("Login failed: " + ex.Message, statusCode: 500);
            }
        }

        [Authorize]
        [HttpDelete("me")]
        [ProducesResponseType(204)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> DeleteMe()
        {
            try
            {
                // Parse token to get user_id
                long user_id = AuthHelpers.GetUserId(User);

                // Delete user using repo
                await _userRepository.DeleteAsync(user_id);
            }
            // Token error
            catch (InvalidOperationException e)
            {
                return Problem($"Bad Token: {e.Message}", statusCode: 400);
            }
            // Repo error
            catch (Exception e)
            {
                return Problem($"Could not delete user: {e.Message}", statusCode: 500);
            }
            // Success
            return NoContent();
        }
    }
}
