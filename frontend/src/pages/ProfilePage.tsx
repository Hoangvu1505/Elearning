import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { getAssetUrl } from '../services/api';

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userClasses, setUserClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mode = searchParams.get('mode') || 'view';

  useEffect(() => {
    setImgError(false);
  }, [profileUser]);

  const isOwnProfile = !id || String(id) === String(currentUser?.id);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        let userDetails = null;
        if (isOwnProfile) {
          userDetails = currentUser;
        } else {
          const res = await api.get(`/auth/users/${id}`);
          userDetails = res.data;
        }
        setProfileUser(userDetails);

        if (userDetails) {
          const classesRes = await api.get(`/classes/user/${userDetails.id}`);
          setUserClasses(classesRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile/classes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, currentUser]);

  // Đồng bộ hóa form khi profileUser data thay đổi
  useEffect(() => {
    if (profileUser) {
      setFullName(profileUser.fullName || '');
      setEmail(profileUser.email || '');
      setDateOfBirth(profileUser.dateOfBirth?.split('T')[0] || '');
    }
  }, [profileUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ảnh quá lớn, vui lòng chọn ảnh dưới 2MB');
        return;
      }
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setIsUpdating(true);
    const formData = new FormData();
    formData.append('file', avatarFile);
    try {
      await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      alert('Cập nhật ảnh đại diện thành công');
      setAvatarFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể tải ảnh lên'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.put('/profile', { 
        fullName, 
        email, 
        dateOfBirth: dateOfBirth || null // Gửi null nếu rỗng
      });
      await refreshUser();
      alert('Cập nhật thông tin thành công');
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể cập nhật hồ sơ'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="text-center mt-12">Đang tải hồ sơ...</div>;
  if (!profileUser) return <div className="text-center mt-12">Không tìm thấy người dùng</div>;

  const showEditMode = isOwnProfile && mode === 'edit';

  return (
    <div className="course-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2 className="section-title mb-6">
        {showEditMode ? '⚙️ Tùy chọn tài khoản' : isOwnProfile ? '👤 Hồ sơ cá nhân' : 'ℹ️ Thông tin thành viên'}
      </h2>
      
      <div className="flex items-center gap-6 mb-8 pb-8" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ position: 'relative' }}>
          <img 
            src={previewUrl || (!imgError && getAssetUrl(profileUser?.avatarUrl)) || 'https://ui-avatars.com/api/?background=4f46e5&color=fff&name=' + (profileUser?.fullName || profileUser?.name || 'U')} 
            alt="Avatar" 
            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
            onError={() => setImgError(true)}
          />
        </div>
        <div>
          <h3 className="mb-2" style={{ color: 'var(--text-primary)', fontSize: '1.25rem' }}>{profileUser?.fullName}</h3>
          <p className="text-secondary mb-4" style={{ fontSize: '0.875rem' }}>
            {profileUser?.role === 'Teacher' ? 'Giảng viên' : (profileUser?.role === 'Admin' ? 'Quản trị viên' : 'Sinh viên')} • MSSV/MSCB: {profileUser?.userCode}
          </p>
          {showEditMode && (
            <div className="flex gap-2">
              <input type="file" accept="image/*" onChange={handleAvatarChange} ref={fileInputRef} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline">Chọn ảnh mới</button>
              {avatarFile && (
                <button onClick={handleUploadAvatar} className="btn btn-primary" disabled={isUpdating}>
                  {isUpdating ? 'Đang tải...' : 'Tải lên'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showEditMode ? (
        // EDIT MODE: Chỉnh sửa trang cá nhân & Đổi mật khẩu
        <div className="grid-cols-2" style={{ gap: '2rem' }}>
          <div>
            <h3 className="mb-4" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Cập nhật thông tin</h3>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="form-group">
                <label>Họ và tên *</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Địa chỉ Email *</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Ngày sinh</label>
                <input 
                  type="date" 
                  value={dateOfBirth} 
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="form-control"
                />
              </div>
              <button type="submit" className="btn btn-primary mt-2" disabled={isUpdating}>
                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </div>

          <div>
            <h3 className="mb-4" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Đổi mật khẩu</h3>
            <ChangePasswordForm />
          </div>
        </div>
      ) : (
        // VIEW MODE: Chỉ hiện thông tin (Hồ sơ)
        <div className="grid-cols-2" style={{ gap: '2rem' }}>
          <div>
            <h3 className="mb-4" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Thông tin chi tiết</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Họ và tên</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-primary)' }}>{profileUser?.fullName || '---'}</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Địa chỉ Email</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-primary)' }}>{profileUser?.email || '---'}</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Ngày sinh</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {profileUser?.dateOfBirth ? new Date(profileUser.dateOfBirth).toLocaleDateString('vi-VN') : '---'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Lần đăng nhập cuối</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {profileUser?.lastLoginAt ? (
                    new Date(profileUser.lastLoginAt).toLocaleString('vi-VN')
                  ) : (
                    'Chưa ghi nhận đăng nhập'
                  )}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {profileUser?.role === 'Teacher' ? '🏫 Các khóa học đang giảng dạy' : '🏫 Các khóa học đã tham gia'} ({userClasses.length})
            </h3>
            {userClasses.length === 0 ? (
              <p className="text-secondary" style={{ fontSize: '0.95rem' }}>Chưa tham gia khóa học nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                {userClasses.map(c => (
                  <div 
                    key={c.id} 
                    className="card" 
                    style={{ 
                      padding: '1rem', 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/classes/${c.id}`)}
                  >
                    <h4 style={{ margin: '0 0 4px 0', color: 'var(--primary-color)', fontSize: '0.95rem', fontWeight: 600 }}>{c.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {c.description}
                    </p>
                    {profileUser?.role === 'Student' && c.teacher && (
                      <small style={{ display: 'block', marginTop: '6px', color: 'var(--text-secondary)' }}>
                        👤 GV: {c.teacher.fullName}
                      </small>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ChangePasswordForm: React.FC = () => {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirm) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await api.post('/profile/change-password', { currentPassword: current, newPassword: newPass });
      alert('Đổi mật khẩu thành công');
      setCurrent(''); setNewPass(''); setConfirm('');
    } catch (error: any) {
      console.error(error);
      alert('Lỗi: ' + (error.response?.data?.message || 'Mật khẩu hiện tại không đúng'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="form-group">
        <label>Mật khẩu hiện tại</label>
        <input type="password" value={current} onChange={e => setCurrent(e.target.value)} className="form-control" required />
      </div>
      <div className="form-group">
        <label>Mật khẩu mới</label>
        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="form-control" required />
      </div>
      <div className="form-group">
        <label>Xác nhận mật khẩu mới</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="form-control" required />
      </div>
      <button type="submit" className="btn btn-outline mt-2" disabled={loading}>
        {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
      </button>
    </form>
  );
};

export default ProfilePage;