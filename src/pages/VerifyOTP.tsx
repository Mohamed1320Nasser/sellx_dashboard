import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Shield, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { passwordRecoveryService } from '../services/passwordRecoveryService';
import toast from 'react-hot-toast';

const otpSchema = z.object({
  otp: z.string()
    .min(6, 'رمز التحقق يجب أن يكون 6 أرقام')
    .max(6, 'رمز التحقق يجب أن يكون 6 أرقام')
    .regex(/^\d{6}$/, 'رمز التحقق يجب أن يحتوي على أرقام فقط'),
});

type OTPFormData = z.infer<typeof otpSchema>;

interface LocationState {
  email: string;
  requestId: string;
}

const VerifyOTP: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [attempts, setAttempts] = useState(0);

  const state = location.state as LocationState;

  // Redirect if no email or requestId
  useEffect(() => {
    if (!state?.email || !state?.requestId) {
      navigate('/forgot-password');
    }
  }, [state, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  const otpValue = watch('otp');

  // Auto-format OTP input
  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue('otp', value);
  };

  const onSubmit = async (data: OTPFormData) => {
    if (attempts >= 3) {
      toast.error('تم تجاوز عدد المحاولات المسموح. يرجى طلب رمز جديد');
      return;
    }

    setIsLoading(true);
    try {
      const response = await passwordRecoveryService.verifyOTP({
        requestId: state.requestId,
        otp: data.otp,
      });

      if (response.right) {
        toast.success('تم التحقق من الرمز بنجاح');
        navigate('/reset-password', {
          state: {
            email: state.email,
            requestId: state.requestId,
          },
        });
      } else if (response.expired) {
        toast.error('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد');
        navigate('/forgot-password');
      } else {
        setAttempts(prev => prev + 1);
        toast.error(`رمز التحقق غير صحيح. المحاولات المتبقية: ${3 - attempts - 1}`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء التحقق من الرمز';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await passwordRecoveryService.resendOTP(state.requestId);
      setTimeLeft(300); // Reset timer
      setAttempts(0); // Reset attempts
      toast.success('تم إرسال رمز جديد إلى بريدك الإلكتروني');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء إعادة إرسال الرمز';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!state?.email || !state?.requestId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            التحقق من الرمز
          </h1>
          <p className="text-gray-600">
            أدخل رمز التحقق الذي تم إرساله إلى
          </p>
          <p className="text-blue-600 font-medium">{state.email}</p>
        </div>

        {/* Form */}
        <Card padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                label="رمز التحقق"
                type="text"
                placeholder="000000"
                {...register('otp')}
                onChange={handleOTPChange}
                error={errors.otp?.message}
                disabled={isLoading}
                className="w-full text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            {/* Timer */}
            <div className="text-center">
              {timeLeft > 0 ? (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 ml-1" />
                  <span>الوقت المتبقي: {formatTime(timeLeft)}</span>
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  انتهت صلاحية الرمز
                </div>
              )}
            </div>

            {/* Attempts Warning */}
            {attempts > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-yellow-600 ml-2" />
                  <span className="text-sm text-yellow-800">
                    المحاولات المتبقية: {3 - attempts}
                  </span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading || timeLeft === 0 || !otpValue || otpValue.length !== 6}
            >
              {isLoading ? 'جاري التحقق...' : 'تحقق من الرمز'}
            </Button>
          </form>
        </Card>

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleResendOTP}
            loading={isResending}
            disabled={isResending || timeLeft > 240} // Can resend after 1 minute
            className="flex items-center justify-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            {isResending ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
          </Button>
        </div>

        {/* Back to Forgot Password */}
        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/forgot-password')}
            className="flex items-center justify-center mx-auto text-gray-600"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة لطلب رمز جديد
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            لم تستلم الرمز؟ تحقق من مجلد الرسائل المزعجة أو{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 font-medium"
              onClick={handleResendOTP}
              disabled={isResending || timeLeft > 240}
            >
              أعد الإرسال
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
