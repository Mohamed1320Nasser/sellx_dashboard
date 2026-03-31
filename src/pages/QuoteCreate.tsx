import React, { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  X,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  ScanLine,
  Package,
} from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Input, Select, Card } from "../components/ui";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { useCreateQuote } from "../hooks/api/useQuotes";
import { useClients } from "../hooks/api/useClients";
import { useProducts } from "../hooks/api/useProducts";
import { useCategories } from "../hooks/api/useCategories";
import { useActiveTaxSettings } from "../hooks/api/useTax";
import { productService } from "../services/productService";
import { formatCurrency } from "../utils/currencyUtils";
import toast from "react-hot-toast";
import { useScanner } from "../hooks/useScanner";

interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  stockQuantity: number;
}

const QuoteCreate: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || company?.company?.id;

  // Form state
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Quote settings
  const [clientType, setClientType] = useState<"manual" | "existing">("manual");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [selectedTaxId, setSelectedTaxId] = useState<string>("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  // Discount settings
  const [discountType, setDiscountType] = useState<"none" | "amount" | "percent">("none");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

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

  const { data: taxSettingsData } = useActiveTaxSettings(companyId!);

  // Mutations
  const createQuoteMutation = useCreateQuote();

  // Hardware hooks - Barcode scanner
  useScanner({
    onScan: async (scannedBarcode) => {
      await handleBarcodeScan(scannedBarcode);
    },
    autoStart: true,
  });

  // Get product stock by ID
  const getProductStock = (productId: string): number => {
    const products = (productsData as any)?.data?.list || [];
    const product = products.find((p: any) => p.id.toString() === productId);
    return product?.currentStock || product?.stockQuantity || 0;
  };

  // Get selected tax setting
  const selectedTax = useMemo(() => {
    if (!selectedTaxId || !taxSettingsData) return null;
    const taxList = Array.isArray(taxSettingsData) ? taxSettingsData : (taxSettingsData as any)?.data || [];
    return taxList.find((t: any) => t.id === selectedTaxId);
  }, [selectedTaxId, taxSettingsData]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  // Calculate discount
  const calculatedDiscount = useMemo(() => {
    if (discountType === "amount") {
      return Math.min(discountAmount, subtotal);
    } else if (discountType === "percent") {
      return Math.round((subtotal * discountPercent / 100) * 100) / 100;
    }
    return 0;
  }, [discountType, discountAmount, discountPercent, subtotal]);

  // Calculate tax
  const taxableAmount = subtotal - calculatedDiscount;
  const taxRate = selectedTax?.rate || 0;
  const taxAmount = Math.round((taxableAmount * taxRate / 100) * 100) / 100;
  const total = taxableAmount + taxAmount;

  // Barcode scanning handler
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const result = await productService.findByBarcode(barcode, companyId!);
      if (result?.data?.data?.product) {
        const product = result.data.data.product;
        addItem(product);
        toast.success(`تم إضافة: ${product.name}`);
        setBarcodeInput("");
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
      } else {
        toast.error(`المنتج غير موجود: ${barcode}`);
        setBarcodeInput("");
      }
    } catch (error) {
      toast.error("خطأ في البحث عن المنتج");
      setBarcodeInput("");
    }
  };

  // Handle manual barcode input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleBarcodeScan(barcodeInput.trim());
    }
  };

  // Add item to quote
  const addItem = (product: any) => {
    const stock = product.currentStock || product.stockQuantity || 0;
    const productId = product.id.toString();
    const existingItem = items.find((item) => item.productId === productId);
    const currentQuantity = existingItem?.quantity || 0;

    // Check stock validation (for quotes we allow exceeding stock but show warning)
    if (currentQuantity >= stock) {
      toast.error(`تحذير: الكمية تتجاوز المخزون المتاح (${stock})`);
    }

    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      const newItems = items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: newQuantity, lineTotal: newQuantity * item.unitPrice }
          : item
      );
      setItems(newItems);
      toast.success(`تم زيادة كمية ${product.name} إلى ${newQuantity}`);
    } else {
      const newItem: QuoteItem = {
        productId,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        lineTotal: product.sellingPrice,
        stockQuantity: stock,
      };
      setItems([...items, newItem]);
      toast.success(`تم إضافة ${product.name}`);
    }
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    const newItems = items.map((item) =>
      item.productId === productId
        ? { ...item, quantity, lineTotal: quantity * item.unitPrice }
        : item
    );
    setItems(newItems);
  };

  // Remove item
  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  // Check if product is selected
  const isProductSelected = (productId: number) => {
    return items.some((item) => item.productId === productId.toString());
  };

  // Get selected quantity
  const getSelectedQuantity = (productId: number) => {
    const item = items.find((item) => item.productId === productId.toString());
    return item ? item.quantity : 0;
  };

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    const client = clientsData?.data?.list?.find((c: any) => c.id.toString() === clientId);
    if (client) {
      setSelectedClientId(client.id);
      setCustomerName(client.name || "");
      setCustomerPhone(client.phone || "");
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let products = (productsData as any)?.data?.list || [];

    if (selectedCategory) {
      products = products.filter((p: any) => p.categoryId?.toString() === selectedCategory);
    }

    if (productSearch) {
      const search = productSearch.toLowerCase();
      products = products.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search)
      );
    }

    return products;
  }, [productsData, selectedCategory, productSearch]);

  // Client options
  const clientOptions = useMemo(() => {
    return (clientsData?.data?.list || []).map((client: any) => ({
      value: client.id.toString(),
      label: `${client.name}${client.phone ? ` - ${client.phone}` : ""}`,
    }));
  }, [clientsData]);

  // Submit quote
  const handleSubmit = useCallback(async () => {
    if (items.length === 0) {
      toast.error("يرجى إضافة منتجات للعرض السعري");
      return;
    }

    try {
      await createQuoteMutation.mutateAsync({
        companyId: companyId!,
        customerName: customerName || undefined,
        customerContact: customerPhone || undefined,
        currency,
        taxSettingId: selectedTaxId || undefined,
        discountAmount: discountType === "amount" && calculatedDiscount > 0 ? calculatedDiscount : undefined,
        discountPercent: discountType === "percent" && discountPercent > 0 ? discountPercent : undefined,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      navigate("/quotes");
    } catch (error) {
      console.error("Error creating quote:", error);
    }
  }, [items, createQuoteMutation, companyId, customerName, customerPhone, currency, selectedTaxId, discountType, calculatedDiscount, discountPercent, validUntil, notes, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate("/quotes");
  }, [navigate]);

  return (
    <Layout>
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              variant="ghost"
              onClick={() => navigate("/quotes")}
              className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">عرض سعري جديد</h1>
              <p className="text-gray-500 text-sm">إنشاء عرض سعري للعميل</p>
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
              onClick={handleSubmit}
              disabled={createQuoteMutation.isPending || items.length === 0}
              className={`${
                items.length === 0
                  ? "bg-gray-400 cursor-not-allowed opacity-60"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              <Save className="w-4 h-4 ml-1" />
              {createQuoteMutation.isPending ? "جاري الحفظ..." : "حفظ العرض"}
            </Button>
          </div>
        </div>

        {/* Barcode Scanner Input */}
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
                    onClick={() => setSelectedCategory(category.id.toString())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category.id.toString()
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {filteredProducts.map((product: any) => {
                    const isSelected = isProductSelected(product.id);
                    const selectedQuantity = getSelectedQuantity(product.id);
                    const stock = product.currentStock || product.stockQuantity;
                    const isOutOfStock = stock <= 0;
                    const isMaxReached = selectedQuantity >= stock;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addItem(product)}
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
                        {/* Selected Badge */}
                        {isSelected && (
                          <div
                            className={`absolute -top-2 -right-2 px-2 py-0.5 text-white text-xs rounded-md font-bold shadow-sm flex items-center gap-1 ${
                              isMaxReached
                                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                : "bg-gradient-to-r from-primary-500 to-green-500"
                            }`}
                          >
                            <span>×{selectedQuantity}</span>
                          </div>
                        )}

                        {/* Checkmark indicator */}
                        {isSelected && !isMaxReached && (
                          <div className="absolute top-2 left-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        {/* Max reached indicator */}
                        {isMaxReached && isSelected && (
                          <div className="absolute top-2 left-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                            </svg>
                          </div>
                        )}

                        <div className={`font-medium text-sm truncate mb-1 ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                          {product.name}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs ${isMaxReached ? "text-amber-600 font-medium" : isSelected ? "text-primary-600" : "text-gray-500"}`}>
                            {stock} متاح
                          </span>
                          <span className={`font-bold text-sm ${isSelected ? "text-primary-700" : "text-primary-600"}`}>
                            {formatCurrency(product.sellingPrice)}
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
            {/* Cart Items */}
            <div className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col min-h-[200px]">
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    المنتجات
                  </h3>
                  <span className="text-sm text-gray-500">{items.length} منتج</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {items.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {items.map((item) => {
                      const stock = getProductStock(item.productId);
                      const isMaxReached = item.quantity >= stock;

                      return (
                        <div key={item.productId} className={`p-3 transition-colors ${isMaxReached ? "bg-amber-50" : "hover:bg-gray-50"}`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900 truncate flex-1 ml-2">
                              {item.productName}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className={`w-10 text-center font-bold ${isMaxReached ? "text-amber-600" : "text-gray-900"}`}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg bg-primary-50 border border-primary-200 text-primary-600 flex items-center justify-center hover:bg-primary-100 active:scale-95 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="font-bold text-primary-600">
                              {formatCurrency(item.lineTotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                    <ShoppingCart className="w-12 h-12 mb-2" />
                    <p className="text-sm">لم يتم إضافة منتجات</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quote Info - Compact */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
              {/* Client Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">العميل</label>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { value: "manual", label: "إدخال يدوي" },
                    { value: "existing", label: "عميل مسجل" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setClientType(type.value as any)}
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
                  value={selectedClientId?.toString() || ""}
                  onChange={(value) => handleClientSelect(value)}
                  placeholder="اختر العميل..."
                />
              )}

              <div className="space-y-2">
                <Input
                  placeholder="اسم العميل"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-sm"
                />
                <Input
                  placeholder="رقم الهاتف"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Tax & Discount */}
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
                  value={selectedTaxId || ""}
                  onChange={(value) => setSelectedTaxId(value || "")}
                  placeholder="ضريبة"
                />
                <Select
                  options={[
                    { value: "none", label: "بدون خصم" },
                    { value: "amount", label: "مبلغ" },
                    { value: "percent", label: "نسبة %" },
                  ]}
                  value={discountType}
                  onChange={(value) => setDiscountType(value as any)}
                />
              </div>

              {discountType === "amount" && (
                <Input
                  type="number"
                  placeholder="مبلغ الخصم"
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
              )}

              {discountType === "percent" && (
                <Input
                  type="number"
                  placeholder="نسبة الخصم %"
                  value={discountPercent || ""}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
              )}

              {/* Valid Until */}
              <Input
                type="date"
                placeholder="صالح حتى"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Totals & Submit */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="space-y-1 text-sm mb-3">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>الخصم</span>
                    <span>-{formatCurrency(calculatedDiscount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>الضريبة ({taxRate}%)</span>
                    <span>+{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                  <span>المجموع</span>
                  <span className="text-primary-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createQuoteMutation.isPending || items.length === 0}
                className={`w-full py-3 text-lg font-bold ${
                  items.length === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
              >
                {createQuoteMutation.isPending ? "جاري الحفظ..." : `حفظ العرض - ${formatCurrency(total)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuoteCreate;
