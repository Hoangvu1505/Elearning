using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ElearningPlatform.Data;
using ElearningPlatform.DTOs;
using ElearningPlatform.Models;
using ElearningPlatform.Services;
using System.Security.Claims;

namespace ElearningPlatform.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SubmissionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;

        public SubmissionsController(AppDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        [HttpPost]
        public async Task<IActionResult> SubmitAssignment([FromForm] SubmitAssignmentDto dto)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            if (role != "Student") return Forbid();

            var assignment = await _context.Assignments.FindAsync(dto.AssignmentId);
            if (assignment == null) return NotFound(new { message = "Bài tập không tồn tại" });

            // Kiểm tra xem đã nộp chưa
            var existingSubmission = await _context.Submissions
                .FirstOrDefaultAsync(s => s.AssignmentId == dto.AssignmentId && s.StudentId == userId);

            if (existingSubmission != null)
            {
                return BadRequest(new { message = "Bạn đã nộp bài này rồi. Hãy dùng chức năng cập nhật bài nộp." });
            }

            var filePath = await _fileService.SaveFileAsync(dto.File, "submissions");

            var submission = new Submission
            {
                AssignmentId = dto.AssignmentId,
                StudentId = userId,
                FilePath = filePath,
                FileName = dto.File.FileName,
                FileSize = dto.File.Length,
                SubmittedAt = DateTime.UtcNow
            };

            _context.Submissions.Add(submission);
            await _context.SaveChangesAsync();

            return Ok(MapToDto(submission));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSubmission(int id, [FromForm] IFormFile file)
        {
            var userId = GetUserId();
            var submission = await _context.Submissions.FindAsync(id);

            if (submission == null) return NotFound();
            if (submission.StudentId != userId) return Forbid();

            // Xóa file cũ
            if (!string.IsNullOrEmpty(submission.FilePath))
            {
                await _fileService.DeleteFile(submission.FilePath);
            }

            // Lưu file mới
            var filePath = await _fileService.SaveFileAsync(file, "submissions");

            submission.FilePath = filePath;
            submission.FileName = file.FileName;
            submission.FileSize = file.Length;
            submission.SubmittedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(MapToDto(submission));
        }

        [HttpGet("assignment/{assignmentId}")]
        public async Task<IActionResult> GetSubmissionsByAssignment(int assignmentId)
        {
            var role = GetUserRole();
            if (role != "Teacher" && role != "Admin") return Forbid();

            var submissions = await _context.Submissions
                .Include(s => s.Student)
                .Where(s => s.AssignmentId == assignmentId)
                .OrderByDescending(s => s.SubmittedAt)
                .ToListAsync();

            return Ok(submissions.Select(MapToDto));
        }

        [HttpGet("assignment/{assignmentId}/my")]
        public async Task<IActionResult> GetMySubmission(int assignmentId)
        {
            var userId = GetUserId();
            var submission = await _context.Submissions
                .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == userId);

            if (submission == null) return NotFound();

            return Ok(MapToDto(submission));
        }

        [Authorize(Roles = "Admin,Teacher")]
        [HttpPost("{id}/grade")]
        public async Task<IActionResult> GradeSubmission(int id, [FromBody] GradeSubmissionDto dto)
        {
            var submission = await _context.Submissions.FindAsync(id);
            if (submission == null) return NotFound(new { message = "Không tìm thấy bài nộp" });

            submission.Grade = dto.Grade;
            submission.Feedback = dto.Feedback;

            await _context.SaveChangesAsync();

            return Ok(MapToDto(submission));
        }

        private static SubmissionResponseDto MapToDto(Submission s) => new()
        {
            Id = s.Id,
            FilePath = s.FilePath ?? "",
            FileName = s.FileName ?? "",
            FileSize = s.FileSize ?? 0,
            SubmittedAt = DateTime.SpecifyKind(s.SubmittedAt, DateTimeKind.Utc),
            Grade = s.Grade,
            Feedback = s.Feedback,
            Student = s.Student != null ? new UserResponseDto
            {
                Id = s.Student.Id,
                FullName = s.Student.FullName,
                Email = s.Student.Email,
                Role = s.Student.Role,
                UserCode = s.Student.UserCode
            } : null
        };
    }
}
