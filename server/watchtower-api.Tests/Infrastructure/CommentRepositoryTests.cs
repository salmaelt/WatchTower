using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Repositories;
using WatchtowerApi.Infrastructure;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace WatchtowerApi.Tests.Infrastructure
{
    [TestFixture]
    public class CommentRepositoryTests
    {
        private CommentRepository _repository;
        private WatchtowerApi.Infrastructure.AppDbContext _db;

        [SetUp]
        public void SetUp()
        {
            _db = TestUtils.TestDbContextFactory.CreateInMemoryDbContext();
            _repository = new CommentRepository(_db);
        }

        [TearDown]
        public void TearDown()
        {
            _db?.Dispose();
        }

        #region ReportExistsAsync Tests

        [Test]
        public async Task ReportExistsAsync_ReturnsTrueWhenReportExists()
        {
            // Arrange
            var report = new Report 
            { 
                Id = 1, 
                Type = "incident", 
                Description = "Test report", 
                Location = new NetTopologySuite.Geometries.Point(0, 0) { SRID = 4326 }, 
                Status = "open",
                UserId = 1
            };
            _db.Reports.Add(report);
            await _db.SaveChangesAsync();

            // Act
            var result = await _repository.ReportExistsAsync(1);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public async Task ReportExistsAsync_ReturnsFalseWhenReportDoesNotExist()
        {
            // Act
            var result = await _repository.ReportExistsAsync(999);

            // Assert
            Assert.That(result, Is.False);
        }

        #endregion

        #region CreateAsync Tests

        [Test]
        public async Task CreateAsync_CreatesComment()
        {
            // Act
            var comment = await _repository.CreateAsync(1, 2, "user", "test comment");

            // Assert
            Assert.That(comment, Is.Not.Null);
            Assert.That(comment.Id, Is.GreaterThan(0));
            Assert.That(comment.CommentText, Is.EqualTo("test comment"));
            Assert.That(comment.UserId, Is.EqualTo(2));
            Assert.That(comment.Username, Is.EqualTo("user"));
            Assert.That(comment.Upvotes, Is.EqualTo(0));
            Assert.That(comment.UpvotedByMe, Is.False);
        }

        [Test]
        public async Task CreateAsync_TrimsCommentText()
        {
            // Act
            var comment = await _repository.CreateAsync(1, 2, "user", "  test comment  ");

            // Assert
            Assert.That(comment.CommentText, Is.EqualTo("test comment"));
        }

        [Test]
        public async Task CreateAsync_UsesProvidedTimestamp()
        {
            // Arrange
            var customTime = new DateTimeOffset(2023, 1, 15, 10, 30, 0, TimeSpan.Zero);

            // Act
            var comment = await _repository.CreateAsync(1, 2, "user", "test comment", customTime);

            // Assert
            Assert.That(comment.CreatedAt, Is.EqualTo(customTime));
        }

        [Test]
        public async Task CreateAsync_UsesCurrentTimeWhenNullProvided()
        {
            // Arrange
            var beforeCreation = DateTimeOffset.UtcNow;

            // Act
            var comment = await _repository.CreateAsync(1, 2, "user", "test comment", null);
            var afterCreation = DateTimeOffset.UtcNow;

            // Assert
            Assert.That(comment.CreatedAt, Is.GreaterThanOrEqualTo(beforeCreation));
            Assert.That(comment.CreatedAt, Is.LessThanOrEqualTo(afterCreation));
        }

        [Test]
        public async Task CreateAsync_SavesCommentToDatabase()
        {
            // Act
            var comment = await _repository.CreateAsync(1, 2, "user", "test comment");

            // Assert
            var savedComment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == comment.Id);
            Assert.That(savedComment, Is.Not.Null);
            Assert.That(savedComment.CommentText, Is.EqualTo("test comment"));
            Assert.That(savedComment.UserId, Is.EqualTo(2));
            Assert.That(savedComment.ReportId, Is.EqualTo(1));
        }

        #endregion

        #region ListByReportAsync Tests

        [Test]
        public async Task ListByReportAsync_ReturnsCommentsForReport()
        {
            // Arrange
            var user = new User { Id = 2, Username = "testuser", Email = "test@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            await _repository.CreateAsync(1, 2, "testuser", "comment 1");
            await _repository.CreateAsync(1, 2, "testuser", "comment 2");
            await _repository.CreateAsync(2, 2, "testuser", "comment 3"); // Different report

            // Act
            var comments = await _repository.ListByReportAsync(1, null);

            // Assert
            Assert.That(comments, Is.Not.Null);
            Assert.That(comments.Count, Is.EqualTo(2));
            Assert.That(comments.All(c => c.Username == "testuser"), Is.True);
        }

        [Test]
        public async Task ListByReportAsync_ReturnsEmptyListWhenNoComments()
        {
            // Act
            var comments = await _repository.ListByReportAsync(999, null);

            // Assert
            Assert.That(comments, Is.Not.Null);
            Assert.That(comments.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task ListByReportAsync_SetsUpvotedByMeCorrectly()
        {
            // Arrange
            var user1 = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            var user2 = new User { Id = 2, Username = "user2", Email = "user2@test.com", PasswordHash = "hash" };
            _db.Users.AddRange(user1, user2);
            await _db.SaveChangesAsync();

            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");
            
            // User 2 upvotes the comment
            var upvote = new CommentUpvote { CommentId = comment.Id, UserId = 2 };
            _db.CommentUpvotes.Add(upvote);
            await _db.SaveChangesAsync();

            // Act - Check as user 2 (should see upvoted)
            var commentsAsUser2 = await _repository.ListByReportAsync(1, 2);
            // Act - Check as user 1 (should not see upvoted)
            var commentsAsUser1 = await _repository.ListByReportAsync(1, 1);

            // Assert
            Assert.That(commentsAsUser2.First().UpvotedByMe, Is.True);
            Assert.That(commentsAsUser1.First().UpvotedByMe, Is.False);
        }

        [Test]
        public async Task ListByReportAsync_SetsUpvotedByMeFalseWhenCallerIsNull()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            await _repository.CreateAsync(1, 1, "user1", "test comment");

            // Act
            var comments = await _repository.ListByReportAsync(1, null);

            // Assert
            Assert.That(comments.First().UpvotedByMe, Is.False);
        }

        #endregion

        #region UpvoteAsync Tests

        [Test]
        public async Task UpvoteAsync_CreatesUpvoteAndIncrementsCounter()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");

            // Act
            var result = await _repository.UpvoteAsync(comment.Id, 2);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(comment.Id));
            Assert.That(result.Upvotes, Is.EqualTo(1));
            Assert.That(result.UpvotedByMe, Is.True);

            // Verify in database
            var upvoteExists = await _db.CommentUpvotes.AnyAsync(u => u.CommentId == comment.Id && u.UserId == 2);
            Assert.That(upvoteExists, Is.True);
        }

        [Test]
        public async Task UpvoteAsync_ReturnsNullWhenCommentNotFound()
        {
            // Act
            var result = await _repository.UpvoteAsync(999, 1);

            // Assert
            Assert.That(result, Is.Null);
        }

        [Test]
        public async Task UpvoteAsync_ThrowsExceptionWhenSelfUpvote()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");

            // Act & Assert
            var ex = Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _repository.UpvoteAsync(comment.Id, 1));
            Assert.That(ex.Message, Is.EqualTo("Self-upvote not allowed"));
        }

        [Test]
        public async Task UpvoteAsync_IdempotentWhenAlreadyUpvoted()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");
            
            // First upvote
            await _repository.UpvoteAsync(comment.Id, 2);

            // Act - Second upvote
            var result = await _repository.UpvoteAsync(comment.Id, 2);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Upvotes, Is.EqualTo(1)); // Should still be 1
            Assert.That(result.UpvotedByMe, Is.True);
        }

        #endregion

        #region RemoveUpvoteAsync Tests

        [Test]
        public async Task RemoveUpvoteAsync_RemovesUpvoteAndDecrementsCounter()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");
            await _repository.UpvoteAsync(comment.Id, 2); // Create upvote first

            // Act
            var result = await _repository.RemoveUpvoteAsync(comment.Id, 2);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(comment.Id));
            Assert.That(result.Upvotes, Is.EqualTo(0));
            Assert.That(result.UpvotedByMe, Is.False);

            // Verify removed from database
            var upvoteExists = await _db.CommentUpvotes.AnyAsync(u => u.CommentId == comment.Id && u.UserId == 2);
            Assert.That(upvoteExists, Is.False);
        }

        [Test]
        public async Task RemoveUpvoteAsync_ReturnsNullWhenCommentNotFound()
        {
            // Act
            var result = await _repository.RemoveUpvoteAsync(999, 1);

            // Assert
            Assert.That(result, Is.Null);
        }

        [Test]
        public async Task RemoveUpvoteAsync_IdempotentWhenNoUpvoteExists()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");

            // Act
            var result = await _repository.RemoveUpvoteAsync(comment.Id, 2);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Upvotes, Is.EqualTo(0));
            Assert.That(result.UpvotedByMe, Is.False);
        }

        [Test]
        public async Task RemoveUpvoteAsync_PreventsNegativeUpvoteCount()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var comment = new Comment
            {
                ReportId = 1,
                UserId = 1,
                CommentText = "test",
                CreatedAt = DateTimeOffset.UtcNow,
                Upvotes = 0 // Already at 0
            };
            _db.Comments.Add(comment);
            
            var upvote = new CommentUpvote { CommentId = comment.Id, UserId = 2 };
            _db.CommentUpvotes.Add(upvote);
            await _db.SaveChangesAsync();

            // Act
            var result = await _repository.RemoveUpvoteAsync(comment.Id, 2);

            // Assert
            Assert.That(result.Upvotes, Is.EqualTo(0)); // Should not go negative
        }

        #endregion

        #region DeleteOwnedAsync Tests

        [Test]
        public async Task DeleteOwnedAsync_DeletesOwnedComment()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");

            // Act
            var result = await _repository.DeleteOwnedAsync(comment.Id, 1, false);

            // Assert
            Assert.That(result, Is.True);

            // Verify deleted from database
            var deletedComment = await _db.Comments.FindAsync(comment.Id);
            Assert.That(deletedComment, Is.Null);
        }

        [Test]
        public async Task DeleteOwnedAsync_ReturnsFalseWhenCommentNotFound()
        {
            // Act
            var result = await _repository.DeleteOwnedAsync(999, 1, false);

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public async Task DeleteOwnedAsync_ReturnsFalseWhenNotOwnerAndNotAdmin()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");

            // Act - Different user, not admin
            var result = await _repository.DeleteOwnedAsync(comment.Id, 2, false);

            // Assert
            Assert.That(result, Is.False);

            // Verify comment still exists
            var existingComment = await _db.Comments.FindAsync(comment.Id);
            Assert.That(existingComment, Is.Not.Null);
        }

        [Test]
        public async Task DeleteOwnedAsync_DeletesWhenNotOwnerButIsAdmin()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");

            // Act - Different user, but is admin
            var result = await _repository.DeleteOwnedAsync(comment.Id, 2, true);

            // Assert
            Assert.That(result, Is.True);

            // Verify deleted from database
            var deletedComment = await _db.Comments.FindAsync(comment.Id);
            Assert.That(deletedComment, Is.Null);
        }

        [Test]
        public async Task DeleteOwnedAsync_DeletesWhenIsOwnerRegardlessOfAdminStatus()
        {
            // Arrange
            var user = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");

            // Act - Owner, not admin
            var result = await _repository.DeleteOwnedAsync(comment.Id, 1, false);

            // Assert
            Assert.That(result, Is.True);

            // Verify deleted from database
            var deletedComment = await _db.Comments.FindAsync(comment.Id);
            Assert.That(deletedComment, Is.Null);
        }

        #endregion

        #region Integration Tests

        [Test]
        public async Task FullWorkflow_CreateUpvoteRemoveUpvoteDelete()
        {
            // Arrange
            var user1 = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            var user2 = new User { Id = 2, Username = "user2", Email = "user2@test.com", PasswordHash = "hash" };
            _db.Users.AddRange(user1, user2);
            await _db.SaveChangesAsync();

            // Act & Assert - Create
            var comment = await _repository.CreateAsync(1, 1, "user1", "test comment");
            Assert.That(comment.Upvotes, Is.EqualTo(0));

            // Act & Assert - Upvote
            var upvoteResult = await _repository.UpvoteAsync(comment.Id, 2);
            Assert.That(upvoteResult.Upvotes, Is.EqualTo(1));
            Assert.That(upvoteResult.UpvotedByMe, Is.True);

            // Act & Assert - List (should show upvoted)
            var comments = await _repository.ListByReportAsync(1, 2);
            Assert.That(comments.First().UpvotedByMe, Is.True);
            Assert.That(comments.First().Upvotes, Is.EqualTo(1));

            // Act & Assert - Remove upvote
            var removeResult = await _repository.RemoveUpvoteAsync(comment.Id, 2);
            Assert.That(removeResult.Upvotes, Is.EqualTo(0));
            Assert.That(removeResult.UpvotedByMe, Is.False);

            // Act & Assert - Delete
            var deleteResult = await _repository.DeleteOwnedAsync(comment.Id, 1, false);
            Assert.That(deleteResult, Is.True);

            // Verify final state
            var finalComments = await _repository.ListByReportAsync(1, 1);
            Assert.That(finalComments.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task ListByReportAsync_HandlesMultipleUsersAndUpvotes()
        {
            // Arrange
            var user1 = new User { Id = 1, Username = "user1", Email = "user1@test.com", PasswordHash = "hash" };
            var user2 = new User { Id = 2, Username = "user2", Email = "user2@test.com", PasswordHash = "hash" };
            var user3 = new User { Id = 3, Username = "user3", Email = "user3@test.com", PasswordHash = "hash" };
            _db.Users.AddRange(user1, user2, user3);
            await _db.SaveChangesAsync();

            // Create comments
            var comment1 = await _repository.CreateAsync(1, 1, "user1", "comment 1");
            var comment2 = await _repository.CreateAsync(1, 2, "user2", "comment 2");

            // User 3 upvotes comment 1, User 1 upvotes comment 2
            await _repository.UpvoteAsync(comment1.Id, 3);
            await _repository.UpvoteAsync(comment2.Id, 1);

            // Act - Get comments as user 3
            var commentsAsUser3 = await _repository.ListByReportAsync(1, 3);

            // Assert
            var comment1Result = commentsAsUser3.First(c => c.Id == comment1.Id);
            var comment2Result = commentsAsUser3.First(c => c.Id == comment2.Id);

            Assert.That(comment1Result.UpvotedByMe, Is.True);
            Assert.That(comment1Result.Upvotes, Is.EqualTo(1));
            Assert.That(comment2Result.UpvotedByMe, Is.False);
            Assert.That(comment2Result.Upvotes, Is.EqualTo(1));
        }

        #endregion
    }
}