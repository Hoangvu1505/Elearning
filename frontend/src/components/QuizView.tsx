import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';

interface QuizQuestion {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface QuizDetails {
  id: number;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
}

interface QuizViewProps {
  quizId: number;
  onClose: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ quizId, onClose }) => {
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; correctCount: number; totalQuestions: number } | null>(null);
  
  const timerRef = useRef<any>(null);
  const quizRef = useRef<QuizDetails | null>(null);
  const answersRef = useRef<{ [questionId: number]: string }>({});

  // Keep references updated for the auto-submit interval
  useEffect(() => {
    quizRef.current = quiz;
  }, [quiz]);

  useEffect(() => {
    answersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  // Load quiz details
  const fetchQuizDetails = async () => {
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      setQuiz(res.data);
      setTimeLeft(res.data.timeLimitMinutes * 60);
    } catch (error) {
      console.error('Failed to load quiz details', error);
      alert('Không thể tải đề thi. Vui lòng thử lại!');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizDetails();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  // Countdown timer
  useEffect(() => {
    if (loading || !quiz || result) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Trigger Auto-submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, quiz, result]);

  const handleSelectOption = (questionId: number, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleAutoSubmit = () => {
    console.log('Time is up! Auto submitting...');
    submitAnswers(true);
  };

  const handleSubmitClick = () => {
    const unansweredCount = (quiz?.questions.length || 0) - Object.keys(selectedAnswers).length;
    let message = 'Bạn có chắc chắn muốn nộp bài kiểm tra này?';
    if (unansweredCount > 0) {
      message = `Bạn còn ${unansweredCount} câu chưa trả lời. ${message}`;
    }
    if (window.confirm(message)) {
      submitAnswers(false);
    }
  };

  const submitAnswers = async (isAuto: boolean = false) => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const payload = {
      answers: Object.keys(answersRef.current).map((qId) => ({
        questionId: parseInt(qId),
        selectedOption: answersRef.current[parseInt(qId)],
      })),
    };

    try {
      const res = await api.post(`/quizzes/${quizId}/submit`, payload);
      setResult(res.data);
      if (isAuto) {
        alert('Hết giờ làm bài! Hệ thống đã tự động nộp bài của bạn.');
      }
    } catch (error) {
      console.error('Failed to submit quiz', error);
      alert('Đã xảy ra lỗi khi nộp bài. Vui lòng liên hệ giáo viên!');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center mt-12 text-secondary">Đang tải đề kiểm tra...</div>;
  if (!quiz) return null;

  // Result screen
  if (result) {
    const isPass = result.score >= 5.0;
    return (
      <div className="card mt-4 text-center p-8" style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {result.score >= 8.0 ? '🎉' : isPass ? '👍' : '😢'}
        </div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Hoàn thành bài thi!</h2>
        <p className="text-secondary mb-6">{quiz.title}</p>
        
        <div 
          style={{ 
            display: 'inline-block', padding: '1.5rem 3rem', borderRadius: '12px', 
            backgroundColor: isPass ? '#e6fcf5' : '#fff5f5', 
            border: `2px solid ${isPass ? '#28a745' : '#dc3545'}`,
            marginBottom: '2rem'
          }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: isPass ? '#28a745' : '#dc3545' }}>
            {result.score} / 10
          </div>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Đúng {result.correctCount} trên tổng số {result.totalQuestions} câu hỏi
          </div>
        </div>

        <div>
          <button className="btn btn-primary w-full" onClick={onClose}>
            Quay lại lớp học
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const isLastQuestion = currentIdx === quiz.questions.length - 1;

  return (
    <div className="grid grid-cols-4 gap-6 mt-4">
      {/* Quiz Area (Left 3 columns) */}
      <div style={{ gridColumn: '1 / 4' }}>
        <div className="card" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-color)', marginBottom: '4px' }}>{quiz.title}</h3>
              <small className="text-secondary">Câu hỏi {currentIdx + 1} / {quiz.questions.length}</small>
            </div>
            {/* Timer */}
            <div 
              style={{ 
                padding: '8px 16px', borderRadius: '20px', 
                backgroundColor: timeLeft <= 60 ? '#fff5f5' : '#f1f3f5',
                color: timeLeft <= 60 ? '#dc3545' : 'var(--text-color)',
                fontWeight: 'bold', fontSize: '1.1rem',
                border: `1px solid ${timeLeft <= 60 ? '#dc3545' : 'transparent'}`
              }}
            >
              ⏱️ {formatTime(timeLeft)}
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <p style={{ fontSize: '1.15rem', fontWeight: 500, color: 'var(--text-color)', lineHeight: '1.5' }}>
              {currentQuestion?.questionText}
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 mb-8">
            {['A', 'B', 'C', 'D'].map((opt) => {
              const optionText = 
                opt === 'A' ? currentQuestion?.optionA :
                opt === 'B' ? currentQuestion?.optionB :
                opt === 'C' ? currentQuestion?.optionC :
                currentQuestion?.optionD;
              
              const isSelected = selectedAnswers[currentQuestion.id] === opt;

              return (
                <button
                  key={opt}
                  type="button"
                  className="flex items-center gap-3 w-full text-left p-4"
                  style={{
                    backgroundColor: isSelected ? 'rgba(0, 86, 179, 0.08)' : 'white',
                    border: `1px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 4px rgba(0, 86, 179, 0.1)' : 'none',
                  }}
                  onClick={() => handleSelectOption(currentQuestion.id, opt)}
                >
                  <span 
                    style={{
                      display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%',
                      alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                      backgroundColor: isSelected ? 'var(--primary-color)' : '#f1f3f5',
                      color: isSelected ? 'white' : 'var(--text-color)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {opt}
                  </span>
                  <span style={{ color: 'var(--text-color)' }}>{optionText}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className="btn btn-outline"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((p) => p - 1)}
            >
              ⬅️ Câu trước
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting}
                onClick={handleSubmitClick}
                style={{ backgroundColor: '#28a745', border: 'none' }}
              >
                {submitting ? 'Đang nộp bài...' : '🏁 Nộp bài thi'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCurrentIdx((p) => p + 1)}
              >
                Câu sau ➡️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Navigation Grid (Right 1 column) */}
      <div>
        <div className="card" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'sticky', top: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Bảng câu hỏi
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.5rem' }}>
            {quiz.questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isActive = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  type="button"
                  style={{
                    height: '36px',
                    borderRadius: '4px',
                    border: `1px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    backgroundColor: isActive 
                      ? 'rgba(0, 86, 179, 0.15)' 
                      : (isAnswered ? 'var(--primary-color)' : '#f1f3f5'),
                    color: isActive 
                      ? 'var(--primary-color)' 
                      : (isAnswered ? 'white' : 'var(--text-color)'),
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  onClick={() => setCurrentIdx(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="flex items-center gap-2">
              <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'var(--primary-color)', borderRadius: '2px' }}></span>
              <span>Đã làm ({Object.keys(selectedAnswers).length} câu)</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#f1f3f5', borderRadius: '2px', border: '1px solid var(--border-color)' }}></span>
              <span>Chưa làm ({quiz.questions.length - Object.keys(selectedAnswers).length} câu)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
