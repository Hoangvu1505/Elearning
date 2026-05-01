import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAssetUrl } from '../../services/api';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imgError, setImgError] = useState(false);

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/classes?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="navbar">
      <div className="flex items-center" style={{ height: '100%' }}>
        <div className="navbar-logo">
          <Link to="/">Elearning</Link>
        </div>
        <ul className="navbar-links">
          <li><Link to="/" className={isActive('/')}>Trang chủ</Link></li>
          <li><Link to="/dashboard" className={isActive('/dashboard')}>Trang tổng quan</Link></li>
          <li><Link to="/classes" className={isActive('/classes')}>Khóa học của tôi</Link></li>
          {user?.role === 'Admin' && (
            <li><Link to="/admin" className={isActive('/admin')}>Quản trị hệ thống</Link></li>
          )}
        </ul>
      </div>
      
      <div className="navbar-actions">
        {/* Search */}
        <div className="nav-icon" style={{ position: 'relative' }}>
          <span onClick={() => { setShowSearch(!showSearch); setShowNotifications(false); setShowMessages(false); }} title="Tìm kiếm">&#128269;</span>
          {showSearch && (
            <div style={dropdownStyle}>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input type="text" className="form-input" placeholder="Tìm khóa học..." autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <button type="submit" className="btn btn-primary">Tìm</button>
              </form>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="nav-icon" style={{ position: 'relative' }}>
          <div onClick={() => { setShowNotifications(!showNotifications); setShowSearch(false); setShowMessages(false); }} title="Thông báo">
            &#128276;
            <span style={{ position: 'absolute', top: '-8px', right: '-10px', backgroundColor: 'red', color: 'white', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '10px' }}>3</span>
          </div>
          {showNotifications && (
            <div style={{ ...dropdownStyle, width: '300px' }}>
              <h4 className="mb-2" style={{ color: 'var(--text-primary)', margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Thông báo mới</h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <strong style={{ color: 'var(--primary-color)' }}>Thông báo quan trọng:</strong> Hệ thống sẽ bảo trì vào 00:00 đêm nay.
                </div>
                <div style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <strong style={{ color: 'var(--primary-color)' }}>CQ K2024:</strong> Giảng viên vừa đăng bài tập mới.
                </div>
                <div style={{ padding: '0.5rem 0' }}>
                  <strong style={{ color: 'var(--primary-color)' }}>Lớp chủ nhiệm:</strong> Lịch sinh hoạt tuần này dời sang chiều thứ 6.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="nav-icon" style={{ position: 'relative' }}>
          <span onClick={() => { setShowMessages(!showMessages); setShowSearch(false); setShowNotifications(false); }} title="Tin nhắn">&#128172;</span>
          {showMessages && (
            <div style={dropdownStyle}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>Tính năng trò chuyện đang được phát triển.</p>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
              {(user?.avatarUrl && !imgError) ? (
                <img 
                  src={getAssetUrl(user.avatarUrl) || ''} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={() => setImgError(true)}
                />
              ) : (
                user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <Link to="/profile" style={{ color: 'white' }}>Hồ sơ</Link>
            <button onClick={logout} className="btn" style={{ color: 'white', textDecoration: 'underline', padding: 0 }}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link to="/login" style={{ color: 'white', textDecoration: 'underline' }}>Đăng nhập</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '40px',
  right: '-10px',
  backgroundColor: 'white',
  padding: '1rem',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  minWidth: '250px',
  zIndex: 1000,
  color: 'var(--text-primary)',
  cursor: 'default'
};
