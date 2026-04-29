import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getAssetUrl } from '../services/api';
import { Assignment, Submission } from '../types';
import { useAuth } from '../contexts/AuthContext';

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
                            <p className="text-secondary">Hạn nộp: {new Date(assignment.dueDate).toLocaleString('vi-VN')}</p>
                        </div>
                        {assignment.hasSubmitted && <span className="badge badge-success">Đã nộp</span>}
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-3">Yêu cầu bài tập:</h3>
                        <div className="p-4 bg-white/50 rounded-lg whitespace-pre-line border border-white/20">
                            {assignment.description}
                        </div>
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
                                        <p className="text-sm text-secondary">Thời gian: {new Date(mySubmission.submittedAt).toLocaleString('vi-VN')}</p>
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
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allSubmissions.map(sub => (
                                                <tr key={sub.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                                    <td className="py-3 px-4">{sub.student?.userCode || sub.student?.id}</td>
                                                    <td className="py-3 px-4 font-medium">{sub.student?.fullName}</td>
                                                    <td className="py-3 px-4 text-sm text-secondary">{new Date(sub.submittedAt).toLocaleString('vi-VN')}</td>
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
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AssignmentDetailPage;
