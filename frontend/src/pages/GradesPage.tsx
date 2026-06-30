import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface GradeItem {
  source: string;
  className: string;
  title: string;
  score: string;
  date: string;
  studentName?: string;
}

const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await api.get('/dashboard/grades');
        setGrades(res.data);
      } catch (error) {
        console.error('Failed to load grades', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) return <div className="text-center mt-12 text-secondary">Đang tải bảng điểm...</div>;

  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="mb-2">📊 Bảng điểm học tập</h1>
          <p className="text-secondary">
            {isTeacher 
              ? 'Danh sách điểm số của các sinh viên thuộc lớp học bạn giảng dạy.' 
              : `Báo cáo điểm số các bài kiểm tra và bài tập của bạn.`}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {grades.length === 0 ? (
          <div className="text-center text-secondary py-8">Chưa có thông tin điểm số nào được ghi nhận.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  {isTeacher && <th>Sinh viên</th>}
                  <th>Lớp học</th>
                  <th>Bài kiểm tra/Bài tập</th>
                  <th>Phân loại</th>
                  <th>Điểm số</th>
                  <th>Ngày nộp</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {isTeacher && <td style={{ fontWeight: 600 }}>{item.studentName || '---'}</td>}
                    <td>{item.className}</td>
                    <td>{item.title}</td>
                    <td>
                      <span 
                        className={`badge ${item.source === 'Trắc nghiệm' ? 'badge-success' : 'badge-danger'}`}
                        style={{
                          backgroundColor: item.source === 'Trắc nghiệm' ? '#e0f2fe' : '#fef3c7',
                          color: item.source === 'Trắc nghiệm' ? '#0369a1' : '#b45309',
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600
                        }}
                      >
                        {item.source}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--primary-color)' }}>
                      {item.score}
                    </td>
                    <td className="text-secondary" style={{ fontSize: '0.9rem' }}>
                      {new Date(item.date).toLocaleDateString('vi-VN')} {new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradesPage;
