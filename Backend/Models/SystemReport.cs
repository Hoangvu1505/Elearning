using System;
using System.ComponentModel.DataAnnotations;

namespace ElearningPlatform.Models
{
    public class SystemReport
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Severity { get; set; } = "Thấp"; // Thấp, Trung bình, Cao

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsResolved { get; set; } = false;

        public int ReporterId { get; set; }
        public User? Reporter { get; set; }
    }
}
