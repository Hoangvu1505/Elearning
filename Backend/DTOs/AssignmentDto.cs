namespace ElearningPlatform.DTOs
{
    public class CreateAssignmentDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ClassId { get; set; }
        public DateTime DueDate { get; set; }
    }
    
    public class AssignmentResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserResponseDto Teacher { get; set; } = null!;
        public bool HasSubmitted { get; set; } // cho student
    }
}