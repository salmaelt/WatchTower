//Domain/User.cs
namespace WatchtowerApi.Domain
{
    public class User
    {
        // Primary Key
        public long Id { get; set; }

        // Fields
        public string Username { get; set; } = default!;
        public string PasswordHash { get; set; } = default!;
        public bool IsAdmin { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation (not actual DB columns), specific to EF CORE
        public ICollection<Report> Reports { get; } = new HashSet<Report>();
        public ICollection<Comment> Comments { get; } = new HashSet<Comment>();
    }
}