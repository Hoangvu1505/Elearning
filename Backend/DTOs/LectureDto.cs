namespace ElearningPlatform.DTOs
{
    public class LectureResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Content { get; set; }
        public string? FilePath { get; set; }
        public string? FileName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateLectureDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Content { get; set; }
        public IFormFile? File { get; set; }
    }
}
