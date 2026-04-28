using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ElearningPlatform.Data;
using ElearningPlatform.DTOs;
using System.Security.Claims;

namespace ElearningPlatform.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AssignmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssignmentsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAssignment(int id)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var a = await _context.Assignments
                .Include(a => a.Submissions)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (a == null) return NotFound();

            bool hasSubmitted = role == "Student" && a.Submissions.Any(s => s.StudentId == userId);

            return Ok(new AssignmentResponseDto
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                DueDate = a.DueDate,
                CreatedAt = a.CreatedAt,
                HasSubmitted = hasSubmitted
            });
        }
    }
}
