<<<<<<< HEAD
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure;
using WatchtowerApi.Infrastructure.Repositories;
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;
=======
// Controllers/CommentsController.cs
>>>>>>> f4b32f7545fbebd3204cd0ac576a4fe77944b7d5

// External Dependencies
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// Internal Dependencies
using WatchtowerApi.Contracts;
using WatchtowerApi.Infrastructure.Auth;
using WatchtowerApi.Infrastructure.Repositories;

namespace WatchtowerApi.Controllers
{
    [ApiController]
<<<<<<< HEAD
    [Route("reports")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IUserRepository _userRepository;

        public CommentsController(ICommentRepository commentRepository, IUserRepository userRepository)
        {
            _commentRepository = commentRepository;
            _userRepository = userRepository;
        }

        // GET: reports/{userId}/comments
        [HttpGet("{id}/comments")]
        public async Task<ActionResult<IEnumerable<CommentDto>>> GetByReportIdAsync(long id)
        {

            var comments = await _commentRepository.GetByReportIdAsync((int)id);
            if (!comments.Any())
            {
                return Problem("Report not found", statusCode: 404);
            }

            var result = new List<CommentDto>();
            foreach (var c in comments)
            {
                var user = await _userRepository.GetByIdAsync((int)c.UserId);

                result.Add(new CommentDto
                {
                    Id = c.Id,
                    UserId = c.UserId,
                    Username = user.Username,
                    CommentText = c.CommentText,
                    CreatedAt = c.CreatedAt,
                    Upvotes = c.Upvotes,
                    UpvotedByMe = false
                });
=======
    public sealed class CommentsController : ControllerBase
    {
        private readonly ICommentRepository _comments;

        public CommentsController(ICommentRepository comments)
        {
            _comments = comments;
        }

        // GET /reports/{id}/comments
        [HttpGet("reports/{id:long}/comments")]
        [ProducesResponseType(typeof(List<CommentDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> ListForReport([FromRoute] long id)
        {
            // 404 if report not found
            if (!await _comments.ReportExistsAsync(id))
                return NotFound(new { error = "report not found" });

            // If caller authorised, include information about upvotes
            long? callerId = AuthHelpers.TryGetUserId(User);

            // Repository call
            List<CommentDto> items = await _comments.ListByReportAsync(id, callerId);

            // Always 200 with array (possibly empty)
            return Ok(items);
        }

        // POST /reports/{id}/comments
        [Authorize]
        [HttpPost("reports/{id:long}/comments")]
        [ProducesResponseType(typeof(CommentDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> Create([FromRoute] long id, [FromBody] CreateCommentRequest body)
        {
            // Validate comment is not empty
            if (body == null || string.IsNullOrWhiteSpace(body.CommentText))
                return Problem("Validation error: commentText is required.", statusCode: 400);

            // Validate the report exists
            if (!await _comments.ReportExistsAsync(id))
                return NotFound(new { error = "report not found" });
            try
            {
                // Token Parsing
                var userId = AuthHelpers.GetUserId(User);
                var username = AuthHelpers.GetUsername(User);

                // Creating comment, returns DTO
                CommentDto created = await _comments.CreateAsync(id, userId, username, body.CommentText);

                // 201 with payload
                return StatusCode(201, created);
            }
            catch (InvalidOperationException)
            {
                return Problem("Bad Token", statusCode: 401);
>>>>>>> f4b32f7545fbebd3204cd0ac576a4fe77944b7d5
            }
            catch (Exception)
            {
                return Problem("Server Error", statusCode: 500);
            }
        }

        // PUT /comments/{id}/upvote
        [Authorize]
        [HttpPut("comments/{id:long}/upvote")]
        [ProducesResponseType(typeof(CommentUpvoteStateDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Upvote([FromRoute] long id)
        {
            try
            {
                var userId = AuthHelpers.GetUserId(User);
                var state = await _comments.UpvoteAsync(id, userId);
                if (state == null) return NotFound(new { error = "comment not found" });

                return Ok(state);
            }
            catch (InvalidOperationException)
            {
                // self-upvote not allowed
                return Problem("Self-upvote not allowed.", statusCode: 400);
            }
        }

        // DELETE /comments/{id}/upvote
        [Authorize]
        [HttpDelete("comments/{id:long}/upvote")]
        [ProducesResponseType(typeof(CommentUpvoteStateDto), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> RemoveUpvote([FromRoute] long id)
        {
            var userId = AuthHelpers.GetUserId(User);
            var state = await _comments.RemoveUpvoteAsync(id, userId);
            if (state == null) return NotFound(new { error = "comment not found" });

            return Ok(state);
        }

        // DELETE /comments/{id}
        [Authorize]
        [HttpDelete("comments/{id:long}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete([FromRoute] long id)
        {
            var userId = AuthHelpers.GetUserId(User);
            var isAdmin = User.IsInRole("admin");

            var ok = await _comments.DeleteOwnedAsync(id, userId, isAdmin);
            if (!ok) return NotFound(new { error = "comment not found" });

            return Ok(result);
        }
<<<<<<< HEAD

        // POST /reports/{id}/comments
        [HttpPost("{id}/comments")]
        public async Task<ActionResult<CommentDto>> CreateCommentAsync(
            long id,
            [FromBody] CreateCommentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CommentText))
            {
                return Problem("Comment text is required", statusCode: 400);
            }

            // how are we gettin gthe userid - jwtclaims?
            // var userId = ;

            // include userId in the param
            
            /*



            var comment = await _commentRepository.CreateAsync((id, userId, request.CommentText);

            var user = await _userRepository.GetByIdAsync(comment.UserId);

            var dto = new CommentDto
            {
                Id = comment.Id,
                UserId = comment.UserId,
                Username = user?.Username ?? "Unknown",
                CommentText = comment.CommentText,
                CreatedAt = comment.CreatedAt,
            };



            
            */
            return Ok();

            
        }
    } }
=======
    }
}
>>>>>>> f4b32f7545fbebd3204cd0ac576a4fe77944b7d5
