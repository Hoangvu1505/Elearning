namespace ElearningPlatform.Models
{
    public class ClassEnrollment
    {
        public int Id { get; set; }
        public int ClassId { get; set; }
        public Class Class { get; set; } = null!;
        public int StudentId { get; set; }
        public User Student { get; set; } = null!;
        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    }
}