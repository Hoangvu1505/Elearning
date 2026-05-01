using Microsoft.AspNetCore.Mvc;
using ElearningPlatform.Data;

namespace ElearningPlatform.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FilesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFile(int id)
        {
            var storedFile = await _context.StoredFiles.FindAsync(id);
            if (storedFile == null) return NotFound();

            return File(storedFile.Content, storedFile.ContentType, storedFile.FileName);
        }
    }
}
