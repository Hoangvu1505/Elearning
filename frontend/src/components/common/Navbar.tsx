import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { getAssetUrl } from '../../services/api';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imgError, setImgError] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'vi');

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  const t = {
    vi: {
      home: 'Trang chủ',
      dashboard: 'Trang tổng quan',
      myCourses: 'Khóa học của tôi',
      admin: 'Quản trị hệ thống',
      searchPlaceholder: 'Tìm khóa học...',
      searchBtn: 'Tìm',
      newNotifications: 'Thông báo mới',
      noNotifications: 'Không có thông báo mới.',
      profile: '👤 Hồ sơ',
      grades: '📊 Điểm',
      calendar: '📅 Lịch',
      reports: '📈 Báo cáo',
      preferences: '⚙️ Tùy chọn ',
      language: '🌐 Ngôn ngữ: Tiếng Việt',
      logout: '🚪 Thoát',
      login: 'Đăng nhập',
    },
    en: {
      home: 'Home',
      dashboard: 'Dashboard',
      myCourses: 'My Courses',
      admin: 'System Admin',
      searchPlaceholder: 'Search courses...',
      searchBtn: 'Search',
      newNotifications: 'New Notifications',
      noNotifications: 'No new notifications.',
      profile: '👤 Profile',
      grades: '📊 Grades',
      calendar: '📅 Calendar',
      reports: '📈 Reports',
      preferences: '⚙️ Preferences ',
      language: '🌐 Language: English',
      logout: '🚪 Logout',
      login: 'Login',
    }
  }[lang as 'vi' | 'en'] || {
    home: 'Trang chủ',
    dashboard: 'Trang tổng quan',
    myCourses: 'Khóa học của tôi',
    admin: 'Quản trị hệ thống',
    searchPlaceholder: 'Tìm khóa học...',
    searchBtn: 'Tìm',
    newNotifications: 'Thông báo mới',
    noNotifications: 'Không có thông báo mới.',
    profile: '👤 Hồ sơ',
    grades: '📊 Điểm',
    calendar: '📅 Lịch',
    reports: '📈 Báo cáo',
    preferences: '⚙️ Tùy chọn (Chỉnh sửa & Đổi MK)',
    language: '🌐 Ngôn ngữ',
    logout: '🚪 Thoát',
    login: 'Đăng nhập',
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/classes?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    localStorage.setItem('lang', nextLang);
    setLang(nextLang);
    setShowUserMenu(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/dashboard/notifications');
      setNotifications(res.data);
      setNotificationCount(res.data.length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowSearch(false);
    setShowUserMenu(false);
    if (!showNotifications) {
      setNotificationCount(0); // Clear count on click
    }
  };

  return (
    <nav className="navbar">
      <div className="flex items-center" style={{ height: '100%' }}>
        <div className="navbar-logo">
          <Link to="/">Elearning</Link>
        </div>
        <ul className="navbar-links">
          <li><Link to="/" className={isActive('/')}>{t.home}</Link></li>
          <li><Link to="/dashboard" className={isActive('/dashboard')}>{t.dashboard}</Link></li>
          <li><Link to="/classes" className={isActive('/classes')}>{t.myCourses}</Link></li>
          {user?.role === 'Admin' && (
            <li><Link to="/admin" className={isActive('/admin')}>{t.admin}</Link></li>
          )}
        </ul>
      </div>
      
      <div className="navbar-actions">
        {/* Search */}
        <div className="nav-icon" style={{ position: 'relative' }}>
          <span onClick={() => { setShowSearch(!showSearch); setShowNotifications(false); setShowUserMenu(false); }} title="Tìm kiếm">&#128269;</span>
          {showSearch && (
            <div style={dropdownStyle}>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input type="text" className="form-input" placeholder={t.searchPlaceholder} autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <button type="submit" className="btn btn-primary">{t.searchBtn}</button>
              </form>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="nav-icon" style={{ position: 'relative' }}>
          <div onClick={handleToggleNotifications} title="Thông báo" style={{ cursor: 'pointer' }}>
            &#128276;
            {notificationCount > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-10px', backgroundColor: 'red', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                {notificationCount}
              </span>
            )}
          </div>
          {showNotifications && (
            <div style={{ ...dropdownStyle, width: '320px' }}>
              <h4 className="mb-2" style={{ color: 'var(--text-primary)', margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem' }}>
                {t.newNotifications}
              </h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1rem 0', textAlign: 'center' }}>{t.noNotifications}</div>
                ) : (
                  notifications.map((n: any, idx: number) => (
                    <div 
                      key={idx} 
                      style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                      onClick={() => {
                        navigate(`/classes/${n.classId}`);
                        setShowNotifications(false);
                      }}
                    >
                      <strong style={{ color: 'var(--primary-color)', display: 'block' }}>{n.title}</strong>
                      <span style={{ color: 'var(--text-primary)' }}>{n.content}</span>
                      <small style={{ display: 'block', color: '#999', marginTop: '2px' }}>
                        {new Date(n.createdAt).toLocaleDateString('vi-VN')} {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2" style={{ position: 'relative' }}>
            <div 
              className="flex items-center gap-2" 
              style={{ cursor: 'pointer' }}
              onClick={() => { setShowUserMenu(!showUserMenu); setShowSearch(false); setShowNotifications(false); }}
            >
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
              <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                {user?.fullName || user?.name || 'User'} ▼
              </span>
            </div>

            {showUserMenu && (
              <div className="dropdown-menu">
                <div className="dropdown-menu-item" onClick={() => { navigate('/profile?mode=view'); setShowUserMenu(false); }}>
                  {t.profile}
                </div>
                <div className="dropdown-menu-item" onClick={() => { navigate('/grades'); setShowUserMenu(false); }}>
                  {t.grades}
                </div>
                <div className="dropdown-menu-item" onClick={() => { navigate('/calendar'); setShowUserMenu(false); }}>
                  {t.calendar}
                </div>
                <div className="dropdown-menu-item" onClick={() => { navigate('/reports'); setShowUserMenu(false); }}>
                  {t.reports}
                </div>
                <div style={{ borderBottom: '1px solid var(--border-color)', margin: '0.25rem 0' }}></div>
                <div className="dropdown-menu-item" onClick={() => { navigate('/profile?mode=edit'); setShowUserMenu(false); }}>
                  {t.preferences}
                </div>
                <div className="dropdown-menu-item" onClick={toggleLanguage}>
                  {t.language}
                </div>
                <div style={{ borderBottom: '1px solid var(--border-color)', margin: '0.25rem 0' }}></div>
                <div className="dropdown-menu-item" style={{ color: 'var(--danger-color)' }} onClick={() => { logout(); setShowUserMenu(false); }}>
                  {t.logout}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" style={{ color: 'white', textDecoration: 'underline' }}>{t.login}</Link>
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
