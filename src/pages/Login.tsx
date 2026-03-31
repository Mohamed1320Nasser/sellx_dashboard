import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

const loginSchema = z.object({
    emailOrUsername: z.string().min(3, 'البريد الإلكتروني أو اسم المستخدم مطلوب'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
    const navigate = useNavigate();
    const login = useSessionAuthStore((state) => state.login);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        mode: 'onSubmit', // Only validate on submit to preserve user input
        shouldFocusError: false, // Don't auto-focus on error to preserve UX
    });

    const onSubmit = async (data: LoginForm) => {
        try {
            const success = await login({ ...data, isAdmin, rememberMe });
            
            if (success) {
                showSuccessToast('تم تسجيل الدخول بنجاح');
                navigate('/');
            } else {
                showErrorToast('فشل في تسجيل الدخول. تحقق من بيانات الاعتماد.');
            }
        } catch (error) {
            showErrorToast(error);
            // Don't reset form on error - keep user data
            // The form data will remain as the user entered it
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding & Features */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        backgroundSize: '60px 60px'
                    }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    {/* Logo */}
                    <div className="mb-12">
                        <div className="flex items-center space-x-4 space-x-reverse mb-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl">
                                <span className="text-white font-bold text-3xl">S</span>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold">SellX</h1>
                                <p className="text-primary-100 text-lg">نظام إدارة المبيعات المتكامل</p>
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold mb-6">مميزات النظام</h2>
                        {[
                            'إدارة مبيعات احترافية ومتطورة',
                            'تتبع المخزون في الوقت الفعلي',
                            'تقارير مالية شاملة ومفصلة',
                            'إدارة العملاء والموردين',
                            'نظام نقاط بيع سهل الاستخدام'
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center space-x-3 space-x-reverse animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-lg text-primary-50">{feature}</span>
                            </div>
                        ))}
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-primary-900/50 to-transparent"></div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="max-w-md w-full">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4">
                            <span className="text-white font-bold text-3xl">S</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">SellX</h1>
                        <p className="text-gray-600 mt-2">نظام إدارة المبيعات المتكامل</p>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">
                            مرحباً بك
                        </h2>
                        <p className="mt-2 text-gray-600">
                            قم بتسجيل الدخول للمتابعة إلى حسابك
                        </p>
                    </div>

                    <Card shadow="xl" className="border-0">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex justify-center space-x-4 space-x-reverse">
                            <button
                                type="button"
                                onClick={() => setIsAdmin(false)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    !isAdmin
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                مستخدم
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAdmin(true)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    isAdmin
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                مدير النظام
                            </button>
                        </div>

                        <Input
                            label="البريد الإلكتروني أو اسم المستخدم"
                            type="text"
                            autoComplete="username"
                            {...register('emailOrUsername')}
                            error={errors.emailOrUsername?.message}
                        />

                        <div className="relative">
                            <Input
                                label="كلمة المرور"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                {...register('password')}
                                error={errors.password?.message}
                            />
                            <button
                                type="button"
                                className="absolute left-3 top-9 flex items-center text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="rememberMe"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="rememberMe" className="mr-2 block text-sm text-gray-900 cursor-pointer">
                                    تذكرني لمدة 30 يوم
                                </label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            loading={isSubmitting}
                        >
                            تسجيل الدخول
                        </Button>

                            <div className="text-center space-y-3 pt-4 border-t border-gray-200">
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/forgot-password')}
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                    >
                                        نسيت كلمة المرور؟
                                    </button>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">ليس لديك حساب؟ </span>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/company/register')}
                                        className="text-sm text-primary-600 hover:text-primary-700 font-bold transition-colors"
                                    >
                                        تسجيل شركة جديدة
                                    </button>
                                </div>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Login;
