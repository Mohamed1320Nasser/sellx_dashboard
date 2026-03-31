import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Select } from "../ui";
import { useCategories } from "../../hooks/api/useCategories";
import type { Product } from "../../types";
import { Scan, Sparkles } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  // SKU is optional - if empty, backend will generate 5-digit barcode
  sku: z.string().optional(),
  description: z.string().optional(),
  purchasePrice: z
    .number({ message: "سعر الشراء يجب أن يكون رقم" })
    .min(0, "سعر الشراء يجب أن يكون موجب"),
  sellingPrice: z
    .number({ message: "سعر البيع يجب أن يكون رقم" })
    .min(0, "سعر البيع يجب أن يكون موجب"),
  stockQuantity: z
    .number({ message: "الكمية يجب أن تكون رقم" })
    .min(0, "الكمية يجب أن تكون موجبة"),
  minStockLevel: z
    .number({ message: "الحد الأدنى يجب أن يكون رقم" })
    .min(0, "الحد الأدنى يجب أن يكون موجب"),
  categoryId: z.string().min(1, "الفئة مطلوبة"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  companyId: number;
  onSubmit: (data: ProductFormData & { companyId: number }) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  companyId,
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      description: product?.description || "",
      purchasePrice: product?.purchasePrice || 0,
      sellingPrice: product?.sellingPrice || 0,
      stockQuantity: product?.stockQuantity || 0,
      minStockLevel: product?.minStockLevel || 0,
      categoryId: product?.categoryId || product?.category?.id || "",
    },
  });

  // Get categories for dropdown
  const { data: categoriesData } = useCategories({
    companyId,
    limit: 100, // Get all categories
  });

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      // Get categoryId from either product.categoryId or product.category.id
      const categoryId = product.categoryId || product.category?.id || "";
      const formData = {
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        stockQuantity: product.stockQuantity || 0,
        minStockLevel: product.minStockLevel || 0,
        categoryId: categoryId,
      };
      reset(formData);
      // Ensure category is set even if categories haven't loaded yet
      if (categoryId) {
        setValue("categoryId", categoryId);
      }
    }
  }, [product, reset, setValue]);

  // Set category value when categories are loaded and product exists
  useEffect(() => {
    if (product && categoriesData?.data?.list) {
      // Get categoryId from either product.categoryId or product.category.id
      const categoryId = product.categoryId || product.category?.id || "";
      if (categoryId) {
        // Verify the category exists in the options before setting
        const categoryExists = categoriesData.data.list.some(cat => cat.id === categoryId);
        if (categoryExists) {
          setValue("categoryId", categoryId);
        }
      }
    }
  }, [categoriesData, product, setValue]);

  const handleFormSubmit = (data: ProductFormData) => {
    onSubmit({ ...data, companyId });
  };

  const categoryOptions = categoriesData?.data?.list.map((category) => ({
    value: category.id,
    label: category.name,
  })) || [];


  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="اسم المنتج"
          placeholder="أدخل اسم المنتج"
          {...register("name")}
          error={errors.name?.message}
          disabled={loading}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الباركود
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="أدخل باركود المنتج أو اتركه فارغاً للتوليد التلقائي"
              {...register("sku")}
              error={errors.sku?.message}
              disabled={loading}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Generate 5-digit random barcode for preview
                const randomBarcode = String(Math.floor(10000 + Math.random() * 90000));
                setValue("sku", randomBarcode);
              }}
              disabled={loading}
              title="توليد باركود تلقائي"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            يمكنك إدخال باركود المنتج الأصلي (مثل EAN-13) أو تركه فارغاً لتوليد رقم محلي من 5 أرقام
          </p>
        </div>
      </div>

      <Input
        label="وصف المنتج"
        placeholder="أدخل وصف المنتج (اختياري)"
        {...register("description")}
        error={errors.description?.message}
        disabled={loading}
      />

      <Select
        label="الفئة"
        placeholder="اختر الفئة"
        options={categoryOptions}
        value={watch("categoryId")}
        onChange={(value) => setValue("categoryId", value)}
        error={errors.categoryId?.message}
        disabled={loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="سعر الشراء"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("purchasePrice", { valueAsNumber: true })}
          error={errors.purchasePrice?.message}
          disabled={loading}
        />

        <Input
          label="سعر البيع"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("sellingPrice", { valueAsNumber: true })}
          error={errors.sellingPrice?.message}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="الكمية في المخزون"
          type="number"
          placeholder="0"
          {...register("stockQuantity", { valueAsNumber: true })}
          error={errors.stockQuantity?.message}
          disabled={loading}
        />

        <Input
          label="الحد الأدنى للمخزون"
          type="number"
          placeholder="0"
          {...register("minStockLevel", { valueAsNumber: true })}
          error={errors.minStockLevel?.message}
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
          {product ? "تحديث المنتج" : "إنشاء منتج جديد"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
