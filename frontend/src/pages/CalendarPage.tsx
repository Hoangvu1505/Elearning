import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  type: string;
  className: string;
}

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Trắc nghiệm' | 'Bài tập'>('All');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/dashboard/calendar');
        setEvents(res.data);
      } catch (error) {
        console.error('Failed to load calendar events', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div className="text-center mt-12 text-secondary">Đang tải lịch trình...</div>;

  const filteredEvents = events.filter(e => filter === 'All' || e.type === filter);

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="mb-2">📅 Lịch học tập & Hạn nộp bài</h1>
          <p className="text-secondary">Theo dõi các lịch thi trắc nghiệm và hạn chót nộp bài tập về nhà.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button 
          className={`btn ${filter === 'All' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('All')}
        >
          Tất cả ({events.length})
        </button>
        <button 
          className={`btn ${filter === 'Trắc nghiệm' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('Trắc nghiệm')}
        >
          ✍️ Trắc nghiệm ({events.filter(e => e.type === 'Trắc nghiệm').length})
        </button>
        <button 
          className={`btn ${filter === 'Bài tập' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('Bài tập')}
        >
          📋 Bài tập về nhà ({events.filter(e => e.type === 'Bài tập').length})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredEvents.length === 0 ? (
          <div className="card text-center text-secondary py-12" style={{ backgroundColor: 'white' }}>
            Không có sự kiện học tập nào sắp tới.
          </div>
        ) : (
          filteredEvents.map((ev, index) => {
            const eventDate = new Date(ev.date);
            const isOverdue = eventDate < new Date();
            
            return (
              <div 
                key={index} 
                className="card flex items-center justify-between" 
                style={{ 
                  backgroundColor: 'white', 
                  padding: '1.5rem', 
                  borderRadius: '12px',
                  borderLeft: `5px solid ${ev.type === 'Trắc nghiệm' ? '#10b981' : '#4f46e5'}`,
                  flexDirection: window.innerWidth < 600 ? 'column' : 'row',
                  alignItems: window.innerWidth < 600 ? 'flex-start' : 'center',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '10px',
                      backgroundColor: ev.type === 'Trắc nghiệm' ? '#d1fae5' : '#e0e7ff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: ev.type === 'Trắc nghiệm' ? '#065f46' : '#3730a3', textTransform: 'uppercase' }}>
                      Th{eventDate.getMonth() + 1}
                    </span>
                    <span style={{ fontSize: '1.15rem', color: ev.type === 'Trắc nghiệm' ? '#065f46' : '#3730a3', marginTop: '-3px' }}>
                      {eventDate.getDate()}
                    </span>
                  </div>
                  <div>
                    <h3 className="mb-1" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{ev.title}</h3>
                    <p className="text-secondary mb-0" style={{ fontSize: '0.85rem' }}>
                      🏫 {ev.className} • <span style={{ fontWeight: 600 }}>{ev.type}</span>
                    </p>
                  </div>
                </div>

                <div 
                  className="flex flex-col items-end"
                  style={{ 
                    alignItems: window.innerWidth < 600 ? 'flex-start' : 'flex-end',
                    width: window.innerWidth < 600 ? '100%' : 'auto',
                    borderTop: window.innerWidth < 600 ? '1px solid var(--border-color)' : 'none',
                    paddingTop: window.innerWidth < 600 ? '0.75rem' : '0'
                  }}
                >
                  <span 
                    style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 600, 
                      color: isOverdue ? 'var(--danger-color)' : 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}
                  >
                    ⏰ Hạn chót: {eventDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button 
                    className="btn btn-outline" 
                    style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                    onClick={() => navigate(`/classes/${ev.Id}`)}
                  >
                    Vào lớp học ➡️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
