import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div>
      <section className="card text-center mb-6" style={{ padding: '4rem 2rem', borderTop: '4px solid var(--accent-color)' }}>
        <h1 className="mb-4" style={{ fontSize: '2.5rem' }}>Chào mừng đến với Hệ thống Elearning</h1>
        <p className="text-secondary mb-6" style={{ maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.1rem' }}>
          Hệ thống quản lý học tập trực tuyến dành cho sinh viên và giảng viên. 
          Theo dõi tiến độ, nộp bài tập và trao đổi trực tuyến dễ dàng.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/classes" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Xem Khóa học</Link>
          {!isAuthenticated && (
            <Link to="/login" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Đăng nhập</Link>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="section-title text-center mb-6">Tính năng nổi bật</h2>
        <div className="grid-cols-3">
          <div className="course-card text-center">
            <h3 className="course-card-title mb-2">Hệ thống bài giảng</h3>
            <p className="text-secondary">
              Tổ chức nội dung học tập theo từng tuần, dễ dàng truy cập tài liệu và video bài giảng mọi lúc mọi nơi.
            </p>
          </div>
          <div className="course-card text-center">
            <h3 className="course-card-title mb-2">Nộp bài tập nhanh chóng</h3>
            <p className="text-secondary">
              Hệ thống theo dõi deadline thông minh, hỗ trợ nộp đa dạng các định dạng file.
            </p>
          </div>
          <div className="course-card text-center">
            <h3 className="course-card-title mb-2">Thông báo & Trao đổi</h3>
            <p className="text-secondary">
              Nhận thông báo ngay lập tức từ giảng viên và thảo luận trực tiếp trên từng khóa học.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
