using Microsoft.AspNetCore.SignalR;

namespace ElearningPlatform.Hubs
{
    public class ClassHub : Hub
    {
        public async Task JoinClass(string classId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, classId);
            Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} joined class room {classId}");
        }

        public async Task LeaveClass(string classId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, classId);
            Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} left class room {classId}");
        }
    }
}
