using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.Models
{
    public class QuizQuestion
    {
        public int Id { get; set; }
        
        public int QuizId { get; set; }
        public Quiz Quiz { get; set; } = null!;
        
        [Required]
        public string QuestionText { get; set; } = string.Empty;
        
        [Required]
        public string OptionA { get; set; } = string.Empty;
        
        [Required]
        public string OptionB { get; set; } = string.Empty;
        
        [Required]
        public string OptionC { get; set; } = string.Empty;
        
        [Required]
        public string OptionD { get; set; } = string.Empty;
        
        [Required, MaxLength(1)]
        public string CorrectOption { get; set; } = "A"; // "A", "B", "C", "D"
    }
}
