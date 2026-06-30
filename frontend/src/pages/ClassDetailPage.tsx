import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Class, Announcement, Assignment, Lecture } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getAssetUrl } from '../services/api';
import QuizTab from '../components/QuizTab';

// Thông tin học sinh trong lớp
interface EnrolledStudent {
  id: number;
  fullName: string;
  email: string;
  enrolledAt: string;
  userCode?: string;
}
const ClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isTeacher, user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [classData, setClassData] = useState<Class | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'announcements' | 'assignments' | 'members' | 'lectures' | 'quizzes'>('announcements');

  // === State quản lý thành viên ===
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const isAssignedTeacher = String(user?.id) === String(classData?.teacher?.id);
  const canManage = isAssignedTeacher || isAdmin;

  // Modals state
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);

  // Form states
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');

  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureContent, setLectureContent] = useState('');
  const [lectureFile, setLectureFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      const [classRes, announceRes, assignRes, lectureRes] = await Promise.all([
        api.get(`/classes/${id}`),
        api.get(`/classes/${id}/announcements`),
        api.get(`/classes/${id}/assignments`),
        api.get(`/classes/${id}/lectures`),
      ]);
      setClassData(classRes.data);
      setAnnouncements(announceRes.data);
      setAssignments(assignRes.data);
      setLectures(lectureRes.data);
    } catch (error) {
      console.error('Failed to fetch class data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setMembersLoading(true);
    try {
      const res = await api.get(`/classes/${id}/students`);
      setStudents(res.data);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentId) return;
    setEnrollLoading(true);
    try {
      // Gửi ID số thực tế cho Backend
      await api.post(`/classes/${id}/enroll`, { studentId: parseInt(enrollStudentId) });
      alert('Thêm học sinh thành công!');
      setEnrollStudentId('');
      fetchStudents();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể thêm học sinh'));
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (!window.confirm(`Xóa "${studentName}" khỏi lớp?`)) return;
    try {
      await api.delete(`/classes/${id}/students/${studentId}`);
      alert('Đã xóa khỏi lớp!');
      fetchStudents();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể xóa'));
    }
  };

  const handleDeleteAssignment = async (assignmentId: number, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${title}"? Tất cả bài nộp của học sinh cũng sẽ bị xóa.`)) return;
    try {
      await api.delete(`/classes/assignments/${assignmentId}`);
      alert('Xóa bài tập thành công!');
      fetchData();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể xóa bài tập'));
    }
  };

  const handleDeleteLecture = async (lectureId: number, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài giảng "${title}"?`)) return;
    try {
      await api.delete(`/classes/lectures/${lectureId}`);
      alert('Xóa bài giảng thành công!');
      fetchData();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể xóa bài giảng'));
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (classData && user) {
      console.log('DEBUG Permission Check:', {
        currentUserId: user.id,
        currentUserIdType: typeof user.id,
        teacherId: classData.teacher?.id,
        teacherIdType: typeof classData.teacher?.id,
        isMatch: String(user.id) === String(classData.teacher?.id),
        userRole: user.role
      });
    }
  }, [classData, user]);

  const fetchAllStudentsList = async () => {
    try {
      const usersRes = await api.get('/auth/users');
      const studentsOnly = usersRes.data.filter((u: any) => u.role === 'Student');
      setAllStudents(studentsOnly);
    } catch (error) {
      console.error('Failed to fetch all students list', error);
    }
  };

  // Tải danh sách học sinh khi chuyển sang tab Thành viên
  useEffect(() => {
    if (activeTab === 'members' && (isAdmin || isTeacher)) {
      fetchStudents();
      fetchAllStudentsList();
    }
  }, [activeTab]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/classes/${id}/announcements`, { title: announceTitle, content: announceContent });
      setShowAnnounceModal(false);
      setAnnounceTitle(''); setAnnounceContent('');
      fetchData(); // reload
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể tạo thông báo'));
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/classes/${id}/assignments`, { title: assignTitle, description: assignDesc, dueDate: assignDueDate });
      setShowAssignModal(false);
      setAssignTitle(''); setAssignDesc(''); setAssignDueDate('');
      fetchData(); // reload
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể tạo bài tập'));
    }
  };

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', lectureTitle);
    formData.append('content', lectureContent);
    if (lectureFile) {
      formData.append('file', lectureFile);
    }

    try {
      await api.post(`/classes/${id}/lectures`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowLectureModal(false);
      setLectureTitle(''); setLectureContent(''); setLectureFile(null);
      fetchData();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể tạo bài giảng'));
    }
  };

  if (loading) return <div className="text-center mt-12 text-secondary">Đang tải thông tin khóa học...</div>;

  return (
    <div>
      <div className="course-card mb-6" style={{ backgroundColor: 'white', padding: '2rem' }}>
        <h1 className="course-card-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{classData?.name}</h1>
        <p className="text-secondary mb-4">{classData?.description}</p>
        <div className="mt-4">
          <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Giảng viên: {' '}
            {classData?.teacher ? (
              <button
                onClick={() => navigate(`/profile/${classData.teacher.id}`)}
                className="btn-link"
                style={{
                  background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)',
                  textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                {classData.teacher.fullName}
              </button>
            ) : (
              <span style={{ color: 'var(--danger-color)' }}>Chưa cập nhật</span>
            )}
          </span>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          Thông báo
        </button>
        <button
          className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          Bài tập
        </button>
        <button
          className={`tab-btn ${activeTab === 'lectures' ? 'active' : ''}`}
          onClick={() => setActiveTab('lectures')}
        >
          Bài giảng
        </button>
        <button
          className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          Trắc nghiệm
        </button>
        {(isAdmin || isTeacher) && (
          <button
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Thành viên
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'announcements' && (
          <div>
            <div className="flex justify-between items-center mb-4 mt-4">
              <h2 className="section-title mb-0">Thông báo gần đây</h2>
              {canManage && <button className="btn btn-primary" onClick={() => setShowAnnounceModal(true)}>+ Tạo thông báo mới</button>}
            </div>
            {announcements.length === 0 ? (
              <p className="text-secondary text-center p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'white' }}>Chưa có thông báo nào.</p>
            ) : (
              announcements.map(a => (
                <div key={a.id} className="course-card mb-4">
                  <h3 className="course-card-title mb-2" style={{ color: 'var(--primary-color)' }}>{a.title}</h3>
                  <p className="course-card-meta mb-2" style={{ fontSize: '1rem', whiteSpace: 'pre-line' }}>{a.content}</p>
                  <small className="text-secondary">{new Date(a.createdAt).toLocaleString('vi-VN')}</small>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <div className="flex justify-between items-center mb-4 mt-4">
              <h2 className="section-title mb-0">Bài tập</h2>
              {canManage && <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>+ Tạo bài tập mới</button>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {assignments.length === 0 ? (
                <p className="text-secondary" style={{ gridColumn: '1 / -1', padding: '1rem' }}>Chưa có bài tập nào.</p>
              ) : (
                assignments.map(a => (
                  <div key={a.id} className="course-card flex flex-col h-full" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="flex justify-between mb-2">
                      <h3 className="course-card-title mb-0" style={{ color: 'var(--primary-color)' }}>{a.title}</h3>
                      <div className="flex gap-2 items-center">
                        {canManage && (
                          <button
                            className="btn"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => handleDeleteAssignment(a.id, a.title)}
                          >
                            Xóa
                          </button>
                        )}
                        {a.hasSubmitted && <span className="badge badge-success" style={{ height: 'fit-content' }}>Đã nộp</span>}
                      </div>
                    </div>
                    <p className="course-card-meta mb-4" style={{ flexGrow: 1, whiteSpace: 'pre-line' }}>{a.description}</p>
                    <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <small className="text-secondary" style={{ color: 'var(--danger-color)', fontWeight: 500 }}>
                        Hạn nộp: {new Date(a.dueDate).toLocaleDateString('vi-VN')}
                      </small>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/assignments/${a.id}`)}
                      >
                        {isTeacher ? 'Xem chi tiết' : (a.hasSubmitted ? 'Xem bài nộp' : 'Nộp bài')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'lectures' && (
          <div>
            <div className="flex justify-between items-center mb-4 mt-4">
              <h2 className="section-title mb-0">Bài giảng & Tài liệu</h2>
              {canManage && <button className="btn btn-primary" onClick={() => setShowLectureModal(true)}>+ Thêm bài giảng</button>}
            </div>
            {lectures.length === 0 ? (
              <p className="text-secondary text-center p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'white' }}>Chưa có bài giảng nào.</p>
            ) : (
              lectures.map(l => (
                <div key={l.id} className="course-card mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex gap-2 items-center mb-2">
                        <h3 className="course-card-title mb-0" style={{ color: 'var(--primary-color)' }}>{l.title}</h3>
                        {canManage && (
                          <button
                            className="btn"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => handleDeleteLecture(l.id, l.title)}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                      <p className="course-card-meta mb-2" style={{ fontSize: '1rem', whiteSpace: 'pre-line' }}>{l.content}</p>
                    </div>
                    {l.filePath && (
                      <a
                        href={getAssetUrl(l.filePath) || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                      >
                        Tải tài liệu: {l.fileName}
                      </a>
                    )}
                  </div>
                  <small className="text-secondary">{new Date(l.createdAt).toLocaleString('vi-VN')}</small>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'quizzes' && id && (
          <QuizTab classId={id} />
        )}

        {activeTab === 'members' && (isAdmin || isTeacher) && (
          <div>
            <div className="flex justify-between items-center mb-4 mt-4">
              <h2 className="section-title mb-0">Thành viên lớp</h2>
            </div>

            {isAdmin && (
              <div className="card mb-4" style={{ padding: '1rem' }}>
                <form onSubmit={handleEnrollStudent} className="flex gap-3 items-end">
                  <div style={{ flex: 1 }}>
                    <label className="text-secondary text-sm block mb-1">Thêm học sinh vào lớp (chọn từ danh sách)</label>
                    <select
                      className="form-input"
                      value={enrollStudentId}
                      onChange={e => setEnrollStudentId(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn học sinh --</option>
                      {allStudents
                        .filter(s => !students.some(enrolled => String(enrolled.id) === String(s.id)))
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.fullName} ({s.userCode || s.id})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={enrollLoading}>
                    {enrollLoading ? 'Đang thêm...' : '+ Thêm'}
                  </button>
                </form>
              </div>
            )}

            {membersLoading ? (
              <div className="text-center text-secondary" style={{ padding: '2rem' }}>Đang tải...</div>
            ) : students.length === 0 ? (
              <p className="text-secondary text-center" style={{ padding: '2rem', border: '1px solid var(--border-color)', backgroundColor: 'white' }}>Chưa có học sinh nào trong lớp.</p>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem' }}>Mã số</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Họ và tên</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Ngày tham gia</th>
                      {isAdmin && <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Hành động</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, index) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: index % 2 === 0 ? 'white' : 'var(--bg-secondary)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>{s.userCode || s.id}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{s.fullName}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{s.email}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{new Date(s.enrolledAt).toLocaleDateString('vi-VN')}</td>
                        {isAdmin && (
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <button
                              className="btn"
                              style={{ padding: '4px 12px', fontSize: '0.85rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => handleRemoveStudent(s.id, s.fullName)}
                            >Xóa khỏi lớp</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showAnnounceModal && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h3>Tạo Thông báo</h3>
            <form onSubmit={handleCreateAnnouncement} className="flex flex-col gap-4 mt-4">
              <input type="text" placeholder="Tiêu đề" className="form-input" required value={announceTitle} onChange={e => setAnnounceTitle(e.target.value)} />
              <textarea placeholder="Nội dung thông báo" className="form-input" rows={4} required value={announceContent} onChange={e => setAnnounceContent(e.target.value)} />
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-outline" onClick={() => setShowAnnounceModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thông báo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h3>Tạo Bài tập</h3>
            <form onSubmit={handleCreateAssignment} className="flex flex-col gap-4 mt-4">
              <input type="text" placeholder="Tiêu đề bài tập" className="form-input" required value={assignTitle} onChange={e => setAssignTitle(e.target.value)} />
              <textarea placeholder="Mô tả và yêu cầu" className="form-input" rows={4} required value={assignDesc} onChange={e => setAssignDesc(e.target.value)} />
              <div>
                <label className="text-secondary text-sm mb-1 block">Hạn nộp</label>
                <input type="datetime-local" className="form-input" required value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)} />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-outline" onClick={() => setShowAssignModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu bài tập</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLectureModal && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h3>Thêm Bài giảng mới</h3>
            <form onSubmit={handleCreateLecture} className="flex flex-col gap-4 mt-4">
              <input type="text" placeholder="Tiêu đề bài giảng" className="form-input" required value={lectureTitle} onChange={e => setLectureTitle(e.target.value)} />
              <textarea placeholder="Nội dung hoặc mô tả" className="form-input" rows={4} value={lectureContent} onChange={e => setLectureContent(e.target.value)} />
              <div>
                <label className="text-secondary text-sm mb-1 block">Tài liệu đính kèm (tùy chọn)</label>
                <input type="file" className="form-input" onChange={e => setLectureFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-outline" onClick={() => setShowLectureModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu bài giảng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'white', padding: '2rem', borderRadius: '8px', minWidth: '500px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

export default ClassDetailPage;