import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface ClassItem {
  id: number;
  name: string;
  description?: string;
  teacher: { id: number; fullName: string };
  studentCount: number;
}

const AdminPanel: React.FC = () => {
    const navigate = useNavigate();
    const [showUserModal, setShowUserModal] = useState(false);
    const [showClassModal, setShowClassModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showClassListModal, setShowClassListModal] = useState(false);

    // Form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Student');

    const [className, setClassName] = useState('');
    const [classDesc, setClassDesc] = useState('');
    const [teacherId, setTeacherId] = useState('');

    const [siteName, setSiteName] = useState('Elearning HCMUS');
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    // === State quản lý lớp ===
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
    const [editClassName, setEditClassName] = useState('');
    const [editClassDesc, setEditClassDesc] = useState('');
    const [editTeacherId, setEditTeacherId] = useState('');
    const [teachers, setTeachers] = useState<any[]>([]);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data);
        } catch (error) {
            console.error('Failed to fetch classes', error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/auth/users');
            setTeachers(res.data.filter((u: any) => u.role === 'Teacher'));
        } catch (error) {
            console.error('Failed to fetch teachers', error);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (showClassListModal) fetchClasses();
    }, [showClassListModal]);

    const openEditClass = (c: ClassItem) => {
        setEditingClass(c);
        setEditClassName(c.name);
        setEditClassDesc(c.description || '');
        setEditTeacherId(String(c.teacher?.id || ''));
    };

    const handleEditClassSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClass) return;
        try {
            await api.put(`/classes/${editingClass.id}`, {
                name: editClassName,
                description: editClassDesc,
                teacherId: parseInt(editTeacherId)
            });
            alert('Cập nhật lớp thành công!');
            setEditingClass(null);
            fetchClasses();
        } catch (error: any) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Không thể cập nhật'));
        }
    };

    const handleDeleteClass = async (c: ClassItem) => {
        if (!window.confirm(`Xóa lớp "${c.name}"? Thao tác này không thể hoàn tác!`)) return;
        try {
            await api.delete(`/classes/${c.id}`);
            alert('Đã xóa lớp!');
            fetchClasses();
        } catch (error: any) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Không thể xóa'));
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', { fullName, email, password, role });
            alert('Tạo tài khoản thành công!');
            setShowUserModal(false);
            setFullName(''); setEmail(''); setPassword('');
        } catch (error: any) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Không thể tạo tài khoản'));
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/classes', { name: className, description: classDesc, teacherId: parseInt(teacherId) });
            alert('Tạo khóa học thành công!');
            setShowClassModal(false);
            setClassName(''); setClassDesc(''); setTeacherId('');
        } catch (error: any) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Không thể tạo khóa học'));
        }
    };

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Đã lưu cấu hình hệ thống!');
        setShowSettingsModal(false);
    };

    return (
        <div>
            <h2 className="section-title mb-6">Bảng điều khiển Quản trị viên</h2>
            <div className="card">
                <p className="text-secondary mb-4">Quản lý người dùng, khóa học và cài đặt hệ thống.</p>
                <div className="grid-cols-3">
                    <div className="course-card text-center">
                        <h3 className="course-card-title mb-2">Quản lý Tài khoản</h3>
                        <p className="text-secondary text-sm mb-4">Cấp tài khoản cho Sinh viên hoặc Giảng viên</p>
                        <div className="flex gap-2 justify-center">
                            <button className="btn btn-outline" onClick={() => navigate('/admin/users')}>Xem danh sách</button>
                            <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>Tạo mới</button>
                        </div>
                    </div>
                    <div className="course-card text-center">
                        <h3 className="course-card-title mb-2">Quản lý Khóa học</h3>
                        <p className="text-secondary text-sm mb-4">Mở lớp học và gán giảng viên phụ trách</p>
                        <div className="flex gap-2 justify-center">
                            <button className="btn btn-outline" onClick={() => setShowClassListModal(true)}>Xem / Sửa lớp</button>
                            <button className="btn btn-primary" onClick={() => setShowClassModal(true)}>Tạo mới</button>
                        </div>
                    </div>
                    <div className="course-card text-center">
                        <h3 className="course-card-title mb-2">Cài đặt Hệ thống</h3>
                        <p className="text-secondary text-sm mb-4">Cấu hình chung hệ thống</p>
                        <button className="btn btn-outline" onClick={() => setShowSettingsModal(true)}>Thiết lập</button>
                    </div>
                </div>
            </div>

            {/* User Modal */}
            {showUserModal && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div className="modal-content" style={modalContentStyle}>
                        <h3>Tạo Tài khoản mới</h3>
                        <form onSubmit={handleCreateUser} className="flex flex-col gap-4 mt-4">
                            <input type="text" placeholder="Họ và tên" className="form-input" required value={fullName} onChange={e => setFullName(e.target.value)} />
                            <input type="email" placeholder="Email" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
                            <input type="password" placeholder="Mật khẩu" className="form-input" required value={password} onChange={e => setPassword(e.target.value)} />
                            <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                                <option value="Student">Sinh viên</option>
                                <option value="Teacher">Giảng viên</option>
                                <option value="Admin">Quản trị viên</option>
                            </select>
                            <div className="flex gap-2 justify-end mt-2">
                                <button type="button" className="btn btn-outline" onClick={() => setShowUserModal(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Class Modal */}
            {showClassModal && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div className="modal-content" style={modalContentStyle}>
                        <h3>Tạo Khóa học mới</h3>
                        <form onSubmit={handleCreateClass} className="flex flex-col gap-4 mt-4">
                            <input type="text" placeholder="Tên môn học (vd: CQ K2024)" className="form-input" required value={className} onChange={e => setClassName(e.target.value)} />
                            <textarea placeholder="Mô tả môn học" className="form-input" required value={classDesc} onChange={e => setClassDesc(e.target.value)} />
                            <select className="form-input" required value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                                <option value="">-- Chọn Giảng viên --</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.fullName} ({t.userCode})</option>
                                ))}
                            </select>
                            <div className="flex gap-2 justify-end mt-2">
                                <button type="button" className="btn btn-outline" onClick={() => setShowClassModal(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div className="modal-content" style={modalContentStyle}>
                        <h3>Cài đặt Hệ thống</h3>
                        <form onSubmit={handleSaveSettings} className="flex flex-col gap-4 mt-4">
                            <div>
                                <label className="text-secondary text-sm block mb-1">Tên nền tảng</label>
                                <input type="text" className="form-input" required value={siteName} onChange={e => setSiteName(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input type="checkbox" id="maintenance" checked={maintenanceMode} onChange={e => setMaintenanceMode(e.target.checked)} />
                                <label htmlFor="maintenance">Bật Chế độ Bảo trì</label>
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => setShowSettingsModal(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal danh sách lớp - Sửa / Xóa */}
            {showClassListModal && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div className="modal-content" style={{ ...modalContentStyle, minWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3>Danh sách Khóa học</h3>
                            <button className="btn btn-outline" style={{ padding: '4px 12px' }} onClick={() => setShowClassListModal(false)}>✕ Đóng</button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                                <tr>
                                    <th style={{ padding: '0.75rem' }}>Tên lớp</th>
                                    <th style={{ padding: '0.75rem' }}>Giảng viên</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Số HV</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có lớp nào</td></tr>
                                ) : classes.map((c, i) => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: i % 2 === 0 ? 'white' : 'var(--bg-secondary)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{c.name}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{c.teacher?.fullName || '—'}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{c.studentCount}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                                                    onClick={() => { openEditClass(c); }}
                                                >Sửa</button>
                                                <button
                                                    className="btn"
                                                    style={{ padding: '4px 10px', fontSize: '0.82rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                    onClick={() => handleDeleteClass(c)}
                                                >Xóa</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Sửa lớp */}
            {editingClass && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div className="modal-content" style={modalContentStyle}>
                        <h3>Chỉnh sửa Khóa học</h3>
                        <form onSubmit={handleEditClassSubmit} className="flex flex-col gap-4 mt-4">
                            <input type="text" placeholder="Tên môn học" className="form-input" required value={editClassName} onChange={e => setEditClassName(e.target.value)} />
                            <textarea placeholder="Mô tả" className="form-input" value={editClassDesc} onChange={e => setEditClassDesc(e.target.value)} />
                            <select className="form-input" required value={editTeacherId} onChange={e => setEditTeacherId(e.target.value)}>
                                <option value="">-- Chọn Giảng viên --</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.fullName} ({t.userCode})</option>
                                ))}
                            </select>
                            <div className="flex gap-2 justify-end mt-2">
                                <button type="button" className="btn btn-outline" onClick={() => setEditingClass(null)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
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
    backgroundColor: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

export default AdminPanel;
