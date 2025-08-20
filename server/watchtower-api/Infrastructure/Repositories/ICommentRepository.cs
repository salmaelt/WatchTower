using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Repositories;

public interface ICommentRepository
{
    Task<Comment> CreateAsync(int reportId, int userId, string commentText);
    Task<Comment?> GetByIdAsync(int id);
    Task<IEnumerable<Comment>> GetByReportIdAsync(long reportId);
    Task<IEnumerable<Comment>> GetByUserIdAsync(long userId);
    Task<Comment> UpdateAsync(int id, string commentText);
    Task DeleteAsync(int id);
    Task<int> GetCountByReportAsync(int reportId);
    Task<int> GetCountByUserAsync(int userId);
}