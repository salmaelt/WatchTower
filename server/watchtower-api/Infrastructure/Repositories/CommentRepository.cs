// Infrastructure/Repositories/CommentRepository.cs
using Microsoft.EntityFrameworkCore;
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Repositories
{
    public sealed class CommentRepository : ICommentRepository
    {
        private readonly AppDbContext _db;

        public CommentRepository(AppDbContext db)
        {
            _db = db;
        }

        // Check a report exists
        public Task<bool> ReportExistsAsync(long reportId) =>
            _db.Reports.AsNoTracking().AnyAsync(r => r.Id == reportId);

        // Get comments for a report
        public async Task<List<CommentDto>> ListByReportAsync(long reportId, long? callerUserId)
        {
            // Newest first
            IQueryable<CommentDto> q = _db.Comments
                .AsNoTracking()
                .Where(c => c.ReportId == reportId)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    UserId = c.UserId,
                    Username = c.User!.Username,
                    CommentText = c.CommentText,
                    CreatedAt = c.CreatedAt,
                    Upvotes = c.Upvotes,
                    UpvotedByMe = callerUserId != null
                        && _db.CommentUpvotes.Any(u => u.CommentId == c.Id && u.UserId == callerUserId.Value)
                });

            return await q.ToListAsync();
        }

        // Create a report
        public async Task<CommentDto> CreateAsync(long reportId, long userId, string username, string commentText, DateTimeOffset? now = null)
        {
            var comment = new Comment
            {
                ReportId = reportId,
                UserId = userId,
                CommentText = commentText.Trim(),
                CreatedAt = now ?? DateTimeOffset.UtcNow,
                Upvotes = 0
            };

            _db.Comments.Add(comment);
            await _db.SaveChangesAsync();

            return new CommentDto
            {
                Id = comment.Id,
                UserId = userId,
                Username = username,
                CommentText = comment.CommentText,
                CreatedAt = comment.CreatedAt,
                Upvotes = 0,
                UpvotedByMe = false
            };
        }

        public async Task<CommentUpvoteStateDto?> UpvoteAsync(long commentId, long userId)
        {
            var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
            if (comment == null) return null;

            if (comment.UserId == userId)
            {
                // self-upvote blocked by spec
                throw new InvalidOperationException("Self-upvote not allowed");
            }

            var existing = await _db.CommentUpvotes.FindAsync(commentId, userId);
            if (existing != null)
            {
                // Idempotent: already upvoted
                return new CommentUpvoteStateDto
                {
                    Id = comment.Id,
                    Upvotes = comment.Upvotes,
                    UpvotedByMe = true
                };
            }

            // Create upvote + increment counter
            _db.CommentUpvotes.Add(new CommentUpvote { CommentId = commentId, UserId = userId });
            comment.Upvotes += 1;

            await _db.SaveChangesAsync();

            return new CommentUpvoteStateDto
            {
                Id = comment.Id,
                Upvotes = comment.Upvotes,
                UpvotedByMe = true
            };
        }

        public async Task<CommentUpvoteStateDto?> RemoveUpvoteAsync(long commentId, long userId)
        {
            var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
            if (comment == null) return null;

            var existing = await _db.CommentUpvotes.FindAsync(commentId, userId);
            if (existing == null)
            {
                // Idempotent no-op
                return new CommentUpvoteStateDto
                {
                    Id = comment.Id,
                    Upvotes = comment.Upvotes,
                    UpvotedByMe = false
                };
            }

            _db.CommentUpvotes.Remove(existing);
            // Guard against negative counts
            if (comment.Upvotes > 0) comment.Upvotes -= 1;

            await _db.SaveChangesAsync();

            return new CommentUpvoteStateDto
            {
                Id = comment.Id,
                Upvotes = comment.Upvotes,
                UpvotedByMe = false
            };
        }

        public async Task<bool> DeleteOwnedAsync(long commentId, long userId, bool isAdmin = false)
        {
            var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
            if (comment == null) return false;

            if (!isAdmin && comment.UserId != userId)
            {
                // Hide existence: act like 404 per spec choice
                return false;
            }

            _db.Comments.Remove(comment);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
