using Microsoft.EntityFrameworkCore;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Auth;

namespace WatchtowerApi.Infrastructure.Repositories;


public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;
    private readonly IUserAuthService _authService;

    // Constructor
    public UserRepository(AppDbContext db, IUserAuthService authService)
    {
        _db = db;
        _authService = authService;
    }

    // Create a user, (validation responsibility of controller)
    public async Task<User> CreateAsync(string email, string password, string username)
    {
        // Validation logic in controller.
        var user = new User
        {
            Email = email,
            Username = username,
            PasswordHash = _authService.HashPassword(password),
            IsAdmin = false
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    // Find and retrieve users
    public async Task<User?> GetByIdAsync(long id) =>
        await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User?> GetByEmailAsync(string email) =>
        await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email);

    public async Task<User?> GetByUsernameAsync(string username) =>
        await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == username);


    // Check if usernames or emails are taken
    public Task<bool> UsernameExistsAsync(string username) =>
            _db.Users.AnyAsync(u => u.Username == username);

    public Task<bool> EmailExistsAsync(string email) =>
        _db.Users.AnyAsync(u => u.Email == email);


    // Check if credentials match a user in the database
    public async Task<User?> VerifyCredentialsAsync(string usernameOrEmail, string password)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Username == usernameOrEmail || u.Email == usernameOrEmail);

        if (user == null) return null;

        return _authService.VerifyPassword(password, user.PasswordHash) ? user : null;
    }

    // Update user
    public async Task<User> UpdateAsync(User user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
        return user;
    }

    // Delete user, needs cascading delete here for related resources
    public async Task DeleteAsync(long id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user != null)
        {
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }
        else
        {
            throw new Exception("Failed to delete User");
        }
    }
}