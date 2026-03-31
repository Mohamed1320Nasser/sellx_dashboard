import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "../ui";

const companySchema = z.object({
  name: z.string().min(2, "اسم الشركة يجب أن يكون على الأقل حرفين").max(100, "اسم الشركة يجب أن يكون أقل من 100 حرف"),
  email: z.string().email("البريد الإلكتروني غير صحيح").min(5, "البريد الإلكتروني قصير جداً").max(64, "البريد الإلكتروني طويل جداً"),
  phone: z.string().optional().refine((val) => !val || /^[0-9]*$/.test(val), "رقم الهاتف يجب أن يحتوي على أرقام فقط"),
  address: z.string().optional().refine((val) => !val || val.length >= 5, "العنوان يجب أن يكون على الأقل 5 أحرف"),
  taxNumber: z.string().optional().refine((val) => !val || val.length >= 5, "الرقم الضريبي يجب أن يكون على الأقل 5 أحرف"),
  adminFullname: z.string().min(2, "اسم المدير يجب أن يكون على الأقل حرفين").max(50, "اسم المدير يجب أن يكون أقل من 50 حرف"),
  adminEmail: z.string().email("البريد الإلكتروني للمدير غير صحيح").min(5, "البريد الإلكتروني قصير جداً").max(64, "البريد الإلكتروني طويل جداً"),
  adminPassword: z.string()
    .min(8, "كلمة المرور يجب أن تكون على الأقل 8 أحرف")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "كلمة المرور يجب أن تحتوي على حرف صغير، حرف كبير، رقم، ورمز خاص"),
  adminPhone: z.string().optional().refine((val) => !val || /^[0-9]*$/.test(val), "رقم الهاتف يجب أن يحتوي على أرقام فقط"),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormProps {
  onSubmit: (data: CompanyFormData, profileFile?: File) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const [profileFile, setProfileFile] = React.useState<File | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const handleFormSubmit = (data: CompanyFormData) => {
    onSubmit(data, profileFile);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Company Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات الشركة</h3>
        <div className="space-y-4">
          <Input
            label="اسم الشركة"
            placeholder="أدخل اسم الشركة"
            {...register("name")}
            error={errors.name?.message}
            disabled={loading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="أدخل البريد الإلكتروني"
              {...register("email")}
              error={errors.email?.message}
              disabled={loading}
            />

            <Input
              label="رقم الهاتف"
              placeholder="أدخل رقم الهاتف"
              {...register("phone")}
              error={errors.phone?.message}
              disabled={loading}
            />
          </div>

          <Input
            label="العنوان"
            placeholder="أدخل عنوان الشركة"
            {...register("address")}
            error={errors.address?.message}
            disabled={loading}
          />

          <Input
            label="الرقم الضريبي"
            placeholder="أدخل الرقم الضريبي (اختياري)"
            {...register("taxNumber")}
            error={errors.taxNumber?.message}
            disabled={loading}
          />
        </div>
      </div>

      {/* Admin Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات مدير الشركة</h3>
        <div className="space-y-4">
          <Input
            label="اسم المدير"
            placeholder="أدخل اسم مدير الشركة"
            {...register("adminFullname")}
            error={errors.adminFullname?.message}
            disabled={loading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="البريد الإلكتروني للمدير"
              type="email"
              placeholder="أدخل البريد الإلكتروني"
              {...register("adminEmail")}
              error={errors.adminEmail?.message}
              disabled={loading}
            />

            <Input
              label="رقم هاتف المدير"
              placeholder="أدخل رقم الهاتف"
              {...register("adminPhone")}
              error={errors.adminPhone?.message}
              disabled={loading}
            />
          </div>

          <Input
            label="كلمة مرور المدير"
            type="password"
            placeholder="أدخل كلمة المرور"
            {...register("adminPassword")}
            error={errors.adminPassword?.message}
            disabled={loading}
          />
        </div>
      </div>

      {/* Profile Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          شعار الشركة (اختياري)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setProfileFile(e.target.files?.[0])}
          className="input-field"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end space-x-4 space-x-reverse">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            إلغاء
          </Button>
        )}
        <Button type="submit" loading={loading}>
          تسجيل الشركة
        </Button>
      </div>
    </form>
  );
};

export default CompanyForm;
