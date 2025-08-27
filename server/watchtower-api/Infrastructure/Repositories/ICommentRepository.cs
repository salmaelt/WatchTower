// Infrastructure/Repositories/ICommentRepository.cs
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Repositories
{
<<<<<<< HEAD
    Task<Comment> CreateAsync(int reportId, int userId, string commentText);
    Task<Comment?> GetByIdAsync(long id);
    Task<IEnumerable<Comment>> GetByReportIdAsync(int reportId);
    Task<IEnumerable<Comment>> GetByUserIdAsync(int userId);
    Task<Comment> UpdateAsync(int id, string commentText);
    Task DeleteAsync(int id);
    Task<int> GetCountByReportAsync(int reportId);
    Task<int> GetCountByUserAsync(int userId);
=======
    public interface ICommentRepository
    {
        Task<bool> ReportExistsAsync(long reportId);

        // List newest-first; if callerUserId is null, upvotedByMe is always false
        Task<List<CommentDto>> ListByReportAsync(long reportId, long? callerUserId);

        // Create a comment and return as DTO
        Task<CommentDto> CreateAsync(long reportId, long userId, string username, string commentText, DateTimeOffset? now = null);

        // Idempotent upvote. Throws InvalidOperationException on self-upvote.
        Task<CommentUpvoteStateDto?> UpvoteAsync(long commentId, long userId);

        // Idempotent remove upvote (no-op if not upvoted)
        Task<CommentUpvoteStateDto?> RemoveUpvoteAsync(long commentId, long userId);

        // Delete only if owner (or admin when allowed). Returns true if deleted, false if not found or not owned.
        Task<bool> DeleteOwnedAsync(long commentId, long userId, bool isAdmin = false);
    }
>>>>>>> f4b32f7545fbebd3204cd0ac576a4fe77944b7d5
}