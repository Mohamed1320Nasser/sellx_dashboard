import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Modal, Button, Input, Select } from '../ui';
import { formatCurrency } from '../../utils/currencyUtils';
import type { CreatePaymentRequest } from '../../services/paymentService';
import { PaymentMethod } from '../../services/paymentService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePaymentRequest) => Promise<void>;
  purchaseId?: number;
  saleId?: number;
  companyId: number;
  remainingAmount: number;
  isLoading?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseId,
  saleId,
  companyId,
  remainingAmount,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: PaymentMethod.CASH,
    reference: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const paymentMethodOptions = [
    { value: PaymentMethod.CASH, label: 'نقدي' },
    { value: PaymentMethod.MOBILE_WALLET, label: 'محفظة إلكترونية' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'تحويل بنكي' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    } else if (parseFloat(formData.amount) > remainingAmount) {
      newErrors.amount = `المبلغ لا يمكن أن يتجاوز ${formatCurrency(remainingAmount)}`;
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'طريقة الدفع مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const paymentData: CreatePaymentRequest = {
        purchaseId,
        saleId,
        companyId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
      };

      await onSubmit(paymentData);
      
      // Reset form
      setFormData({
        amount: '',
        paymentMethod: PaymentMethod.CASH,
        reference: '',
        notes: '',
      });
      setErrors({});
      onClose();
    } catch {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      paymentMethod: PaymentMethod.CASH,
      reference: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title="إضافة دفعة">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mr-3">إضافة دفعة</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المبلغ المتبقي
            </label>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مبلغ الدفعة *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              error={errors.amount}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              طريقة الدفع *
            </label>
            <Select
              options={paymentMethodOptions}
              value={formData.paymentMethod}
              onChange={(value) => setFormData({ ...formData, paymentMethod: value as any })}
              error={errors.paymentMethod}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم المرجع (اختياري)
            </label>
            <Input
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="رقم المرجع أو المعاملة"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات (اختياري)
            </label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ملاحظات إضافية"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center"
            >
              {isLoading ? 'جاري الحفظ...' : 'إضافة الدفعة'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PaymentModal;
