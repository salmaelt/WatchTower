//Domain/Report.cs
using NetTopologySuite.Geometries;

namespace WatchtowerApi.Domain
{
    public class Report
    {
        // Primary Key
        public long Id { get; set; }

        // Foreign Key + Navigation
        public long UserId { get; set; }
        public User? User { get; set; }

        // Fields
        public string Type { get; set; } = default!;
        public string Description { get; set; } = default!;
        public DateTimeOffset OccurredAt { get; set; }
        public Point Location { get; set; } = default!;  // geometry(Point,4326)
        public string Status { get; set; } = "open";
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; }
        public int Upvotes { get; set; } = 0;
        public ICollection<ReportUpvote> UpvoteUsers { get; } = new HashSet<ReportUpvote>();
    }
}