import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getAssetUrl } from '../services/api';
import { Assignment, Submission } from '../types';
import { useAuth } from '../contexts/AuthContext';

const getRemainingTimeText = (dueDateStr: string): string => {
  const diffMs = new Date(dueDateStr).getTime() - new Date().getTime();
  const isOverdue = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const diffSecs = Math.floor(absDiff / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (isOverdue) {
    if (diffDays > 0) return `Đã quá hạn ${diffDays} ngày`;
    if (diffHours > 0) return `Đã quá hạn ${diffHours} giờ`;
    if (diffMins > 0) return `Đã quá hạn ${diffMins} phút`;
    return 'Đã quá hạn';
  } else {
    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      return `Còn ${diffDays} ngày ${remainingHours} giờ`;
    }
    if (diffHours > 0) {
      const remainingMins = diffMins % 60;
      return `Còn ${diffHours} giờ ${remainingMins} phút`;
    }
    if (diffMins > 0) return `Còn ${diffMins} phút`;
    return 'Hết thời gian nộp';
  }
};

const AssignmentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isTeacher } = useAuth();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [mySubmission, setMySubmission] = useState<Submission | null>(null);
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [gradingSub, setGradingSub] = useState<Submission | null>(null);
    const [gradeVal, setGradeVal] = useState<string>('');
    const [feedbackVal, setFeedbackVal] = useState<string>('');
    const [gradingLoading, setGradingLoading] = useState(false);

    const loadData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await api.get(`/assignments/${id}`);
            setAssignment(res.data);

            if (isTeacher) {
                const subRes = await api.get(`/submissions/assignment/${id}`);
                setAllSubmissions(subRes.data);
            } else {
                try {
                    const mySubRes = await api.get(`/submissions/assignment/${id}/my`);
                    setMySubmission(mySubRes.data);
                } catch (e) {
                    // Chưa nộp bài
                    setMySubmission(null);
                }
            }
        } catch (error) {
            console.error("Failed to load assignment detail", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        loadData(true);
    }, [id, isTeacher]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setSubmitting(true);
        const formData = new FormData();
        
        try {
            if (mySubmission) {
                // Cập nhật
                formData.append('file', selectedFile);
                await api.put(`/submissions/${mySubmission.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Cập nhật bài nộp thành công!");
            } else {
                // Nộp mới
                formData.append('assignmentId', id!);
                formData.append('file', selectedFile);
                await api.post(`/submissions`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Nộp bài thành công!");
            }
            // Reset selection and refresh data without hard reload
            setSelectedFile(null);
            loadData(false);
        } catch (error: any) {
            alert("Lỗi: " + (error.response?.data?.message || "Không thể nộp bài"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gradingSub) return;
        const parsedGrade = parseFloat(gradeVal);
        if (isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 10) {
            alert('Điểm số phải là số từ 0 đến 10');
            return;
        }
        setGradingLoading(true);
        try {
            await api.post(`/submissions/${gradingSub.id}/grade`, {
                grade: parsedGrade,
                feedback: feedbackVal
            });
            alert('Chấm điểm thành công!');
            setGradingSub(null);
            loadData(false);
        } catch (error: any) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Không thể lưu điểm'));
        } finally {
            setGradingLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-12">Đang tải...</div>;
    if (!assignment) return <div className="text-center mt-12">Không tìm thấy bài tập.</div>;

    return (
        <div className="page-container">
            <main className="max-w-4xl mx-auto py-8 px-4">
                <button onClick={() => navigate(-1)} className="mb-6 text-primary hover:underline flex items-center gap-2">
                    ← Quay lại lớp học
                </button>

                <div className="glass-panel p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
                            <p className="text-secondary">
                                Hạn nộp: {new Date(assignment.dueDate).toLocaleString('vi-VN')}
                                <span style={{ 
                                    marginLeft: '10px', 
                                    fontWeight: 'bold', 
                                    color: new Date(assignment.dueDate).getTime() - new Date().getTime() < 0 ? '#dc3545' : '#10b981' 
                                }}>
                                    ⏱️ ({getRemainingTimeText(assignment.dueDate)})
                                </span>
                            </p>
                        </div>
                        {assignment.hasSubmitted && <span className="badge badge-success">Đã nộp</span>}
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-3">Yêu cầu bài tập:</h3>
                        <div className="p-4 bg-white/50 rounded-lg whitespace-pre-line border border-white/20 mb-3">
                            {assignment.description}
                        </div>
                        {assignment.filePath && (
                            <div className="mt-2">
                                <a 
                                    href={getAssetUrl(assignment.filePath) ?? '#'} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn btn-outline flex items-center gap-2"
                                    style={{ display: 'inline-flex', padding: '6px 12px' }}
                                >
                                    📁 Tải tệp đính kèm bài tập: {assignment.fileName}
                                </a>
                            </div>
                        )}
                    </div>

                    <hr className="my-8 border-white/20" />

                    {!isTeacher ? (
                        <div>
                            <h3 className="text-xl font-semibold mb-4">
                                {mySubmission ? "Bài nộp của bạn" : "Nộp bài"}
                            </h3>
                                                        {mySubmission && (
                                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">File đã nộp: {mySubmission.fileName}</p>
                                        <p className="text-sm text-secondary">
                                            Thời gian: {' '}
                                            <span style={{ 
                                                color: new Date(mySubmission.submittedAt) > new Date(assignment.dueDate) ? '#dc3545' : 'inherit', 
                                                fontWeight: new Date(mySubmission.submittedAt) > new Date(assignment.dueDate) ? 'bold' : 'normal' 
                                            }}>
                                                {new Date(mySubmission.submittedAt).toLocaleString('vi-VN')}
                                                {new Date(mySubmission.submittedAt) > new Date(assignment.dueDate) && (
                                                    <span style={{ marginLeft: '6px', fontSize: '0.75rem', backgroundColor: '#f8d7da', color: '#721c24', padding: '2px 6px', borderRadius: '4px' }}>Nộp trễ</span>
                                                )}
                                            </span>
                                        </p>
                                        {mySubmission.grade !== null && mySubmission.grade !== undefined && (
                                            <div className="mt-3 p-3 bg-white/40 rounded-lg border border-green-500/20">
                                                <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                                    💯 Điểm số: <span style={{ fontSize: '1.2rem', color: '#10b981' }}>{mySubmission.grade}</span> / 10
                                                </p>
                                                {mySubmission.feedback && (
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                        💬 Nhận xét: {mySubmission.feedback}
                                                     </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <a 
                                        href={getAssetUrl(mySubmission.filePath) ?? '#'} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="btn btn-outline py-1 px-3 text-sm"
                                    >
                                        Xem file
                                    </a>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="p-6 border-2 border-dashed border-white/30 rounded-xl text-center hover:border-primary/50 transition-colors">
                                    <input 
                                        type="file" 
                                        id="fileInput" 
                                        className="hidden" 
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                                    />
                                    <label htmlFor="fileInput" className="cursor-pointer">
                                        <div className="text-4xl mb-2">📁</div>
                                        <p className="text-lg font-medium">{selectedFile ? selectedFile.name : "Chọn file bài làm (PDF, Word, Zip...)"}</p>
                                        <p className="text-sm text-secondary">Dung lượng tối đa 20MB</p>
                                    </label>
                                </div>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-full py-3 text-lg font-semibold"
                                    disabled={!selectedFile || submitting}
                                >
                                    {submitting ? "Đang xử lý..." : (mySubmission ? "Cập nhật bài nộp" : "Nộp bài ngay")}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Danh sách bài nộp ({allSubmissions.length})</h3>
                            {allSubmissions.length === 0 ? (
                                <p className="text-secondary text-center py-8">Chưa có học sinh nào nộp bài.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/20">
                                                <th className="py-3 px-4">Mã số</th>
                                                <th className="py-3 px-4">Học sinh</th>
                                                <th className="py-3 px-4">Thời gian nộp</th>
                                                <th className="py-3 px-4">File bài làm</th>
                                                <th className="py-3 px-4">Điểm số</th>
                                                <th className="py-3 px-4">Nhận xét</th>
                                                <th className="py-3 px-4 text-center">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allSubmissions.map(sub => {
                                                const isLate = new Date(sub.submittedAt) > new Date(assignment.dueDate);
                                                return (
                                                    <tr key={sub.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                                        <td className="py-3 px-4">{sub.student?.userCode || sub.student?.id}</td>
                                                        <td className="py-3 px-4 font-medium">
                                                            <Link to={`/profile/${sub.student?.id}`} className="text-primary hover:underline">
                                                                {sub.student?.fullName}
                                                            </Link>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-secondary">
                                                            <span style={{ 
                                                                color: isLate ? '#dc3545' : 'inherit', 
                                                                fontWeight: isLate ? 'bold' : 'normal' 
                                                            }}>
                                                                {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                                                                {isLate && (
                                                                    <span style={{ marginLeft: '6px', fontSize: '0.75rem', backgroundColor: '#f8d7da', color: '#721c24', padding: '2px 6px', borderRadius: '4px' }}>Nộp trễ</span>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <a 
                                                                href={getAssetUrl(sub.filePath) ?? '#'} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="text-primary hover:underline font-medium"
                                                            >
                                                                {sub.fileName}
                                                            </a>
                                                        </td>
                                                        <td className="py-3 px-4 font-bold" style={{ color: sub.grade !== null ? '#10b981' : 'var(--text-secondary)' }}>
                                                            {sub.grade !== null && sub.grade !== undefined ? `${sub.grade} / 10` : '---'}
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-secondary" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {sub.feedback || '---'}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <button 
                                                                className="btn btn-primary"
                                                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                                onClick={() => {
                                                                    setGradingSub(sub);
                                                                    setGradeVal(sub.grade !== null && sub.grade !== undefined ? String(sub.grade) : '');
                                                                    setFeedbackVal(sub.feedback || '');
                                                                }}
                                                            >
                                                                📝 Chấm điểm
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Chấm điểm */}
            {gradingSub && (
                <div 
                    className="modal-overlay" 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <div 
                        className="modal-content" 
                        style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            width: '90%',
                            maxWidth: '450px',
                            boxShadow: 'var(--shadow-lg)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <h3 className="mb-2" style={{ color: 'var(--primary-color)' }}>📝 Chấm bài nộp</h3>
                        <p className="text-secondary text-sm mb-4">
                            Học sinh: <strong>{gradingSub.student?.fullName}</strong> ({gradingSub.student?.userCode})
                        </p>
                        <form onSubmit={handleSaveGrade} className="flex flex-col gap-4">
                            <div>
                                <label className="text-secondary text-sm mb-1 block">Điểm số (Thang điểm 10)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0" 
                                    max="10" 
                                    required 
                                    className="form-input" 
                                    placeholder="Ví dụ: 8.5"
                                    value={gradeVal}
                                    onChange={e => setGradeVal(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-secondary text-sm mb-1 block">Nhận xét của Giáo viên</label>
                                <textarea 
                                    className="form-input" 
                                    rows={4} 
                                    placeholder="Nhập nhận xét hoặc feedback..."
                                    value={feedbackVal}
                                    onChange={e => setFeedbackVal(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 justify-end mt-2">
                                <button type="button" className="btn btn-outline" onClick={() => setGradingSub(null)}>Hủy</button>
                                <button type="submit" className="btn btn-primary" disabled={gradingLoading}>
                                    {gradingLoading ? 'Đang lưu...' : 'Lưu điểm số'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentDetailPage;
