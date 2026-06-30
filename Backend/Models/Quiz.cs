using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.Models
{
    public class Quiz
    {
        public int Id { get; set; }
        
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public int ClassId { get; set; }
        public Class Class { get; set; } = null!;
        
        public int TimeLimitMinutes { get; set; } // e.g. 15, 30, 45 minutes
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
        public ICollection<QuizSubmission> Submissions { get; set; } = new List<QuizSubmission>();
    }
}
