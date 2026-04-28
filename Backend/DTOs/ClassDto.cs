namespace ElearningPlatform.DTOs
{
    public class CreateClassDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TeacherId { get; set; }
    }
    
    public class ClassResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public UserResponseDto Teacher { get; set; } = null!;
        public int StudentCount { get; set; }
    }

    // Cập nhật thông tin lớp (Admin)
    public class UpdateClassDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TeacherId { get; set; }
    }

    // Thêm học sinh vào lớp
    public class EnrollStudentDto
    {
        public int StudentId { get; set; }
    }

    // Thông tin học sinh trong lớp
    public class EnrolledStudentDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime EnrolledAt { get; set; }
        public string? UserCode { get; set; }
    }
}