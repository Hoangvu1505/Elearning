using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.Models
{
    public class Assignment
    {
        public int Id { get; set; }
        [Required]
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ClassId { get; set; }
        public Class Class { get; set; } = null!;
        public int TeacherId { get; set; }
        public User Teacher { get; set; } = null!;
        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    }
}