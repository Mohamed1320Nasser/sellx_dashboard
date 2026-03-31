import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Calendar, User, Save } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, Input, Select } from "../components/ui";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salaryService } from "../services/salaryService";
import { useCompanyUsers } from "../hooks/api/useUsers";
import toast from "react-hot-toast";

const salarySchema = z.object({
  userId: z.string().min(1, "الموظف مطلوب"),
  baseSalary: z.string().min(1, "الراتب الأساسي مطلوب"),
  allowances: z.string().optional(),
  deductions: z.string().optional(),
  overtime: z.string().optional(),
  bonuses: z.string().optional(),
  month: z.string().min(1, "الشهر مطلوب"),
  year: z.string().min(1, "السنة مطلوبة"),
  workingDays: z.string().min(1, "أيام العمل مطلوبة"),
  absentDays: z.string().optional(),
  notes: z.string().optional(),
});

type SalaryFormData = z.infer<typeof salarySchema>;

const SalariesCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || 0;

  const [netSalary, setNetSalary] = useState(0);

  // Fetch company users
  const { data: usersData } = useCompanyUsers({
    companyId,
    limit: 100,
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<SalaryFormData>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      allowances: "0",
      deductions: "0",
      overtime: "0",
      bonuses: "0",
      absentDays: "0",
      workingDays: "30",
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
    },
  });

  // Watch all fields to calculate net salary
  const baseSalary = watch("baseSalary") || "0";
  const allowances = watch("allowances") || "0";
  const deductions = watch("deductions") || "0";
  const overtime = watch("overtime") || "0";
  const bonuses = watch("bonuses") || "0";

  // Calculate net salary whenever values change
  React.useEffect(() => {
    const base = parseFloat(baseSalary) || 0;
    const allow = parseFloat(allowances) || 0;
    const deduc = parseFloat(deductions) || 0;
    const over = parseFloat(overtime) || 0;
    const bonus = parseFloat(bonuses) || 0;

    const total = base + allow + over + bonus - deduc;
    setNetSalary(total);
  }, [baseSalary, allowances, deductions, overtime, bonuses]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => salaryService.create(data),
    onSuccess: () => {
      toast.success("تم إنشاء الراتب بنجاح");
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      navigate("/salaries");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.msg || "حدث خطأ أثناء إنشاء الراتب");
    },
  });

  const onSubmit = (data: SalaryFormData) => {
    createMutation.mutate({
      userId: Number(data.userId),
      companyId,
      baseSalary: parseFloat(data.baseSalary),
      allowances: parseFloat(data.allowances || "0"),
      deductions: parseFloat(data.deductions || "0"),
      overtime: parseFloat(data.overtime || "0"),
      bonuses: parseFloat(data.bonuses || "0"),
      netSalary: netSalary,
      month: Number(data.month),
      year: Number(data.year),
      workingDays: Number(data.workingDays),
      absentDays: Number(data.absentDays || "0"),
      notes: data.notes,
      status: "DRAFT",
    });
  };

  const months = [
    { value: "1", label: "يناير" },
    { value: "2", label: "فبراير" },
    { value: "3", label: "مارس" },
    { value: "4", label: "أبريل" },
    { value: "5", label: "مايو" },
    { value: "6", label: "يونيو" },
    { value: "7", label: "يوليو" },
    { value: "8", label: "أغسطس" },
    { value: "9", label: "سبتمبر" },
    { value: "10", label: "أكتوبر" },
    { value: "11", label: "نوفمبر" },
    { value: "12", label: "ديسمبر" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - 2 + i),
    label: String(currentYear - 2 + i),
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/salaries")}>
              <ArrowLeft className="w-4 h-4 ml-1" />
              العودة
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إضافة راتب جديد</h1>
              <p className="text-gray-600 mt-1">إنشاء راتب جديد للموظف</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Employee & Period */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 ml-2 text-primary-600" />
              معلومات الموظف والفترة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الموظف <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="userId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      placeholder="اختر الموظف"
                      value={field.value}
                      onChange={field.onChange}
                      options={
                        usersData?.data?.list
                          ?.filter((user: any) => user.fullname)
                          ?.map((user: any) => ({
                            value: String(user.id),
                            label: user.fullname,
                          })) || []
                      }
                    />
                  )}
                />
                {errors.userId && (
                  <p className="text-red-500 text-sm mt-1">{errors.userId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الشهر <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="month"
                  control={control}
                  render={({ field }) => (
                    <Select
                      placeholder="اختر الشهر"
                      value={field.value}
                      onChange={field.onChange}
                      options={months}
                    />
                  )}
                />
                {errors.month && (
                  <p className="text-red-500 text-sm mt-1">{errors.month.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  السنة <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="year"
                  control={control}
                  render={({ field }) => (
                    <Select
                      placeholder="اختر السنة"
                      value={field.value}
                      onChange={field.onChange}
                      options={years}
                    />
                  )}
                />
                {errors.year && (
                  <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Salary Details */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 ml-2 text-green-600" />
              تفاصيل الراتب
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="الراتب الأساسي"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("baseSalary")}
                  error={errors.baseSalary?.message}
                  required
                />
              </div>

              <div>
                <Input
                  label="البدلات"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("allowances")}
                  error={errors.allowances?.message}
                />
              </div>

              <div>
                <Input
                  label="الخصومات"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("deductions")}
                  error={errors.deductions?.message}
                />
              </div>

              <div>
                <Input
                  label="الإضافي"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("overtime")}
                  error={errors.overtime?.message}
                />
              </div>

              <div>
                <Input
                  label="المكافآت"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("bonuses")}
                  error={errors.bonuses?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  صافي الراتب
                </label>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">
                    {netSalary.toFixed(2)} ج.م
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Attendance */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 ml-2 text-blue-600" />
              الحضور
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="أيام العمل"
                  type="number"
                  placeholder="30"
                  {...register("workingDays")}
                  error={errors.workingDays?.message}
                  required
                />
              </div>

              <div>
                <Input
                  label="أيام الغياب"
                  type="number"
                  placeholder="0"
                  {...register("absentDays")}
                  error={errors.absentDays?.message}
                />
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card padding="lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="أضف ملاحظات إضافية..."
              />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/salaries")}
            >
              إلغاء
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              <Save className="w-4 h-4 ml-2" />
              حفظ الراتب
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default SalariesCreate;
