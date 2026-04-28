import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (roles && user && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
};

export default ProtectedRoute;
