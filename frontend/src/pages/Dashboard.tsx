import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate ở đây
import api from '../services/api';

interface DashboardSummary {
  enrolledClassesCount: number;
  upcomingAssignmentsCount: number;
  newAnnouncementsCount: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const navigate = useNavigate(); // Khởi tạo hook chuyển trang

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setSummary(res.data);
      } catch (error) {
        console.error('Failed to load dashboard summary', error);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-bottom pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="mb-2">Trang tổng quan</h1>
          <p className="text-secondary">Xin chào, {user?.fullName || user?.name || 'Sinh viên'}!</p>
        </div>
        {/* Nút này ở trên cùng không bị giới hạn width nên dùng Link vẫn ổn */}
        <Link to="/classes" className="btn btn-primary">Xem khóa học</Link>
      </div>

      <div className="grid-cols-3">
        {/* CARD 1 */}
        <div className="course-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="course-card-title mb-0" style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>Khóa học đang tham gia</h3>
            <span style={{ backgroundColor: '#e2e8f0', color: '#1e293b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {summary?.enrolledClassesCount || 0} Môn
            </span>
          </div>
          <p className="text-secondary mb-6" style={{ fontSize: '0.95rem' }}>Các môn học đang diễn ra trong học kỳ này.</p>
          {/* Đã thay đổi thành button và dùng onClick để chuyển trang */}
          <button 
            onClick={() => navigate('/classes')} 
            className="btn btn-outline w-full text-center"
          >
            Xem chi tiết
          </button>
        </div>

        {/* CARD 2 */}
        <div className="course-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="course-card-title mb-0" style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>Bài tập sắp đến hạn</h3>
            <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {summary?.upcomingAssignmentsCount || 0} Bài
            </span>
          </div>
          <p className="text-secondary mb-6" style={{ fontSize: '0.95rem' }}>Vui lòng kiểm tra và nộp bài tập đúng thời hạn.</p>
          <button className="btn btn-outline w-full text-center">Xem bài tập</button>
        </div>

        {/* CARD 3 */}
        <div className="course-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="course-card-title mb-0" style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>Thông báo mới</h3>
            <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {summary?.newAnnouncementsCount || 0} Mới
            </span>
          </div>
          <p className="text-secondary mb-6" style={{ fontSize: '0.95rem' }}>Có thông báo mới từ giảng viên của bạn.</p>
          <button className="btn btn-outline w-full text-center">Xem thông báo</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;