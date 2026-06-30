import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface BugReport {
  id: number;
  title: string;
  description: string;
  severity: string;
  createdAt: string;
  isResolved: boolean;
  reporterName: string;
  reporterCode?: string;
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Thấp');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (error) {
      console.error('Failed to load bug reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin báo cáo lỗi!');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/reports', { title, description, severity });
      alert('Báo cáo lỗi của bạn đã được gửi thành công đến Admin. Xin cảm ơn!');
      setTitle('');
      setDescription('');
      setSeverity('Thấp');
      fetchReports();
    } catch (error) {
      console.error('Failed to submit report', error);
      alert('Đã xảy ra lỗi khi gửi báo cáo. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveReport = async (id: number) => {
    if (!window.confirm('Đánh dấu lỗi này đã được xử lý/sửa đổi xong?')) return;
    try {
      await api.put(`/reports/${id}/resolve`);
      alert('Đã đánh dấu xử lý thành công!');
      fetchReports();
    } catch (error) {
      console.error('Failed to resolve report', error);
      alert('Không thể cập nhật trạng thái lỗi!');
    }
  };

  if (loading) return <div className="text-center mt-12 text-secondary">Đang tải danh sách báo cáo lỗi...</div>;

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="mb-2">🐞 Báo cáo lỗi hệ thống</h1>
          <p className="text-secondary">
            {isAdmin 
              ? 'Trang quản trị tiếp nhận và xử lý các lỗi kỹ thuật do học sinh & giáo viên báo cáo.'
              : 'Gửi báo cáo lỗi kỹ thuật trực tiếp cho Quản trị viên để cải thiện hệ thống.'}
          </p>
        </div>
      </div>

      <div className={isAdmin ? 'flex flex-col gap-6' : 'grid grid-cols-2 gap-6'} style={{ alignItems: 'flex-start' }}>
        {/* Left Side: Submit Form (Only for non-admins, or if admin wants to report too) */}
        {!isAdmin && (
          <div className="card" style={{ padding: '2rem', backgroundColor: 'white' }}>
            <h3 className="mb-4" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Gửi báo cáo lỗi mới</h3>
            <form onSubmit={handleSubmitReport} className="flex flex-col gap-4">
              <div className="form-group">
                <label>Tiêu đề lỗi *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="VD: Không nộp được bài tập PDF" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Mức độ ảnh hưởng *</label>
                <select 
                  className="form-control" 
                  value={severity} 
                  onChange={e => setSeverity(e.target.value)}
                >
                  <option value="Thấp">🟢 Thấp (Lỗi hiển thị nhẹ, không ảnh hưởng học tập)</option>
                  <option value="Trung bình">🟡 Trung bình (Chức năng lỗi nhưng có cách tránh)</option>
                  <option value="Cao">🔴 Cao (Lỗi nghiêm trọng, không thể học/nộp bài/thi)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Chi tiết lỗi & Cách tái hiện lỗi *</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  required 
                  placeholder="Vui lòng mô tả chi tiết: bạn làm gì thì lỗi xảy ra, lỗi hiển thị thế nào..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
                {submitting ? 'Đang gửi...' : '📤 Gửi báo cáo'}
              </button>
            </form>
          </div>
        )}

        {/* Right Side / Full Width (Admin): List of Reports */}
        <div className={isAdmin ? 'w-full card' : 'card'} style={{ padding: '2rem', backgroundColor: 'white', flex: 1 }}>
          <h3 className="mb-4" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            {isAdmin ? '📋 Danh sách báo cáo lỗi hệ thống' : '🕒 Lịch sử báo cáo của bạn'}
          </h3>

          {reports.length === 0 ? (
            <div className="text-center text-secondary py-8">Chưa có báo cáo lỗi nào được ghi nhận.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reports.map((report) => (
                <div 
                  key={report.id} 
                  style={{ 
                    padding: '1.2rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    backgroundColor: report.isResolved ? '#f0fdf4' : '#fffbeb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 className="mb-1" style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600 }}>{report.title}</h4>
                      <small className="text-secondary">
                        {isAdmin ? `Người gửi: ${report.reporterName} (${report.reporterCode})` : 'Đã gửi'} • {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                      </small>
                    </div>

                    <div className="flex gap-2 items-center">
                      {/* Severity badge */}
                      <span 
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: report.severity === 'Cao' ? '#ffe4e6' : report.severity === 'Trung bình' ? '#fef3c7' : '#f0fdf4',
                          color: report.severity === 'Cao' ? '#e11d48' : report.severity === 'Trung bình' ? '#d97706' : '#16a34a'
                        }}
                      >
                        {report.severity}
                      </span>

                      {/* Resolution badge */}
                      <span 
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: report.isResolved ? '#d1fae5' : '#fee2e2',
                          color: report.isResolved ? '#065f46' : '#991b1b'
                        }}
                      >
                        {report.isResolved ? '✅ Đã xử lý' : '⏳ Chờ xử lý'}
                      </span>
                    </div>
                  </div>

                  <p className="text-secondary mb-0" style={{ fontSize: '0.9rem', whiteSpace: 'pre-line', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    {report.description}
                  </p>

                  {isAdmin && !report.isResolved && (
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={() => handleResolveReport(report.id)} 
                        className="btn btn-outline" 
                        style={{ padding: '4px 10px', fontSize: '0.8rem', color: '#16a34a', borderColor: '#16a34a' }}
                      >
                        🔧 Đánh dấu đã sửa xong
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
