import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { User } from '../types';

// DTO cho chỉnh sửa người dùng
interface UpdateUserForm {
  fullName: string;
  email: string;
  role: string;
}

const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Teacher' | 'Student'>('All');

  // === State cho Sửa / Xóa ===
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserForm>({ fullName: '', email: '', role: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({ fullName: user.fullName || user.name || '', email: user.email, role: user.role });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      await api.put(`/auth/users/${editingUser.id}`, editForm);
      alert('Cập nhật thành công!');
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể cập nhật'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa tài khoản "${user.fullName || user.name}"?`)) return;
    try {
      await api.delete(`/auth/users/${user.id}`);
      alert('Đã xóa tài khoản!');
      fetchUsers();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể xóa'));
    }
  };

  const filteredUsers = users.filter(u => {
    if (activeTab === 'All') return true;
    return u.role === activeTab;
  });

  const getRoleBadge = (role: string) => {
    if (role === 'Admin') return <span className="badge badge-danger" style={{ backgroundColor: '#dc3545', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Quản trị viên</span>;
    if (role === 'Teacher') return <span className="badge badge-primary" style={{ backgroundColor: '#0d6efd', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Giảng viên</span>;
    return <span className="badge badge-success" style={{ backgroundColor: '#198754', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Sinh viên</span>;
  };

  if (loading) return <div className="text-center mt-12 text-secondary">Đang tải danh sách người dùng...</div>;

  return (
    <div>
      <h2 className="section-title mb-6">Quản lý Người dùng</h2>
      
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'All' ? 'active' : ''}`}
          onClick={() => setActiveTab('All')}
        >
          Tất cả ({users.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'Teacher' ? 'active' : ''}`}
          onClick={() => setActiveTab('Teacher')}
        >
          Giảng viên ({users.filter(u => u.role === 'Teacher').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'Student' ? 'active' : ''}`}
          onClick={() => setActiveTab('Student')}
        >
          Học viên ({users.filter(u => u.role === 'Student').length})
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Mã số</th>
              <th style={{ padding: '1rem' }}>Họ và tên</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Vai trò</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-secondary" style={{ padding: '2rem' }}>Không có dữ liệu</td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: index % 2 === 0 ? 'white' : 'var(--bg-secondary)' }}>
                  <td style={{ padding: '1rem' }}>{user.userCode || user.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{user.fullName || user.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td style={{ padding: '1rem' }}>{getRoleBadge(user.role)}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div className="flex gap-2 justify-center">
                      <button
                        className="btn btn-outline"
                        style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                        onClick={() => openEditModal(user)}
                      >Sửa</button>
                      <button
                        className="btn"
                        style={{ padding: '4px 12px', fontSize: '0.85rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => handleDelete(user)}
                      >Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Sửa người dùng */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', minWidth: '420px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Chỉnh sửa tài khoản</h3>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-secondary text-sm block mb-1">Họ và tên</label>
                <input type="text" className="form-input" required value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
              </div>
              <div>
                <label className="text-secondary text-sm block mb-1">Email</label>
                <input type="email" className="form-input" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="text-secondary text-sm block mb-1">Vai trò</label>
                <select className="form-input" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="Student">Sinh viên</option>
                  <option value="Teacher">Giảng viên</option>
                  <option value="Admin">Quản trị viên</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListPage;
