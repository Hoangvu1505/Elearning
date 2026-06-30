import React, { useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';
import api, { BASE_URL, getAssetUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: number;
  classId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  senderAvatarUrl?: string;
  message: string;
  createdAt: string;
}

interface ChatTabProps {
  classId: string;
}

const ChatTab: React.FC<ChatTabProps> = ({ classId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<HubConnection | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history
  const loadChatHistory = async () => {
    try {
      const res = await api.get(`/chat/${classId}`);
      setMessages(res.data);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load chat history', error);
    }
  };

  useEffect(() => {
    loadChatHistory();

    // Setup SignalR connection
    const token = localStorage.getItem('token') || '';
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/class`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = newConnection;

    const startConnection = async () => {
      try {
        await newConnection.start();
        console.log('[SignalR] Connected successfully');
        setConnected(true);
        // Join class room group
        await newConnection.invoke('JoinClass', classId);
      } catch (err) {
        console.error('[SignalR] Connection failed: ', err);
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    // Listen for new messages
    newConnection.on('ReceiveMessage', (message: ChatMessage) => {
      if (String(message.classId) === String(classId)) {
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      }
    });

    // Cleanup connection on unmount
    return () => {
      if (newConnection) {
        newConnection.invoke('LeaveClass', classId).catch(console.error);
        newConnection.stop().catch(console.error);
      }
    };
  }, [classId]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await api.post('/chat', {
        classId: parseInt(classId),
        message: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSending(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return <span className="badge" style={{ backgroundColor: '#dc3545', color: 'white', fontSize: '0.75rem', padding: '2px 6px', marginLeft: '6px' }}>QTV</span>;
      case 'Teacher':
        return <span className="badge" style={{ backgroundColor: '#fd7e14', color: 'white', fontSize: '0.75rem', padding: '2px 6px', marginLeft: '6px' }}>Giáo viên</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col mt-4" style={{ height: '550px', border: '1px solid var(--border-color)', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
        <span style={{ fontWeight: 500, color: 'var(--text-color)' }}>Phòng thảo luận lớp học</span>
        <span className="flex items-center gap-2">
          <span style={{
            display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: connected ? '#28a745' : '#dc3545'
          }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {connected ? 'Trực tuyến' : 'Đang kết nối lại...'}
          </span>
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-grow p-4" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 ? (
          <div className="text-center text-secondary my-auto" style={{ color: 'var(--text-secondary)' }}>
            Chưa có tin nhắn nào. Hãy gửi lời chào đến lớp học!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.senderId) === String(user?.id);
            return (
              <div
                key={msg.id}
                className="flex items-start gap-3"
                style={{
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                }}
              >
                {/* Avatar */}
                {!isMe && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      backgroundColor: '#ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {msg.senderAvatarUrl ? (
                      <img src={getAssetUrl(msg.senderAvatarUrl) || ''} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#666' }}>
                        {msg.senderName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Content */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <div style={{ fontSize: '0.85rem', marginBottom: '2px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>{msg.senderName}</span>
                      {getRoleBadge(msg.senderRole)}
                    </div>
                  )}

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      borderTopRightRadius: isMe ? '2px' : '12px',
                      borderTopLeftRadius: isMe ? '12px' : '2px',
                      backgroundColor: isMe ? 'var(--primary-color)' : '#f1f3f5',
                      color: isMe ? 'white' : 'var(--text-color)',
                      fontSize: '0.95rem',
                      lineHeight: '1.4',
                      wordBreak: 'break-word',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    {msg.message}
                  </div>
                  <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="flex gap-2 p-3" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <input
          type="text"
          className="form-input"
          style={{ flex: 1, borderRadius: '20px', padding: '8px 16px', border: '1px solid var(--border-color)' }}
          placeholder="Nhập nội dung tin nhắn..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={!connected}
          required
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ borderRadius: '20px', padding: '8px 20px', fontWeight: 600 }}
          disabled={sending || !connected}
        >
          {sending ? 'Đang gửi...' : 'Gửi'}
        </button>
      </form>
    </div>
  );
};

export default ChatTab;
