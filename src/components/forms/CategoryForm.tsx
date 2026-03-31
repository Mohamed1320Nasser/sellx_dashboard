import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "../ui";
import type { Category } from "../../types";

const categorySchema = z.object({
  name: z.string().min(1, "اسم الفئة مطلوب"),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: Category;
  companyId: number;
  onSubmit: (data: CategoryFormData & { companyId: number }) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  companyId,
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
    },
  });

  // Update form values when category prop changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name || "",
        description: category.description || "",
      });
    }
  }, [category, reset]);

  const handleFormSubmit = (data: CategoryFormData) => {
    onSubmit({ ...data, companyId });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Input
        label="اسم الفئة"
        placeholder="أدخل اسم الفئة"
        {...register("name")}
        error={errors.name?.message}
        disabled={loading}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">الوصف (اختياري)</label>
        <textarea
          {...register("description")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="أدخل وصف الفئة"
          rows={3}
          disabled={loading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
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
          {category ? "تحديث الفئة" : "إنشاء فئة جديدة"}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;
