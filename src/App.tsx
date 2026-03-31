import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './config/queryClient';
import { useSessionAuthStore } from './stores/sessionAuthStore';
import { useUIStore } from './stores/uiStore';
import { usePrinterConfigStore } from './stores/printerConfigStore';
import { initializeAppApi } from './shared/api/init';
import { getBaseURL, resetApiConfig } from './shared/api/config';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import ErrorBoundary from './components/ErrorBoundary';
import './utils/clearOldAuth'; // Clear old localStorage auth
import Login from './pages/Login';
import CompanyRegister from './pages/CompanyRegister';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import SessionDemo from './pages/SessionDemo';
import Dashboard from './pages/Dashboard';
import AppConfig from './pages/Settings/AppConfig';
import Categories from './pages/Categories';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import ProductEdit from './pages/ProductEdit';
import ProductCreate from './pages/ProductCreate';
import UserManagement from './pages/UserManagement';
import Suppliers from './pages/Suppliers';
import Clients from './pages/Clients';
import Sales from './pages/Sales';
import SalesCreate from './pages/SalesCreate';
import SalesDetails from './pages/SalesDetails';
import Purchases from './pages/Purchases';
import PurchasesCreate from './pages/PurchasesCreate';
import PurchasesDetails from './pages/PurchasesDetails';
import Payments from './pages/Payments';
import PaymentCreate from './pages/PaymentCreate';
import PaymentDetails from './pages/PaymentDetails';
import StockMovements from './pages/StockMovements';
import FinancialReports from './pages/FinancialReports';
import Analytics from './pages/Analytics';
import Quotes from './pages/Quotes';
import QuoteCreate from './pages/QuoteCreate';
import QuoteEdit from './pages/QuoteEdit';
import QuoteView from './pages/QuoteView';
import QuotePrint from './pages/QuotePrint';
import Returns from './pages/Returns';
import ReturnsCreate from './pages/ReturnsCreate';
import ReturnsDetails from './pages/ReturnsDetails';
import Absences from './pages/Absences';
import Salaries from './pages/Salaries';
import SalariesCreate from './pages/SalariesCreate';
import SalariesEdit from './pages/SalariesEdit';
import CashRegisters from './pages/CashRegisters';
import Shifts from './pages/Shifts';
import PrinterSettings from './pages/Settings/PrinterSettings';
import CompanySettings from './pages/Settings/CompanySettings';
import TaxSettings from './pages/Settings/TaxSettings';
import NoInternetPage from './pages/NoInternetPage';

const App: React.FC = () => {
    const isAuthenticated = useSessionAuthStore((state) => state.isAuthenticated);
    const isLoading = useSessionAuthStore((state) => state.isLoading);
    const initialize = useSessionAuthStore((state) => state.initialize);
    const { language, setLanguage } = useUIStore();

    // Network status monitoring
    const { isOnline, checkConnection } = useNetworkStatus();
    const [showOfflinePage, setShowOfflinePage] = useState(false);

    // Initialize authentication immediately on first render
    const [isInitialized, setIsInitialized] = useState(false);

    // Handle going online - hide offline page
    const handleOnline = useCallback(() => {
        console.log('[APP] Network restored - hiding offline page');
        setShowOfflinePage(false);
    }, []);

    // Show offline page when network is lost (only in Electron/desktop)
    useEffect(() => {
        const isElectron = typeof window !== 'undefined' && (window as any).isElectron === true;

        // Only show offline page in Electron app
        if (isElectron && !isOnline) {
            console.log('[APP] Network lost - showing offline page');
            setShowOfflinePage(true);
        } else if (isOnline && showOfflinePage) {
            // Auto-hide when back online
            setShowOfflinePage(false);
        }
    }, [isOnline, showOfflinePage]);

    // Determine router type at runtime - HashRouter for file:// protocol (Electron), BrowserRouter for web
    // This is computed once and memoized to prevent re-renders
    const useHashRouter = useMemo(() => {
        const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
        const isElectronEnv = typeof window !== 'undefined' && (window as any).isElectron === true;
        const shouldUseHash = isFileProtocol || isElectronEnv;
        console.log('[APP] Router selection:', { isFileProtocol, isElectronEnv, shouldUseHash, protocol: window?.location?.protocol });
        return shouldUseHash;
    }, []);
    const Router = useHashRouter ? HashRouter : BrowserRouter;

    // Auto-load printer config when company changes
    const company = useSessionAuthStore(state => state.company);
    const printerConfig = usePrinterConfigStore();

    useEffect(() => {
        if (company?.companyId && (window as any).isElectron) {
            console.log('[APP] Company changed, loading printer config for:', company.companyId);
            printerConfig.loadConfig(company.companyId).catch(err => {
                console.error('[APP] Failed to load printer config:', err);
            });
        }
    }, [company?.companyId]);

    useEffect(() => {
        if (!isInitialized) {
            console.log('[APP] Starting initialization...');
            console.log('[APP] Platform:', (window as any).isElectron ? 'DESKTOP' : 'WEB');
            console.log('[APP] isElectron:', (window as any).isElectron);
            console.log('[APP] VITE_TARGET:', import.meta.env.VITE_TARGET);
            console.log('[APP] API Base URL:', getBaseURL());

            // Add debug function to reset config if needed
            if (import.meta.env.DEV) {
              (window as any).resetApiConfig = resetApiConfig;
              (window as any).forceCorrectUrl = async () => {
                console.log('[APP] Forcing correct URL: http://localhost:3000');
                await resetApiConfig();
                window.location.reload();
              };
              console.log('[APP] Debug: resetApiConfig() and forceCorrectUrl() available in console');
            }
            
            initialize();

            // Add timeout for API initialization to prevent hanging
            Promise.race([
                initializeAppApi(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('API init timeout')), 3000)
                )
            ]).catch(error => {
                console.warn("API initialization failed or timed out:", error);
                // Continue anyway - web can work without Electron config
            });

            // Auto-load printer configuration on startup (Electron only)
            if ((window as any).isElectron && (window as any).printerAPI) {
                const loadPrinterConfig = async () => {
                    try {
                        const authStore = useSessionAuthStore.getState();
                        const printerStore = usePrinterConfigStore.getState();

                        // Check if we have a company logged in
                        if (authStore.company?.companyId) {
                            console.log('[APP] Auto-loading printer config for company:', authStore.company.companyId);

                            // Load config from backend first
                            await printerStore.loadConfig(authStore.company.companyId);

                            // Now get the loaded config
                            const printerConfig = usePrinterConfigStore.getState();

                            // Only set config if it's actually configured
                            if (printerConfig.printerName || printerConfig.ipAddress) {
                                console.log('[APP] Setting printer config in Electron...');
                                await (window as any).printerAPI.setConfig({
                                    printerName: printerConfig.printerName,
                                    connectionType: printerConfig.connectionType,
                                    ipAddress: printerConfig.ipAddress,
                                    port: printerConfig.port,
                                    paperWidth: printerConfig.paperWidth,
                                    marginTop: printerConfig.marginTop,
                                    marginBottom: printerConfig.marginBottom,
                                    showLogo: printerConfig.showLogo,
                                    showOrderId: printerConfig.showOrderId,
                                    showTaxBreakdown: printerConfig.showTaxBreakdown,
                                    showQRCode: printerConfig.showQRCode,
                                    headerText: printerConfig.headerText,
                                    footerText: printerConfig.footerText,
                                    cutPaper: printerConfig.cutPaper,
                                });
                                console.log('[APP] ✓ Printer config loaded and set successfully');
                            } else {
                                console.log('[APP] No printer configured yet - please configure in Settings');
                            }
                        } else {
                            console.log('[APP] No company logged in yet - skipping printer config');
                        }
                    } catch (error) {
                        console.error('[APP] Failed to auto-load printer config:', error);
                    }
                };

                // Wait a bit for auth to be ready
                setTimeout(loadPrinterConfig, 1000);
            }

            setIsInitialized(true);
        }
        
        // Set initial language and direction
        setLanguage(language);
    }, [language, setLanguage, initialize, isInitialized]);

    // Show offline page when network is down (Electron only)
    if (showOfflinePage) {
        return (
            <ErrorBoundary>
                <NoInternetPage
                    onRetry={() => checkConnection()}
                    onOnline={handleOnline}
                />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <div className="App w-full h-full">
                    <Routes>
                        <Route 
                            path="/login" 
                            element={
                                isAuthenticated ? <Navigate to="/" replace /> : <Login />
                            } 
                        />
                        <Route 
                            path="/company/register" 
                            element={
                                isAuthenticated ? <Navigate to="/" replace /> : <CompanyRegister />
                            } 
                        />
                        <Route 
                            path="/session-demo" 
                            element={<SessionDemo />} 
                        />
                        <Route 
                            path="/forgot-password" 
                            element={
                                isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />
                            } 
                        />
                        <Route 
                            path="/verify-otp" 
                            element={
                                isAuthenticated ? <Navigate to="/" replace /> : <VerifyOTP />
                            } 
                        />
                        <Route 
                            path="/reset-password" 
                            element={
                                isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />
                            } 
                        />
                        
                        {/* All routes now use session-based authentication */}
                        <Route 
                            path="/*" 
                            element={
                                isLoading || !isInitialized ? (
                                    <div className="flex items-center justify-center min-h-screen">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="mt-4 text-gray-600">جاري التحميل...</p>
                                        </div>
                                    </div>
                                ) : isAuthenticated ? (
                                    <Routes>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/categories" element={<Categories />} />
                                        <Route path="/products" element={<Products />} />
                                        <Route path="/products/:id" element={<ProductDetails />} />
                                        <Route path="/products/:id/edit" element={<ProductEdit />} />
                                        <Route path="/products/create" element={<ProductCreate />} />
                                        <Route path="/users" element={<UserManagement />} />
                                        <Route path="/suppliers" element={<Suppliers />} />
                                        <Route path="/clients" element={<Clients />} />
                                        <Route path="/sales" element={<Sales />} />
                                        <Route path="/sales/create" element={<SalesCreate />} />
                                        <Route path="/sales/:id" element={<SalesDetails />} />
                                        <Route path="/purchases" element={<Purchases />} />
                                        <Route path="/purchases/create" element={<PurchasesCreate />} />
                                        <Route path="/purchases/:id" element={<PurchasesDetails />} />
                                        <Route path="/purchases/:id/edit" element={<PurchasesCreate />} />
                                        <Route path="/payments" element={<Payments />} />
                                        <Route path="/payments/create" element={<PaymentCreate />} />
                                        <Route path="/payments/:id" element={<PaymentDetails />} />
                                        <Route path="/payments/:id/edit" element={<PaymentCreate />} />
                                        <Route path="/stock-movements" element={<StockMovements />} />
                                        <Route path="/financial-reports" element={<FinancialReports />} />
                                        <Route path="/analytics" element={<Analytics />} />
                                        <Route path="/returns" element={<Returns />} />
                                        <Route path="/returns/create" element={<ReturnsCreate />} />
                                        <Route path="/returns/:id" element={<ReturnsDetails />} />
                                        <Route path="/absences" element={<Absences />} />
                                        <Route path="/salaries" element={<Salaries />} />
                                        <Route path="/salaries/create" element={<SalariesCreate />} />
                                        <Route path="/salaries/:id/edit" element={<SalariesEdit />} />
                                        <Route path="/quotes" element={<Quotes />} />
                                        <Route path="/quotes/create" element={<QuoteCreate />} />
                                        <Route path="/quotes/:id" element={<QuoteView />} />
                                        <Route path="/quotes/:id/edit" element={<QuoteEdit />} />
                                        <Route path="/quotes/:id/print" element={<QuotePrint />} />
                                        <Route path="/settings/app-config" element={<AppConfig />} />
                                        <Route path="/settings/printer" element={<PrinterSettings />} />
                                        <Route path="/settings/company" element={<CompanySettings />} />
                                        <Route path="/settings/tax" element={<TaxSettings />} />
                                        <Route path="/cash-registers" element={<CashRegisters />} />
                                        <Route path="/shifts" element={<Shifts />} />
                                    </Routes>
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            } 
                        />
                    </Routes>
                    
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                            success: {
                                duration: 3000,
                                style: {
                                    background: '#10b981',
                                },
                            },
                            error: {
                                duration: 7000, // 7 seconds for error messages
                                style: {
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                },
                            },
                        }}
                    />
                    </div>
                </Router>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </ErrorBoundary>
    );
};

export default App;