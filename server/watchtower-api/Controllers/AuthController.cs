using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WatchtowerApi.Domain;
using WatchtowerApi.Contracts;
using WatchtowerApi.Infrastructure.Repositories;
using NuGet.Protocol;

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

        // take dto turn into model 
        // add model to db using repository
        // repository should retunr the model (expected)
        // build dto using token 

        // POST: auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // ADD ERRORR HANDLING
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Email) ||
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

                var newUser = await _userRepository.CreateAsync(request.Email, _userAuthService.HashPassword(request.Password), request.Username);
                string token = _userAuthService.GenerateJwtToken(newUser);

                var response = new AuthResponse
                {
                    Id = newUser.Id,
                    Username = newUser.Username,
                    Token = token,
                    ExpiresIn = 3600
                };

                return StatusCode(201, response);
            }
            catch (Exception)
            {

                return Problem("Registration failed", statusCode: 500);
            }


        }

        // POST: auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.UsernameOrEmail) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Problem("Username/email and password are required", statusCode: 400);
            }

            try
            {
            
                var LoginUser = await _userRepository.VerifyCredentialsAsync(request.UsernameOrEmail, request.Password);
                if (LoginUser == null)
                {
                    return Problem("Invalid credentials", statusCode: 401);
                }

                string token = _userAuthService.GenerateJwtToken(LoginUser);

                var response = new AuthResponse
                {
                    Id = LoginUser.Id,
                    Username = LoginUser.Username,
                    Token = token,
                    ExpiresIn = 3600
                };

                return Ok(response);
            }
            catch (System.Exception)
            {
                return Problem("Login failed", statusCode: 500);

            }

        }
    }
}