import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';
import { Layout } from '../components/layout';
import { Button, Card, Input, Select } from '../components/ui';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, PaymentMethod, PaymentStatus, type CreatePaymentRequest } from '../services/paymentService';
import { useSales } from '../hooks/api/useSales';
import { usePurchases } from '../hooks/api/usePurchases';
import { formatCurrency } from '../utils/currencyUtils';
import toast from 'react-hot-toast';

const PaymentCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { company, user } = useSessionAuthStore();
  
  const [formData, setFormData] = useState({
    saleId: '',
    purchaseId: '',
    amount: '',
    paymentMethod: PaymentMethod.CASH,
    paymentStatus: PaymentStatus.COMPLETED,
    reference: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<'sale' | 'purchase'>('sale');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  const companyId = company?.companyId || company?.company?.id;

  // Fetch sales and purchases
  const { data: salesData } = useSales({
    companyId: companyId || 0,
    page: 1,
    limit: 100,
  });

  const { data: purchasesData } = usePurchases({
    companyId: companyId || 0,
    page: 1,
    limit: 100,
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: CreatePaymentRequest) => paymentService.create(data),
    onSuccess: () => {
      toast.success('تم إنشاء الدفعة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      navigate('/payments');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.msg || error?.message || 'حدث خطأ أثناء إنشاء الدفعة';
      toast.error(errorMessage);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.saleId && !formData.purchaseId) {
      newErrors.invoice = 'يجب اختيار فاتورة بيع أو شراء';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'طريقة الدفع مطلوبة';
    }

    if (!formData.paymentStatus) {
      newErrors.paymentStatus = 'حالة الدفع مطلوبة';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'تاريخ الدفع مطلوب';
    }

    // Validate amount against remaining balance
    if (selectedSale && formData.amount) {
      const remainingAmount = selectedSale.totalAmount - (selectedSale.paidAmount || 0);
      if (parseFloat(formData.amount) > remainingAmount) {
        newErrors.amount = `المبلغ لا يمكن أن يتجاوز ${formatCurrency(remainingAmount)}`;
      }
    }

    if (selectedPurchase && formData.amount) {
      const remainingAmount = (selectedPurchase.totalAmount || 0) + (selectedPurchase.taxAmount || 0) - (selectedPurchase.paidAmount || 0);
      if (parseFloat(formData.amount) > remainingAmount) {
        newErrors.amount = `المبلغ لا يمكن أن يتجاوز ${formatCurrency(remainingAmount)}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!companyId || !user?.id) {
      toast.error('معلومات الشركة أو المستخدم غير متوفرة');
      return;
    }

    try {
      const paymentData: CreatePaymentRequest = {
        saleId: formData.saleId ? parseInt(formData.saleId) : undefined,
        purchaseId: formData.purchaseId ? parseInt(formData.purchaseId) : undefined,
        companyId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        paymentDate: new Date(formData.paymentDate).toISOString(),
      };

      await createPaymentMutation.mutateAsync(paymentData);
    } catch {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleBack = () => {
    navigate('/payments');
  };

  const handleTypeChange = (type: 'sale' | 'purchase') => {
    setSelectedType(type);
    setFormData(prev => ({
      ...prev,
      saleId: '',
      purchaseId: '',
    }));
    setSelectedSale(null);
    setSelectedPurchase(null);
    setErrors({});
  };

  const handleSaleSelect = (sale: any) => {
    setSelectedSale(sale);
    setFormData(prev => ({
      ...prev,
      saleId: sale.id.toString(),
      purchaseId: '',
    }));
    setSelectedPurchase(null);
    setErrors({});
  };

  const handlePurchaseSelect = (purchase: any) => {
    setSelectedPurchase(purchase);
    setFormData(prev => ({
      ...prev,
      purchaseId: purchase.id.toString(),
      saleId: '',
    }));
    setSelectedSale(null);
    setErrors({});
  };

  const filteredSales = salesData?.data?.list?.filter((sale: any) =>
    sale.id.toString().includes(searchTerm) ||
    sale.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredPurchases = purchasesData?.data?.list?.filter((purchase: any) =>
    purchase.id.toString().includes(searchTerm) ||
    purchase.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 ml-1" />
              العودة
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إضافة دفعة جديدة</h1>
              <p className="text-gray-600">إنشاء دفعة جديدة للفاتورة</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Selection */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">اختيار الفاتورة</h3>
                </div>

                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={selectedType === 'sale' ? 'primary' : 'outline'}
                    onClick={() => handleTypeChange('sale')}
                    className="w-full"
                  >
                    فاتورة بيع
                  </Button>
                  <Button
                    type="button"
                    variant={selectedType === 'purchase' ? 'primary' : 'outline'}
                    onClick={() => handleTypeChange('purchase')}
                    className="w-full"
                  >
                    فاتورة شراء
                  </Button>
                </div>

                {/* Search */}
                <div>
                  <Input
                    placeholder={`البحث في ${selectedType === 'sale' ? 'فواتير البيع' : 'فواتير الشراء'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Invoice List */}
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
                    {selectedType === 'sale' ? (
                      filteredSales.map((sale: any) => (
                        <div
                          key={sale.id}
                          onClick={() => handleSaleSelect(sale)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedSale?.id === sale.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <div className={`w-3 h-3 rounded-full ${
                                  selectedSale?.id === sale.id ? 'bg-blue-500' : 'bg-gray-300'
                                }`}></div>
                                <span className="font-semibold text-gray-900">#{sale.id}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatCurrency(sale.totalAmount)}
                                </p>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-700">رقم الإيصال</p>
                                <p className="text-sm text-gray-600">{sale.receiptNumber}</p>
                              </div>
                              
                              {sale.client && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">العميل</p>
                                  <p className="text-sm text-gray-600">{sale.client.name}</p>
                                </div>
                              )}

                              <div>
                                <p className="text-sm font-medium text-gray-700">المبلغ المتبقي</p>
                                <p className="text-sm font-semibold text-red-600">
                                  {formatCurrency(sale.totalAmount - (sale.paidAmount || 0))}
                                </p>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="pt-2 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">حالة الدفع</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  (sale.totalAmount - (sale.paidAmount || 0)) > 0
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-green-100 text-green-600'
                                }`}>
                                  {(sale.totalAmount - (sale.paidAmount || 0)) > 0 ? 'غير مكتمل' : 'مكتمل'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      filteredPurchases.map((purchase: any) => (
                        <div
                          key={purchase.id}
                          onClick={() => handlePurchaseSelect(purchase)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedPurchase?.id === purchase.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <div className={`w-3 h-3 rounded-full ${
                                  selectedPurchase?.id === purchase.id ? 'bg-blue-500' : 'bg-gray-300'
                                }`}></div>
                                <span className="font-semibold text-gray-900">#{purchase.id}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatCurrency((purchase.totalAmount || 0) + (purchase.taxAmount || 0))}
                                </p>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-700">رقم الفاتورة</p>
                                <p className="text-sm text-gray-600">{purchase.invoiceNumber}</p>
                              </div>
                              
                              {purchase.supplier && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">المورد</p>
                                  <p className="text-sm text-gray-600">{purchase.supplier.name}</p>
                                </div>
                              )}

                              <div>
                                <p className="text-sm font-medium text-gray-700">المبلغ المتبقي</p>
                                <p className="text-sm font-semibold text-red-600">
                                  {formatCurrency((purchase.totalAmount || 0) + (purchase.taxAmount || 0) - (purchase.paidAmount || 0))}
                                </p>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="pt-2 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">حالة الدفع</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  ((purchase.totalAmount || 0) + (purchase.taxAmount || 0) - (purchase.paidAmount || 0)) > 0
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-green-100 text-green-600'
                                }`}>
                                  {((purchase.totalAmount || 0) + (purchase.taxAmount || 0) - (purchase.paidAmount || 0)) > 0 ? 'غير مكتمل' : 'مكتمل'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {errors.invoice && (
                  <p className="text-sm text-red-600">{errors.invoice}</p>
                )}
              </div>
            </Card>

            {/* Payment Details */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Plus className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">تفاصيل الدفعة</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="المبلغ *"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      error={errors.amount}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Select
                      label="طريقة الدفع *"
                      value={formData.paymentMethod}
                      onChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod }))}
                      options={[
                        { value: PaymentMethod.CASH, label: 'نقدي' },
                        { value: PaymentMethod.MOBILE_WALLET, label: 'محفظة إلكترونية' },
                        { value: PaymentMethod.BANK_TRANSFER, label: 'تحويل بنكي' },
                      ]}
                      error={errors.paymentMethod}
                    />
                  </div>

                  <div>
                    <Select
                      label="حالة الدفع *"
                      value={formData.paymentStatus}
                      onChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value as PaymentStatus }))}
                      options={[
                        { value: PaymentStatus.COMPLETED, label: 'مكتمل' },
                        { value: PaymentStatus.PENDING, label: 'في الانتظار' },
                        { value: PaymentStatus.FAILED, label: 'فشل' },
                        { value: PaymentStatus.CANCELLED, label: 'ملغي' },
                      ]}
                      error={errors.paymentStatus}
                    />
                  </div>

                  <div>
                    <Input
                      label="تاريخ الدفع *"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                      error={errors.paymentDate}
                    />
                  </div>

                  <div>
                    <Input
                      label="المرجع (اختياري)"
                      value={formData.reference}
                      onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                      placeholder="رقم المرجع أو المعاملة"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="ملاحظات (اختياري)"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="ملاحظات إضافية حول الدفعة"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card padding="lg">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">ملخص الدفعة</h3>
                
                {selectedSale && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">فاتورة البيع:</span>
                      <span className="font-medium">#{selectedSale.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">المبلغ الإجمالي:</span>
                      <span className="font-medium">{formatCurrency(selectedSale.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">المبلغ المدفوع:</span>
                      <span className="font-medium">{formatCurrency(selectedSale.paidAmount || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">المبلغ المتبقي:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(selectedSale.totalAmount - (selectedSale.paidAmount || 0))}
                      </span>
                    </div>
                  </div>
                )}

                {selectedPurchase && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">فاتورة الشراء:</span>
                      <span className="font-medium">#{selectedPurchase.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">المبلغ الإجمالي:</span>
                      <span className="font-medium">
                        {formatCurrency((selectedPurchase.totalAmount || 0) + (selectedPurchase.taxAmount || 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">المبلغ المدفوع:</span>
                      <span className="font-medium">{formatCurrency(selectedPurchase.paidAmount || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">المبلغ المتبقي:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency((selectedPurchase.totalAmount || 0) + (selectedPurchase.taxAmount || 0) - (selectedPurchase.paidAmount || 0))}
                      </span>
                    </div>
                  </div>
                )}

                {formData.amount && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">مبلغ الدفعة:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(parseFloat(formData.amount) || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <Card padding="lg">
              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  loading={createPaymentMutation.isPending}
                  className="w-full flex items-center justify-center"
                >
                  <Save className="w-4 h-4 ml-1" />
                  حفظ الدفعة
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="w-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 ml-1" />
                  إلغاء
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentCreate;
