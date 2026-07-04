using Microsoft.AspNetCore.Http;

namespace ElearningPlatform.DTOs
{
    public class SubmitAssignmentDto
    {
        public int AssignmentId { get; set; }
        public IFormFile File { get; set; } = null!;
    }
    
    public class SubmissionResponseDto
    {
        public int Id { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime SubmittedAt { get; set; }
        public double? Grade { get; set; }
        public string? Feedback { get; set; }
        public UserResponseDto? Student { get; set; }
    }

    public class GradeSubmissionDto
    {
        public double Grade { get; set; }
        public string? Feedback { get; set; }
    }
}