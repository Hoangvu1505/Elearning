import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface NotificationItem {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  type: string;
  classId: number;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/dashboard/notifications');
        setNotifications(res.data);
      } catch (error) {
        console.error('Failed to load notifications', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) return <div className="text-center mt-12 text-secondary">Đang tải thông báo...</div>;

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="mb-2">🔔 Thông báo & Tin tức mới</h1>
          <p className="text-secondary">Cập nhật các thông báo và bài tập mới nhất được đăng tải trong lớp học của bạn.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {notifications.length === 0 ? (
          <div className="card text-center text-secondary py-12" style={{ backgroundColor: 'white' }}>
            Không có thông báo nào mới.
          </div>
        ) : (
          notifications.map((n, idx) => (
            <div 
              key={idx} 
              className="card" 
              style={{ 
                backgroundColor: 'white', 
                padding: '1.5rem', 
                borderRadius: '12px',
                borderLeft: `5px solid ${n.type === 'announcement' ? '#10b981' : '#4f46e5'}`,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="mb-0" style={{ fontSize: '1.1rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                  {n.title}
                </h3>
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    padding: '2px 8px', 
                    borderRadius: '12px',
                    backgroundColor: n.type === 'announcement' ? '#d1fae5' : '#e0e7ff',
                    color: n.type === 'announcement' ? '#065f46' : '#3730a3',
                    fontWeight: 'bold'
                  }}
                >
                  {n.type === 'announcement' ? 'Thông báo' : 'Bài tập'}
                </span>
              </div>
              <p className="mb-4" style={{ fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                {n.content}
              </p>
              <div className="flex justify-between items-center mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <small className="text-secondary">
                  ⏰ Đăng lúc: {new Date(n.createdAt).toLocaleString('vi-VN')}
                </small>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => navigate(`/classes/${n.classId}`)}
                >
                  Vào lớp học ➡️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
