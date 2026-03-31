import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { passwordRecoveryService } from '../services/passwordRecoveryService';
import toast from 'react-hot-toast';

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'كلمة المرور يجب أن تكون على الأقل 8 أحرف')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 
      'كلمة المرور يجب أن تحتوي على حرف صغير، حرف كبير، رقم، ورمز خاص'),
  confirmPassword: z.string()
    .min(8, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمة المرور وتأكيدها غير متطابقين',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface LocationState {
  email: string;
  requestId: string;
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const state = location.state as LocationState;

  // Redirect if no email or requestId
  useEffect(() => {
    if (!state?.email || !state?.requestId) {
      navigate('/forgot-password');
    }
  }, [state, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const newPassword = watch('newPassword');
  const confirmPassword = watch('confirmPassword');

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score <= 2) return { score, label: 'ضعيف', color: 'text-red-600' };
    if (score <= 3) return { score, label: 'متوسط', color: 'text-yellow-600' };
    if (score <= 4) return { score, label: 'جيد', color: 'text-blue-600' };
    return { score, label: 'قوي جداً', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(newPassword || '');

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await passwordRecoveryService.resetPassword({
        email: state.email,
        requestId: state.requestId,
        new: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      toast.success('تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول');
      navigate('/login');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!state?.email || !state?.requestId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-gray-600">
            أدخل كلمة المرور الجديدة لحسابك
          </p>
          <p className="text-blue-600 font-medium text-sm">{state.email}</p>
        </div>

        {/* Form */}
        <Card padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <Input
                label="كلمة المرور الجديدة"
                type={showPassword ? 'text' : 'password'}
                placeholder="أدخل كلمة المرور الجديدة"
                {...register('newPassword')}
                error={errors.newPassword?.message}
                disabled={isLoading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
              
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">قوة كلمة المرور:</span>
                  <span className={passwordStrength.color}>{passwordStrength.label}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score <= 2 ? 'bg-red-500' :
                      passwordStrength.score <= 3 ? 'bg-yellow-500' :
                      passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <Input
                label="تأكيد كلمة المرور"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="أعد إدخال كلمة المرور"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isLoading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
              
            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className="mt-2 flex items-center">
                {newPassword === confirmPassword ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600 ml-1" />
                    <span className="text-sm text-green-600">كلمة المرور متطابقة</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600 ml-1" />
                    <span className="text-sm text-red-600">كلمة المرور غير متطابقة</span>
                  </>
                )}
              </div>
            )}

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">متطلبات كلمة المرور:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li className={`flex items-center ${newPassword && newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ml-1 ${newPassword && newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                  على الأقل 8 أحرف
                </li>
                <li className={`flex items-center ${newPassword && /[a-z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ml-1 ${newPassword && /[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                  حرف صغير (a-z)
                </li>
                <li className={`flex items-center ${newPassword && /[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ml-1 ${newPassword && /[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                  حرف كبير (A-Z)
                </li>
                <li className={`flex items-center ${newPassword && /\d/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ml-1 ${newPassword && /\d/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                  رقم (0-9)
                </li>
                <li className={`flex items-center ${newPassword && /[@$!%*?&]/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ml-1 ${newPassword && /[@$!%*?&]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                  رمز خاص (@$!%*?&)
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {isLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
            </Button>
          </form>
        </Card>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/login')}
            className="flex items-center justify-center mx-auto"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة لتسجيل الدخول
          </Button>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
              <span className="text-sm font-medium text-green-800">أمان إضافي</span>
            </div>
            <p className="text-xs text-green-700">
              بعد تغيير كلمة المرور، سيتم تسجيل خروجك من جميع الأجهزة الأخرى تلقائياً
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;