import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, User, LogOut, ChevronDown, Home, ChevronLeft, Settings, Shield, Mail, Phone } from 'lucide-react';
import { useSessionAuthStore } from '../../stores/sessionAuthStore';
import { useUIStore } from '../../stores/uiStore';
import { useLocation, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
    const { logout, getCurrentUser } = useSessionAuthStore();
    const currentUser = getCurrentUser();
    const role = currentUser?.role;
    const { toggleSidebar, sidebarCollapsed } = useUIStore();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };


    // Get page-specific content
    const getPageContent = () => {
        const path = location.pathname;
        
        // Page titles mapping
        const pageTitles: { [key: string]: string } = {
            '/analytics': 'التحليلات',
            '/users': 'إدارة المستخدمين',
            '/user-management': 'إدارة المستخدمين',
            '/company': 'إدارة الشركة',
            '/company-management': 'إدارة الشركة',
            '/products': 'المنتجات',
            '/categories': 'الفئات',
            '/clients': 'العملاء',
            '/suppliers': 'الموردين',
            '/sales': 'المبيعات',
            '/purchases': 'المشتريات',
            '/quotes': 'عروض الأسعار',
            '/returns': 'المرتجعات',
            '/payments': 'المدفوعات',
            '/stock-movements': 'حركة المخزون',
            '/financial-reports': 'التقارير المالية',
        };
        
        const pageTitle = pageTitles[path] || 'الصفحة';
        
        return {
            title: pageTitle,
            showBreadcrumb: path !== '/'
        };
    };

    const pageContent = getPageContent();

    return (
        <header className="pl-6 pr-3 sm:pl-8 sm:pr-4 lg:pl-12 lg:pr-6 py-4 bg-white border-b border-gray-200 shadow-sm w-full">
            <div className="flex items-center justify-between w-full">
                {/* Right side - Sidebar toggle (follows RTL) */}
                <div className="flex items-center space-x-4 space-x-reverse">
                    {/* Sidebar toggle */}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                        aria-label={sidebarCollapsed ? "إظهار القائمة الجانبية" : "إخفاء القائمة الجانبية"}
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {/* Breadcrumb for non-dashboard pages */}
                    {pageContent.showBreadcrumb && (
                        <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center space-x-1 space-x-reverse hover:text-gray-700 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">الرئيسية</span>
                            </button>
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-gray-700 font-medium">{pageContent.title}</span>
                        </div>
                    )}
                </div>

                {/* Left side - Profile and actions (follows RTL) */}
                <div className="flex items-center space-x-3 space-x-reverse flex-shrink-0">
                    {/* Notifications */}
                    <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors">
                        <Bell className="w-5 h-5" />
                        {/* Notification badge */}
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* Profile Section */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center space-x-3 space-x-reverse p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {/* Profile Avatar */}
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                {/* Online status indicator */}
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            
                            {/* Profile Info */}
                            <div className="hidden sm:block text-right min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate max-w-32">
                                    {currentUser?.fullname || currentUser?.name || currentUser?.email?.split('@')[0] || 'المستخدم'}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-32">
                                    {currentUser?.company?.name || 'شركة تجريبية'}
                                </p>
                            </div>
                            
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Enhanced Profile Menu */}
                        {showUserMenu && (
                            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                {/* Profile Header */}
                                <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-gray-100">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">
                                                {currentUser?.fullname || currentUser?.name || currentUser?.email?.split('@')[0] || 'المستخدم'}
                                            </h3>
                                            <p className="text-xs text-gray-600 truncate">
                                                {currentUser?.company?.name || 'شركة تجريبية'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Details */}
                                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-600">
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate">{currentUser?.email || 'user@example.com'}</span>
                                        </div>
                                        {currentUser?.phone && (
                                            <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-600">
                                                <Phone className="w-3 h-3" />
                                                <span>{currentUser.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-600">
                                            <Shield className="w-3 h-3" />
                                            <span>{role === 'ADMIN' ? 'مدير النظام' : role === 'MANAGER' ? 'مدير' : role === 'CASHIER' ? 'أمين صندوق' : 'مستخدم'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Actions */}
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            // Handle profile navigation
                                        }}
                                        className="flex items-center w-full px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <User className="w-4 h-4 ml-3" />
                                        الملف الشخصي
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            // Handle settings navigation
                                        }}
                                        className="flex items-center w-full px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 ml-3" />
                                        الإعدادات
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            handleLogout();
                                        }}
                                        className="flex items-center w-full px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4 ml-3" />
                                        تسجيل الخروج
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
