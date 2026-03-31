import React, { useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '../../stores/uiStore';
import { usePermissions } from '../../hooks/usePermissions';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { sidebarCollapsed } = useUIStore();
    const permissionsLoaded = useRef(false);
    
    // Load user permissions only once per session
    const { isLoading } = usePermissions();
    
    // Track if permissions have been loaded to prevent unnecessary re-renders
    useEffect(() => {
        if (!isLoading && !permissionsLoaded.current) {
            permissionsLoaded.current = true;
        }
    }, [isLoading]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('[data-dropdown]')) {
                // Close any open dropdowns
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full min-h-screen bg-gray-50" dir="rtl">
            {/* Sidebar - Fixed Position */}
            <Sidebar />

            {/* Main content area with margin for fixed sidebar */}
            <div className={`flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? 'mr-16' : 'mr-64'
            }`}>
                {/* Sticky Header */}
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm">
                    <Header />
                </div>

                {/* Page content with professional spacing */}
                <main className="flex-1 overflow-auto bg-gray-50">
                    <div className="pl-6 pr-4 sm:pl-8 sm:pr-6 lg:pl-12 lg:pr-8 py-6 transition-all duration-300 ease-in-out">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
