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

        private class NotificationItemDto
        {
            public int Id { get; set; }
            public string Title { get; set; } = "";
            public string Content { get; set; } = "";
            public DateTime CreatedAt { get; set; }
            public string Type { get; set; } = "";
            public int ClassId { get; set; }
        }

        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = GetUserId();
            var role = GetUserRole();
            var list = new List<NotificationItemDto>();

            if (role == "Student")
            {
                var enrolledClassIds = await _context.ClassEnrollments
                    .Where(ce => ce.StudentId == userId)
                    .Select(ce => ce.ClassId)
                    .ToListAsync();

                var announcements = await _context.Announcements
                    .Include(a => a.Class)
                    .Where(a => enrolledClassIds.Contains(a.ClassId))
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(5)
                    .Select(a => new NotificationItemDto {
                        Id = a.Id,
                        Title = $"Thông báo mới từ {a.Class.Name}",
                        Content = a.Title,
                        CreatedAt = a.CreatedAt,
                        Type = "announcement",
                        ClassId = a.ClassId
                    })
                    .ToListAsync();

                var assignments = await _context.Assignments
                    .Include(a => a.Class)
                    .Where(a => enrolledClassIds.Contains(a.ClassId))
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(5)
                    .Select(a => new NotificationItemDto {
                        Id = a.Id,
                        Title = $"Bài tập mới từ {a.Class.Name}",
                        Content = a.Title,
                        CreatedAt = a.CreatedAt,
                        Type = "assignment",
                        ClassId = a.ClassId
                    })
                    .ToListAsync();

                list.AddRange(announcements);
                list.AddRange(assignments);
            }
            else if (role == "Teacher" || role == "Admin")
            {
                var teacherClassIds = await _context.Classes
                    .Where(c => c.TeacherId == userId)
                    .Select(c => c.Id)
                    .ToListAsync();

                var announcements = await _context.Announcements
                    .Include(a => a.Class)
                    .Where(a => teacherClassIds.Contains(a.ClassId))
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(5)
                    .Select(a => new NotificationItemDto {
                        Id = a.Id,
                        Title = $"Đã đăng thông báo trong {a.Class.Name}",
                        Content = a.Title,
                        CreatedAt = a.CreatedAt,
                        Type = "announcement",
                        ClassId = a.ClassId
                    })
                    .ToListAsync();

                list.AddRange(announcements);
            }

            var result = list
                .OrderByDescending(x => x.CreatedAt)
                .Take(5)
                .ToList();

            return Ok(result);
        }

        private class GradeItemDto
        {
            public string Source { get; set; } = "";
            public string ClassName { get; set; } = "";
            public string Title { get; set; } = "";
            public string Score { get; set; } = "";
            public DateTime Date { get; set; }
            public string StudentName { get; set; } = "";
        }

        [HttpGet("grades")]
        public async Task<IActionResult> GetGrades()
        {
            var userId = GetUserId();
            var role = GetUserRole();
            var list = new List<GradeItemDto>();

            if (role == "Student")
            {
                var quizGrades = await _context.QuizSubmissions
                    .Include(qs => qs.Quiz)
                    .ThenInclude(q => q.Class)
                    .Where(qs => qs.StudentId == userId)
                    .Select(qs => new GradeItemDto {
                        Source = "Trắc nghiệm",
                        ClassName = qs.Quiz.Class.Name,
                        Title = qs.Quiz.Title,
                        Score = qs.Score.ToString("F1") + " / 10",
                        Date = qs.SubmittedAt,
                        StudentName = ""
                    })
                    .ToListAsync();

                var assignmentGrades = await _context.Submissions
                    .Include(s => s.Assignment)
                    .ThenInclude(a => a.Class)
                    .Where(s => s.StudentId == userId)
                    .Select(s => new GradeItemDto {
                        Source = "Bài tập",
                        ClassName = s.Assignment.Class.Name,
                        Title = s.Assignment.Title,
                        Score = s.Grade.HasValue ? s.Grade.Value.ToString("F1") + " / 10" : "Chưa chấm",
                        Date = s.SubmittedAt,
                        StudentName = ""
                    })
                    .ToListAsync();

                list.AddRange(quizGrades);
                list.AddRange(assignmentGrades);
            }
            else
            {
                var teacherClassIds = await _context.Classes
                    .Where(c => c.TeacherId == userId)
                    .Select(c => c.Id)
                    .ToListAsync();

                var quizGrades = await _context.QuizSubmissions
                    .Include(qs => qs.Quiz)
                    .ThenInclude(q => q.Class)
                    .Include(qs => qs.Student)
                    .Where(qs => teacherClassIds.Contains(qs.Quiz.ClassId))
                    .Select(qs => new GradeItemDto {
                        Source = "Trắc nghiệm",
                        ClassName = qs.Quiz.Class.Name,
                        Title = qs.Quiz.Title,
                        Score = qs.Score.ToString("F1") + " / 10",
                        Date = qs.SubmittedAt,
                        StudentName = qs.Student.FullName
                    })
                    .ToListAsync();

                var assignmentGrades = await _context.Submissions
                    .Include(s => s.Assignment)
                    .ThenInclude(a => a.Class)
                    .Include(s => s.Student)
                    .Where(s => teacherClassIds.Contains(s.Assignment.ClassId))
                    .Select(s => new GradeItemDto {
                        Source = "Bài tập",
                        ClassName = s.Assignment.Class.Name,
                        Title = s.Assignment.Title,
                        Score = s.Grade.HasValue ? s.Grade.Value.ToString("F1") + " / 10" : "Chưa chấm",
                        Date = s.SubmittedAt,
                        StudentName = s.Student.FullName
                    })
                    .ToListAsync();

                list.AddRange(quizGrades);
                list.AddRange(assignmentGrades);
            }

            var result = list.OrderByDescending(x => x.Date).ToList();
            return Ok(result);
        }

        private class CalendarEventDto
        {
            public int Id { get; set; }
            public string Title { get; set; } = "";
            public DateTime Date { get; set; }
            public string Type { get; set; } = "";
            public string ClassName { get; set; } = "";
        }

        [HttpGet("calendar")]
        public async Task<IActionResult> GetCalendarEvents()
        {
            var userId = GetUserId();
            var role = GetUserRole();
            var list = new List<CalendarEventDto>();

            if (role == "Student")
            {
                var enrolledClassIds = await _context.ClassEnrollments
                    .Where(ce => ce.StudentId == userId)
                    .Select(ce => ce.ClassId)
                    .ToListAsync();

                var quizzes = await _context.Quizzes
                    .Include(q => q.Class)
                    .Where(q => enrolledClassIds.Contains(q.ClassId))
                    .Select(q => new CalendarEventDto {
                        Id = q.Id,
                        Title = q.Title,
                        Date = q.CreatedAt.AddDays(7), // Assume a default due date of 7 days after creation
                        Type = "Trắc nghiệm",
                        ClassName = q.Class.Name
                    })
                    .ToListAsync();

                var assignments = await _context.Assignments
                    .Include(a => a.Class)
                    .Where(a => enrolledClassIds.Contains(a.ClassId))
                    .Select(a => new CalendarEventDto {
                        Id = a.Id,
                        Title = a.Title,
                        Date = a.DueDate,
                        Type = "Bài tập",
                        ClassName = a.Class.Name
                    })
                    .ToListAsync();

                list.AddRange(quizzes);
                list.AddRange(assignments);
            }
            else
            {
                var teacherClassIds = await _context.Classes
                    .Where(c => c.TeacherId == userId)
                    .Select(c => c.Id)
                    .ToListAsync();

                var quizzes = await _context.Quizzes
                    .Include(q => q.Class)
                    .Where(q => teacherClassIds.Contains(q.ClassId))
                    .Select(q => new CalendarEventDto {
                        Id = q.Id,
                        Title = q.Title,
                        Date = q.CreatedAt.AddDays(7),
                        Type = "Trắc nghiệm",
                        ClassName = q.Class.Name
                    })
                    .ToListAsync();

                var assignments = await _context.Assignments
                    .Include(a => a.Class)
                    .Where(a => teacherClassIds.Contains(a.ClassId))
                    .Select(a => new CalendarEventDto {
                        Id = a.Id,
                        Title = a.Title,
                        Date = a.DueDate,
                        Type = "Bài tập",
                        ClassName = a.Class.Name
                    })
                    .ToListAsync();

                list.AddRange(quizzes);
                list.AddRange(assignments);
            }

            var result = list.OrderBy(x => x.Date).ToList();
            return Ok(result);
        }
    }
}
