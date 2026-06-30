namespace ElearningPlatform.DTOs
{
    public class SendMessageDto
    {
        public int ClassId { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ChatMessageResponseDto
    {
        public int Id { get; set; }
        public int ClassId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string SenderRole { get; set; } = string.Empty;
        public string? SenderAvatarUrl { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
