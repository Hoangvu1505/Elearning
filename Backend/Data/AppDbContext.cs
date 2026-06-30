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
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<QuizQuestion> QuizQuestions { get; set; }
        public DbSet<QuizSubmission> QuizSubmissions { get; set; }
        public DbSet<SystemReport> SystemReports { get; set; }
        
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

            // ChatMessage configurations
            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Class)
                .WithMany()
                .HasForeignKey(m => m.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Quiz configurations
            modelBuilder.Entity<Quiz>()
                .HasOne(q => q.Class)
                .WithMany()
                .HasForeignKey(q => q.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<QuizQuestion>()
                .HasOne(qq => qq.Quiz)
                .WithMany(q => q.Questions)
                .HasForeignKey(qq => qq.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<QuizSubmission>()
                .HasOne(qs => qs.Quiz)
                .WithMany(q => q.Submissions)
                .HasForeignKey(qs => qs.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<QuizSubmission>()
                .HasOne(qs => qs.Student)
                .WithMany()
                .HasForeignKey(qs => qs.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // SystemReport configurations
            modelBuilder.Entity<SystemReport>()
                .HasOne(r => r.Reporter)
                .WithMany()
                .HasForeignKey(r => r.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}