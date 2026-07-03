using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ElearningPlatform.Data;
using ElearningPlatform.Models;
using ElearningPlatform.DTOs;

namespace ElearningPlatform.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        
        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }
        
        public async Task<UserResponseDto> Register(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                throw new Exception("Email đã tồn tại");
                
            CreatePasswordHash(dto.Password, out byte[] hash, out byte[] salt);
            
            var role = dto.Role ?? "Student";
            var prefix = role == "Teacher" ? "GV" : (role == "Student" ? "HS" : "AD");
            var count = await _context.Users.CountAsync(u => u.Role == role);
            var userCode = $"{prefix}{(count + 1):D2}";

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                DateOfBirth = dto.DateOfBirth,
                PasswordHash = hash,
                PasswordSalt = salt,
                Role = role,
                UserCode = userCode
            };
            
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
            return MapToDto(user);
        }
        
        public async Task<string> Login(LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null) throw new Exception("Email hoặc mật khẩu không đúng");
            
            if (!VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
                throw new Exception("Email hoặc mật khẩu không đúng");
                
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
                
            return CreateToken(user);
        }
        
        public async Task<UserResponseDto> GetCurrentUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found");
            return MapToDto(user);
        }
        
        public async Task ChangePassword(int userId, string currentPassword, string newPassword)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found");
            
            if (!VerifyPasswordHash(currentPassword, user.PasswordHash, user.PasswordSalt))
                throw new Exception("Mật khẩu hiện tại không đúng");
                
            CreatePasswordHash(newPassword, out byte[] hash, out byte[] salt);
            user.PasswordHash = hash;
            user.PasswordSalt = salt;
            await _context.SaveChangesAsync();
        }
        
        // Helper methods (CreatePasswordHash, VerifyPasswordHash, CreateToken, MapToDto)
        private string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };
            
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not found")));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);
            
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds
            );
            
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<IEnumerable<UserResponseDto>> GetAllUsers()
        {
            var users = await _context.Users.ToListAsync();
            return users.Select(MapToDto);
        }

        public async Task<UserResponseDto> UpdateUser(int id, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) throw new Exception("Không tìm thấy người dùng");

            // Kiểm tra email trùng (nếu đổi email)
            if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
            {
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
                    throw new Exception("Email đã được sử dụng bởi tài khoản khác");
            }

            user.FullName = dto.FullName;
            user.Email = dto.Email;
            user.Role = dto.Role;
            await _context.SaveChangesAsync();
            return MapToDto(user);
        }

        public async Task DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) throw new Exception("Không tìm thấy người dùng");
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
        
        private static UserResponseDto MapToDto(User user) => new()
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            DateOfBirth = user.DateOfBirth,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role,
            UserCode = user.UserCode,
            LastLoginAt = user.LastLoginAt != null ? DateTime.SpecifyKind(user.LastLoginAt.Value, DateTimeKind.Utc) : null
        };
        
        private void CreatePasswordHash(string password, out byte[] hash, out byte[] salt)
        {
            using var hmac = new System.Security.Cryptography.HMACSHA512();
            salt = hmac.Key;
            hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }
        
        private bool VerifyPasswordHash(string password, byte[] hash, byte[] salt)
        {
            using var hmac = new System.Security.Cryptography.HMACSHA512(salt);
            var computed = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return computed.SequenceEqual(hash);
        }
    }
}