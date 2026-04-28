using ElearningPlatform.DTOs;

namespace ElearningPlatform.Services
{
    public interface IAuthService
    {
        Task<UserResponseDto> Register(RegisterDto registerDto);
        Task<string> Login(LoginDto loginDto);
        Task<UserResponseDto> GetCurrentUser(int userId);
        Task<IEnumerable<UserResponseDto>> GetAllUsers();
        Task ChangePassword(int userId, string currentPassword, string newPassword);
        Task<UserResponseDto> UpdateUser(int id, UpdateUserDto dto);
        Task DeleteUser(int id);
    }
}