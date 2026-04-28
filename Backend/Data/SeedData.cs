using Microsoft.EntityFrameworkCore;
using ElearningPlatform.Models;
using System.Security.Cryptography;
using System.Text;

namespace ElearningPlatform.Data
{
    public static class SeedData
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            using var context = new AppDbContext(
                serviceProvider.GetRequiredService<DbContextOptions<AppDbContext>>());

            // Ensure schema is up to date (manually add missing columns if using EnsureCreated)
            await EnsureSchemaUpToDate(context);

            if (!context.Users.Any(u => u.Role == "Admin"))
            {
                CreatePasswordHash("password123", out byte[] hashAdmin, out byte[] saltAdmin);
                var admin = new User
                {
                    FullName = "Quản Trị Viên",
                    Email = "admin@hcmus.edu.vn",
                    Role = "Admin",
                    UserCode = "AD01",
                    PasswordHash = hashAdmin,
                    PasswordSalt = saltAdmin
                };
                context.Users.Add(admin);
                await context.SaveChangesAsync();
            }

            // Gán mã số cho các người dùng cũ chưa có mã
            var usersWithoutCode = await context.Users.Where(u => string.IsNullOrEmpty(u.UserCode)).ToListAsync();
            if (usersWithoutCode.Any())
            {
                foreach (var role in new[] { "Teacher", "Student", "Admin" })
                {
                    var roleUsers = usersWithoutCode.Where(u => u.Role == role).ToList();
                    var existingCount = await context.Users.CountAsync(u => u.Role == role && !string.IsNullOrEmpty(u.UserCode));
                    for (int i = 0; i < roleUsers.Count; i++)
                    {
                        var prefix = role == "Teacher" ? "GV" : (role == "Student" ? "HS" : "AD");
                        roleUsers[i].UserCode = $"{prefix}{(existingCount + i + 1):D2}";
                    }
                }
                await context.SaveChangesAsync();
            }

            // Fix orphan classes (classes with invalid TeacherId)
            var allUsers = await context.Users.ToListAsync();
            var allClasses = await context.Classes.ToListAsync();
            var firstTeacher = allUsers.FirstOrDefault(u => u.Role == "Teacher");
            
            bool changed = false;
            foreach (var c in allClasses)
            {
                if (!allUsers.Any(u => u.Id == c.TeacherId))
                {
                    Console.WriteLine($"[DEBUG] Fixing class {c.Id} ({c.Name}): TeacherId {c.TeacherId} not found in Users table.");
                    if (firstTeacher != null)
                    {
                        c.TeacherId = firstTeacher.Id;
                        changed = true;
                        Console.WriteLine($"[DEBUG] Assigned to {firstTeacher.FullName} (ID: {firstTeacher.Id})");
                    }
                    else
                    {
                        Console.WriteLine("[DEBUG] No teacher found in database to assign to this class!");
                    }
                }
            }
            if (changed) await context.SaveChangesAsync();

            // Log all classes and their teachers for debugging
            var finalClasses = await context.Classes.Include(c => c.Teacher).ToListAsync();
            Console.WriteLine($"--- DEBUG: Class List (Total: {finalClasses.Count}) ---");
            foreach (var fc in finalClasses)
            {
                Console.WriteLine($"ID: {fc.Id} | Name: {fc.Name} | Teacher: {(fc.Teacher?.FullName ?? "NULL")} (TeacherId: {fc.TeacherId})");
            }
            Console.WriteLine("------------------------------------------");

            if (context.Users.Any(u => u.Role == "Teacher"))
            {
                return;   // DB has been seeded with standard users
            }

            // Create standard users
            CreatePasswordHash("password123", out byte[] hash, out byte[] salt);
            var teacher = new User { FullName ="Hoàng Vũ", Email = "hoangvu150506@gmail.com", Role = "Teacher", UserCode = "GV01", PasswordHash = hash, PasswordSalt = salt };
            var student = new User { FullName = "Lương Nguyễn Hoàng Vũ", Email = "hoangvunt787@gmail.com", Role = "Student", UserCode = "HS01", PasswordHash = hash, PasswordSalt = salt };
            
            context.Users.AddRange(teacher, student);
            await context.SaveChangesAsync();

            // Create classes
            var class1 = new Class
            {
                Name = "Lớp 1",
                Description = "Toán 9",
                TeacherId = teacher.Id
            };
            
            var class2 = new Class
            {
                Name = "Lớp chủ nhiệm",
                Description = "Sinh hoạt chi đoàn",
                TeacherId = teacher.Id
            };

            context.Classes.AddRange(class1, class2);
            await context.SaveChangesAsync();

            // Enroll student
            context.ClassEnrollments.Add(new ClassEnrollment { ClassId = class1.Id, StudentId = student.Id });
            context.ClassEnrollments.Add(new ClassEnrollment { ClassId = class2.Id, StudentId = student.Id });
            await context.SaveChangesAsync();

            // Create announcements
            context.Announcements.Add(new Announcement
            {
                Title = "Chào mừng các em đến với khóa học!",
                Content = "Vui lòng đọc đề cương môn học trong phần tài liệu.",
                ClassId = class1.Id,
                AuthorId = teacher.Id
            });

            // Create assignments
            context.Assignments.Add(new Assignment
            {
                Title = "Bài tập tuần 1",
                Description = "Hoàn thành bài tập chương 1 trong giáo trình.",
                ClassId = class1.Id,
                TeacherId = teacher.Id,
                DueDate = DateTime.UtcNow.AddDays(7)
            });

            await context.SaveChangesAsync();
        }

        private static async Task EnsureSchemaUpToDate(AppDbContext context)
        {
            // Add UserCode if missing
            await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Users]') AND name = 'UserCode')
                BEGIN
                    ALTER TABLE [Users] ADD [UserCode] NVARCHAR(MAX) NOT NULL DEFAULT '';
                END");

            // Add AvatarUrl if missing
            await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Users]') AND name = 'AvatarUrl')
                BEGIN
                    ALTER TABLE [Users] ADD [AvatarUrl] NVARCHAR(MAX) NULL;
                END");

            // Create Lectures table if missing
            await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Lectures]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE [Lectures] (
                        [Id] int NOT NULL IDENTITY,
                        [Title] nvarchar(200) NOT NULL,
                        [Content] nvarchar(max) NULL,
                        [FilePath] nvarchar(max) NULL,
                        [FileName] nvarchar(max) NULL,
                        [ClassId] int NOT NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_Lectures] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_Lectures_Classes_ClassId] FOREIGN KEY ([ClassId]) REFERENCES [Classes] ([Id]) ON DELETE CASCADE
                    );
                END");
        }

        private static void CreatePasswordHash(string password, out byte[] hash, out byte[] salt)
        {
            using var hmac = new HMACSHA512();
            salt = hmac.Key;
            hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }
    }
}
