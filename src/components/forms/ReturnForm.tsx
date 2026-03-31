import React, { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Package, AlertTriangle, Search, ChevronDown } from "lucide-react";
import { Button, Input, Card } from "../ui";
import { useSales, useSale } from "../../hooks/api/useSales";
import { formatCurrency } from "../../utils";
import { useSessionAuthStore } from "../../stores/sessionAuthStore";
import type { Return, CreateReturnRequest, Sale, Product } from "../../types";

const returnItemSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
  quantity: z
    .number({ message: "الكمية يجب أن تكون رقم" })
    .min(1, "الكمية يجب أن تكون أكبر من 0"),
  unitPrice: z
    .number({ message: "سعر الوحدة يجب أن يكون رقم" })
    .min(0.01, "سعر الوحدة يجب أن يكون أكبر من 0"),
  reason: z.string().optional(),
  condition: z.enum(["NEW", "USED", "DAMAGED", "DEFECTIVE"]).optional(),
});

const returnSchema = z.object({
  originalSaleId: z
    .number({ message: "رقم البيع الأصلي مطلوب" })
    .min(1, "رقم البيع الأصلي يجب أن يكون أكبر من 0"),
  clientId: z.number().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  refundAmount: z
    .number({ message: "مبلغ الاسترداد يجب أن يكون رقم" })
    .min(0, "مبلغ الاسترداد يجب أن يكون موجب")
    .optional(),
  items: z.array(returnItemSchema).min(1, "يجب إضافة منتج واحد على الأقل"),
});

type ReturnFormData = z.infer<typeof returnSchema>;

interface ReturnFormProps {
  return?: Return;
  companyId: number;
  onSubmit: (data: CreateReturnRequest) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const ReturnForm: React.FC<ReturnFormProps> = ({
  return: returnData,
  companyId,
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const { user } = useSessionAuthStore();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // For API search
  const [displaySearchTerm, setDisplaySearchTerm] = useState(""); // For input field display
  const [showSaleDropdown, setShowSaleDropdown] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      originalSaleId: returnData?.originalSaleId || 0,
      clientId: returnData?.clientId || undefined,
      reason: returnData?.reason || "",
      notes: returnData?.notes || "",
      refundAmount: returnData?.refundAmount || 0,
      items: returnData?.items?.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        reason: item.reason || "",
        condition: item.condition || "NEW",
      })) || [
        {
          productId: "",
          quantity: 1,
          unitPrice: 0,
          reason: "",
          condition: "NEW",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedSaleId = watch("originalSaleId");

  // Get sales data
  const salesParams = useMemo(() => ({
    companyId,
    page: 1,
    limit: 100,
    search: searchTerm,
  }), [companyId, searchTerm]);
  const { data: salesData, error: salesError } = useSales(salesParams);
  

  // Get detailed sale data when a sale is selected
  const { data: detailedSale, isLoading: isLoadingSale, error: saleError } = useSale(selectedSale?.id ? Number(selectedSale.id) : 0, companyId);

  // Mock data for testing when API fails
  const mockSales = useMemo(() => [
    {
      id: "1",
      receiptNumber: "RCP-001",
      totalAmount: 100.00,
      saleDate: "2024-01-15T10:00:00Z",
      companyId: 1,
      userId: 1,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      client: { id: 1, name: "عميل تجريبي", phone: "01234567890" },
      items: [
        { product: { id: "1", name: "منتج تجريبي 1", sku: "SKU001", purchasePrice: 50, sellingPrice: 100, stockQuantity: 10, currentStock: 10, minStockLevel: 5, categoryId: "1", companyId: 1, userId: 1, createdAt: "2024-01-15T10:00:00Z", updatedAt: "2024-01-15T10:00:00Z", deletedAt: null } as unknown as Product },
        { product: { id: "2", name: "منتج تجريبي 2", sku: "SKU002", purchasePrice: 75, sellingPrice: 150, stockQuantity: 8, currentStock: 8, minStockLevel: 3, categoryId: "1", companyId: 1, userId: 1, createdAt: "2024-01-15T10:00:00Z", updatedAt: "2024-01-15T10:00:00Z", deletedAt: null } as unknown as Product }
      ]
    },
    {
      id: "2",
      receiptNumber: "RCP-002", 
      totalAmount: 250.00,
      saleDate: "2024-01-16T14:30:00Z",
      companyId: 1,
      userId: 1,
      createdAt: "2024-01-16T14:30:00Z",
      updatedAt: "2024-01-16T14:30:00Z",
      client: { id: 2, name: "عميل آخر", phone: "09876543210" },
      items: [
        { product: { id: "3", name: "منتج تجريبي 3", sku: "SKU003", purchasePrice: 100, sellingPrice: 200, stockQuantity: 5, currentStock: 5, minStockLevel: 2, categoryId: "1", companyId: 1, userId: 1, createdAt: "2024-01-16T14:30:00Z", updatedAt: "2024-01-16T14:30:00Z", deletedAt: null } as unknown as Product }
      ]
    }
  ] as unknown as Sale[], []);

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    // Use mock data if API fails
    const salesList = salesError ? mockSales : (salesData?.data?.list || []);
    
    if (!searchTerm) return salesList;
    
    return salesList.filter(sale => {
      const clientName = sale.client?.name?.toLowerCase() || "";
      const receiptNumber = sale.receiptNumber?.toLowerCase() || "";
      const clientPhone = sale.client?.phone?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      
      return clientName.includes(search) || 
             receiptNumber.includes(search) || 
             clientPhone.includes(search);
    });
  }, [salesData?.data?.list, searchTerm, salesError, mockSales]);

  // Calculate total amount
  const totalAmount = watchedItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  // Update refund amount when total changes
  useEffect(() => {
    if (!returnData) {
      setValue("refundAmount", totalAmount);
    }
  }, [totalAmount, setValue, returnData]);

  // Handle sale selection
  useEffect(() => {
    if (watchedSaleId && salesData?.data?.list) {
      const sale = salesData.data.list.find(s => Number(s.id) === watchedSaleId);
      setSelectedSale(sale || null);
    } else if (watchedSaleId && salesError) {
      const mockSale = mockSales.find(sale => Number(sale.id) === watchedSaleId);
      setSelectedSale(mockSale || null);
    }
  }, [watchedSaleId, salesData, salesError, mockSales]);

  // Update products when detailed sale data is loaded
  useEffect(() => {
    const saleData = detailedSale as any;
    if (saleData?.data?.items) {
      const products = saleData.data.items.map(item => item.product).filter(Boolean) as Product[];
      setAvailableProducts(products);
    } else if (selectedSale && !detailedSale && !saleError) {
      setAvailableProducts([]);
    } else if (selectedSale && (saleError || salesError)) {
      const mockSale = mockSales.find(sale => Number(sale.id) === Number(selectedSale.id));
      if (mockSale?.items) {
        const products = mockSale.items.map(item => item.product).filter(Boolean);
        setAvailableProducts(products);
      }
    }
  }, [detailedSale, selectedSale, saleError, salesError, mockSales]);

  // Initialize displaySearchTerm when a sale is pre-selected or cleared
  useEffect(() => {
    if (selectedSale) {
      setDisplaySearchTerm(`${selectedSale.client?.name || "عميل نقدي"} - ${formatCurrency(selectedSale.totalAmount)} - ${new Date(selectedSale.saleDate).toLocaleDateString('ar-EG')} - ${selectedSale.receiptNumber}`);
    } else {
      setDisplaySearchTerm("");
    }
  }, [selectedSale]);


  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSaleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFormSubmit = (data: ReturnFormData) => {
    if (user?.id === undefined || user?.id === null) {
      // User ID is required for creating returns
      return;
    }
    
    const submitData: CreateReturnRequest = {
      ...data,
      companyId,
      userId: user.id,
      refundAmount: data.refundAmount || totalAmount,
    };
    
    onSubmit(submitData);
  };

  const addItem = () => {
    append({
      productId: "",
      quantity: 1,
      unitPrice: 0,
      reason: "",
      condition: "NEW",
    });
  };

  const handleSaleSelect = (sale: Sale) => {
    const saleId = Number(sale.id);
    setValue("originalSaleId", saleId);
    setSelectedSale(sale);
    setDisplaySearchTerm(`${sale.client?.name || "عميل نقدي"} - ${formatCurrency(sale.totalAmount)} - ${new Date(sale.saleDate).toLocaleDateString('ar-EG')} - ${sale.receiptNumber}`);
    setSearchTerm(""); // Clear searchTerm for API to fetch a broader list
    setShowSaleDropdown(false);
    
    // Force form to re-render to trigger the sale selection effect
    setValue("originalSaleId", saleId, { shouldDirty: true, shouldTouch: true });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSaleDropdown(true);
    if (!value) {
      setSelectedSale(null);
      setValue("originalSaleId", 0);
    }
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Helper function to get original sale item data
  const getOriginalSaleItem = (productId: string) => {
    const saleData = detailedSale as any;
    if (saleData?.data?.items) {
      return saleData.data.items.find(item => item.product.id === productId);
    }
    return null;
  };

  const updateItemPrice = (index: number, productId: string) => {
    const saleItem = getOriginalSaleItem(productId);
    if (saleItem) {
      setValue(`items.${index}.unitPrice`, saleItem.unitPrice);
    }
  };

  // Custom validation for quantity against original sale
  const validateQuantity = (quantity: number, productId: string) => {
    const saleItem = getOriginalSaleItem(productId);
    if (saleItem && quantity > saleItem.quantity) {
      return `الكمية المتاحة للاسترداد: ${saleItem.quantity} وحدة فقط`;
    }
    return true;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Sale Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          تفاصيل البيع الأصلي
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم البيع الأصلي *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={displaySearchTerm}
                onChange={(e) => {
                  setDisplaySearchTerm(e.target.value);
                  handleSearchChange(e.target.value);
                }}
                onFocus={() => setShowSaleDropdown(true)}
                placeholder="ابحث برقم الإيصال أو اسم العميل أو رقم الهاتف..."
                className={`w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:border-gray-400 ${errors.originalSaleId ? 'border-red-500' : ''}`}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {showSaleDropdown && filteredSales.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => handleSaleSelect(sale)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {sale.client?.name || "عميل نقدي"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {sale.receiptNumber} - {new Date(sale.saleDate).toLocaleDateString('ar-EG')}
                        </div>
                        {sale.client?.phone && (
                          <div className="text-xs text-gray-500">
                            {sale.client.phone}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(sale.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showSaleDropdown && filteredSales.length === 0 && searchTerm && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="px-4 py-3 text-gray-500 text-center">
                  لا توجد نتائج
                </div>
              </div>
            )}
            
            {/* Hidden input to ensure form validation works */}
            <input
              type="hidden"
              {...register("originalSaleId", { valueAsNumber: true })}
            />
          </div>

          {selectedSale && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العميل
              </label>
              <Input
                value={selectedSale.client?.name || "عميل نقدي"}
                disabled
                className="bg-gray-50"
              />
              {saleError && (
                <div className="mt-2 text-sm text-red-600">
                  خطأ في تحميل تفاصيل البيع: {saleError.message}
                </div>
              )}
              {salesError && (
                <div className="mt-2 text-sm text-yellow-600">
                  تحذير: استخدام بيانات تجريبية - {salesError.message}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedSale && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">تفاصيل البيع:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">رقم الإيصال:</span>
                <p className="font-medium">{selectedSale.receiptNumber}</p>
              </div>
              <div>
                <span className="text-gray-600">تاريخ البيع:</span>
                <p className="font-medium">{new Date(selectedSale.saleDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-600">المبلغ الإجمالي:</span>
                <p className="font-medium">{formatCurrency(selectedSale.totalAmount)}</p>
              </div>
              <div>
                <span className="text-gray-600">طريقة الدفع:</span>
                <p className="font-medium">{selectedSale.paymentMethod || "نقدي"}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Return Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" />
            المنتجات المرتجعة
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج
          </Button>
        </div>

        {/* Information Box */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">قواعد الإرجاع:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>يمكن إرجاع كمية أقل من أو تساوي الكمية المباعة فقط</li>
                <li>سعر الوحدة يتم تعبئته تلقائياً من سعر البيع الأصلي</li>
                <li>مبلغ الاسترداد = الكمية × سعر الوحدة الأصلي</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">منتج {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المنتج *
                  </label>
                  <select
                    {...register(`items.${index}.productId`)}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:border-gray-400 ${errors.items?.[index]?.productId ? 'border-red-500' : ''}`}
                    onChange={(e) => updateItemPrice(index, e.target.value)}
                  >
                    <option value="">اختر المنتج</option>
                    {availableProducts.length > 0 ? (
                      availableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {selectedSale 
                          ? (isLoadingSale ? "جاري تحميل المنتجات..." : detailedSale ? "لا توجد منتجات في هذا البيع" : "جاري تحميل المنتجات...") 
                          : "اختر البيع الأصلي أولاً"
                        }
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الكمية *
                    {(() => {
                      const productId = watch(`items.${index}.productId`);
                      const saleItem = getOriginalSaleItem(productId);
                      return saleItem ? (
                        <span className="text-xs text-gray-500 font-normal">
                          (متاح: {saleItem.quantity})
                        </span>
                      ) : null;
                    })()}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={(() => {
                      const productId = watch(`items.${index}.productId`);
                      const saleItem = getOriginalSaleItem(productId);
                      return saleItem ? saleItem.quantity : undefined;
                    })()}
                    {...register(`items.${index}.quantity`, { 
                      valueAsNumber: true,
                      validate: (value) => {
                        const productId = watch(`items.${index}.productId`);
                        return validateQuantity(value, productId);
                      }
                    })}
                    error={errors.items?.[index]?.quantity?.message}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    سعر الوحدة *
                    <span className="text-xs text-gray-500 font-normal">(سعر البيع الأصلي)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    error={errors.items?.[index]?.unitPrice?.message}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50 shadow-sm transition-all duration-200"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحالة
                  </label>
                  <select {...register(`items.${index}.condition`)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:border-gray-400">
                    <option value="NEW">جديد</option>
                    <option value="USED">مستعمل</option>
                    <option value="DAMAGED">تالف</option>
                    <option value="DEFECTIVE">معيب</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  سبب الإرجاع
                </label>
                <Input
                  {...register(`items.${index}.reason`)}
                  placeholder="أدخل سبب الإرجاع"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
                />
              </div>

              <div className="mt-2 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {(() => {
                    const productId = watch(`items.${index}.productId`);
                    const saleItem = getOriginalSaleItem(productId);
                    return saleItem ? (
                      <span>سعر البيع الأصلي: {formatCurrency(saleItem.unitPrice)} × {saleItem.quantity} = {formatCurrency(saleItem.unitPrice * saleItem.quantity)}</span>
                    ) : null;
                  })()}
                </div>
                <span className="text-sm font-semibold text-green-600">
                  مبلغ الاسترداد: {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0))}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-green-800">المجموع الإجمالي:</span>
            <span className="text-xl font-bold text-green-900">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </Card>

      {/* Return Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          تفاصيل الإرجاع
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مبلغ الاسترداد
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("refundAmount", { valueAsNumber: true })}
              error={errors.refundAmount?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              سبب الإرجاع العام
            </label>
            <Input
              {...register("reason")}
              placeholder="أدخل سبب الإرجاع العام"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات إضافية
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="أدخل أي ملاحظات إضافية"
          />
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {returnData ? "تحديث الإرجاع" : "إنشاء الإرجاع"}
        </Button>
      </div>
    </form>
  );
};

export default ReturnForm;
