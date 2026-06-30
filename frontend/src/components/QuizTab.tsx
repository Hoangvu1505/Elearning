import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CreateQuiz from './CreateQuiz';
import QuizView from './QuizView';

interface QuizItem {
  id: number;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  createdAt: string;
  questionCount: number;
  hasSubmitted: boolean;
  studentScore?: number;
}

interface SubmissionItem {
  id: number;
  studentName: string;
  studentCode: string;
  score: number;
  submittedAt: string;
}

interface QuizTabProps {
  classId: string;
}

const QuizTab: React.FC<QuizTabProps> = ({ classId }) => {
  const { isTeacher } = useAuth();
  const isAdmin = useAuth().user?.role === 'Admin';
  const canManage = isTeacher || isAdmin;

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Views states
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [viewSubmissionsQuiz, setViewSubmissionsQuiz] = useState<QuizItem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quizzes/class/${classId}`);
      setQuizzes(res.data);
    } catch (error) {
      console.error('Failed to fetch quizzes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [classId]);

  const handleOpenSubmissions = async (quiz: QuizItem) => {
    setViewSubmissionsQuiz(quiz);
    setSubsLoading(true);
    try {
      const res = await api.get(`/quizzes/${quiz.id}/submissions`);
      setSubmissions(res.data);
    } catch (error) {
      console.error('Failed to fetch submissions', error);
      alert('Không thể lấy danh sách kết quả làm bài');
    } finally {
      setSubsLoading(false);
    }
  };

  if (activeQuizId !== null) {
    return (
      <QuizView 
        quizId={activeQuizId} 
        onClose={() => {
          setActiveQuizId(null);
          fetchQuizzes();
        }} 
      />
    );
  }

  if (showCreateQuiz) {
    return (
      <CreateQuiz 
        classId={classId} 
        onClose={() => {
          setShowCreateQuiz(false);
          fetchQuizzes();
        }} 
      />
    );
  }

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title mb-0">Bài trắc nghiệm trực tuyến</h2>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowCreateQuiz(true)}>
            + Soạn đề trắc nghiệm
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-secondary p-6">Đang tải danh sách đề thi...</div>
      ) : quizzes.length === 0 ? (
        <p className="text-secondary text-center p-6" style={{ border: '1px solid var(--border-color)', backgroundColor: 'white' }}>
          Chưa có bài trắc nghiệm nào trong lớp này.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div 
              key={quiz.id} 
              className="course-card flex flex-col h-full" 
              style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            >
              <div className="flex justify-between mb-2">
                <h3 className="course-card-title mb-0" style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}>{quiz.title}</h3>
                {quiz.hasSubmitted && (
                  <span className="badge badge-success" style={{ height: 'fit-content', padding: '4px 8px' }}>
                    Đã nộp bài
                  </span>
                )}
              </div>
              
              <p className="course-card-meta mb-4" style={{ flexGrow: 1, whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>
                {quiz.description || 'Không có mô tả.'}
              </p>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>⏱️ Thời gian: <strong>{quiz.timeLimitMinutes} phút</strong></div>
                <div>📝 Số câu hỏi: <strong>{quiz.questionCount} câu</strong></div>
                {quiz.hasSubmitted && quiz.studentScore !== undefined && (
                  <div style={{ color: 'var(--success-color)', fontWeight: 'bold', fontSize: '1rem', marginTop: '6px' }}>
                    💯 Điểm của bạn: {quiz.studentScore} / 10
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <small className="text-secondary">
                  Ngày tạo: {new Date(quiz.createdAt).toLocaleDateString('vi-VN')}
                </small>
                
                <div className="flex gap-2">
                  {canManage && (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleOpenSubmissions(quiz)}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      Bảng điểm
                    </button>
                  )}
                  
                  {!canManage && (
                    <button 
                      className={`btn ${quiz.hasSubmitted ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => {
                        if (!quiz.hasSubmitted) {
                          setActiveQuizId(quiz.id);
                        }
                      }}
                      disabled={quiz.hasSubmitted}
                      style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                    >
                      {quiz.hasSubmitted ? 'Hoàn thành' : 'Bắt đầu làm bài'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submissions Modal */}
      {viewSubmissionsQuiz && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={{ ...modalContentStyle, minWidth: '650px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              Bảng điểm: {viewSubmissionsQuiz.title}
            </h3>
            
            <div style={{ overflowY: 'auto', flexGrow: 1, marginBottom: '1.5rem' }}>
              {subsLoading ? (
                <div className="text-center text-secondary p-4">Đang tải bảng điểm...</div>
              ) : submissions.length === 0 ? (
                <div className="text-center text-secondary p-4">Chưa có học sinh nào nộp bài.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem' }}>Hạng</th>
                      <th style={{ padding: '0.75rem' }}>Mã học sinh</th>
                      <th style={{ padding: '0.75rem' }}>Họ và tên</th>
                      <th style={{ padding: '0.75rem' }}>Thời gian nộp</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Điểm số</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, index) => (
                      <tr 
                        key={sub.id} 
                        style={{ 
                          borderBottom: '1px solid var(--border-color)', 
                          backgroundColor: index === 0 ? '#fff9db' : (index % 2 === 0 ? 'white' : 'var(--bg-secondary)') 
                        }}
                      >
                        <td style={{ padding: '0.75rem', fontWeight: index < 3 ? 'bold' : 'normal' }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{sub.studentCode}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{sub.studentName}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: sub.score >= 5 ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '1.05rem' }}>
                          {sub.score} / 10
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-outline" onClick={() => setViewSubmissionsQuiz(null)}>
                Đóng
              </button>
            </div>
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
  backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
};

export default QuizTab;
