using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ElearningPlatform.Data;
using ElearningPlatform.Models;
using ElearningPlatform.DTOs;
using System.Security.Claims;

namespace ElearningPlatform.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class QuizzesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QuizzesController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        // 1. Tạo bài trắc nghiệm mới (Chỉ Giáo viên hoặc Admin)
        [Authorize(Roles = "Admin,Teacher")]
        [HttpPost]
        public async Task<IActionResult> CreateQuiz([FromBody] CreateQuizDto dto)
        {
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var classroom = await _context.Classes.FindAsync(dto.ClassId);
            if (classroom == null) return NotFound(new { message = "Lớp học không tồn tại" });

            // Kiểm tra xem giáo viên có dạy lớp này không (nếu không phải Admin)
            if (role == "Teacher" && classroom.TeacherId != userId)
            {
                return Forbid();
            }

            if (dto.Questions == null || dto.Questions.Count == 0)
            {
                return BadRequest(new { message = "Bài trắc nghiệm phải có ít nhất 1 câu hỏi" });
            }

            var quiz = new Quiz
            {
                Title = dto.Title,
                Description = dto.Description,
                ClassId = dto.ClassId,
                TimeLimitMinutes = dto.TimeLimitMinutes,
                CreatedAt = DateTime.UtcNow,
                Questions = dto.Questions.Select(q => new QuizQuestion
                {
                    QuestionText = q.QuestionText,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    CorrectOption = q.CorrectOption.ToUpper().Trim()
                }).ToList()
            };

            _context.Quizzes.Add(quiz);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo bài trắc nghiệm thành công!", quizId = quiz.Id });
        }

        // 2. Lấy danh sách bài trắc nghiệm của lớp học
        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetQuizzesByClass(int classId)
        {
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var classroom = await _context.Classes.FindAsync(classId);
            if (classroom == null) return NotFound(new { message = "Lớp học không tồn tại" });

            // Kiểm tra quyền tham gia lớp học
            if (role == "Student")
            {
                var isEnrolled = await _context.ClassEnrollments
                    .AnyAsync(ce => ce.ClassId == classId && ce.StudentId == userId);
                if (!isEnrolled) return Forbid();
            }
            else if (role == "Teacher")
            {
                if (classroom.TeacherId != userId) return Forbid();
            }

            var quizzes = await _context.Quizzes
                .Include(q => q.Questions)
                .Include(q => q.Submissions)
                .Where(q => q.ClassId == classId)
                .OrderByDescending(q => q.CreatedAt)
                .ToListAsync();

            var result = quizzes.Select(q =>
            {
                var submission = q.Submissions.FirstOrDefault(s => s.StudentId == userId);
                return new QuizResponseDto
                {
                    Id = q.Id,
                    Title = q.Title,
                    Description = q.Description,
                    TimeLimitMinutes = q.TimeLimitMinutes,
                    CreatedAt = q.CreatedAt,
                    QuestionCount = q.Questions.Count,
                    HasSubmitted = submission != null,
                    StudentScore = submission?.Score
                };
            }).ToList();

            return Ok(result);
        }

        // 3. Lấy thông tin chi tiết bài trắc nghiệm để làm bài (ẨN ĐÁP ÁN ĐÚNG để tránh hack F12)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetQuizDetails(int id)
        {
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var quiz = await _context.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quiz == null) return NotFound(new { message = "Không tìm thấy bài trắc nghiệm" });

            // Kiểm tra quyền truy cập thông qua lớp học
            var classroom = await _context.Classes.FindAsync(quiz.ClassId);
            if (classroom == null) return NotFound();

            if (role == "Student")
            {
                var isEnrolled = await _context.ClassEnrollments
                    .AnyAsync(ce => ce.ClassId == quiz.ClassId && ce.StudentId == userId);
                if (!isEnrolled) return Forbid();
            }
            else if (role == "Teacher")
            {
                if (classroom.TeacherId != userId) return Forbid();
            }

            // Map ra DTO chi tiết nhưng lược bỏ đáp án đúng (CorrectOption)
            var result = new QuizDetailsDto
            {
                Id = quiz.Id,
                Title = quiz.Title,
                Description = quiz.Description,
                TimeLimitMinutes = quiz.TimeLimitMinutes,
                Questions = quiz.Questions.Select(q => new QuizQuestionResponseDto
                {
                    Id = q.Id,
                    QuestionText = q.QuestionText,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD
                }).ToList()
            };

            return Ok(result);
        }

        // 4. Học sinh nộp bài và tự động chấm điểm
        [HttpPost("{id}/submit")]
        public async Task<IActionResult> SubmitQuiz(int id, [FromBody] SubmitQuizDto dto)
        {
            var userId = GetUserId();
            
            var quiz = await _context.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quiz == null) return NotFound(new { message = "Không tìm thấy bài trắc nghiệm" });

            // Kiểm tra xem đã nộp bài này trước đó chưa
            var alreadySubmitted = await _context.QuizSubmissions
                .AnyAsync(s => s.QuizId == id && s.StudentId == userId);
            if (alreadySubmitted)
            {
                return BadRequest(new { message = "Bạn đã làm bài trắc nghiệm này rồi và không thể nộp lại!" });
            }

            if (quiz.Questions.Count == 0)
            {
                return BadRequest(new { message = "Bài trắc nghiệm không có câu hỏi để chấm!" });
            }

            int correctAnswersCount = 0;

            foreach (var question in quiz.Questions)
            {
                var studentAnswer = dto.Answers?.FirstOrDefault(a => a.QuestionId == question.Id);
                if (studentAnswer != null && 
                    string.Equals(studentAnswer.SelectedOption.Trim(), question.CorrectOption.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    correctAnswersCount++;
                }
            }

            // Tính điểm trên thang điểm 10
            double rawScore = ((double)correctAnswersCount / quiz.Questions.Count) * 10.0;
            double score = Math.Round(rawScore, 2);

            var submission = new QuizSubmission
            {
                QuizId = id,
                StudentId = userId,
                Score = score,
                SubmittedAt = DateTime.UtcNow
            };

            _context.QuizSubmissions.Add(submission);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Nộp bài thành công!",
                score = score,
                correctCount = correctAnswersCount,
                totalQuestions = quiz.Questions.Count
            });
        }

        // 5. Xem kết quả nộp bài của cả lớp (Dành cho Giáo viên / Admin)
        [Authorize(Roles = "Admin,Teacher")]
        [HttpGet("{id}/submissions")]
        public async Task<IActionResult> GetQuizSubmissions(int id)
        {
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var quiz = await _context.Quizzes.FindAsync(id);
            if (quiz == null) return NotFound(new { message = "Không tìm thấy bài trắc nghiệm" });

            var classroom = await _context.Classes.FindAsync(quiz.ClassId);
            if (classroom == null) return NotFound();

            if (role == "Teacher" && classroom.TeacherId != userId) return Forbid();

            var submissions = await _context.QuizSubmissions
                .Include(s => s.Student)
                .Where(s => s.QuizId == id)
                .OrderByDescending(s => s.Score)
                .ToListAsync();

            var result = submissions.Select(s => new QuizSubmissionResponseDto
            {
                Id = s.Id,
                StudentName = s.Student.FullName,
                StudentCode = s.Student.UserCode ?? s.Student.Id.ToString(),
                Score = s.Score,
                SubmittedAt = s.SubmittedAt
            }).ToList();

            return Ok(result);
        }

        // 6. Xóa bài trắc nghiệm (Chỉ Giáo viên hoặc Admin)
        [Authorize(Roles = "Admin,Teacher")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuiz(int id)
        {
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var quiz = await _context.Quizzes.FindAsync(id);
            if (quiz == null) return NotFound(new { message = "Bài trắc nghiệm không tồn tại" });

            var classroom = await _context.Classes.FindAsync(quiz.ClassId);
            if (classroom == null) return NotFound();

            if (role == "Teacher" && classroom.TeacherId != userId)
            {
                return Forbid();
            }

            _context.Quizzes.Remove(quiz);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa bài trắc nghiệm thành công!" });
        }
    }
}
