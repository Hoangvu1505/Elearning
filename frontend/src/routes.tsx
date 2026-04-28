import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ClassListPage from './pages/ClassListPage';
import ClassDetailPage from './pages/ClassDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminPanel from './pages/AdminPanel';
import UserListPage from './pages/UserListPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import AssignmentDetailPage from './pages/AssignmentDetailPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/classes" element={<ProtectedRoute><MainLayout><ClassListPage /></MainLayout></ProtectedRoute>} />
      <Route path="/classes/:id" element={<ProtectedRoute><MainLayout><ClassDetailPage /></MainLayout></ProtectedRoute>} />
      <Route path="/assignments/:id" element={<ProtectedRoute><MainLayout><AssignmentDetailPage /></MainLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
      <Route path="/profile/:id" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><MainLayout><AdminPanel /></MainLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['Admin']}><MainLayout><UserListPage /></MainLayout></ProtectedRoute>} />
    </Routes>
  );
};

export default AppRoutes;