import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X, ShoppingCart, Plus, Minus, Trash2, Search, Package, Printer } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Input, Select, Card, Modal } from "../components/ui";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { useCreateSale } from "../hooks/api/useSales";
import { useClients, useCreateClient } from "../hooks/api/useClients";
import { useProducts } from "../hooks/api/useProducts";
import { useCategories } from "../hooks/api/useCategories";
import { useActiveTaxSettings } from "../hooks/api/useTax";
import { productService } from "../services/productService";
import { useForm } from "react-hook-form";
import { formatCurrency, formatNumber } from "../utils/currencyUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { printReceipt } from "../services/printService";
import { PrintReceiptPreview } from "../components/printer/PrintReceiptPreview";
import { usePrinterConfigStore } from "../stores/printerConfigStore";
import { companyService } from "../services/companyService";

// Define the base schema without refine for proper type inference
const saleBaseSchema = z.object({
  clientType: z.enum(["cash", "existing", "new"]),
  clientId: z.number().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "CREDIT"]),
  additionalFee: z.coerce.number().min(0, "الرسوم الإضافية يجب أن تكون أكبر من أو تساوي صفر").default(0),
  additionalFeeLabel: z.string().optional(),
  notes: z.string().optional(),
  // Tax and Discount fields
  taxSettingId: z.string().optional(),
  discountType: z.enum(["none", "amount", "percent"]).default("none"),
  discountAmount: z.coerce.number().min(0, "الخصم يجب أن يكون أكبر من أو يساوي صفر").default(0),
  discountPercent: z.coerce.number().min(0).max(100, "نسبة الخصم يجب أن تكون بين 0 و 100").default(0),
  paidAmount: z.coerce.number().min(0, "المبلغ المدفوع يجب أن يكون أكبر من أو يساوي صفر").optional(),
  // New client fields
  newClientName: z.string().optional(),
  newClientPhone: z.string().optional(),
  newClientEmail: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")).or(z.undefined()),
  newClientAddress: z.string().optional(),
});

// Use the base schema for type inference
type SaleFormData = z.infer<typeof saleBaseSchema>;

// Create the refined schema for validation
const saleSchema = saleBaseSchema
  .refine((data) => {
    if (data.clientType === "new") {
      return data.newClientName && data.newClientName.length > 0;
    }
    return true;
  }, {
    message: "اسم العميل الجديد مطلوب",
    path: ["newClientName"],
  })
  .refine((data) => {
    if (data.clientType === "new") {
      return data.newClientPhone && data.newClientPhone.length > 0;
    }
    return true;
  }, {
    message: "رقم هاتف العميل مطلوب",
    path: ["newClientPhone"],
  });

const clientSchema = z.object({
  name: z.string().min(1, "اسم العميل مطلوب"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  address: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const SalesCreate: React.FC = () => {
  const navigate = useNavigate();
  const { company, user } = useSessionAuthStore();
  const companyId = company?.companyId || company?.company?.id;

  // Form state
  const [items, setItems] = useState<SaleItem[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printableSale, setPrintableSale] = useState<any>(null);
  const [clientType, setClientType] = useState<"cash" | "existing" | "new">("cash");
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [clientSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [lastScannedBarcode, setLastScannedBarcode] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Fetch data
  const { data: clientsData } = useClients({
    companyId: companyId!,
    page: 1,
    limit: 100,
  });

  const { data: productsData } = useProducts({
    companyId: companyId!,
    page: 1,
    limit: 100,
  });

  const { data: categoriesData } = useCategories({
    companyId: companyId!,
    limit: 100,
  });

  // Fetch tax settings
  const { data: taxSettingsData } = useActiveTaxSettings(companyId!);

  // Mutations
  const createSaleMutation = useCreateSale();
  const createClientMutation = useCreateClient();

  // Sale form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema) as any,
    defaultValues: {
      clientType: "cash",
      paymentMethod: "CASH",
      additionalFee: 0,
      discountType: "none",
      discountAmount: 0,
      discountPercent: 0,
    },
  });

  // Client form
  const {
    register: registerClient,
    handleSubmit: handleSubmitClient,
    reset: resetClient,
    formState: { errors: clientErrors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  // Get watched form values
  const watchedTaxSettingId = watch("taxSettingId");
  const watchedDiscountType = watch("discountType");
  const watchedDiscountAmount = watch("discountAmount") || 0;
  const watchedDiscountPercent = watch("discountPercent") || 0;
  const watchedAdditionalFee = watch("additionalFee") || 0;

  // Get selected tax setting
  const selectedTax = useMemo(() => {
    if (!watchedTaxSettingId || !taxSettingsData) return null;
    const taxList = Array.isArray(taxSettingsData) ? taxSettingsData : (taxSettingsData as any)?.data || [];
    return taxList.find((t: any) => t.id === watchedTaxSettingId) || null;
  }, [watchedTaxSettingId, taxSettingsData]);

  // Calculate totals with tax and discount
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  // Calculate discount
  const discountAmount = useMemo(() => {
    if (watchedDiscountType === "amount") {
      return Math.min(watchedDiscountAmount, subtotal);
    } else if (watchedDiscountType === "percent") {
      return Math.round((subtotal * watchedDiscountPercent / 100) * 100) / 100;
    }
    return 0;
  }, [watchedDiscountType, watchedDiscountAmount, watchedDiscountPercent, subtotal]);

  // Calculate tax
  const taxableAmount = subtotal - discountAmount;
  const taxRate = selectedTax?.rate || 0;
  const taxAmount = Math.round((taxableAmount * taxRate / 100) * 100) / 100;

  // Calculate total
  const additionalFee = watchedAdditionalFee;
  const total = taxableAmount + taxAmount + additionalFee;

  // Barcode scanning handler - now uses the new barcode API
  const handleBarcodeScan = async (barcode: string) => {
    console.log('🔍 Scanning barcode in sales:', barcode);
    setLastScannedBarcode(barcode);

    try {
      // Use authenticated productService
      const result = await productService.findByBarcode(barcode, companyId);
      console.log('📦 API Response:', result);

      // apiClient returns response.data, so structure is:
      // { msg, status, data: { success, data: { product, matchedField } } }
      const product = result?.data?.data?.product || result?.data?.product;
      const matchedField = result?.data?.data?.matchedField || result?.data?.matchedField;

      if (product) {
        console.log('✅ Product found:', product.name);
        console.log('📊 Matched field:', matchedField);

        addItem(product);
        setBarcodeInput(""); // Clear input

        // Show which barcode type was matched
        const matchedFieldArabic =
          matchedField === 'originalBarcode' ? 'الباركود الأصلي' :
          matchedField === 'localBarcode' ? 'الباركود المحلي' :
          'رمز المنتج';
        toast.success(`تمت الإضافة: ${product.name} (${matchedFieldArabic})`);

        // Auto-focus barcode input for next scan
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 100);
      } else {
        console.log('❌ Product not found for barcode:', barcode);
        toast.error(`المنتج غير موجود: ${barcode}`);
        setBarcodeInput(""); // Clear input
      }
    } catch (error: any) {
      console.error('Error scanning barcode:', error);
      const errorMsg = error?.response?.data?.msg || error?.message || 'حدث خطأ أثناء البحث عن المنتج';
      toast.error(errorMsg);
      setBarcodeInput(""); // Clear input
    }
  };

  // Handle manual barcode input
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      await handleBarcodeScan(barcodeInput.trim());
    }
  };

  // Auto-focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Get product stock by ID
  const getProductStock = (productId: number): number => {
    const products = (productsData as any)?.data?.list || [];
    const product = products.find((p: any) => p.id === productId);
    return product?.currentStock || product?.stockQuantity || 0;
  };

  // Add item to sale
  const addItem = (product: any) => {
    const stock = product.currentStock || product.stockQuantity || 0;
    const existingItem = items.find(item => item.productId === product.id);
    const currentQuantity = existingItem?.quantity || 0;

    // Check stock validation
    if (currentQuantity >= stock) {
      toast.error(`لا يمكن إضافة المزيد - الكمية المتاحة: ${stock}`);
      return;
    }

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + 1;
      const newItems = items.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.unitPrice,
            }
          : item
      );
      setItems(newItems);
    } else {
      // Add new item
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        total: product.sellingPrice,
      };
      setItems([...items, newItem]);
    }
  };

  // Update item quantity
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    // Get current quantity to check if increasing
    const currentItem = items.find(item => item.productId === productId);
    const currentQuantity = currentItem?.quantity || 0;

    // Only validate stock when INCREASING quantity
    if (quantity > currentQuantity) {
      const stock = getProductStock(productId);
      if (quantity > stock) {
        toast.error(`الكمية المطلوبة تتجاوز المخزون المتاح: ${stock}`);
        return;
      }
    }

    const newItems = items.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity,
            total: quantity * item.unitPrice,
          }
        : item
    );
    setItems(newItems);
  };

  // Remove item
  const removeItem = (productId: number) => {
    setItems(items.filter(item => item.productId !== productId));
  };

  // Check if product is already selected
  const isProductSelected = (productId: number) => {
    return items.some(item => item.productId === productId);
  };

  // Get selected item quantity
  const getSelectedQuantity = (productId: number) => {
    const item = items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };


  // Show confirmation modal before sale
  const handleShowConfirm = useCallback(() => {
    if (items.length === 0) {
      toast.error("يجب إضافة منتجات للبيع");
      return;
    }
    setShowConfirmModal(true);
  }, [items.length]);

  // Handle sale submission
  const handleSaleSubmit = useCallback(async (data: SaleFormData) => {
    setShowConfirmModal(false);

    if (items.length === 0) {
      toast.error("يجب إضافة منتجات للبيع");
      return;
    }

    try {
      let clientId = data.clientId;

      // If new client is selected, create the client first
      if (data.clientType === "new" && data.newClientName) {
        const newClient = await createClientMutation.mutateAsync({
          name: data.newClientName,
          email: data.newClientEmail || undefined,
          phone: data.newClientPhone || undefined,
          address: data.newClientAddress || undefined,
          companyId: companyId!,
        });
        clientId = newClient.id;
        toast.success("تم إنشاء العميل الجديد");
      }

      const saleData: any = {
        // receiptNumber will be auto-generated by backend
        clientId: clientId,
        paymentMethod: data.paymentMethod,
        saleDate: new Date().toISOString(),
        items: items.map(item => ({
          productId: String(item.productId), // Convert to string as backend expects
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        companyId: companyId!,
      };

      // Add tax if selected
      if (data.taxSettingId) {
        saleData.taxSettingId = data.taxSettingId;
      }

      // Add discount if applicable
      if (data.discountType === "amount" && discountAmount > 0) {
        saleData.discountAmount = discountAmount;
      } else if (data.discountType === "percent" && data.discountPercent > 0) {
        saleData.discountPercent = data.discountPercent;
      }

      // Add paid amount for partial payments (if not full payment)
      if (data.paidAmount !== undefined && data.paidAmount >= 0 && data.paidAmount < total) {
        saleData.paidAmount = data.paidAmount;
      } else {
        // Full payment by default
        saleData.paidAmount = total;
      }

      // Only add additionalFee if it's greater than 0
      if (data.additionalFee && data.additionalFee > 0) {
        saleData.additionalFee = data.additionalFee;
        saleData.additionalFeeLabel = data.additionalFeeLabel || undefined;
      }

      const createdSale = await createSaleMutation.mutateAsync(saleData);
      // Note: Success toast is shown in useSales hook

      console.log('📦 Created sale response:', createdSale);
      console.log('📦 Sale data from API:', (createdSale as any)?.data);

      // Get printer config to check auto-print setting
      const printerConfig = usePrinterConfigStore.getState();

      // Extract the actual sale data from the response
      const saleData_fromAPI = (createdSale as any)?.data || {};

      // Prepare sale with items for printing
      const saleWithItems = {
        ...saleData_fromAPI,  // Data returned from API
        ...saleData,          // Original sale data (fallback)
        items: items.map(item => ({
          ...item,
          productName: item.productName,
          product: { name: item.productName }
        }))
      };

      console.log('📦 Final sale with items for printing:', saleWithItems);

      // Auto-print if enabled
      if (printerConfig.autoPrintOnPayment) {
        try {
          console.log('🖨️ Auto-printing receipt...');
          // Fetch full company profile with logo
          const companyId = company?.companyId || company?.id;
          let fullCompany = company?.company || { name: 'POS System' };
          if (companyId) {
            try {
              fullCompany = await companyService.getProfile(companyId);
            } catch (err) {
              console.warn('Could not fetch company profile, using default data');
            }
          }

          await printReceipt({
            sale: saleWithItems,
            company: fullCompany,
            cashier: user
          });
          toast.success('تم الطباعة تلقائياً');
        } catch (printError) {
          console.error('Auto-print error:', printError);
          toast.error('فشلت الطباعة التلقائية');
        }
        navigate('/sales');
      } else {
        // Show print preview modal
        setPrintableSale(saleWithItems);
        setShowPrintModal(true);
      }
    } catch (error: any) {
      console.error("[SalesCreate] Error creating sale:", error);
      const errorMessage = error?.message || "حدث خطأ أثناء إنشاء عملية البيع";
      toast.error(errorMessage);
    }
  }, [items, createSaleMutation, createClientMutation, companyId, navigate, total, discountAmount, watch]);

  // Handle client creation
  const handleClientSubmit = async (data: ClientFormData) => {
    try {
      await createClientMutation.mutateAsync({
        ...data,
        companyId: companyId!,
      });
      toast.success("تم إنشاء العميل بنجاح");
      setShowClientModal(false);
      resetClient();
    } catch {
      toast.error("حدث خطأ أثناء إنشاء العميل");
    }
  };

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/sales');
  }, [navigate]);



  // Filter clients based on search
  const filteredClients = useMemo(() => {
    const clients = (clientsData as any)?.data?.list || [];
    
    if (!clientSearch) return clients;
    
    return clients.filter((client: any) => {
      const searchTerm = clientSearch.toLowerCase();
      return (
        client.name.toLowerCase().includes(searchTerm) ||
        client.phone?.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm)
      );
    });
  }, [clientsData, clientSearch]);

  // Client options
  const clientOptions = filteredClients.map((client: any) => ({
    value: client.id.toString(),
    label: `${client.name}${client.phone ? ` - ${client.phone}` : ''}`,
  }));

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    const products = (productsData as any)?.data?.list || [];
    
    return products.filter((product: any) => {
      const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                           product.sku?.toLowerCase().includes(productSearch.toLowerCase());
      
      // Convert both to strings for comparison to handle any type mismatches
      const productCategoryId = String(product.categoryId || '');
      const selectedCategoryId = String(selectedCategory || '');
      const matchesCategory = !selectedCategory || productCategoryId === selectedCategoryId;
      
      return matchesSearch && matchesCategory;
    });
  }, [productsData, productSearch, selectedCategory]);

  // Product options for display
  const productOptions = filteredProducts.map((product: any) => ({
    value: product.id,
    label: `${product.name} - ${formatCurrency(product.sellingPrice)} (المتاح: ${formatNumber(product.currentStock || product.stockQuantity)})`,
    product,
  }));

  // Category options for filter
  const categoryOptions = [
    { value: "", label: "جميع الفئات" },
    ...((categoriesData as any)?.data?.list || []).map((category: any) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  return (
    <Layout>
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              variant="ghost"
              onClick={() => navigate('/sales')}
              className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">عملية بيع جديدة</h1>
              <p className="text-gray-500 text-sm">إنشاء عملية بيع جديدة في النظام</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4 ml-1" />
              إلغاء
            </Button>
            <Button
              onClick={handleShowConfirm}
              disabled={createSaleMutation.isPending || items.length === 0}
              className={`${
                items.length === 0
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              title={items.length === 0 ? 'أضف منتجات أولاً' : 'إنشاء عملية البيع'}
            >
              <Save className="w-4 h-4 ml-1" />
              {createSaleMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء البيع'}
            </Button>
          </div>
        </div>

        {/* Barcode Scanner Input */}
        <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="أدخل الباركود يدوياً..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={!barcodeInput.trim()}
            className="bg-primary-600 hover:bg-primary-700 px-6"
          >
            إضافة
          </Button>
        </form>

        {/* POS Layout - Products Left, Cart Right */}
        <form onSubmit={handleSubmit(handleSaleSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-180px)]">

            {/* LEFT SIDE - Products (8 columns) */}
            <div className="lg:col-span-8 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Category Tabs */}
              <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 p-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === ""
                        ? "bg-primary-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    الكل
                  </button>
                  {(categoriesData as any)?.data?.list?.map((category: any) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === category.id
                          ? "bg-primary-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="flex-shrink-0 p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="البحث عن منتج..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto p-3">
                {productOptions.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {productOptions.map((option) => {
                      const isSelected = isProductSelected(option.product.id);
                      const selectedQuantity = getSelectedQuantity(option.product.id);
                      const stock = option.product.currentStock || option.product.stockQuantity;
                      const isOutOfStock = stock <= 0;
                      const isMaxReached = selectedQuantity >= stock;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => addItem(option.product)}
                          disabled={isOutOfStock}
                          className={`relative p-3 rounded-lg border text-right transition-all duration-200 ${
                            isSelected
                              ? isMaxReached
                                ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md shadow-amber-100"
                                : "border-primary-400 bg-gradient-to-br from-primary-50 to-green-50 shadow-md shadow-primary-100"
                              : isOutOfStock
                              ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                              : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
                          }`}
                        >
                          {/* Selected Badge - Modern Style */}
                          {isSelected && (
                            <div className={`absolute -top-2 -right-2 px-2 py-0.5 text-white text-xs rounded-md font-bold shadow-sm flex items-center gap-1 ${
                              isMaxReached
                                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                : "bg-gradient-to-r from-primary-500 to-green-500"
                            }`}>
                              <span>×{selectedQuantity}</span>
                            </div>
                          )}

                          {/* Checkmark indicator */}
                          {isSelected && !isMaxReached && (
                            <div className="absolute top-2 left-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}

                          {/* Max reached indicator */}
                          {isMaxReached && isSelected && (
                            <div className="absolute top-2 left-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                              </svg>
                            </div>
                          )}

                          <div className={`font-medium text-sm truncate mb-1 ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                            {option.product.name}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs ${
                              isMaxReached
                                ? "text-amber-600 font-medium"
                                : isSelected
                                  ? "text-primary-600"
                                  : "text-gray-500"
                            }`}>
                              {stock} متاح
                            </span>
                            <span className={`font-bold text-sm ${isSelected ? "text-primary-700" : "text-primary-600"}`}>
                              {formatCurrency(option.product.sellingPrice)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Package className="w-12 h-12 mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد منتجات</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE - Cart & Info (4 columns) */}
            <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto">
              {/* Cart Items - Flexible height with scroll */}
              <div className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col min-h-[200px]">
                <div className="px-2 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4" />
                      السلة
                    </h3>
                    <span className="text-xs text-gray-500">{items.length} منتج</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {items.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {items.map((item) => {
                        const stock = getProductStock(item.productId);
                        const isMaxReached = item.quantity >= stock;

                        return (
                          <div key={item.productId} className={`px-2 py-2 transition-colors ${isMaxReached ? "bg-amber-50" : "hover:bg-gray-50"}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900 text-xs truncate flex-1 ml-1">
                                {item.productName}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeItem(item.productId)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="w-7 h-7 rounded bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className={`w-8 text-center text-sm font-bold ${isMaxReached ? "text-amber-600" : "text-gray-900"}`}>
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  disabled={isMaxReached}
                                  className={`w-7 h-7 rounded border flex items-center justify-center active:scale-95 transition-all ${
                                    isMaxReached
                                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                      : "bg-primary-50 border-primary-200 text-primary-600 hover:bg-primary-100"
                                  }`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="font-bold text-sm text-primary-600">
                                {formatCurrency(item.total)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-6">
                      <ShoppingCart className="w-10 h-10 mb-1" />
                      <p className="text-xs">السلة فارغة</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sale Info - Compact */}
              <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
                {/* Client Type - Compact */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">العميل</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { value: "cash", label: "نقدي" },
                      { value: "existing", label: "مسجل" },
                      { value: "new", label: "جديد" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setClientType(type.value as any);
                          setValue("clientType", type.value as any);
                          if (type.value !== "existing") setValue("clientId", undefined);
                        }}
                        className={`py-1.5 px-2 rounded text-xs font-medium transition-all ${
                          clientType === type.value
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Client Selection */}
                {clientType === "existing" && (
                  <Select
                    options={clientOptions}
                    value={watch("clientId")?.toString() || ""}
                    onChange={(value) => setValue("clientId", value ? parseInt(value) : undefined)}
                    placeholder="اختر العميل..."
                  />
                )}

                {clientType === "new" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="اسم العميل *"
                      {...register("newClientName")}
                      className="text-sm"
                      error={errors.newClientName?.message}
                    />
                    <Input
                      placeholder="رقم الهاتف *"
                      {...register("newClientPhone")}
                      className="text-sm"
                      error={errors.newClientPhone?.message}
                    />
                  </div>
                )}

                {/* Payment Method - Compact */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الدفع</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { value: "CASH", label: "نقدي" },
                      { value: "CARD", label: "بطاقة" },
                      { value: "CREDIT", label: "آجل" },
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setValue("paymentMethod", method.value as any)}
                        className={`py-1.5 px-2 rounded text-xs font-medium transition-all ${
                          watch("paymentMethod") === method.value
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tax & Discount - Compact Row */}
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    options={[
                      { value: "", label: "بدون ضريبة" },
                      ...(Array.isArray(taxSettingsData)
                        ? taxSettingsData
                        : (taxSettingsData as any)?.data || []
                      ).map((tax: any) => ({
                        value: tax.id,
                        label: `${tax.rate}%`,
                      })),
                    ]}
                    value={watch("taxSettingId") || ""}
                    onChange={(value) => setValue("taxSettingId", value || undefined)}
                    placeholder="ضريبة"
                  />
                  <Select
                    options={[
                      { value: "none", label: "بدون خصم" },
                      { value: "amount", label: "مبلغ" },
                      { value: "percent", label: "نسبة %" },
                    ]}
                    value={watch("discountType") || "none"}
                    onChange={(value) => setValue("discountType", value as any)}
                  />
                </div>

                {watch("discountType") === "amount" && (
                  <Input
                    type="number"
                    placeholder="مبلغ الخصم"
                    {...register("discountAmount", { valueAsNumber: true })}
                    className="text-sm"
                  />
                )}

                {watch("discountType") === "percent" && (
                  <Input
                    type="number"
                    placeholder="نسبة الخصم %"
                    {...register("discountPercent", { valueAsNumber: true })}
                    className="text-sm"
                  />
                )}

                {watch("paymentMethod") === "CREDIT" && (
                  <Input
                    type="number"
                    placeholder="المبلغ المدفوع مقدماً"
                    {...register("paidAmount", { valueAsNumber: true })}
                    className="text-sm"
                  />
                )}

                {/* Additional Fees Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">رسوم إضافية (اختياري)</label>

                  {/* Quick Select Common Fees */}
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: "توصيل", value: 20 },
                      { label: "تغليف", value: 10 },
                      { label: "خدمة", value: 15 },
                    ].map((fee) => (
                      <button
                        key={fee.label}
                        type="button"
                        onClick={() => {
                          setValue("additionalFee", fee.value);
                          setValue("additionalFeeLabel", fee.label);
                        }}
                        className={`py-1.5 px-1 rounded text-xs font-medium transition-all border ${
                          watch("additionalFeeLabel") === fee.label && watch("additionalFee") === fee.value
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {fee.label} ({fee.value})
                      </button>
                    ))}
                  </div>

                  {/* Custom Fee Input */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="المبلغ"
                      {...register("additionalFee", { valueAsNumber: true })}
                      className="text-sm"
                      min="0"
                      step="0.01"
                    />
                    <Input
                      type="text"
                      placeholder="الوصف"
                      {...register("additionalFeeLabel")}
                      className="text-sm"
                    />
                  </div>

                  {/* Clear Button */}
                  {(watch("additionalFee") > 0 || watch("additionalFeeLabel")) && (
                    <button
                      type="button"
                      onClick={() => {
                        setValue("additionalFee", 0);
                        setValue("additionalFeeLabel", undefined);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      إزالة الرسوم
                    </button>
                  )}
                </div>
              </div>

              {/* Totals & Submit */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="space-y-1 text-sm mb-3">
                  <div className="flex justify-between text-gray-600">
                    <span>المجموع الفرعي</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>الخصم</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>الضريبة</span>
                      <span>+{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  {additionalFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{watch("additionalFeeLabel") || "رسوم إضافية"}</span>
                      <span>+{formatCurrency(additionalFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                    <span>المجموع</span>
                    <span className="text-primary-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleShowConfirm}
                  disabled={createSaleMutation.isPending || items.length === 0}
                  className={`w-full py-3 text-lg font-bold ${
                    items.length === 0
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-primary-600 hover:bg-primary-700"
                  }`}
                >
                  {createSaleMutation.isPending ? "جاري الإنشاء..." : `إتمام البيع - ${formatCurrency(total)}`}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Client Creation Modal */}
        <Modal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          title="إضافة عميل جديد"
          size="md"
        >
          <form onSubmit={handleSubmitClient(handleClientSubmit)} className="space-y-4">
            <Input
              label="اسم العميل *"
              {...registerClient("name")}
              error={clientErrors.name?.message}
              placeholder="أدخل اسم العميل"
              required
            />

            <Input
              label="رقم الهاتف *"
              {...registerClient("phone")}
              error={clientErrors.phone?.message}
              placeholder="أدخل رقم الهاتف"
              required
            />

            <Input
              label="البريد الإلكتروني (اختياري)"
              type="email"
              {...registerClient("email")}
              error={clientErrors.email?.message}
              placeholder="أدخل البريد الإلكتروني"
            />

            <Input
              label="العنوان (اختياري)"
              {...registerClient("address")}
              error={clientErrors.address?.message}
              placeholder="أدخل العنوان"
            />

            <div className="flex justify-end space-x-3 space-x-reverse pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowClientModal(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createClientMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createClientMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء العميل'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Confirmation Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="تأكيد عملية البيع"
          size="md"
        >
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">عدد المنتجات:</span>
                <span className="font-medium">{items.length} منتج</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">إجمالي الكمية:</span>
                <span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)} قطعة</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>الخصم:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">الضريبة:</span>
                  <span>+{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>المجموع الكلي:</span>
                <span className="text-primary-600">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Confirmation message */}
            <p className="text-gray-600 text-center">
              هل أنت متأكد من إتمام عملية البيع؟
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit(handleSaleSubmit)}
                disabled={createSaleMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {createSaleMutation.isPending ? "جاري الإنشاء..." : "تأكيد البيع"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Print Receipt Preview Modal */}
        {printableSale && (
          <PrintReceiptPreview
            sale={printableSale}
            companyId={company?.companyId || company?.id || 0}
            cashier={user}
            isOpen={showPrintModal}
            onClose={() => {
              setShowPrintModal(false);
              setPrintableSale(null);
              navigate('/sales');
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default SalesCreate;
