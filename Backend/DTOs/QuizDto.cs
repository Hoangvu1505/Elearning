using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.DTOs
{
    public class CreateQuizQuestionDto
    {
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

    public class CreateQuizDto
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ClassId { get; set; }
        public int TimeLimitMinutes { get; set; }
        public List<CreateQuizQuestionDto> Questions { get; set; } = new List<CreateQuizQuestionDto>();
    }

    public class QuizResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TimeLimitMinutes { get; set; }
        public DateTime CreatedAt { get; set; }
        public int QuestionCount { get; set; }
        public bool HasSubmitted { get; set; }
        public double? StudentScore { get; set; } // Out of 10.0
    }

    public class QuizQuestionResponseDto
    {
        public int Id { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string OptionC { get; set; } = string.Empty;
        public string OptionD { get; set; } = string.Empty;
    }

    public class QuizDetailsDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TimeLimitMinutes { get; set; }
        public List<QuizQuestionResponseDto> Questions { get; set; } = new List<QuizQuestionResponseDto>();
    }

    public class SubmitQuestionAnswerDto
    {
        public int QuestionId { get; set; }
        public string SelectedOption { get; set; } = "A"; // "A", "B", "C", "D"
    }

    public class SubmitQuizDto
    {
        public List<SubmitQuestionAnswerDto> Answers { get; set; } = new List<SubmitQuestionAnswerDto>();
    }

    public class QuizSubmissionResponseDto
    {
        public int Id { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        public double Score { get; set; }
        public DateTime SubmittedAt { get; set; }
    }
}
