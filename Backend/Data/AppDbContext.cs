using Microsoft.EntityFrameworkCore;
using ElearningPlatform.Models;

namespace ElearningPlatform.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        
        public DbSet<User> Users { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<ClassEnrollment> ClassEnrollments { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<Lecture> Lectures { get; set; }
        public DbSet<StoredFile> StoredFiles { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Class - Teacher relationship
            modelBuilder.Entity<Class>()
                .HasOne(c => c.Teacher)
                .WithMany(u => u.TeachingClasses)
                .HasForeignKey(c => c.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Enrollment composite key alternative (unique per student-class)
            modelBuilder.Entity<ClassEnrollment>()
                .HasIndex(ce => new { ce.ClassId, ce.StudentId })
                .IsUnique();

            // Prevent multiple cascade paths for Submission
            modelBuilder.Entity<Submission>()
                .HasOne(s => s.Student)
                .WithMany()
                .HasForeignKey(s => s.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}