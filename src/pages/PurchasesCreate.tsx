import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, ShoppingCart, Package, Calendar, DollarSign, Search, ScanLine, Upload, FileText, Trash2, ChevronDown, ChevronUp, CheckCircle, ChevronRight, Truck, Receipt } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, Input, Select, Modal } from "../components/ui";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { useSuppliers } from "../hooks/api/useSuppliers";
import { useProducts } from "../hooks/api/useProducts";
import { useCategories } from "../hooks/api/useCategories";
import { useCreatePurchase } from "../hooks/api/usePurchases";
import { formatCurrency, formatNumber } from "../utils/currencyUtils";
import toast from "react-hot-toast";
import type { Supplier } from "../types/business";
import { BarcodeInput } from "../components/pos/BarcodeInput";
import { ScanIndicator } from "../components/pos/ScanIndicator";
import { PrintStatus } from "../components/pos/PrintStatus";
import { useScanner } from "../hooks/useScanner";
import { usePrinterConfigStore } from "../stores/printerConfigStore";
import { companyService } from "../services/companyService";
import { printReceipt } from "../services/printService";
import { PrintReceiptPreview } from "../components/printer/PrintReceiptPreview";

interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currentProductPrice: number;
  updateProductPrice: boolean;
}

const PurchasesCreate: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  
  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [includeTax, setIncludeTax] = useState(false);
  const [taxRate, setTaxRate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProductSelectionCollapsed, setIsProductSelectionCollapsed] = useState(true);

  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printablePurchase, setPrintablePurchase] = useState<any>(null);

  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Items state
  const [items, setItems] = useState<PurchaseItem[]>([]);
  
  // Search and filter state
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Barcode scanning state
  const [barcodeInput, setBarcodeInput] = useState("");
  const [lastScannedBarcode, setLastScannedBarcode] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const { data: suppliersData } = useSuppliers({ 
    companyId: company?.companyId || 0,
    limit: 100 
  });
  
  const { data: productsData } = useProducts({
    companyId: company?.companyId || 0,
    limit: 1000,
    search: productSearch,
    categoryId: selectedCategory || undefined,
  });
  
  const { data: categoriesData } = useCategories({
    companyId: company?.companyId || 0,
    limit: 100,
  });

  const createMutation = useCreatePurchase();

  // Hardware hooks
  const { isScanning } = useScanner({
    onScan: async (scannedBarcode) => {
      await handleBarcodeScan(scannedBarcode);
    },
    autoStart: true,
  });

  // Auto-generate invoice number on component mount
  useEffect(() => {
    setInvoiceNumber(generateInvoiceNumber());
  }, []);

  // Filtered products for selection
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

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const taxAmount = includeTax ? subtotal * ((Number(taxRate) || 0) / 100) : 0;
  const totalAmount = subtotal; // Backend expects total without tax

  // Handlers (moved before barcode scanning handler)
  const handleBack = useCallback(() => {
    navigate('/purchases');
  }, [navigate]);

  const handleRemoveItem = useCallback((productId: string) => {
    setItems(items.filter(item => item.productId !== productId));
  }, [items]);

  const handleUpdateItemQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setItems(items.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
        : item
    ));
  }, [items, handleRemoveItem]);

  // Barcode scanning handler
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setLastScannedBarcode(barcode);
    
    // Find product by barcode
    const products = (productsData as any)?.data?.list || [];
    const product = products.find((p: any) => 
      p.barcode === barcode || p.sku === barcode
    );

    if (product) {
      // Check if product is already in purchase
      const existingItem = items.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Update quantity
        handleUpdateItemQuantity(product.id, existingItem.quantity + 1);
        toast.success(`تم زيادة كمية ${product.name} إلى ${existingItem.quantity + 1}`);
      } else {
        // Add new item
        const newItem: PurchaseItem = {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.purchasePrice || product.sellingPrice || 0,
          totalPrice: product.purchasePrice || product.sellingPrice || 0,
          currentProductPrice: product.sellingPrice || 0,
          updateProductPrice: false,
        };
        setItems([...items, newItem]);
        toast.success(`تم إضافة ${product.name} إلى فاتورة الشراء`);
      }
      
      setBarcodeInput(""); // Clear input
      // Auto-focus barcode input for next scan
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    } else {
      toast.error(`المنتج غير موجود: ${barcode}`);
      setBarcodeInput(""); // Clear input
    }
  }, [items, productsData, handleUpdateItemQuantity]);

  // Handle manual barcode input
  const handleBarcodeSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      await handleBarcodeScan(barcodeInput.trim());
    }
  }, [barcodeInput, handleBarcodeScan]);


  const handleUpdateItemPrice = (productId: string, newPrice: number) => {
    setItems(items.map(item => 
      item.productId === productId 
        ? { ...item, unitPrice: newPrice, totalPrice: item.quantity * newPrice }
        : item
    ));
  };

  const handleTogglePriceUpdate = (productId: string, updatePrice: boolean) => {
    setItems(items.map(item =>
      item.productId === productId
        ? { ...item, updateProductPrice: updatePrice }
        : item
    ));
  };

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('نوع الملف غير مدعوم. يرجى اختيار صورة أو PDF');
      return;
    }

    setInvoiceFile(file);
    toast.success(`تم اختيار الملف: ${file.name}`);
  };

  // Step validation
  const canProceedToStep2 = () => {
    if (!supplierId) {
      toast.error('يرجى اختيار المورد');
      return false;
    }
    if (!invoiceNumber) {
      toast.error('يرجى إدخال رقم الفاتورة');
      return false;
    }
    if (!purchaseDate) {
      toast.error('يرجى تحديد تاريخ الشراء');
      return false;
    }
    return true;
  };

  const canProceedToStep3 = () => {
    if (items.length === 0) {
      toast.error('يرجى إضافة منتج واحد على الأقل');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !canProceedToStep2()) return;
    if (currentStep === 2 && !canProceedToStep3()) return;

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-4);
    return `INV-${year}${month}${day}-${time}`;
  };

  const handleSubmit = useCallback(async () => {
    if (!supplierId || !invoiceNumber || items.length === 0) {
      toast.error('يرجى ملء جميع البيانات المطلوبة');
      return;
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('companyId', String(company?.companyId || 0));
    formData.append('supplierId', supplierId);
    formData.append('invoiceNumber', invoiceNumber);
    formData.append('purchaseDate', purchaseDate || new Date().toISOString().split('T')[0]);
    if (dueDate && dueDate.trim() !== '') {
      formData.append('dueDate', dueDate);
    }
    formData.append('totalAmount', String(totalAmount));
    formData.append('paidAmount', String(Number(paidAmount) || 0));
    formData.append('paymentMethod', paymentMethod);
    if (includeTax) {
      formData.append('taxRate', String(Number(taxRate) || 0));
      formData.append('taxAmount', String(taxAmount));
    }
    formData.append('reminderEnabled', String(reminderEnabled));
    if (reminderEnabled && reminderDate) {
      formData.append('reminderDate', reminderDate);
    }
    if (notes) {
      formData.append('notes', notes);
    }

    // Add invoice file if selected
    if (invoiceFile) {
      formData.append('invoice', invoiceFile);
    }

    // Add items as JSON string
    formData.append('items', JSON.stringify(items.map(item => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      updateProductPrice: item.updateProductPrice,
      newProductPrice: item.updateProductPrice ? Number(item.unitPrice) : undefined,
    }))));

    try {
      const createdPurchase = await createMutation.mutateAsync(formData);
      // Success toast is handled by the mutation hook

      // Get printer config to check auto-print setting
      const printerConfig = usePrinterConfigStore.getState();

      // Extract the actual purchase data from the response
      const purchaseData = (createdPurchase as any)?.data || createdPurchase;

      // Prepare purchase with items for printing
      const purchaseWithItems = {
        ...purchaseData,
        items: items.map(item => ({
          ...item,
          productName: item.productName,
          product: { name: item.productName }
        })),
        supplier: (suppliersData as any)?.data?.list?.find((s: any) => s.id === parseInt(supplierId))
      };

      // Auto-print if enabled
      if (printerConfig.autoPrintOnPayment) {
        try {
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
            sale: purchaseWithItems,
            company: fullCompany,
            cashier: null,
            isPurchase: true
          });
          toast.success('تم الطباعة تلقائياً');
        } catch (printError) {
          console.error('Auto-print error:', printError);
          toast.error('فشلت الطباعة التلقائية');
        }
        navigate('/purchases');
      } else {
        // Show print preview modal
        setPrintablePurchase(purchaseWithItems);
        setShowPrintModal(true);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.msg || error?.message || 'حدث خطأ أثناء إنشاء عملية الشراء';

      if (errorMessage.includes('Invoice number already exists')) {
        toast.error('رقم الفاتورة موجود مسبقاً. يرجى استخدام رقم فاتورة مختلف أو الضغط على "توليد رقم"');
      } else {
        toast.error(errorMessage);
      }
    }
  }, [supplierId, invoiceNumber, items, purchaseDate, dueDate, totalAmount, paidAmount, paymentMethod, includeTax, taxRate, taxAmount, reminderEnabled, reminderDate, notes, invoiceFile, company, createMutation, navigate, suppliersData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F6: Focus barcode input
      if (e.key === 'F6') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      // F7: Complete purchase
      else if (e.key === 'F7' && items.length > 0) {
        e.preventDefault();
        handleSubmit();
      }
      // ESC: Cancel/Go back
      else if (e.key === 'Escape') {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, handleBack, handleSubmit]);

  // Auto-focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const supplierOptions = [
    { value: "", label: "اختر المورد" },
    ...((suppliersData as any)?.data?.list?.map((supplier: Supplier) => ({
      value: supplier.id.toString(),
      label: supplier.name,
    })) || []),
  ];

  const categoryOptions = [
    { value: "", label: "جميع الفئات" },
    ...((categoriesData as any)?.data?.list?.map((category: any) => ({
      value: category.id.toString(),
      label: category.name,
    })) || []),
  ];

  return (
    <Layout>
      <style>
        {`
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إنشاء عملية شراء جديدة</h1>
              <p className="text-gray-600 mt-1">
                إضافة عملية شراء جديدة من الموردين
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Step Progress Indicator */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {/* Step 1 */}
            <div className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                currentStep >= 1
                  ? 'bg-gradient-to-r from-primary-600 to-success-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {currentStep > 1 ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Truck className="w-6 h-6" />
                )}
              </div>
              <div className="mr-3">
                <div className={`text-sm font-semibold ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                  الخطوة 1
                </div>
                <div className={`text-xs ${currentStep >= 1 ? 'text-gray-600' : 'text-gray-400'}`}>
                  معلومات الشراء
                </div>
              </div>
            </div>

            {/* Connector Line */}
            <div className={`flex-1 h-1 mx-4 rounded transition-all ${
              currentStep >= 2 ? 'bg-gradient-to-r from-primary-600 to-success-600' : 'bg-gray-200'
            }`}></div>

            {/* Step 2 */}
            <div className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                currentStep >= 2
                  ? 'bg-gradient-to-r from-primary-600 to-success-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {currentStep > 2 ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Package className="w-6 h-6" />
                )}
              </div>
              <div className="mr-3">
                <div className={`text-sm font-semibold ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                  الخطوة 2
                </div>
                <div className={`text-xs ${currentStep >= 2 ? 'text-gray-600' : 'text-gray-400'}`}>
                  إضافة المنتجات
                </div>
              </div>
            </div>

            {/* Connector Line */}
            <div className={`flex-1 h-1 mx-4 rounded transition-all ${
              currentStep >= 3 ? 'bg-gradient-to-r from-primary-600 to-success-600' : 'bg-gray-200'
            }`}></div>

            {/* Step 3 */}
            <div className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                currentStep >= 3
                  ? 'bg-gradient-to-r from-primary-600 to-success-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                <Receipt className="w-6 h-6" />
              </div>
              <div className="mr-3">
                <div className={`text-sm font-semibold ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>
                  الخطوة 3
                </div>
                <div className={`text-xs ${currentStep >= 3 ? 'text-gray-600' : 'text-gray-400'}`}>
                  المراجعة والتأكيد
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          {/* STEP 1: Purchase Information */}
          {currentStep === 1 && (
            <div className="animate-fadeIn">
              <Card padding="lg" className="shadow-lg">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">معلومات عملية الشراء</h2>
                  <p className="text-gray-600">قم بإدخال التفاصيل الأساسية لعملية الشراء</p>
                </div>

                <div className="space-y-6">
                  {/* Supplier and Invoice Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Truck className="w-4 h-4 inline ml-2 text-blue-600" />
                        المورد *
                      </label>
                      <Select
                        placeholder="اختر المورد"
                        options={supplierOptions}
                        value={supplierId}
                        onChange={setSupplierId}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline ml-2 text-blue-600" />
                        رقم الفاتورة *
                      </label>
                      <div className="flex space-x-2 space-x-reverse">
                        <Input
                          placeholder="رقم الفاتورة"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setInvoiceNumber(generateInvoiceNumber())}
                          className="whitespace-nowrap bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                        >
                          توليد رقم
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline ml-2 text-primary-600" />
                        تاريخ الشراء *
                      </label>
                      <Input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline ml-2 text-primary-600" />
                        تاريخ الاستحقاق
                      </label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-xl p-6 border border-primary-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 ml-2 text-success-600" />
                      معلومات الدفع
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          المبلغ المدفوع
                        </label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          طريقة الدفع
                        </label>
                        <Select
                          options={[
                            { value: 'CASH', label: 'نقدي' },
                            { value: 'MOBILE_WALLET', label: 'محفظة إلكترونية' },
                            { value: 'BANK_TRANSFER', label: 'تحويل بنكي' },
                          ]}
                          value={paymentMethod}
                          onChange={setPaymentMethod}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Upload className="w-4 h-4 inline ml-2 text-primary-600" />
                      فاتورة الشراء (اختياري)
                    </label>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files[0];
                        handleFileSelect(file);
                      }}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                        isDragging
                          ? 'border-primary-500 bg-primary-50 scale-105'
                          : invoiceFile
                          ? 'border-success-500 bg-success-50'
                          : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
                      }`}
                    >
                      {invoiceFile ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center space-x-3 space-x-reverse">
                            {invoiceFile.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(invoiceFile)}
                                alt="معاينة"
                                className="w-24 h-24 object-cover rounded-lg border-2 border-white shadow-md"
                              />
                            ) : (
                              <div className="w-24 h-24 flex items-center justify-center bg-danger-100 rounded-lg border-2 border-white shadow-md">
                                <FileText className="w-12 h-12 text-danger-500" />
                              </div>
                            )}
                            <div className="text-right flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {invoiceFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(invoiceFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <p className="text-xs text-success-600 font-medium mt-1">
                                ✓ جاهز للرفع
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center space-x-2 space-x-reverse">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInvoiceFile(null);
                              }}
                              className="text-danger-600 border-danger-200 hover:bg-danger-50"
                            >
                              <Trash2 className="w-4 h-4 ml-1" />
                              إزالة
                            </Button>
                            <label className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                                className="hidden"
                              />
                              <span className="inline-flex items-center px-3 py-2 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 transition-colors">
                                <Upload className="w-4 h-4 ml-1" />
                                استبدال
                              </span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className={`w-16 h-16 mx-auto transition-all ${
                            isDragging ? 'text-primary-500 scale-110' : 'text-gray-400'
                          }`} />
                          <div>
                            <p className="text-lg font-medium text-gray-900">
                              {isDragging ? 'أفلت الملف هنا' : 'اسحب وأفلت الفاتورة هنا'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">أو</p>
                          </div>
                          <label className="cursor-pointer inline-block" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileSelect(e.target.files?.[0])}
                              className="hidden"
                            />
                            <span className="inline-flex items-center px-6 py-3 border-2 border-primary-300 text-sm font-semibold rounded-lg text-primary-700 bg-white hover:bg-primary-50 transition-colors shadow-sm hover:shadow-md">
                              <FileText className="w-5 h-5 ml-2" />
                              اختر ملف
                            </span>
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            JPG, PNG, أو PDF (حد أقصى 5 ميجابايت)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline ml-2 text-primary-600" />
                      ملاحظات
                    </label>
                    <textarea
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="أضف ملاحظات إضافية..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Step 1 Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="px-6"
                  >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    إلغاء
                  </Button>

                  <Button
                    onClick={handleNextStep}
                    className="px-8 bg-gradient-to-r from-primary-600 to-success-600 hover:from-primary-700 hover:to-success-700 text-white shadow-lg"
                  >
                    التالي: إضافة المنتجات
                    <ChevronRight className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* STEP 2: Add Products */}
          {currentStep === 2 && (
            <div className="animate-fadeIn">
              <Card padding="lg" className="shadow-lg">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">إضافة المنتجات</h2>
                  <p className="text-gray-600">قم بإضافة المنتجات التي تم شراؤها</p>
                </div>

                {/* Barcode Scanner */}
                <div className="mb-6 bg-gradient-to-r from-primary-50 to-success-50 rounded-xl p-4 border border-primary-100">
                  <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        placeholder="امسح الباركود أو أدخل الرمز يدوياً..."
                        className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                        autoFocus
                      />
                      {isScanning && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={!barcodeInput.trim()}
                      className="bg-gradient-to-r from-primary-600 to-success-600 hover:from-primary-700 hover:to-success-700 px-6"
                    >
                      إضافة
                    </Button>
                  </form>
                </div>

                {/* Collapsible Product Selection - Full Width */}
                <Card padding="lg" className="shadow-lg">
                  <div
                    className="flex items-center justify-between cursor-pointer pb-4 border-b"
                    onClick={() => setIsProductSelectionCollapsed(!isProductSelectionCollapsed)}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-6 h-6 text-primary-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">اختيار المنتجات من القائمة</h3>
                        <p className="text-sm text-gray-600">انقر لتصفح جميع المنتجات المتاحة</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isProductSelectionCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </Button>
                  </div>

                  {!isProductSelectionCollapsed && (
                    <div className="mt-6">
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 400px)' }}>
                        <div className="flex flex-col h-full">
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
                              {(categoriesData?.data?.list || []).map((category: any) => (
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
                            {filteredProducts.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2">
                                {filteredProducts.map((product: any) => {
                                  const isSelected = items.some(item => item.productId === product.id);
                                  const selectedQuantity = items.find(item => item.productId === product.id)?.quantity || 0;
                                  const stock = product.stockQuantity || 0;

                                  return (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => {
                                        if (!isSelected) {
                                          const newItem: PurchaseItem = {
                                            productId: product.id,
                                            productName: product.name,
                                            quantity: 1,
                                            unitPrice: product.purchasePrice || 0,
                                            totalPrice: product.purchasePrice || 0,
                                            currentProductPrice: product.purchasePrice || 0,
                                            updateProductPrice: true,
                                          };
                                          setItems([...items, newItem]);
                                        }
                                      }}
                                      className={`relative p-3 rounded-lg border text-right transition-all duration-200 ${
                                        isSelected
                                          ? "border-primary-400 bg-gradient-to-br from-primary-50 to-green-50 shadow-md shadow-primary-100"
                                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
                                      }`}
                                    >
                                      {/* Selected Badge */}
                                      {isSelected && (
                                        <div className="absolute -top-2 -right-2 px-2 py-0.5 text-white text-xs rounded-md font-bold shadow-sm flex items-center gap-1 bg-gradient-to-r from-primary-500 to-green-500">
                                          <span>×{selectedQuantity}</span>
                                        </div>
                                      )}

                                      {/* Checkmark indicator */}
                                      {isSelected && (
                                        <div className="absolute top-2 left-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                        </div>
                                      )}

                                      <div className={`font-medium text-sm truncate mb-1 ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                                        {product.name}
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className={`text-xs ${isSelected ? "text-primary-600" : "text-gray-500"}`}>
                                          {stock} متاح
                                        </span>
                                        <span className={`font-bold text-sm ${isSelected ? "text-primary-700" : "text-primary-600"}`}>
                                          {formatCurrency(product.purchasePrice || 0)}
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
                      </div>
                    </div>
                  )}
                </Card>

                {/* Selected Items - Full Width Below */}
                {items.length > 0 && (
                  <Card padding="lg" className="shadow-md mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary-600" />
                        المنتجات المختارة ({items.length})
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">إجمالي الكمية:</span>
                          <span className="font-bold text-accent-600">
                            {items.reduce((sum, item) => sum + item.quantity, 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold">الإجمالي:</span>
                          <span className="font-bold text-success-600 text-xl">{formatCurrency(subtotal)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {items.map((item) => (
                        <div key={item.productId} className="p-4 bg-white border-2 border-primary-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                          {/* Product Name and Remove */}
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 text-sm truncate flex-1">
                              {item.productName}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="text-danger-400 hover:text-danger-600 hover:bg-danger-50 p-1.5 rounded transition-colors ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Quantity Controls */}
                          <div className="mb-3">
                            <label className="text-xs text-gray-600 mb-1 block">الكمية</label>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(item.productId, item.quantity - 1)}
                                className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center text-lg font-bold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(item.productId, item.quantity + 1)}
                                className="w-8 h-8 rounded bg-primary-50 border border-primary-200 text-primary-600 hover:bg-primary-100 flex items-center justify-center active:scale-95 transition-all"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Price Input */}
                          <div className="mb-3">
                            <label className="text-xs text-gray-600 mb-1 block">سعر الوحدة</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-full text-center font-semibold text-primary-600 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">ج.م</span>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="mb-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">المجموع:</span>
                              <span className="text-lg font-bold text-success-600">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            </div>
                          </div>

                          {/* Update Product Price Checkbox */}
                          <label className="flex items-center space-x-2 space-x-reverse text-xs cursor-pointer bg-accent-50 p-2 rounded-lg">
                            <input
                              type="checkbox"
                              checked={item.updateProductPrice}
                              onChange={(e) => handleTogglePriceUpdate(item.productId, e.target.checked)}
                              className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                            />
                            <span className="text-gray-700">تحديث سعر المنتج</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Step 2 Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-6"
                  >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    السابق
                  </Button>

                  <Button
                    onClick={handleNextStep}
                    disabled={items.length === 0}
                    className="px-8 bg-gradient-to-r from-primary-600 to-success-600 hover:from-primary-700 hover:to-success-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي: المراجعة والتأكيد
                    <ChevronRight className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {currentStep === 3 && (
            <div className="animate-fadeIn">
              <Card padding="lg" className="shadow-lg">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">المراجعة والتأكيد</h2>
                  <p className="text-gray-600">تأكد من صحة البيانات قبل إنشاء عملية الشراء</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Summary */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Purchase Info Summary */}
                    <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6 border border-primary-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Truck className="w-5 h-5 ml-2 text-primary-600" />
                        معلومات الشراء
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">المورد:</span>
                          <span className="font-semibold text-gray-900 mr-2">
                            {supplierOptions.find(s => s.value === supplierId)?.label || 'غير محدد'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">رقم الفاتورة:</span>
                          <span className="font-semibold text-gray-900 mr-2">{invoiceNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">تاريخ الشراء:</span>
                          <span className="font-semibold text-gray-900 mr-2">{purchaseDate}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">طريقة الدفع:</span>
                          <span className="font-semibold text-gray-900 mr-2">
                            {paymentMethod === 'CASH' ? 'نقدي' : paymentMethod === 'MOBILE_WALLET' ? 'محفظة إلكترونية' : 'تحويل بنكي'}
                          </span>
                        </div>
                      </div>
                      {invoiceFile && (
                        <div className="mt-4 pt-4 border-t border-primary-200">
                          <span className="text-xs text-success-600 flex items-center">
                            <CheckCircle className="w-4 h-4 ml-1" />
                            تم إرفاق فاتورة: {invoiceFile.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Items Summary */}
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Package className="w-5 h-5 ml-2 text-accent-600" />
                        المنتجات ({items.length})
                      </h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.productName}</div>
                              <div className="text-sm text-gray-500">
                                {item.quantity} × {formatCurrency(item.unitPrice)}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {formatCurrency(item.totalPrice)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Financial Summary */}
                  <div className="lg:col-span-1">
                    <div className="lg:sticky lg:top-6">
                      <Card padding="lg" className="bg-gradient-to-br from-success-50 to-primary-50 border-success-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <DollarSign className="w-5 h-5 ml-2 text-success-600" />
                          الملخص المالي
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">المجموع الفرعي</span>
                            <span className="text-lg font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                          </div>
                          {includeTax && (
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                              <span className="text-sm text-gray-600">الضريبة ({taxRate}%)</span>
                              <span className="text-lg font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">المبلغ المدفوع</span>
                            <span className="text-lg font-semibold text-success-600">{formatCurrency(Number(paidAmount) || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">المبلغ المتبقي</span>
                            <span className="text-lg font-semibold text-danger-600">
                              {formatCurrency((subtotal + taxAmount) - (Number(paidAmount) || 0))}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-600 to-success-600 rounded-lg text-white shadow-lg">
                            <span className="text-sm font-medium">المجموع الكلي</span>
                            <span className="text-2xl font-bold">{formatCurrency(subtotal + taxAmount)}</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Step 3 Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-6"
                  >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    السابق
                  </Button>

                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    className="px-8 bg-gradient-to-r from-success-600 to-primary-600 hover:from-success-700 hover:to-primary-700 text-white shadow-lg text-lg font-semibold"
                  >
                    {createMutation.isPending ? (
                      <>
                        <span className="animate-spin ml-2">⏳</span>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 ml-2" />
                        إنشاء عملية الشراء
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Print Preview Modal */}
      {printablePurchase && (
        <Modal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            navigate('/purchases');
          }}
          title="معاينة الطباعة"
          size="lg"
        >
          <PrintReceiptPreview
            sale={printablePurchase}
            companyId={company?.companyId || company?.id || 0}
            cashier={null}
            isOpen={showPrintModal}
            onClose={() => {
              setShowPrintModal(false);
              navigate('/purchases');
            }}
            onPrint={async () => {
              try {
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
                  sale: printablePurchase,
                  company: fullCompany,
                  cashier: null,
                  isPurchase: true
                });
                toast.success('تم الطباعة بنجاح');
                setShowPrintModal(false);
                navigate('/purchases');
              } catch (error) {
                console.error('Print error:', error);
                toast.error('فشلت الطباعة');
              }
            }}
            onCancel={() => {
              setShowPrintModal(false);
              navigate('/purchases');
            }}
          />
        </Modal>
      )}
    </Layout>
  );
};

export default PurchasesCreate;
