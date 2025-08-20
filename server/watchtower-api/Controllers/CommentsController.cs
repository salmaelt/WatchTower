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

// FE -> JSON -> DTO -> Models -> Repository -> Model -> DTO -> JSON

namespace WatchtowerApi.Controllers
{
    [ApiController]
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
            }

            return Ok(result);
        }
    }
}
