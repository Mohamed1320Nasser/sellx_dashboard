import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Select } from "../ui";

const userSchema = z.object({
  fullname: z.string().min(1, "الاسم الكامل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف"),
  phone: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData, profileFile?: File) => void;
  loading?: boolean;
  onCancel?: () => void;
  isSystemAdmin?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  onSubmit,
  loading = false,
  onCancel,
  isSystemAdmin = false,
}) => {
  const [profileFile, setProfileFile] = React.useState<File | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "user",
    },
  });

  const handleFormSubmit = (data: UserFormData) => {
    onSubmit(data, profileFile);
  };

  const roleOptions = [
    { value: "user", label: "مستخدم عادي" },
    { value: "admin", label: "مدير نظام" },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Input
        label="الاسم الكامل"
        placeholder="أدخل الاسم الكامل"
        {...register("fullname")}
        error={errors.fullname?.message}
        disabled={loading}
      />

      <Input
        label="البريد الإلكتروني"
        type="email"
        placeholder="أدخل البريد الإلكتروني"
        {...register("email")}
        error={errors.email?.message}
        disabled={loading}
      />

      <Input
        label="كلمة المرور"
        type="password"
        placeholder="أدخل كلمة المرور"
        {...register("password")}
        error={errors.password?.message}
        disabled={loading}
      />

      <Input
        label="رقم الهاتف (اختياري)"
        placeholder="أدخل رقم الهاتف"
        {...register("phone")}
        error={errors.phone?.message}
        disabled={loading}
      />

      {isSystemAdmin && (
        <Select
          label="نوع المستخدم"
          options={roleOptions}
          value={watch("role")}
          onChange={(value) => setValue("role", value as "user" | "admin")}
          error={errors.role?.message}
          disabled={loading}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          صورة الملف الشخصي (اختياري)
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
          إنشاء مستخدم
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
