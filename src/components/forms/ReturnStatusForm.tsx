import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "../ui";
import { formatCurrency } from "../../utils/currencyUtils";
import type { Return, ReturnStatus, UpdateReturnStatusRequest } from "../../types";

const statusUpdateSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "REJECTED"]),
  notes: z.string().optional(),
  refundAmount: z
    .number({ message: "مبلغ الاسترداد يجب أن يكون رقم" })
    .min(0, "مبلغ الاسترداد يجب أن يكون موجب")
    .optional(),
});

type StatusUpdateFormData = z.infer<typeof statusUpdateSchema>;

interface ReturnStatusFormProps {
  returnData: Return;
  onSubmit: (data: UpdateReturnStatusRequest) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const ReturnStatusForm: React.FC<ReturnStatusFormProps> = ({
  returnData,
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StatusUpdateFormData>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: returnData.status,
      notes: returnData.notes || "",
      refundAmount: returnData.refundAmount || 0,
    },
  });

  const watchedStatus = watch("status");

  const handleFormSubmit = (data: StatusUpdateFormData) => {
    onSubmit(data as UpdateReturnStatusRequest);
  };

  const getStatusColor = (status: ReturnStatus) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "COMPLETED":
        return "text-green-600 bg-green-100";
      case "REJECTED":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusLabel = (status: ReturnStatus) => {
    switch (status) {
      case "PENDING":
        return "في الانتظار";
      case "COMPLETED":
        return "مكتمل";
      case "REJECTED":
        return "مرفوض";
      default:
        return status;
    }
  };

  const getStatusDescription = (status: ReturnStatus) => {
    switch (status) {
      case "PENDING":
        return "طلب الإرجاع في انتظار المراجعة";
      case "COMPLETED":
        return "تم معالجة الإرجاع بالكامل وإضافة المنتجات للمخزون واسترداد المبلغ";
      case "REJECTED":
        return "تم رفض طلب الإرجاع";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Return Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">معلومات الإرجاع الحالي</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">رقم الإرجاع:</span>
            <p className="font-medium">{returnData.returnNumber}</p>
          </div>
          <div>
            <span className="text-gray-600">البيع الأصلي:</span>
            <p className="font-medium">{returnData.originalSale?.receiptNumber}</p>
          </div>
          <div>
            <span className="text-gray-600">المبلغ الإجمالي:</span>
            <p className="font-medium">{formatCurrency(Number(returnData.totalAmount))}</p>
          </div>
          <div>
            <span className="text-gray-600">الحالة الحالية:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(returnData.status)}`}>
              {getStatusLabel(returnData.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Update Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الحالة الجديدة *
          </label>
          <select
            {...register("status")}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.status ? 'border-red-500' : ''}`}
          >
            <option value="PENDING">في الانتظار</option>
            <option value="COMPLETED">مكتمل</option>
            <option value="REJECTED">مرفوض</option>
          </select>
          
          {watchedStatus && (
            <p className="mt-2 text-sm text-gray-600">
              {getStatusDescription(watchedStatus as ReturnStatus)}
            </p>
          )}
        </div>

        {watchedStatus === "COMPLETED" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مبلغ الاسترداد
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={returnData.totalAmount}
              {...register("refundAmount", { valueAsNumber: true })}
              error={errors.refundAmount?.message}
            />
            <p className="mt-1 text-sm text-gray-500">
              الحد الأقصى: {returnData.totalAmount} ريال
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="أدخل أي ملاحظات حول تغيير الحالة"
          />
        </div>

        {/* Status Change Warning */}
        {watchedStatus === "COMPLETED" && returnData.status !== "COMPLETED" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  تحذير: إكمال الإرجاع
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    عند إكمال هذا الإرجاع، سيتم:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>إضافة المنتجات المرتجعة إلى المخزون</li>
                    <li>إنشاء حركة مخزون جديدة</li>
                    <li>تحديث إحصائيات المبيعات والتحليلات</li>
                    <li>تسجيل استرداد المبلغ للعميل</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          )}
          <Button type="submit" loading={loading}>
            تحديث الحالة
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReturnStatusForm;
