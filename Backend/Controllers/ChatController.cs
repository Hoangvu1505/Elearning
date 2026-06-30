using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ElearningPlatform.Data;
using ElearningPlatform.Models;
using ElearningPlatform.DTOs;
using ElearningPlatform.Hubs;
using System.Security.Claims;

namespace ElearningPlatform.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ClassHub> _hubContext;

        public ChatController(AppDbContext context, IHubContext<ClassHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        [HttpGet("{classId}")]
        public async Task<IActionResult> GetChatHistory(int classId)
        {
            // Verify if user is enrolled in this class, or is teacher/admin
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var classExists = await _context.Classes.AnyAsync(c => c.Id == classId);
            if (!classExists) return NotFound(new { message = "Lớp học không tồn tại" });

            if (role == "Student")
            {
                var isEnrolled = await _context.ClassEnrollments
                    .AnyAsync(ce => ce.ClassId == classId && ce.StudentId == userId);
                if (!isEnrolled) return Forbid();
            }
            else if (role == "Teacher")
            {
                var isTeacherOfClass = await _context.Classes
                    .AnyAsync(c => c.Id == classId && c.TeacherId == userId);
                if (!isTeacherOfClass) return Forbid();
            }

            var messages = await _context.ChatMessages
                .Include(m => m.Sender)
                .Where(m => m.ClassId == classId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(100)
                .ToListAsync();

            var result = messages.Select(m => new ChatMessageResponseDto
            {
                Id = m.Id,
                ClassId = m.ClassId,
                SenderId = m.SenderId,
                SenderName = m.Sender.FullName,
                SenderRole = m.Sender.Role,
                SenderAvatarUrl = m.Sender.AvatarUrl,
                Message = m.Message,
                CreatedAt = m.CreatedAt
            }).OrderBy(m => m.CreatedAt).ToList();

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var classroom = await _context.Classes.FindAsync(dto.ClassId);
            if (classroom == null) return NotFound(new { message = "Lớp học không tồn tại" });

            // Authorization check
            if (role == "Student")
            {
                var isEnrolled = await _context.ClassEnrollments
                    .AnyAsync(ce => ce.ClassId == dto.ClassId && ce.StudentId == userId);
                if (!isEnrolled) return Forbid();
            }
            else if (role == "Teacher")
            {
                if (classroom.TeacherId != userId) return Forbid();
            }

            var sender = await _context.Users.FindAsync(userId);
            if (sender == null) return Unauthorized();

            var chatMessage = new ChatMessage
            {
                ClassId = dto.ClassId,
                SenderId = userId,
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(chatMessage);
            await _context.SaveChangesAsync();

            var response = new ChatMessageResponseDto
            {
                Id = chatMessage.Id,
                ClassId = chatMessage.ClassId,
                SenderId = chatMessage.SenderId,
                SenderName = sender.FullName,
                SenderRole = sender.Role,
                SenderAvatarUrl = sender.AvatarUrl,
                Message = chatMessage.Message,
                CreatedAt = chatMessage.CreatedAt
            };

            // Broadcast to the SignalR group (which is the ClassId string representation)
            await _hubContext.Clients.Group(dto.ClassId.ToString())
                .SendAsync("ReceiveMessage", response);

            return Ok(response);
        }
    }
}
