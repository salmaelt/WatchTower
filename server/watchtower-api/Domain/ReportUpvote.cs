// Domain/ReportUpvote.cs
namespace WatchtowerApi.Domain
{
    // Composite PK (ReportId, UserId). Ensures one upvote per user per report.
    public class ReportUpvote
    {
        public long ReportId { get; set; }
        public Report? Report { get; set; }

        public long UserId { get; set; }
        public User? User { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}