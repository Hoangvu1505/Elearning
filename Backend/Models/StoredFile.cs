using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.Models
{
    public class StoredFile
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string FileName { get; set; } = string.Empty;
        [Required]
        public string ContentType { get; set; } = string.Empty;
        [Required]
        public byte[] Content { get; set; } = Array.Empty<byte>();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
