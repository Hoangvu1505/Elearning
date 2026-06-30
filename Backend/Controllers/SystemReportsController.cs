using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ElearningPlatform.Data;
using ElearningPlatform.Models;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ElearningPlatform.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/reports")]
    public class SystemReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SystemReportsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        // DTO for incoming reports
        public class CreateReportDto
        {
            public string Title { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string Severity { get; set; } = "Thấp"; // Thấp, Trung bình, Cao
        }

        // POST /api/reports
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description))
            {
                return BadRequest(new { message = "Tiêu đề và nội dung báo cáo không được để trống." });
            }

            var userId = GetUserId();
            var report = new SystemReport
            {
                Title = dto.Title,
                Description = dto.Description,
                Severity = dto.Severity,
                CreatedAt = DateTime.UtcNow,
                IsResolved = false,
                ReporterId = userId
            };

            _context.SystemReports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Báo cáo lỗi đã được gửi thành công đến Quản trị viên.", reportId = report.Id });
        }

        // GET /api/reports
        [HttpGet]
        public async Task<IActionResult> GetReports()
        {
            var userId = GetUserId();
            var role = GetUserRole();

            if (role == "Admin")
            {
                // Admins see all reports
                var reports = await _context.SystemReports
                    .Include(r => r.Reporter)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new {
                        r.Id,
                        r.Title,
                        r.Description,
                        r.Severity,
                        r.CreatedAt,
                        r.IsResolved,
                        ReporterName = r.Reporter != null ? r.Reporter.FullName : "Ngoại tuyến",
                        ReporterCode = r.Reporter != null ? r.Reporter.UserCode : "Ngoại tuyến"
                    })
                    .ToListAsync();

                return Ok(reports);
            }
            else
            {
                // Regular users see only their own reported bugs
                var reports = await _context.SystemReports
                    .Where(r => r.ReporterId == userId)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new {
                        r.Id,
                        r.Title,
                        r.Description,
                        r.Severity,
                        r.CreatedAt,
                        r.IsResolved,
                        ReporterName = "Tôi",
                        ReporterCode = ""
                    })
                    .ToListAsync();

                return Ok(reports);
            }
        }

        // PUT /api/reports/{id}/resolve
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/resolve")]
        public async Task<IActionResult> ResolveReport(int id)
        {
            var report = await _context.SystemReports.FindAsync(id);
            if (report == null)
            {
                return NotFound(new { message = "Không tìm thấy báo cáo lỗi." });
            }

            report.IsResolved = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Báo cáo lỗi đã được xử lý xong." });
        }
    }
}
