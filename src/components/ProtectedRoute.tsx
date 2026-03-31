import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { LoadingSpinner } from './ui';
import { hasPermission } from '../utils/permissions';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requiredRole 
}) => {
    const { isAuthenticated, user, isLoading } = useSessionAuthStore();
    const role = user?.role;


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="جاري التحميل..." />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check role hierarchy if required role is specified
    if (requiredRole && !hasPermission(requiredRole, role)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        غير مصرح لك بالوصول
                    </h2>
                    <p className="text-gray-600">
                        لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
