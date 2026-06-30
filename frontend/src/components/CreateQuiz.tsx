import React, { useState } from 'react';
import api from '../services/api';

interface QuestionInput {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
}

interface CreateQuizProps {
  classId: string;
  onClose: () => void;
}

const CreateQuiz: React.FC<CreateQuizProps> = ({ classId, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(15);
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' }
  ]);
  const [saving, setSaving] = useState(false);

  const handleQuestionChange = (index: number, field: keyof QuestionInput, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.some(q => !q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD)) {
      alert('Vui lòng điền đầy đủ câu hỏi và tất cả các đáp án lựa chọn!');
      return;
    }
    
    setSaving(true);
    try {
      await api.post('/quizzes', {
        title,
        description,
        classId: parseInt(classId),
        timeLimitMinutes: timeLimit,
        questions: questions
      });
      alert('Tạo đề trắc nghiệm thành công!');
      onClose();
    } catch (error: any) {
      console.error('Failed to create quiz', error);
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể tạo bài trắc nghiệm'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card mt-4" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <div className="flex justify-between items-center mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h3 className="section-title mb-0" style={{ fontSize: '1.4rem' }}>Soạn đề thi trắc nghiệm mới</h3>
        <button className="btn btn-outline" onClick={onClose} disabled={saving}>Hủy</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Quiz metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="text-secondary text-sm block mb-1 font-semibold">Tiêu đề bài thi *</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              placeholder="VD: Kiểm tra giữa kỳ môn Toán" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="text-secondary text-sm block mb-1 font-semibold">Mô tả bài thi (nếu có)</label>
            <textarea 
              className="form-input" 
              rows={2} 
              placeholder="VD: Đề thi gồm 10 câu hỏi bao trùm kiến thức chương 1" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-secondary text-sm block mb-1 font-semibold">Thời gian làm bài (Phút) *</label>
            <input 
              type="number" 
              className="form-input" 
              min={1} 
              max={180} 
              required 
              value={timeLimit} 
              onChange={e => setTimeLimit(parseInt(e.target.value) || 15)} 
            />
          </div>
        </div>

        {/* Questions list */}
        <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h4 className="mb-4" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', fontWeight: 600 }}>
            Danh sách câu hỏi ({questions.length} câu)
          </h4>

          {questions.map((q, idx) => (
            <div 
              key={idx} 
              className="mb-6 p-4" 
              style={{ border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm" style={{ color: 'var(--primary-color)' }}>Câu số {idx + 1}</span>
                {questions.length > 1 && (
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 10px', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => handleRemoveQuestion(idx)}
                  >
                    Xóa câu này
                  </button>
                )}
              </div>

              {/* Question text */}
              <div className="mb-3">
                <label className="text-secondary text-xs block mb-1">Nội dung câu hỏi *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="Nhập câu hỏi..." 
                  value={q.questionText} 
                  onChange={e => handleQuestionChange(idx, 'questionText', e.target.value)} 
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-secondary text-xs block mb-1">Đáp án A *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Đáp án A" 
                    value={q.optionA} 
                    onChange={e => handleQuestionChange(idx, 'optionA', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-secondary text-xs block mb-1">Đáp án B *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Đáp án B" 
                    value={q.optionB} 
                    onChange={e => handleQuestionChange(idx, 'optionB', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-secondary text-xs block mb-1">Đáp án C *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Đáp án C" 
                    value={q.optionC} 
                    onChange={e => handleQuestionChange(idx, 'optionC', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-secondary text-xs block mb-1">Đáp án D *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Đáp án D" 
                    value={q.optionD} 
                    onChange={e => handleQuestionChange(idx, 'optionD', e.target.value)} 
                  />
                </div>
              </div>

              {/* Correct option */}
              <div>
                <label className="text-secondary text-xs block mb-1 font-semibold">Đáp án đúng *</label>
                <select 
                  className="form-input" 
                  style={{ maxWidth: '120px' }}
                  value={q.correctOption} 
                  onChange={e => handleQuestionChange(idx, 'correctOption', e.target.value)}
                >
                  <option value="A">Đáp án A</option>
                  <option value="B">Đáp án B</option>
                  <option value="C">Đáp án C</option>
                  <option value="D">Đáp án D</option>
                </select>
              </div>
            </div>
          ))}

          <button 
            type="button" 
            className="btn btn-outline w-full mb-6" 
            style={{ borderStyle: 'dashed', borderWidth: '2px', padding: '10px' }}
            onClick={handleAddQuestion}
          >
            + Thêm câu hỏi trắc nghiệm
          </button>
        </div>

        {/* Form actions */}
        <div className="flex gap-2 justify-end pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu đề thi...' : '💾 Lưu và phát đề thi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;
