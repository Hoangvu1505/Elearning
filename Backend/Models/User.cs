using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
        [Required]
        public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();
        public DateTime? DateOfBirth { get; set; }
        public string? AvatarUrl { get; set; }
        [Required]
        public string Role { get; set; } = "Student"; // Admin, Teacher, Student
        public string UserCode { get; set; } = string.Empty; // HS01, GV01...
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
        
        // Navigation properties
        public ICollection<ClassEnrollment> Enrollments { get; set; } = new List<ClassEnrollment>();
        public ICollection<Class> TeachingClasses { get; set; } = new List<Class>();
        public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    }
}