using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        
        public int ClassId { get; set; }
        public Class Class { get; set; } = null!;
        
        public int SenderId { get; set; }
        public User Sender { get; set; } = null!;
        
        [Required]
        public string Message { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
