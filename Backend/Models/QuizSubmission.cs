namespace ElearningPlatform.Models
{
    public class QuizSubmission
    {
        public int Id { get; set; }
        
        public int QuizId { get; set; }
        public Quiz Quiz { get; set; } = null!;
        
        public int StudentId { get; set; }
        public User Student { get; set; } = null!;
        
        public double Score { get; set; } // Out of 10.0 or percentage
        
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}
