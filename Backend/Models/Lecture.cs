using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.Models
{
    public class Lecture
    {
        public int Id { get; set; }
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        public string? Content { get; set; }
        public string? FilePath { get; set; }
        public string? FileName { get; set; }
        public int ClassId { get; set; }
        public Class Class { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
