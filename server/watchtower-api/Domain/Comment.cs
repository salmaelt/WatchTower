//Domain/Comment.cs
namespace WatchtowerApi.Domain
{
    public class Comment
    {
        // Primary Key
        public long Id { get; set; }

        // Foreign Keys and Navigation Properties
        public long ReportId { get; set; }
        public Report? Report { get; set; }
        public long UserId { get; set; }
        public User? User { get; set; }

        // Fields
        public string CommentText { get; set; } = default!;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public int Upvotes { get; set; } = 0;

        // Navigation
        public ICollection<CommentUpvote> UpvoteUsers { get; } = new HashSet<CommentUpvote>();
    }
}