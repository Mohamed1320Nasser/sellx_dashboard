import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { passwordRecoveryService } from '../services/passwordRecoveryService';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح').min(1, 'البريد الإلكتروني مطلوب'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await passwordRecoveryService.requestOTP({
        email: data.email,
        type: 'PASSWORD_RESET',
      });

      toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      
      // Navigate to OTP verification page with email and request ID
      navigate('/verify-otp', {
        state: {
          email: data.email,
          requestId: response.id,
        },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء إرسال رمز التحقق';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            نسيت كلمة المرور؟
          </h1>
          <p className="text-gray-600">
            أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق لإعادة تعيين كلمة المرور
          </p>
        </div>

        {/* Form */}
        <Card padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 ml-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">معلومات أمنية:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• سيتم إرسال رمز التحقق إلى بريدك الإلكتروني</li>
                    <li>• الرمز صالح لمدة 5 دقائق فقط</li>
                    <li>• لا تشارك هذا الرمز مع أي شخص</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
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

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            لا تستطيع الوصول إلى بريدك الإلكتروني؟{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => {
                toast('يرجى التواصل مع فريق الدعم الفني', { icon: 'ℹ️' });
              }}
            >
              اتصل بالدعم الفني
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
