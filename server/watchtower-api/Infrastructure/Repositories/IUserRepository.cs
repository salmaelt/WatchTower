using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Repositories;

public interface IUserRepository
{
    Task<User> CreateAsync(string email, string password, string username);
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> VerifyCredentialsAsync(string email, string password);
    Task<User> UpdateAsync(User user);
    Task DeleteAsync(int id);
    Task<bool> EmailExistsAsync(string email);
    Task<bool> UsernameExistsAsync(string username);
    Task<IEnumerable<User>> GetAllAsync();
}