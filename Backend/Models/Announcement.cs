using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.Models
{
    public class Announcement
    {
        public int Id { get; set; }
        [Required]
        public string Title { get; set; } = string.Empty;
        [Required]
        public string Content { get; set; } = string.Empty;
        public int ClassId { get; set; }
        public Class Class { get; set; } = null!;
        public int AuthorId { get; set; }  // Teacher
        public User Author { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}