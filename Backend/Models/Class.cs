using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.Models
{
    public class Class
    {
        public int Id { get; set; }
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TeacherId { get; set; }  // User có Role = Teacher
        public User Teacher { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public ICollection<ClassEnrollment> Enrollments { get; set; } = new List<ClassEnrollment>();
        public ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();
        public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public ICollection<Lecture> Lectures { get; set; } = new List<Lecture>();
    }
}