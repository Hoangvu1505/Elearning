using ElearningPlatform.Data;
using ElearningPlatform.Models;

namespace ElearningPlatform.Services
{
    public class FileService : IFileService
    {
        private readonly AppDbContext _context;
        private const long MaxFileSize = 20 * 1024 * 1024; // 20MB
        
        public FileService(AppDbContext context)
        {
            _context = context;
        }
        
        public async Task<string> SaveFileAsync(IFormFile file, string subFolder)
        {
            if (file.Length > MaxFileSize)
                throw new Exception("File vượt quá dung lượng cho phép (20MB)");
                
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            
            var storedFile = new StoredFile
            {
                FileName = file.FileName,
                ContentType = file.ContentType,
                Content = ms.ToArray()
            };
            
            _context.StoredFiles.Add(storedFile);
            await _context.SaveChangesAsync();
            
            // Trả về đường dẫn dạng API proxy
            return $"api/files/{storedFile.Id}";
        }
        
        public async Task DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;
            
            // Lấy ID từ chuỗi "api/files/{id}"
            var parts = filePath.Split('/');
            if (parts.Length > 0 && int.TryParse(parts[^1], out int fileId))
            {
                var file = await _context.StoredFiles.FindAsync(fileId);
                if (file != null)
                {
                    _context.StoredFiles.Remove(file);
                    await _context.SaveChangesAsync();
                }
            }
        }
    }
}