using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Repositories;

namespace WatchtowerApi.Controllers
{
    [ApiController]
    [Route("reports/{reportId}/comments")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IReportRepository _reportRepository;

        public CommentsController(ICommentRepository commentRepository, IReportRepository reportRepository)
        {
            _commentRepository = commentRepository;
            _reportRepository = reportRepository;
        }

        // GET /reports/{reportId}/comments
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetComments(long reportId)
        {
            var report = await _reportRepository.GetByIdAsync((int)reportId);
            if (report == null)
                return NotFound(new { message = "Report not found" });

            long? userId = null;
            var userIdClaim = User.FindFirstValue("sub");
            if (!string.IsNullOrEmpty(userIdClaim) && long.TryParse(userIdClaim, out var parsedId))
                userId = parsedId;

            var comments = await _commentRepository.GetByReportIdAsync((int)reportId);

            var response = comments
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    UserId = c.UserId,
                    Username = c.User?.Username ?? "Unknown",
                    CommentText = c.CommentText,
                    CreatedAt = c.CreatedAt,
                    Upvotes = c.UpvoteUsers.Count,
                    UpvotedByMe = userId.HasValue && c.UpvoteUsers.Any(u => u.UserId == userId.Value)
                });

            return Ok(response);
        }

        // POST /reports/{reportId}/comments
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddComment(long reportId, [FromBody] CreateCommentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CommentText))
                return BadRequest(new { message = "Comment text is required" });

            var report = await _reportRepository.GetByIdAsync((int)reportId);
            if (report == null)
                return NotFound(new { message = "Report not found" });

            var userIdClaim = User.FindFirstValue("sub");
            var username = User.FindFirstValue("unique_name");

            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId) || string.IsNullOrEmpty(username))
                return Unauthorized();

            var comment = await _commentRepository.CreateAsync((int)reportId, (int)userId, request.CommentText);

            var response = new CommentDto
            {
                Id = comment.Id,
                UserId = comment.UserId,
                Username = username,
                CommentText = comment.CommentText,
                CreatedAt = comment.CreatedAt,
                Upvotes = 0,
                UpvotedByMe = false
            };

            return CreatedAtAction(nameof(GetComments), new { reportId }, response);
        }

        // PUT /comments/{id}/upvote
        [HttpPut("/comments/{id}/upvote")]
        [Authorize]
        public async Task<IActionResult> UpvoteComment(long id)
        {
            var userIdClaim = User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var comment = await _commentRepository.GetByIdAsync((int)id);
            if (comment == null)
                return NotFound(new { message = "Comment not found" });

            if (comment.UserId == userId)
                return BadRequest(new { message = "Self-upvote not allowed" });

            // Idempotent: only add upvote if it doesn't exist
            if (!comment.UpvoteUsers.Any(u => u.UserId == userId))
                await _commentRepository.UpvoteAsync(id, (int)userId);

            comment = await _commentRepository.GetByIdAsync((int)id); // refresh

            return Ok(new CommentUpvoteStateDto
            {
                Id = comment.Id,
                Upvotes = comment.UpvoteUsers.Count,
                UpvotedByMe = comment.UpvoteUsers.Any(u => u.UserId == userId)
            });
        }

        // DELETE /comments/{id}/upvote
        [HttpDelete("/comments/{id}/upvote")]
        [Authorize]
        public async Task<IActionResult> RemoveUpvote(long id)
        {
            var userIdClaim = User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var comment = await _commentRepository.GetByIdAsync((int)id);
            if (comment == null)
                return NotFound(new { message = "Comment not found" });

            // Idempotent removal
            await _commentRepository.RemoveUpvoteAsync(id, (int)userId);

            comment = await _commentRepository.GetByIdAsync((int)id); // refresh

            return Ok(new CommentUpvoteStateDto
            {
                Id = comment.Id,
                Upvotes = comment.UpvoteUsers.Count,
                UpvotedByMe = false
            });
        }

        // DELETE /comments/{id}
        [HttpDelete("/comments/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(long id)
        {
            var userIdClaim = User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var comment = await _commentRepository.GetByIdAsync((int)id);
            if (comment == null)
                return NotFound(new { message = "Comment not found" });

            if (comment.UserId != userId)
                return Forbid();

            await _commentRepository.DeleteAsync((int)id);

            return NoContent();
        }
    }
}