using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ElearningPlatform.Data;
using ElearningPlatform.DTOs;
using ElearningPlatform.Services;

namespace ElearningPlatform.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;
        
        public ProfileController(AppDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }
        
        [HttpPut]
        public async Task<IActionResult> UpdateProfile(UpdateProfileDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();
            
            // Kiểm tra email trùng (nếu email thay đổi)
            if (user.Email != dto.Email)
            {
                var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
                if (emailExists) return BadRequest(new { message = "Email này đã được sử dụng bởi người dùng khác" });
            }

            user.FullName = dto.FullName;
            user.DateOfBirth = dto.DateOfBirth;
            user.Email = dto.Email;
            
            await _context.SaveChangesAsync();
            return Ok(MapToDto(user));
        }
        
        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();
            
            if (!string.IsNullOrEmpty(user.AvatarUrl))
                await _fileService.DeleteFile(user.AvatarUrl);
                
            var avatarPath = await _fileService.SaveFileAsync(file, "avatars");
            user.AvatarUrl = avatarPath;
            await _context.SaveChangesAsync();
            
            return Ok(new { avatarUrl = avatarPath });
        }
        
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto, [FromServices] IAuthService authService)
        {
            var userId = GetUserId();
            try 
            {
                await authService.ChangePassword(userId, dto.CurrentPassword, dto.NewPassword);
                return Ok(new { message = "Đổi mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        private int GetUserId() => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        
        private static UserResponseDto MapToDto(Models.User user) => new()
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            DateOfBirth = user.DateOfBirth,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role
        };
    }
}