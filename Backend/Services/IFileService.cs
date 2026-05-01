namespace ElearningPlatform.Services
{
    public interface IFileService
    {
        Task<string> SaveFileAsync(IFormFile file, string subFolder);
        Task DeleteFile(string filePath);
    }
}