namespace ElearningPlatform.Services
{
    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _env;
        private const long MaxFileSize = 20 * 1024 * 1024; // 20MB
        
        public FileService(IWebHostEnvironment env)
        {
            _env = env;
        }
        
        public async Task<string> SaveFileAsync(IFormFile file, string subFolder)
        {
            if (file.Length > MaxFileSize)
                throw new Exception("File vượt quá dung lượng cho phép (20MB)");
                
            var uploadsFolder = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", subFolder);
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
            
            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);
            
            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);
            
            return Path.Combine("uploads", subFolder, uniqueFileName).Replace("\\", "/");
        }
        
        public void DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;
            var fullPath = Path.Combine(_env.ContentRootPath, "wwwroot", filePath);
            if (File.Exists(fullPath)) File.Delete(fullPath);
        }
    }
}