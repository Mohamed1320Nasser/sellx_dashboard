import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Trash2, AlertCircle } from "lucide-react";
import { Button, Card, Input, Select, Textarea } from "../ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProducts } from "../../hooks/api/useProducts";
import { useCalculateQuote, useCreateQuote } from "../../hooks/api/useQuotes";
import type { Product } from "../../types";
import toast from "react-hot-toast";
import { formatCurrency, formatNumber } from "../../utils/currencyUtils";

// Enhanced validation schema
const quoteSchema = z.object({
  customerName: z.string().min(1, "اسم العميل مطلوب").optional(),
  customerContact: z.string().min(1, "رقم الهاتف مطلوب").optional(),
  customerEmail: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  currency: z.string().min(1, "العملة مطلوبة"),
  taxPercent: z.number().min(0, "نسبة الضريبة لا يمكن أن تكون سالبة").max(100, "نسبة الضريبة لا يمكن أن تتجاوز 100%"),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discountPercent: number;
}

interface QuoteFormProps {
  companyId: number;
  onSave?: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
  initialData?: any;
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  companyId,
  onSave,
  onCancel,
  loading = false,
  initialData,
}) => {
  // State management
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [calculatedQuote, setCalculatedQuote] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API hooks
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts({ companyId });
  const calculateMutation = useCalculateQuote();
  const createMutation = useCreateQuote();


  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors: formErrors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      currency: "EGP",
      taxPercent: 0,
      ...initialData,
    },
  });


  // Memoized product options
  const productOptions = useMemo(() => {
    if (!productsData?.data?.list || productsData.data.list.length === 0) {
      return [{ value: "", label: productsLoading ? "جاري تحميل المنتجات..." : "لا توجد منتجات متاحة" }];
    }
    
    return [
      { value: "", label: "اختر منتج" },
      ...productsData.data.list.map((product: Product) => ({
        value: String(product.id), // Ensure ID is string
        label: `${product.name} - ${formatCurrency(product.sellingPrice)} (المتاح: ${formatNumber(product.currentStock)})`,
        disabled: product.currentStock <= 0,
      })),
    ];
  }, [productsData, productsLoading]);


  // Calculate quote with debouncing and error handling
  const calculateQuote = useCallback(async () => {
    if (items.length === 0) {
      setCalculatedQuote(null);
      return;
    }

    setIsCalculating(true);
    setErrors({});

    try {
      // Use all items for calculation - let backend handle validation
      const validItems = items.filter(item => {
        const product = productsData?.data?.list?.find((p: Product) => p.id === item.productId);
        return product; // Just check if product exists, don't filter by stock
      });

      if (validItems.length === 0) {
        setCalculatedQuote(null);
        setIsCalculating(false);
        return;
      }

      const formValues = getValues();
      const quoteData = {
        companyId,
        customerName: formValues.customerName || "",
        customerContact: formValues.customerContact || "",
        customerEmail: formValues.customerEmail || "",
        currency: formValues.currency || "EGP",
        taxPercent: formValues.taxPercent || 0,
        items: validItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const result = await calculateMutation.mutateAsync(quoteData);
      setCalculatedQuote(result);
    } catch {
      setErrors({ calculation: "فشل في حساب العرض السعري" });
      setCalculatedQuote(null);
      toast.error("فشل في حساب العرض السعري");
    } finally {
      setIsCalculating(false);
    }
  }, [items, companyId, calculateMutation, productsData, getValues]);

  // Clear calculated quote when no items
  useEffect(() => {
    if (items.length === 0) {
      setCalculatedQuote(null);
    }
  }, [items.length]);

  // Add item with validation
  const addItem = useCallback(() => {
    if (!selectedProductId) {
      setErrors({ product: "يجب اختيار منتج" });
      return;
    }

    if (quantity <= 0) {
      setErrors({ quantity: "الكمية يجب أن تكون أكبر من صفر" });
      return;
    }

    const product = productsData?.data?.list?.find((p: Product) => p.id === selectedProductId);
    if (!product) {
      setErrors({ product: "المنتج غير موجود" });
      return;
    }

    if (product.currentStock < quantity) {
      setErrors({ quantity: `الكمية المطلوبة (${quantity}) تتجاوز المخزون المتاح (${product.currentStock})` });
      return;
    }

    // Check for duplicate products
    if (items.some(item => item.productId === selectedProductId)) {
      setErrors({ product: "هذا المنتج موجود بالفعل في العرض السعري" });
      return;
    }

    const newItem: QuoteItem = {
      id: `${selectedProductId}-${Date.now()}`,
      productId: selectedProductId.toString(), // Ensure it's a string for backend
      product,
      quantity,
      unitPrice: product.sellingPrice,
      lineTotal: product.sellingPrice * quantity,
      discountPercent: 0,
    };

    setItems(prev => [...prev, newItem]);
    setSelectedProductId("");
    setQuantity(1);
    setErrors({});
  }, [selectedProductId, quantity, productsData, items]);

  // Remove item
  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Update item quantity
  const updateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          lineTotal: item.unitPrice * newQuantity,
        };
      }
      return item;
    }));
  }, []);

  // Form submission handlers

  const handleSave = useCallback((data: QuoteFormData) => {
    if (items.length === 0) {
      toast.error("يجب إضافة منتجات للعرض السعري");
      return;
    }

    const quoteData = {
      ...data,
      companyId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    if (onSave) {
      onSave(quoteData);
    }
  }, [items, companyId, onSave]);

  // Manual calculation trigger
  const handleCalculate = useCallback(() => {
    calculateQuote();
  }, [calculateQuote]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">عرض سعري جديد</h1>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">العميل</label>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                إضافة عميل جديد
              </button>
              <div className="flex-1">
                <Input
                  placeholder="اسم العميل"
                  {...register("customerName")}
                  error={formErrors.customerName?.message}
                  disabled={loading}
                  className="h-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <Input
                  placeholder="أدخل رقم الهاتف"
                  {...register("customerContact")}
                  error={formErrors.customerContact?.message}
                  disabled={loading}
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <Input
                  placeholder="أدخل البريد الإلكتروني"
                  type="email"
                  {...register("customerEmail")}
                  error={formErrors.customerEmail?.message}
                  disabled={loading}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Add Products */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">إضافة منتجات</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">الكمية</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  error={errors.quantity}
                  disabled={loading}
                  className="h-10"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">اختر منتج</label>
                <Select
                  options={productOptions}
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                  disabled={loading || productsLoading}
                  placeholder={productsLoading ? "جاري تحميل المنتجات..." : "اختر منتج"}
                  className="h-10"
                />
                {productsError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    خطأ في تحميل المنتجات
                  </p>
                )}
                {errors.product && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.product}
                  </p>
                )}
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addItem}
                  disabled={loading || !selectedProductId || quantity <= 0}
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  إضافة
                </Button>
              </div>
            </div>
          </div>


          {/* Added Products List */}
          {items.length > 0 && (
            <div className="mb-6">
              <div className="space-y-2">
                {items.map((item) => {
                  const product = productsData?.data?.list?.find((p: Product) => p.id === item.productId);
                  const hasStockError = product && product.currentStock < item.quantity;
                  
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        hasStockError 
                          ? "bg-red-50 border-red-200" 
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${hasStockError ? "text-red-900" : "text-gray-900"}`}>
                            {item.product.name}
                          </h4>
                          {hasStockError && (
                            <span className="text-xs text-red-500 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              الكمية تتجاوز المخزون المتاح ({product.currentStock})
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${hasStockError ? "text-red-600" : "text-gray-600"}`}>
                          {item.unitPrice} جنيه × {item.quantity} = {item.lineTotal.toFixed(2)} جنيه
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.id, Number(e.target.value))}
                          className="w-16 h-8 text-sm"
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={loading}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

      {/* Calculation Error */}
      {errors.calculation && (
        <Card padding="md" className="border-red-200 bg-red-50">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{errors.calculation}</span>
          </div>
        </Card>
      )}

          {/* Quote Settings */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                <Select
                  options={[
                    { value: "EGP", label: "جنيه مصري" },
                    { value: "USD", label: "دولار أمريكي" },
                    { value: "EUR", label: "يورو" },
                    { value: "SAR", label: "ريال سعودي" },
                  ]}
                  value={watch("currency")}
                  onChange={(value) => setValue("currency", value)}
                  disabled={loading}
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الضريبة (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...register("taxPercent", { valueAsNumber: true })}
                  error={formErrors.taxPercent?.message}
                  disabled={loading}
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
                <Input
                  type="date"
                  {...register("validUntil")}
                  error={formErrors.validUntil?.message}
                  disabled={loading}
                  className="h-10"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <Textarea
                placeholder="ملاحظات إضافية"
                {...register("notes")}
                error={formErrors.notes?.message}
                disabled={loading}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Quote Summary */}
          {calculatedQuote && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">ملخص الفاتورة</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">المجموع الفرعي:</span>
                  <span className="font-medium">
                    {calculatedQuote.subtotal?.toFixed(2) || '0.00'} {calculatedQuote.currency || 'EGP'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">إجمالي الخصومات:</span>
                  <span className="font-medium text-green-600">
                    -{calculatedQuote.totalDiscount?.toFixed(2) || '0.00'} {calculatedQuote.currency || 'EGP'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">الضريبة ({calculatedQuote.taxPercent || 0}%):</span>
                  <span className="font-medium">
                    {calculatedQuote.taxAmount?.toFixed(2) || '0.00'} {calculatedQuote.currency || 'EGP'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-900">المجموع الكلي:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {calculatedQuote.total?.toFixed(2) || '0.00'} {calculatedQuote.currency || 'EGP'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleCalculate}
              disabled={items.length === 0 || loading || isCalculating}
              className="px-6 py-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {isCalculating ? "جاري الحساب..." : "حساب فقط"}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(handleSave)}
              disabled={items.length === 0 || loading || createMutation.isPending}
              loading={createMutation.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              حفظ العرض السعري
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteForm;