import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select } from '../ui';
import { useProducts } from '../../hooks/api/useProducts';
import { StockMovementType } from '../../types/business';
import type { StockMovement } from '../../types/business';

// Form validation schema
const stockMovementSchema = z.object({
  productId: z.string().min(1, 'يرجى اختيار منتج'),
  type: z.nativeEnum(StockMovementType, {
    message: 'يرجى اختيار نوع الحركة',
  }),
  quantity: z.number().min(1, 'الكمية يجب أن تكون أكبر من 0'),
  reference: z.string().optional(),
});

type StockMovementFormData = z.infer<typeof stockMovementSchema>;

interface StockMovementFormProps {
  stockMovement?: StockMovement | null;
  companyId: number;
  onSubmit: (data: StockMovementFormData) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const StockMovementForm: React.FC<StockMovementFormProps> = ({
  stockMovement,
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
  } = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      productId: stockMovement?.productId || '',
      type: stockMovement?.type || StockMovementType.ADJUSTMENT,
      quantity: 1,
      reference: stockMovement?.reference || '',
    },
  });

  // Get products for dropdown
  const { data: productsData, isLoading: productsLoading } = useProducts({
    companyId,
    limit: 1000, // Get all products
  });

  const products = (productsData as any)?.data?.list || [];
  const selectedProductId = watch('productId');
  const selectedProduct = products.find(p => p.id === selectedProductId);


  // Reset form when stockMovement changes
  useEffect(() => {
    if (stockMovement) {
      reset({
        productId: stockMovement.productId,
        type: stockMovement.type,
        quantity: Math.abs(stockMovement.quantity),
        reference: stockMovement.reference || '',
      });
    }
  }, [stockMovement, reset]);

  const getMovementTypeLabel = (type: StockMovementType) => {
    const labels = {
      [StockMovementType.PURCHASE]: 'شراء',
      [StockMovementType.SALE]: 'بيع',
      [StockMovementType.ADJUSTMENT]: 'تعديل مخزون',
      [StockMovementType.RETURN]: 'إرجاع',
    };
    return labels[type];
  };

  const getMovementTypeDescription = (type: StockMovementType) => {
    const descriptions = {
      [StockMovementType.PURCHASE]: 'إضافة منتجات للمخزون',
      [StockMovementType.SALE]: 'خصم منتجات من المخزون',
      [StockMovementType.ADJUSTMENT]: 'تعديل كمية المخزون (إضافة أو خصم)',
      [StockMovementType.RETURN]: 'إرجاع منتجات للمخزون',
    };
    return descriptions[type];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Product Selection */}
      <Select
        label="المنتج"
        placeholder="اختر منتج"
        options={products.map((product) => ({
          value: String(product.id), // Ensure ID is string
          label: `${product.name} (${product.sku}) - المخزون الحالي: ${product.stockQuantity}`,
        }))}
        value={watch('productId')}
        onChange={(value) => setValue('productId', value)}
        error={errors.productId?.message}
        disabled={loading}
        loading={productsLoading}
      />

      {/* Current Stock Display */}
      {selectedProduct && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-blue-800">المخزون الحالي</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p><strong>المنتج:</strong> {selectedProduct.name}</p>
                <p><strong>الكمية المتاحة:</strong> {selectedProduct.stockQuantity} وحدة</p>
                <p><strong>الحد الأدنى:</strong> {selectedProduct.minStockLevel} وحدة</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movement Type */}
      <div>
        <Select
          label="نوع الحركة"
          placeholder="اختر نوع الحركة"
          options={Object.values(StockMovementType).map((type) => ({
            value: type,
            label: getMovementTypeLabel(type),
          }))}
          value={watch('type')}
          onChange={(value) => setValue('type', value as StockMovementType)}
          error={errors.type?.message}
          disabled={loading}
        />
        {watch('type') && (
          <p className="mt-2 text-sm text-gray-500">
            {getMovementTypeDescription(watch('type'))}
          </p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الكمية <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          {...register('quantity', { valueAsNumber: true })}
          placeholder="أدخل الكمية"
          disabled={loading}
          min="1"
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          للخصم من المخزون، استخدم قيمة سالبة
        </p>
      </div>

      {/* Reference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          المرجع (اختياري)
        </label>
        <Input
          {...register('reference')}
          placeholder="مثال: تعديل مخزون، إرجاع منتج، إلخ"
          disabled={loading}
        />
        {errors.reference && (
          <p className="mt-1 text-sm text-red-600">{errors.reference.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200">
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
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          loading={loading}
        >
          {stockMovement ? 'تحديث الحركة' : 'إنشاء الحركة'}
        </Button>
      </div>
    </form>
  );
};

export default StockMovementForm;
