namespace ElearningPlatform.Models
{
    public class Submission
    {
        public int Id { get; set; }
        public int AssignmentId { get; set; }
        public Assignment Assignment { get; set; } = null!;
        public int StudentId { get; set; }
        public User Student { get; set; } = null!;
        public string? FilePath { get; set; }
        public string? FileName { get; set; }
        public long? FileSize { get; set; } // bytes
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public double? Grade { get; set; }
        public string? Feedback { get; set; }
    }
}