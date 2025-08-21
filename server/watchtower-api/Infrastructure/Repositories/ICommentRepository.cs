using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Repositories;

public interface ICommentRepository
{
    Task<Comment> CreateAsync(int reportId, int userId, string commentText);
    Task<Comment?> GetByIdAsync(int id);
    Task<IEnumerable<Comment>> GetByReportIdAsync(int reportId);
    Task<IEnumerable<Comment>> GetByUserIdAsync(int userId);
    Task<Comment> UpdateAsync(int id, string commentText);
    Task DeleteAsync(int id);
    Task<int> GetCountByReportAsync(int reportId);
    Task<int> GetCountByUserAsync(int userId);
    Task UpvoteAsync(long commentId, int userId);
    Task RemoveUpvoteAsync(long commentId, int userId);
    
}