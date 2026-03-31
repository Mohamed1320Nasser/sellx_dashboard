import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Upload, X } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { useMutation } from '@tanstack/react-query';
import { companyService } from '../services/companyService';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

const companyRegisterSchema = z.object({
    companyName: z.string().min(2, 'اسم الشركة يجب أن يكون على الأقل حرفين').max(100, 'اسم الشركة لا يمكن أن يتجاوز 100 حرف'),
    companyEmail: z.string().email('البريد الإلكتروني غير صحيح').max(64, 'البريد الإلكتروني لا يمكن أن يتجاوز 64 حرف'),
    companyPhone: z.string().regex(/^[0-9]*$/, 'رقم الهاتف يجب أن يحتوي على أرقام فقط').min(5, 'رقم الهاتف يجب أن يكون على الأقل 5 أرقام').max(15, 'رقم الهاتف لا يمكن أن يتجاوز 15 رقم').optional().or(z.literal('')),
    companyAddress: z.string().min(5, 'العنوان يجب أن يكون على الأقل 5 أحرف').max(200, 'العنوان لا يمكن أن يتجاوز 200 حرف').optional().or(z.literal('')),
    taxNumber: z.string().min(5, 'الرقم الضريبي يجب أن يكون على الأقل 5 أحرف').max(50, 'الرقم الضريبي لا يمكن أن يتجاوز 50 حرف').optional().or(z.literal('')),
    ownerFullname: z.string().min(2, 'اسم المالك يجب أن يكون على الأقل حرفين').max(50, 'اسم المالك لا يمكن أن يتجاوز 50 حرف'),
    ownerEmail: z.string().email('بريد المالك الإلكتروني غير صحيح').max(64, 'البريد الإلكتروني لا يمكن أن يتجاوز 64 حرف'),
    ownerPhone: z.string().regex(/^[0-9]*$/, 'رقم هاتف المالك يجب أن يحتوي على أرقام فقط').min(5, 'رقم هاتف المالك يجب أن يكون على الأقل 5 أرقام').max(15, 'رقم هاتف المالك لا يمكن أن يتجاوز 15 رقم').optional().or(z.literal('')),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون على الأقل 8 أحرف')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'كلمة المرور يجب أن تحتوي على حرف صغير، حرف كبير، رقم، ورمز خاص'),
});

type CompanyRegisterForm = z.infer<typeof companyRegisterSchema>;

const CompanyRegister: React.FC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Logo upload state
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CompanyRegisterForm>({
        resolver: zodResolver(companyRegisterSchema),
        mode: 'onSubmit',
        shouldFocusError: false,
    });

    const registerCompanyMutation = useMutation({
        mutationFn: ({ data, logoFile }: { data: CompanyRegisterForm; logoFile?: File }) =>
            companyService.register(data, logoFile),
        onSuccess: () => {
            showSuccessToast('تم تسجيل الشركة بنجاح! سيتم مراجعة الطلب من قبل الإدارة.');
            navigate('/login');
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.msg || error?.message || 'حدث خطأ أثناء تسجيل الشركة';
            showErrorToast(errorMessage);
        },
    });

    // Handle logo file selection
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showErrorToast('حجم الملف يجب أن لا يتجاوز 2 ميجابايت');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                showErrorToast('الملف يجب أن يكون صورة');
                return;
            }

            setLogoFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove logo
    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (data: CompanyRegisterForm) => {
        setIsSubmitting(true);
        try {
            // Clean up empty optional fields
            const cleanedData = {
                ...data,
                companyPhone: data.companyPhone || undefined,
                companyAddress: data.companyAddress || undefined,
                taxNumber: data.taxNumber || undefined,
                ownerPhone: data.ownerPhone || undefined,
            };

            await registerCompanyMutation.mutateAsync({ data: cleanedData, logoFile: logoFile || undefined });
        } catch {
            // Error is handled by the mutation's onError callback
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <Building2 className="w-12 h-12 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        تسجيل شركة جديدة
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        أدخل بيانات شركتك لتسجيلها في النظام
                    </p>
                </div>

                <Card>
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        {/* Company Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                                بيانات الشركة
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="اسم الشركة *"
                                    {...register('companyName')}
                                    error={errors.companyName?.message}
                                />
                                
                                <Input
                                    label="البريد الإلكتروني *"
                                    type="email"
                                    {...register('companyEmail')}
                                    error={errors.companyEmail?.message}
                                />
                                
                                <Input
                                    label="رقم الهاتف (اختياري)"
                                    type="tel"
                                    {...register('companyPhone')}
                                    error={errors.companyPhone?.message}
                                />
                                
                                <Input
                                    label="العنوان (اختياري)"
                                    {...register('companyAddress')}
                                    error={errors.companyAddress?.message}
                                />
                                
                                <div className="md:col-span-2">
                                    <Input
                                        label="الرقم الضريبي (اختياري)"
                                        {...register('taxNumber')}
                                        error={errors.taxNumber?.message}
                                    />
                                </div>
                            </div>

                            {/* Logo Upload Section */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    شعار الشركة (اختياري)
                                </label>
                                <div className="flex items-center space-x-4 space-x-reverse">
                                    {logoPreview ? (
                                        <div className="relative">
                                            <img
                                                src={logoPreview}
                                                alt="Logo Preview"
                                                className="w-24 h-24 object-contain border-2 border-gray-300 rounded-lg p-2 bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                            <Upload className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload className="w-4 h-4 ml-2" />
                                            {logoFile ? 'تغيير الشعار' : 'اختيار شعار'}
                                        </Button>
                                        <p className="text-xs text-gray-500 mt-2">
                                            PNG, JPG, GIF حتى 2MB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Owner Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                                بيانات مالك الشركة
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="اسم المالك *"
                                    {...register('ownerFullname')}
                                    error={errors.ownerFullname?.message}
                                />
                                
                                <Input
                                    label="بريد المالك الإلكتروني *"
                                    type="email"
                                    {...register('ownerEmail')}
                                    error={errors.ownerEmail?.message}
                                />
                                
                                <Input
                                    label="رقم هاتف المالك (اختياري)"
                                    type="tel"
                                    {...register('ownerPhone')}
                                    error={errors.ownerPhone?.message}
                                />
                                
                                <div className="md:col-span-1">
                                    <Input
                                        label="كلمة المرور *"
                                        type="password"
                                        {...register('password')}
                                        error={errors.password?.message}
                                        placeholder="يجب أن تحتوي على حرف كبير وصغير ورقم ورمز"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex items-center justify-between pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/login')}
                                className="flex items-center"
                            >
                                <ArrowLeft className="w-4 h-4 ml-1" />
                                العودة لتسجيل الدخول
                            </Button>
                            
                            <Button
                                type="submit"
                                loading={isSubmitting || registerCompanyMutation.isPending}
                                className="px-8"
                            >
                                تسجيل الشركة
                            </Button>
                        </div>

                        <div className="text-center text-sm text-gray-500">
                            <p>
                                سيتم مراجعة طلب تسجيل الشركة من قبل الإدارة قبل تفعيل الحساب
                            </p>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default CompanyRegister;
