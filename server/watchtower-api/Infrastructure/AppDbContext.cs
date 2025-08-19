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

        // Mapping model entities to SQL records, generates the sql schema in the db
        protected override void OnModelCreating(ModelBuilder b)
        {
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
                .OnDelete(DeleteBehavior.Restrict);
                // .HasConstraintName("fk_reports_user_id_users_id"); // optional explicit FK name

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

                e.HasOne(x => x.Report)             // Navigation: Comment -> Report
                .WithMany()                        // (or .WithMany(r => r.Comments) if you expose Report.Comments)
                .HasForeignKey(x => x.ReportId)
                .OnDelete(DeleteBehavior.Cascade);
                // .HasConstraintName("fk_comments_report_id_reports_id"); // optional

                e.HasOne(x => x.User)               // Navigation: Comment -> User
                .WithMany(u => u.Comments)         // Inverse: User.Comments
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
                // .HasConstraintName("fk_comments_user_id_users_id"); // optional

                // (Optional) indexes to speed up lookups:
                // e.HasIndex(x => x.ReportId).HasDatabaseName("comments_report_id_idx");
                // e.HasIndex(x => x.UserId).HasDatabaseName("comments_user_id_idx");
            });
        }
    }
}