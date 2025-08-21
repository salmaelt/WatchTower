using Microsoft.EntityFrameworkCore;
using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure.Repositories
{
    public class CommentRepository : ICommentRepository
    {
        private readonly AppDbContext _context;

        public CommentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Comment> CreateAsync(int reportId, int userId, string commentText)
        {
            var comment = new Comment
            {
                ReportId = reportId,
                UserId = userId,
                CommentText = commentText
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            return comment;
        }

        public async Task<Comment?> GetByIdAsync(int id)
        {
            return await _context.Comments
                .Include(c => c.User)
                .Include(c => c.UpvoteUsers)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<IEnumerable<Comment>> GetByReportIdAsync(int reportId)
        {
            return await _context.Comments
                .Include(c => c.User)
                .Include(c => c.UpvoteUsers)
                .Where(c => c.ReportId == reportId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Comment>> GetByUserIdAsync(int userId)
        {
            return await _context.Comments
                .Include(c => c.Report)
                .Include(c => c.UpvoteUsers)
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Comment> UpdateAsync(int id, string commentText)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null) throw new KeyNotFoundException("Comment not found");

            comment.CommentText = commentText;
            comment.Upvotes = comment.Upvotes; // Optional: keep current upvotes

            _context.Comments.Update(comment);
            await _context.SaveChangesAsync();

            return comment;
        }

        public async Task DeleteAsync(int id)
        {
            var comment = await _context.Comments
                .Include(c => c.UpvoteUsers)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comment == null) return;

            _context.Set<CommentUpvote>().RemoveRange(comment.UpvoteUsers);
            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetCountByReportAsync(int reportId)
        {
            return await _context.Comments.CountAsync(c => c.ReportId == reportId);
        }

        public async Task<int> GetCountByUserAsync(int userId)
        {
            return await _context.Comments.CountAsync(c => c.UserId == userId);
        }

        public async Task UpvoteAsync(long commentId, int userId)
        {
            var comment = await _context.Comments
                .Include(c => c.UpvoteUsers)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null || comment.UserId == userId) return;

            if (!comment.UpvoteUsers.Any(u => u.UserId == userId))
            {
                comment.UpvoteUsers.Add(new CommentUpvote
                {
                    CommentId = commentId,
                    UserId = userId
                });

                comment.Upvotes += 1;
                await _context.SaveChangesAsync();
            }
        }

        public async Task RemoveUpvoteAsync(long commentId, int userId)
        {
            var upvote = await _context.Set<CommentUpvote>()
                .FirstOrDefaultAsync(u => u.CommentId == commentId && u.UserId == userId);

            if (upvote != null)
            {
                _context.Set<CommentUpvote>().Remove(upvote);

                var comment = await _context.Comments.FindAsync(commentId);
                if (comment != null && comment.Upvotes > 0)
                    comment.Upvotes -= 1;

                await _context.SaveChangesAsync();
            }
        }
    }
}
