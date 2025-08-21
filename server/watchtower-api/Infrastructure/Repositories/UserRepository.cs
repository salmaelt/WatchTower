using Microsoft.EntityFrameworkCore;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Auth;

namespace WatchtowerApi.Infrastructure.Repositories;


public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;
    private readonly IUserAuthService _authService;

    public UserRepository(AppDbContext db, IUserAuthService authService)
    {
        _db = db;
        _authService = authService;
    }

    public async Task<User> CreateAsync(string email, string password, string username)
    {
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

    public async Task<User?> GetByIdAsync(int id) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User?> GetByEmailAsync(string email) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<User?> GetByUsernameAsync(string username) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Username == username);

    public async Task<User?> VerifyCredentialsAsync(string usernameOrEmail, string password)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Username == usernameOrEmail || u.Email == usernameOrEmail);

        if (user == null) return null;

        return _authService.VerifyPassword(password, user.PasswordHash) ? user : null;
    }

    public async Task<User> UpdateAsync(User user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task DeleteAsync(int id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user != null)
        {
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<bool> EmailExistsAsync(string email) =>
        await _db.Users.AnyAsync(u => u.Email == email);

    public async Task<bool> UsernameExistsAsync(string username) =>
        await _db.Users.AnyAsync(u => u.Username == username);
}
