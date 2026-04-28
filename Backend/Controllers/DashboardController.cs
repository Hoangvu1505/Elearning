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
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var userId = GetUserId();
            var role = GetUserRole();

            int enrolledClasses = 0;
            int upcomingAssignments = 0;
            int newAnnouncements = 0;

            if (role == "Student")
            {
                var enrolledClassIds = await _context.ClassEnrollments
                    .Where(ce => ce.StudentId == userId)
                    .Select(ce => ce.ClassId)
                    .ToListAsync();

                enrolledClasses = enrolledClassIds.Count;

                var now = DateTime.UtcNow;
                upcomingAssignments = await _context.Assignments
                    .Where(a => enrolledClassIds.Contains(a.ClassId) && a.DueDate > now)
                    .CountAsync();

                newAnnouncements = await _context.Announcements
                    .Where(a => enrolledClassIds.Contains(a.ClassId) && a.CreatedAt > now.AddDays(-7))
                    .CountAsync();
            }
            else if (role == "Teacher")
            {
                enrolledClasses = await _context.Classes.CountAsync(c => c.TeacherId == userId);
                
                var teacherClassIds = await _context.Classes
                    .Where(c => c.TeacherId == userId)
                    .Select(c => c.Id)
                    .ToListAsync();
                    
                var now = DateTime.UtcNow;
                upcomingAssignments = await _context.Assignments
                    .Where(a => teacherClassIds.Contains(a.ClassId) && a.DueDate > now)
                    .CountAsync();
                    
                newAnnouncements = await _context.Announcements
                    .Where(a => teacherClassIds.Contains(a.ClassId) && a.CreatedAt > now.AddDays(-7))
                    .CountAsync();
            }

            return Ok(new DashboardSummaryDto
            {
                EnrolledClassesCount = enrolledClasses,
                UpcomingAssignmentsCount = upcomingAssignments,
                NewAnnouncementsCount = newAnnouncements
            });
        }
    }
}
