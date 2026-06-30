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
    public class ClassesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;

        public ClassesController(AppDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        [HttpGet]
        public async Task<IActionResult> GetClasses()
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var query = _context.Classes.Include(c => c.Teacher).AsQueryable();

            if (role == "Student")
            {
                var enrolledClassIds = await _context.ClassEnrollments
                    .Where(ce => ce.StudentId == userId)
                    .Select(ce => ce.ClassId)
                    .ToListAsync();
                    
                query = query.Where(c => enrolledClassIds.Contains(c.Id));
            }
            else if (role == "Teacher")
            {
                query = query.Where(c => c.TeacherId == userId);
            }
            // Admin sees all classes

            var classes = await query.ToListAsync();
            var result = classes.Select(c => new ClassResponseDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Teacher = c.Teacher != null ? new UserResponseDto 
                { 
                    Id = c.Teacher.Id, 
                    FullName = c.Teacher.FullName, 
                    Role = c.Teacher.Role 
                } : null!,
                StudentCount = c.Enrollments.Count
            }).ToList();

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetClass(int id)
        {
            var c = await _context.Classes
                .Include(x => x.Teacher)
                .Include(x => x.Enrollments)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (c == null) return NotFound();

            // Explicitly load teacher if navigation property is null
            if (c.Teacher == null && c.TeacherId != 0)
            {
                c.Teacher = await _context.Users.FindAsync(c.TeacherId);
            }

            Console.WriteLine($"[API] Returning class {c.Id}, Teacher is {(c.Teacher != null ? c.Teacher.FullName : "NULL")} (TeacherId: {c.TeacherId})");

            return Ok(new ClassResponseDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Teacher = c.Teacher != null ? new UserResponseDto 
                { 
                    Id = c.Teacher.Id, 
                    FullName = c.Teacher.FullName, 
                    Role = c.Teacher.Role 
                } : null!,
                StudentCount = c.Enrollments.Count
            });
        }

        [HttpGet("{id}/announcements")]
        public async Task<IActionResult> GetAnnouncements(int id)
        {
            var announcements = await _context.Announcements
                .Where(a => a.ClassId == id)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AnnouncementDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Content = a.Content,
                    CreatedAt = DateTime.SpecifyKind(a.CreatedAt, DateTimeKind.Utc).ToString("o")
                })
                .ToListAsync();

            return Ok(announcements);
        }

        [HttpGet("{id}/assignments")]
        public async Task<IActionResult> GetAssignments(int id)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var assignmentsQuery = _context.Assignments
                .Include(a => a.Submissions)
                .Where(a => a.ClassId == id)
                .OrderBy(a => a.DueDate);

            var result = new List<AssignmentResponseDto>();

            foreach (var a in await assignmentsQuery.ToListAsync())
            {
                bool hasSubmitted = role == "Student" && a.Submissions.Any(s => s.StudentId == userId);
                result.Add(new AssignmentResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    DueDate = DateTime.SpecifyKind(a.DueDate, DateTimeKind.Utc),
                    CreatedAt = DateTime.SpecifyKind(a.CreatedAt, DateTimeKind.Utc),
                    HasSubmitted = hasSubmitted
                });
            }

            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto)
        {
            var newClass = new Class
            {
                Name = dto.Name,
                Description = dto.Description,
                TeacherId = dto.TeacherId
            };
            _context.Classes.Add(newClass);
            await _context.SaveChangesAsync();
            return Ok(newClass);
        }

        [Authorize(Roles = "Admin,Teacher")]
        [HttpPost("{id}/announcements")]
        public async Task<IActionResult> CreateAnnouncement(int id, [FromBody] CreateAnnouncementDto dto)
        {
            var userId = GetUserId();
            var role = GetUserRole();
            
            var query = _context.Classes.AsQueryable();
            if (role != "Admin")
            {
                query = query.Where(c => c.Id == id && c.TeacherId == userId);
            }
            else
            {
                query = query.Where(c => c.Id == id);
            }

            var classExists = await query.AnyAsync();
            if (!classExists) return Forbid();

            var announcement = new Announcement
            {
                Title = dto.Title,
                Content = dto.Content,
                ClassId = id,
                AuthorId = userId
            };
            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();
            return Ok(announcement);
        }

        [Authorize(Roles = "Admin,Teacher")]
        [HttpPost("{id}/assignments")]
        public async Task<IActionResult> CreateAssignment(int id, [FromBody] CreateAssignmentDto dto)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var query = _context.Classes.AsQueryable();
            if (role != "Admin")
            {
                query = query.Where(c => c.Id == id && c.TeacherId == userId);
            }
            else
            {
                query = query.Where(c => c.Id == id);
            }

            var classExists = await query.AnyAsync();
            if (!classExists) return Forbid();

            var assignment = new Assignment
            {
                Title = dto.Title,
                Description = dto.Description,
                DueDate = dto.DueDate,
                ClassId = id,
                TeacherId = userId
            };
            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();
            return Ok(assignment);
        }

        [HttpGet("{id}/lectures")]
        public async Task<IActionResult> GetLectures(int id)
        {
            var lectures = await _context.Lectures
                .Where(l => l.ClassId == id)
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => new LectureResponseDto
                {
                    Id = l.Id,
                    Title = l.Title,
                    Content = l.Content,
                    FileName = l.FileName,
                    FilePath = l.FilePath,
                    CreatedAt = DateTime.SpecifyKind(l.CreatedAt, DateTimeKind.Utc)
                })
                .ToListAsync();

            return Ok(lectures);
        }

        [Authorize(Roles = "Admin,Teacher")]
        [HttpPost("{id}/lectures")]
        public async Task<IActionResult> CreateLecture(int id, [FromForm] CreateLectureDto dto)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var query = _context.Classes.AsQueryable();
            if (role != "Admin")
            {
                query = query.Where(c => c.Id == id && c.TeacherId == userId);
            }
            else
            {
                query = query.Where(c => c.Id == id);
            }

            var classExists = await query.AnyAsync();
            if (!classExists) return Forbid();

            string? filePath = null;
            string? fileName = null;

            if (dto.File != null)
            {
                filePath = await _fileService.SaveFileAsync(dto.File, "lectures");
                fileName = dto.File.FileName;
            }

            var lecture = new Lecture
            {
                Title = dto.Title,
                Content = dto.Content,
                ClassId = id,
                FilePath = filePath,
                FileName = fileName
            };

            _context.Lectures.Add(lecture);
            await _context.SaveChangesAsync();

            return Ok(new LectureResponseDto
            {
                Id = lecture.Id,
                Title = lecture.Title,
                Content = lecture.Content,
                FileName = lecture.FileName,
                FilePath = lecture.FilePath,
                CreatedAt = lecture.CreatedAt
            });
        }

        // === Quản lý thành viên lớp ===

        [Authorize(Roles = "Admin,Teacher")]
        [HttpGet("{id}/students")]
        public async Task<IActionResult> GetStudents(int id)
        {
            var enrollments = await _context.ClassEnrollments
                .Include(ce => ce.Student)
                .Where(ce => ce.ClassId == id)
                .Select(ce => new EnrolledStudentDto
                {
                    Id = ce.Student.Id,
                    FullName = ce.Student.FullName,
                    Email = ce.Student.Email,
                    EnrolledAt = ce.EnrolledAt,
                    UserCode = ce.Student.UserCode
                })
                .ToListAsync();
            return Ok(enrollments);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/enroll")]
        public async Task<IActionResult> EnrollStudent(int id, [FromBody] EnrollStudentDto dto)
        {
            var classExists = await _context.Classes.AnyAsync(c => c.Id == id);
            if (!classExists) return NotFound(new { message = "Lớp không tồn tại" });

            var studentExists = await _context.Users.AnyAsync(u => u.Id == dto.StudentId && u.Role == "Student");
            if (!studentExists) return BadRequest(new { message = "Không tìm thấy học sinh" });

            var alreadyEnrolled = await _context.ClassEnrollments
                .AnyAsync(ce => ce.ClassId == id && ce.StudentId == dto.StudentId);
            if (alreadyEnrolled) return BadRequest(new { message = "Học sinh đã trong lớp" });

            var enrollment = new ClassEnrollment
            {
                ClassId = id,
                StudentId = dto.StudentId
            };
            _context.ClassEnrollments.Add(enrollment);
            await _context.SaveChangesAsync();
            return Ok(enrollment);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}/students/{studentId}")]
        public async Task<IActionResult> RemoveStudent(int id, int studentId)
        {
            var enrollment = await _context.ClassEnrollments
                .FirstOrDefaultAsync(ce => ce.ClassId == id && ce.StudentId == studentId);
            if (enrollment == null) return NotFound(new { message = "Học sinh không trong lớp" });

            _context.ClassEnrollments.Remove(enrollment);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClass(int id, [FromBody] UpdateClassDto dto)
        {
            var c = await _context.Classes.FindAsync(id);
            if (c == null) return NotFound();

            c.Name = dto.Name;
            c.Description = dto.Description;
            c.TeacherId = dto.TeacherId;
            await _context.SaveChangesAsync();
            return Ok(c);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClass(int id)
        {
            var c = await _context.Classes.FindAsync(id);
            if (c == null) return NotFound();

            _context.Classes.Remove(c);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin,Teacher")]
        [HttpDelete("assignments/{assignmentId}")]
        public async Task<IActionResult> DeleteAssignment(int assignmentId)
        {
            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment == null) return NotFound(new { message = "Không tìm thấy bài tập" });

            _context.Assignments.Remove(assignment);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa bài tập thành công" });
        }

        [Authorize(Roles = "Admin,Teacher")]
        [HttpDelete("lectures/{lectureId}")]
        public async Task<IActionResult> DeleteLecture(int lectureId)
        {
            var lecture = await _context.Lectures.FindAsync(lectureId);
            if (lecture == null) return NotFound(new { message = "Không tìm thấy bài giảng" });

            if (!string.IsNullOrEmpty(lecture.FilePath))
            {
                await _fileService.DeleteFile(lecture.FilePath);
            }

            _context.Lectures.Remove(lecture);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa bài giảng thành công" });
        }
    }
}