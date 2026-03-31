import React, { useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    Receipt,
    BarChart3,
    UserCheck,
    Settings,
    Menu,
    X,
    Folder,
    Archive,
    Truck,
    UserPlus,
    CreditCard,
    TrendingUp,
    FileText,
    Calculator,
    Calendar,
    DollarSign,
    RotateCcw,
    User,
    Printer,
    Monitor,
    Clock,
    Cog,
    Building2
} from 'lucide-react';
import { useSessionAuthStore } from '../../stores/sessionAuthStore';
import { useUIStore } from '../../stores/uiStore';
import { PermissionGuard } from '../common/PermissionGuard';

interface NavigationItem {
    name: string;
    href: string;
    icon: React.ComponentType<any>;
    permission?: keyof import('../../stores/permissionStore').UserPermissions;
    permissions?: (keyof import('../../stores/permissionStore').UserPermissions)[];
    requireAll?: boolean;
    children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
    {
        name: 'لوحة التحكم',
        href: '/',
        icon: LayoutDashboard,
        permission: 'canViewDashboard',
    },
    {
        name: 'المخزون',
        href: '/inventory',
        icon: Package,
        permissions: ['canViewProducts', 'canViewCategories', 'canViewSuppliers'],
        children: [
            {
                name: 'الفئات',
                href: '/categories',
                icon: Folder,
                permission: 'canViewCategories',
            },
            {
                name: 'المنتجات',
                href: '/products',
                icon: Archive,
                permission: 'canViewProducts',
            },
            {
                name: 'الموردين',
                href: '/suppliers',
                icon: Truck,
                permission: 'canViewSuppliers',
            },
            {
                name: 'العملاء',
                href: '/clients',
                icon: UserPlus,
                permission: 'canViewClients',
            },
        ],
    },
    {
        name: 'العمليات',
        href: '/operations',
        icon: ShoppingCart,
        permissions: ['canViewSales', 'canViewQuotes', 'canViewPurchases', 'canViewPayments', 'canViewReturns'],
        children: [
            {
                name: 'المبيعات',
                href: '/sales',
                icon: Receipt,
                permission: 'canViewSales',
            },
            {
                name: 'العروض السعرية',
                href: '/quotes',
                icon: FileText,
                permission: 'canViewQuotes',
            },
            {
                name: 'المشتريات',
                href: '/purchases',
                icon: ShoppingCart,
                permission: 'canViewPurchases',
            },
            {
                name: 'المدفوعات',
                href: '/payments',
                icon: CreditCard,
                permission: 'canViewPayments',
            },
            {
                name: 'حركة المخزون',
                href: '/stock-movements',
                icon: TrendingUp,
                permission: 'canViewStockMovements',
            },
            {
                name: 'المرتجعات',
                href: '/returns',
                icon: RotateCcw,
                permission: 'canViewReturns',
            },
        ],
    },
    {
        name: 'التقارير',
        href: '/reports',
        icon: BarChart3,
        permissions: ['canViewFinancialReports', 'canViewAnalytics'],
        children: [
            {
                name: 'التقارير المالية',
                href: '/financial-reports',
                icon: Calculator,
                permission: 'canViewFinancialReports',
            },
            {
                name: 'التحليلات',
                href: '/analytics',
                icon: BarChart3,
                permission: 'canViewAnalytics',
            },
        ],
    },
    {
        name: 'الموارد البشرية',
        href: '/hr',
        icon: UserCheck,
        permissions: ['canViewUsers', 'canViewAbsences', 'canViewSalaries'],
        children: [
            {
                name: 'إدارة المستخدمين',
                href: '/users',
                icon: Users,
                permission: 'canViewUsers',
            },
            {
                name: 'إدارة الغياب',
                href: '/absences',
                icon: Calendar,
                permission: 'canViewAbsences',
            },
            {
                name: 'إدارة الرواتب',
                href: '/salaries',
                icon: DollarSign,
                permission: 'canViewSalaries',
            },
        ],
    },
    {
        name: 'صناديق النقد',
        href: '/cash-registers',
        icon: DollarSign,
        permission: 'canViewSales',
    },
    {
        name: 'الورديات',
        href: '/shifts',
        icon: Clock,
        permission: 'canViewSales',
    },
    {
        name: 'الإعدادات',
        href: '/settings',
        icon: Settings,
        permissions: ['canManageUserRoles', 'canDeleteUsers'],
        children: [
            {
                name: 'إعدادات التطبيق',
                href: '/settings/app-config',
                icon: Cog,
                permission: 'canManageUserRoles',
            },
            {
                name: 'إعدادات الطابعة',
                href: '/settings/printer',
                icon: Printer,
                permission: 'canManageUserRoles',
            },
            {
                name: 'إعدادات الشركة',
                href: '/settings/company',
                icon: Building2,
                permission: 'canManageUserRoles',
            },
        ],
    },
];

// Store scroll position outside component to persist across renders
const SIDEBAR_SCROLL_KEY = 'sidebar-scroll-position';

const Sidebar: React.FC = () => {
    const { user } = useSessionAuthStore();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const navRef = useRef<HTMLElement>(null);
    const isRestoringRef = useRef(false);

    // Restore scroll position on mount
    useEffect(() => {
        const navElement = navRef.current;
        if (!navElement) return;

        const savedPosition = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
        if (savedPosition) {
            const position = parseInt(savedPosition, 10);
            if (position > 0) {
                isRestoringRef.current = true;
                // Multiple attempts to ensure scroll is restored after render
                requestAnimationFrame(() => {
                    navElement.scrollTop = position;
                    setTimeout(() => {
                        navElement.scrollTop = position;
                        isRestoringRef.current = false;
                    }, 50);
                });
            }
        }
    }, []);

    // Save scroll position on scroll
    useEffect(() => {
        const navElement = navRef.current;
        if (!navElement) return;

        const handleScroll = () => {
            if (!isRestoringRef.current) {
                sessionStorage.setItem(SIDEBAR_SCROLL_KEY, navElement.scrollTop.toString());
            }
        };

        navElement.addEventListener('scroll', handleScroll, { passive: true });
        return () => navElement.removeEventListener('scroll', handleScroll);
    }, []);

    const renderNavigationItem = (item: NavigationItem, level = 0) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;

        // Use PermissionGuard to check permissions
        return (
            <PermissionGuard
                key={item.href}
                permission={item.permission}
                permissions={item.permissions}
                requireAll={item.requireAll}
                hide={true}
            >
                {/* If item has children, render as a non-clickable header */}
                {hasChildren && level === 0 ? (
                    <div className="relative group">
                        <div className={`flex items-center px-3 py-2.5 text-sm font-semibold text-gray-300 bg-secondary-800/50 rounded-xl mb-2 transition-all duration-200 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                            <Icon className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : 'ml-2'}`} />
                            {!sidebarCollapsed && (
                                <span className="truncate">{item.name}</span>
                            )}
                        </div>

                        {/* Tooltip for collapsed state */}
                        {sidebarCollapsed && (
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                {item.name}
                            </div>
                        )}

                        {!sidebarCollapsed && (
                            <div className="mt-1 space-y-1 mr-4">
                                {item.children.map((child) => renderNavigationItem(child, level + 1))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* If item has no children or is a child item, render as clickable link */
                    <div className="relative group">
                        <NavLink
                            to={item.href}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 transform ${
                                    isActive
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-105 border-r-4 border-primary-400'
                                        : 'text-gray-300 hover:bg-secondary-700/70 hover:text-white hover:scale-102'
                                } ${level > 0 ? 'mr-4' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`
                            }
                            title={sidebarCollapsed ? item.name : undefined}
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon className={`w-5 h-5 transition-colors duration-200 ${sidebarCollapsed ? 'mx-auto' : 'ml-2'} ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                    {!sidebarCollapsed && (
                                        <span className="truncate">{item.name}</span>
                                    )}
                                </>
                            )}
                        </NavLink>

                        {/* Tooltip for collapsed state */}
                        {sidebarCollapsed && (
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                {item.name}
                            </div>
                        )}
                    </div>
                )}
            </PermissionGuard>
        );
    };

    return (
        <>
            {/* Mobile sidebar overlay */}
            {!sidebarCollapsed && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300 ease-in-out"
                    onClick={toggleSidebar}
                />
            )}

            {/* Fixed Sidebar with Independent Scrolling - Modern Dark Design */}
            <div
                className={`h-screen bg-gradient-to-b from-secondary-900 via-secondary-800 to-secondary-900 border-l border-secondary-700 shadow-2xl transition-all duration-300 ease-in-out ${
                    sidebarCollapsed
                        ? 'w-16'
                        : 'w-64'
                } fixed inset-y-0 right-0 z-50 lg:z-auto flex-shrink-0`}
            >
                <div className="h-full flex flex-col">
                    {/* Modern Header - Dark Theme */}
                    <div className="flex items-center justify-between p-4 border-b border-secondary-700/50 flex-shrink-0">
                        {!sidebarCollapsed ? (
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-xl">
                                    <span className="text-white font-bold text-lg">S</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        SellX
                                    </h1>
                                    <p className="text-xs text-gray-400">نظام إدارة المبيعات</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-xl mx-auto">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                        )}
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg hover:bg-secondary-700/50 text-gray-400 hover:text-white transition-all duration-200 lg:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Fixed Navigation with Independent Scrolling */}
                    <nav
                        ref={navRef}
                        className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-sidebar"
                    >
                        {navigationItems.map((item) => renderNavigationItem(item))}
                    </nav>

                    {/* Modern Footer with User Info - Dark Theme */}
                    <div className="border-t border-secondary-700/50 bg-secondary-900/50 flex-shrink-0">
                        {!sidebarCollapsed ? (
                            <div className="p-3">
                                {/* User Profile Section */}
                                <div className="flex items-center space-x-3 space-x-reverse mb-3 p-2 rounded-xl bg-secondary-800/50 hover:bg-secondary-800 transition-all duration-200">
                                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {user?.fullname || 'المستخدم'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {user?.email || 'user@example.com'}
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle Button */}
                                <button
                                    onClick={toggleSidebar}
                                    className="w-full flex items-center justify-center p-2 text-gray-400 hover:bg-secondary-700/50 hover:text-white rounded-lg transition-all duration-200 text-xs"
                                >
                                    <Menu className="w-4 h-4 ml-1" />
                                    <span className="text-xs">طي القائمة</span>
                                </button>
                            </div>
                        ) : (
                            <div className="p-2">
                                {/* Collapsed User Icon */}
                                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <button
                                    onClick={toggleSidebar}
                                    className="w-full flex items-center justify-center p-2 text-gray-400 hover:bg-secondary-700/50 hover:text-white rounded-lg transition-all duration-200"
                                >
                                    <Menu className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
