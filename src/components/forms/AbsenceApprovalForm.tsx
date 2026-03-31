import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Select } from "../ui";
import { CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import type { Absence, AbsenceStatus, ApproveAbsenceRequest } from "../../types";
import { formatTableDate } from "../../utils/dateUtils";

const approvalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"], {
    message: "يجب اختيار القرار",
  }),
  notes: z.string().optional(),
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

interface AbsenceApprovalFormProps {
  absence: Absence;
  onSubmit: (data: ApproveAbsenceRequest) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const AbsenceApprovalForm: React.FC<AbsenceApprovalFormProps> = ({
  absence,
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      status: "APPROVED",
      notes: "",
    },
  });

  const watchedStatus = watch("status");

  const statusOptions = [
    { value: "APPROVED", label: "موافقة" },
    { value: "REJECTED", label: "رفض" },
    { value: "CANCELLED", label: "إلغاء" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "CANCELLED":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 bg-green-50 border-green-200";
      case "REJECTED":
        return "text-red-600 bg-red-50 border-red-200";
      case "CANCELLED":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Absence Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل طلب الغياب</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">الموظف</label>
            <p className="text-gray-900">{absence.user?.fullname || "غير محدد"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">نوع الغياب</label>
            <p className="text-gray-900">
              {absence.type === "SICK_LEAVE" && "إجازة مرضية"}
              {absence.type === "VACATION" && "إجازة سنوية"}
              {absence.type === "PERSONAL_LEAVE" && "إجازة شخصية"}
              {absence.type === "MATERNITY_LEAVE" && "إجازة أمومة"}
              {absence.type === "PATERNITY_LEAVE" && "إجازة أبوة"}
              {absence.type === "BEREAVEMENT" && "إجازة وفاة"}
              {absence.type === "OTHER" && "أخرى"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">تاريخ البداية</label>
            <p className="text-gray-900">{formatTableDate(absence.startDate)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">تاريخ النهاية</label>
            <p className="text-gray-900">{formatTableDate(absence.endDate)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">عدد الأيام</label>
            <p className="text-gray-900">{absence.totalDays} يوم</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">الحالة الحالية</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(absence.status)}`}>
              {getStatusIcon(absence.status)}
              <span className="mr-1">
                {absence.status === "PENDING" && "في الانتظار"}
                {absence.status === "APPROVED" && "موافق عليه"}
                {absence.status === "REJECTED" && "مرفوض"}
                {absence.status === "CANCELLED" && "ملغي"}
              </span>
            </span>
          </div>
        </div>
        {absence.reason && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">السبب</label>
            <p className="text-gray-900">{absence.reason}</p>
          </div>
        )}
        {absence.notes && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
            <p className="text-gray-900">{absence.notes}</p>
          </div>
        )}
      </div>

      {/* Approval Form */}
      <form onSubmit={handleSubmit((data) => {
        const formData = {
          status: data.status as AbsenceStatus,
          notes: data.notes,
        } as ApproveAbsenceRequest;
        onSubmit(formData);
      })} className="space-y-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline w-4 h-4 ml-1" />
            القرار
          </label>
          <Select
            placeholder="اختر القرار"
            options={statusOptions}
            value={watchedStatus}
            onChange={() => {
              // Handle status selection
            }}
            error={errors.status?.message}
          />
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline w-4 h-4 ml-1" />
            ملاحظات إضافية (اختياري)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="أدخل أي ملاحظات إضافية..."
            {...register("notes")}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 space-x-reverse">
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
            loading={loading}
            disabled={loading}
            className={watchedStatus === "REJECTED" ? "bg-red-600 hover:bg-red-700" : 
                      watchedStatus === "CANCELLED" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
          >
            {watchedStatus === "APPROVED" && "موافقة على الطلب"}
            {watchedStatus === "REJECTED" && "رفض الطلب"}
            {watchedStatus === "CANCELLED" && "إلغاء الطلب"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AbsenceApprovalForm;