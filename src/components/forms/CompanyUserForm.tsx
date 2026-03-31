import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Select } from "../ui";

const companyUserSchema = z.object({
  fullname: z.string().min(1, "الاسم الكامل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف").optional(),
  phone: z.string().optional(),
  role: z.enum(["CASHIER", "MANAGER", "ADMIN"]),
});

type CompanyUserFormData = z.infer<typeof companyUserSchema>;

interface CompanyUserFormProps {
  companyId: number;
  onSubmit: (data: CompanyUserFormData & { companyId: number }) => void;
  loading?: boolean;
  onCancel?: () => void;
  initialData?: Partial<CompanyUserFormData>;
  isEdit?: boolean;
}

const CompanyUserForm: React.FC<CompanyUserFormProps> = ({
  companyId,
  onSubmit,
  loading = false,
  onCancel,
  initialData,
  isEdit = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyUserFormData>({
    resolver: zodResolver(companyUserSchema),
    defaultValues: {
      role: "CASHIER",
      ...initialData,
    },
  });

  const handleFormSubmit = (data: CompanyUserFormData) => {
    // Validate password is required when creating new user
    if (!isEdit && (!data.password || data.password.trim() === "")) {
      return; // Form validation will handle the error
    }
    
    // Remove password from data if it's empty (for edit mode)
    const submitData = { ...data };
    if (isEdit && (!submitData.password || submitData.password.trim() === "")) {
      delete submitData.password;
    }
    
    onSubmit({ ...submitData, companyId });
  };

  const roleOptions = [
    { value: "CASHIER", label: "كاشير" },
    { value: "MANAGER", label: "مدير" },
    { value: "ADMIN", label: "مدير شركة" },
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

      {!isEdit && (
        <Input
          label="كلمة المرور"
          type="password"
          placeholder="أدخل كلمة المرور"
          {...register("password", {
            required: !isEdit ? "كلمة المرور مطلوبة" : false,
            minLength: {
              value: 6,
              message: "كلمة المرور يجب أن تكون على الأقل 6 أحرف"
            }
          })}
          error={errors.password?.message}
          disabled={loading}
        />
      )}

      <Input
        label="رقم الهاتف (اختياري)"
        placeholder="أدخل رقم الهاتف"
        {...register("phone")}
        error={errors.phone?.message}
        disabled={loading}
      />

      <Select
        label="الدور في الشركة"
        options={roleOptions}
        value={watch("role")}
        onChange={(value) => setValue("role", value as "CASHIER" | "MANAGER" | "ADMIN")}
        error={errors.role?.message}
        disabled={loading}
      />

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
          {isEdit ? "تحديث المستخدم" : "إنشاء مستخدم"}
        </Button>
      </div>
    </form>
  );
};

export default CompanyUserForm;
