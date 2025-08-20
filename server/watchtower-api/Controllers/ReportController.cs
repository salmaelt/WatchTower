using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WatchtowerApi.Contracts;
using WatchtowerApi.Domain;
using WatchtowerApi.Infrastructure.Repositories;

namespace WatchtowerApi.Controllers
{
    [ApiController]
    [Route("reports")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportRepository _reportRepository;
        private readonly ICommentRepository _commentRepository;

        public ReportsController(IReportRepository reportRepository, ICommentRepository commentRepository)
        {
            _reportRepository = reportRepository;
            _commentRepository = commentRepository;
        }

        // GET /reports/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult> GetReport(long id)
        {
            var report = await _reportRepository.GetByIdAsync((int)id);

            return Ok(new
            {
                id = report.Id,
                type = report.Type,
                occurredAt = report.OccurredAt,
                lat = report.Location.Y,
                lng = report.Location.X,
                status = report.Status,
                upvotes = report.Upvotes,
                description = report.Description,
                userId = report.UserId,
                username = report.User?.Username,
                createdAt = report.CreatedAt
            });
        }


        // PATCH /reports/{id}/upvote
        [HttpPatch("{id}/upvote")]
        public async Task<ActionResult> UpvoteReport(int id)
        {
            var report = await _reportRepository.GetByIdAsync(id);
            if (report == null) return NotFound();

            // Increment upvotes
            report.Upvotes += 1;
            await _reportRepository.UpdateUpvotesAsync(id, report.Upvotes);
            var response = new { id = report.Id, upvotes = report.Upvotes };

            return Ok(response);
        }

        // [HttpPost("{id}/comments")]
        // public async Task<ActionResult> AddComment(int id, [FromBody] CreateCommentRequest request)
        // {
        //     var report = await _reportRepository.GetByIdAsync(id);
        //     if (report == null) return NotFound();

        //     int userId = int.Parse(User.FindFirst("id")!.Value); // match DB

        //     var comment = await _commentRepository.CreateAsync(report.Id, userId, request.CommentText);

        //     var dto = new
        //     {
        //         id = comment.Id,
        //         userId = comment.UserId,
        //         username = comment.User!.Username,
        //         commentText = comment.CommentText,
        //         createdAt = comment.CreatedAt
        //     };

        //     return Ok(dto);
        // }



    }
}
