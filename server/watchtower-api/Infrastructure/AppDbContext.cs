//Infrastructure/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using WatchtowerApi.Domain;

namespace WatchtowerApi.Infrastructure
{
    // Defines object<->db_row mapping and units of work
    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        // Tables - Used by EF CORE to build queries
        public DbSet<User> Users => Set<User>();
        public DbSet<Report> Reports => Set<Report>();
        public DbSet<Comment> Comments => Set<Comment>();
        public DbSet<ReportUpvote> ReportUpvotes => Set<ReportUpvote>();
        public DbSet<CommentUpvote> CommentUpvotes => Set<CommentUpvote>();

        // Mapping model entities to SQL records, generates the sql schema in the db
        protected override void OnModelCreating(ModelBuilder b)
        {
            // Superclass constructor
            base.OnModelCreating(b);

            // Enable PostGIS extension
            b.HasPostgresExtension("postgis");

            // Users Table
            b.Entity<User>(e =>
            {
                e.ToTable("users");                 // DB table name

                e.HasKey(x => x.Id);                // PRIMARY KEY(users.id)
                e.Property(x => x.Id).HasColumnName("id");

                e.Property(x => x.Username)         // Username (Text)
                .HasColumnType("text")
                .IsRequired()
                .HasColumnName("username");
                e.HasIndex(x => x.Username)         // Indexed to speed up queries
                .IsUnique()
                .HasDatabaseName("users_username_idx");

                e.Property(x => x.Email)            // Email (Text)
                    .HasColumnType("text")
                    .IsRequired()
                    .HasColumnName("email");
                e.HasIndex(x => x.Email)
                    .IsUnique()
                    .HasDatabaseName("users_email_idx");

                e.Property(x => x.PasswordHash)     // Hashed Password (Text)
                .HasColumnType("text")
                .IsRequired()
                .HasColumnName("password_hash");

                e.Property(x => x.IsAdmin)          // IsAdmin (true/false)
                .HasColumnType("boolean")
                .HasColumnName("is_admin");

                e.Property(x => x.CreatedAt)        // CreatedAt (Time)
                .HasColumnType("timestamptz")
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            });

            // Reports Table
            b.Entity<Report>(e =>
            {
                e.ToTable("reports");               // DB table name

                e.HasKey(x => x.Id);                // PRIMARY KEY (reports.id)
                e.Property(x => x.Id).HasColumnName("id");

                e.Property(x => x.UserId)           // FOREIGN KEY to users(id)
                .IsRequired()
                .HasColumnName("user_id");
                e.HasOne(x => x.User)               // Navigation: Report -> User
                .WithMany(u => u.Reports)          // Inverse
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

                e.Property(x => x.Type)             // Type of report (Text)
                .HasColumnType("text")
                .IsRequired()
                .HasColumnName("type");

                e.Property(x => x.Description)      // Description (Text)
                .HasColumnType("text")
                .IsRequired()
                .HasColumnName("description");

                e.Property(x => x.OccurredAt)       // OccuredAt (Time)
                .HasColumnType("timestamptz")
                .HasColumnName("occurred_at");

                e.Property(x => x.Location)         // Location (PostGIS point in 4326 format)
                .HasColumnType("geometry(Point,4326)")
                .IsRequired()
                .HasColumnName("location");
                e.HasIndex(x => x.Location)         // Spatial index for bbox / intersects queries
                .HasMethod("gist")
                .HasDatabaseName("reports_location_gist");

                e.Property(x => x.Status)           // Status (Text)
                .HasColumnType("text")
                .IsRequired()
                .HasColumnName("status");

                e.Property(x => x.CreatedAt)        // CreatedAt (server-side default)
                .HasColumnType("timestamptz")
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");

                e.Property(x => x.UpdatedAt)        // UpdatedAt (nullable)
                .HasColumnType("timestamptz")
                .HasColumnName("updated_at");

                e.Property(x => x.Upvotes)          // Upvotes (default 0)
                .HasDefaultValue(0)
                .HasColumnName("upvotes");

                // (Optional but useful) conventional indexes for common filters:
                // e.HasIndex(x => x.UserId).HasDatabaseName("reports_user_id_idx");
                // e.HasIndex(x => x.OccurredAt).HasDatabaseName("reports_occurred_at_idx");
            });

            // Comments Table
            b.Entity<Comment>(e =>
            {
                e.ToTable("comments");              // DB table name

                e.HasKey(x => x.Id);                // PRIMARY KEY (comments.id)
                e.Property(x => x.Id).HasColumnName("id");

                e.Property(x => x.CommentText)      // CommentText (Text)
                .HasColumnType("text")
                .IsRequired()
                .HasColumnName("comment_text");

                e.Property(x => x.CreatedAt)        // CreatedAt (Time)
                .HasColumnType("timestamptz")
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");

                e.Property(x => x.ReportId)         // FOREIGN KEY to reports(id)
                .IsRequired()
                .HasColumnName("report_id");

                e.Property(x => x.UserId)           // FOREIGN KEY to users(id)
                .IsRequired()
                .HasColumnName("user_id");

                e.Property(x => x.Upvotes)        // Upvotes (INT)
                .HasColumnName("upvotes")
                .HasDefaultValue(0);

                e.HasOne(x => x.Report)             // Navigation: Comment -> Report
                .WithMany()                        // (or .WithMany(r => r.Comments) if you expose Report.Comments)
                .HasForeignKey(x => x.ReportId)
                .OnDelete(DeleteBehavior.Cascade);
                // .HasConstraintName("fk_comments_report_id_reports_id"); // optional

                e.HasOne(x => x.User)               // Navigation: Comment -> User
                .WithMany(u => u.Comments)         // Inverse: User.Comments
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                // .HasConstraintName("fk_comments_user_id_users_id"); // optional

                // (Optional) indexes to speed up lookups:
                // e.HasIndex(x => x.ReportId).HasDatabaseName("comments_report_id_idx");
                // e.HasIndex(x => x.UserId).HasDatabaseName("comments_user_id_idx");
            });

            // Report Upvotes Table
            b.Entity<ReportUpvote>(e =>
            {
                e.ToTable("report_upvotes");

                e.HasKey(x => new { x.ReportId, x.UserId }); // composite PK enforces uniqueness

                e.Property(x => x.ReportId). // FK ReportID
                HasColumnName("report_id");

                e.Property(x => x.UserId).  // FK UserID
                HasColumnName("user_id");

                e.Property(x => x.CreatedAt) // Time CreatedAt
                .HasColumnType("timestamptz")
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");

                e.HasOne(x => x.Report)
                    .WithMany(r => r.UpvoteUsers)
                    .HasForeignKey(x => x.ReportId)
                    .OnDelete(DeleteBehavior.Cascade); // delete report -> delete its upvotes

                e.HasOne(x => x.User)
                    .WithMany(u => u.ReportUpvotes)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade); // delete user -> delete their upvotes
            });

            // Comment Upvotes Table
            b.Entity<CommentUpvote>(e =>
            {
                e.ToTable("comment_upvotes");

                e.HasKey(x => new { x.CommentId, x.UserId }); // composite PK

                e.Property(x => x.CommentId). // FK Comment
                HasColumnName("comment_id");

                e.Property(x => x.UserId) // FK User
                .HasColumnName("user_id");

                e.Property(x => x.CreatedAt) // Time CreatedAt
                .HasColumnType("timestamptz")
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");

                e.HasOne(x => x.Comment)  
                    .WithMany(c => c.UpvoteUsers)
                    .HasForeignKey(x => x.CommentId)
                    .OnDelete(DeleteBehavior.Cascade); // delete comment -> delete its upvotes

                e.HasOne(x => x.User)
                    .WithMany(u => u.CommentUpvotes)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade); // delete user -> delete their upvotes
            });
        }
    }
}