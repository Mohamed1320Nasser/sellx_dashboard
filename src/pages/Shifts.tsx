import React, { useState } from "react";
import {
  Plus,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  LogOut,
  Eye,
  ArrowRightLeft,
  User,
  Calendar,
} from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, Input, Modal, Select, DataTable, Badge } from "../components/ui";
import type { Column } from "../components/ui/DataTable";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import {
  useShifts,
  useCurrentShift,
  useCreateShift,
  useCloseShift,
  useCreateCashMovement,
} from "../hooks/api/useShifts";
import { useCashRegisters } from "../hooks/api/useCashRegisters";
import { formatTableDate } from "../utils/dateUtils";
import { formatCurrency } from "../utils/currencyUtils";
import type { Shift, CashMovement } from "../services/shiftService";
import { useNavigate } from "react-router-dom";

const Shifts: React.FC = () => {
  const navigate = useNavigate();
  const { company, user } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCashMovementModal, setShowCashMovementModal] = useState(false);

  // Form state
  const [openFormData, setOpenFormData] = useState({
    registerId: "",
    openingBalance: "",
    notes: "",
  });

  const [closeFormData, setCloseFormData] = useState({
    actualCash: "",
    closingNotes: "",
  });

  const [cashMovementFormData, setCashMovementFormData] = useState({
    type: "CASH_IN" as CashMovement["type"],
    amount: "",
    reason: "",
    reference: "",
    notes: "",
  });

  // API hooks
  const { data: shiftsData, isLoading } = useShifts({
    companyId: company?.companyId || 0,
    page: currentPage,
    limit: pageSize,
    status: statusFilter ? (statusFilter as "OPEN" | "CLOSED") : undefined,
  });

  const { data: currentShiftData } = useCurrentShift(company?.companyId || 0);
  const { data: registersData } = useCashRegisters(company?.companyId || 0);

  const createShiftMutation = useCreateShift();
  const closeShiftMutation = useCloseShift();
  const createCashMovementMutation = useCreateCashMovement();

  // Check if user has cashier role
  const isCashier =
    user?.role === "CASHIER" ||
    user?.role === "MANAGER" ||
    user?.role === "ADMIN";

  // Current shift data
  const currentShift = currentShiftData?.shift;
  const currentSummary = currentShiftData?.summary;
  const hasOpenShift = currentShiftData?.hasOpenShift || false;

  // Table columns
  const columns: Column<Shift>[] = [
    {
      key: "id",
      label: "رقم الوردية",
      render: (shift: Shift) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-primary-600">
            #{shift.id.substring(0, 8)}
          </span>
        </div>
      ),
    },
    {
      key: "register",
      label: "الصندوق",
      render: (shift: Shift) => (
        <span className="text-gray-900">{(shift as any).register.name}</span>
      ),
    },
    {
      key: "user",
      label: "الموظف",
      render: (shift: Shift) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900">{(shift as any).user.fullname}</span>
        </div>
      ),
    },
    {
      key: "openingBalance",
      label: "الرصيد الافتتاحي",
      render: (shift: Shift) => (
        <span className="font-bold text-gray-900">
          {formatCurrency((shift as any).openingBalance)}
        </span>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      render: (shift: Shift) => (
        <Badge variant={(shift as any).status === "OPEN" ? "success" : "default"}>
          {(shift as any).status === "OPEN" ? "مفتوحة" : "مغلقة"}
        </Badge>
      ),
    },
    {
      key: "variance",
      label: "الفرق",
      render: (shift: Shift) => {
        const variance = (shift as any).variance;
        if ((shift as any).status === "OPEN") {
          return <span className="text-gray-400">-</span>;
        }
        if (variance === null) return <span className="text-gray-400">-</span>;
        const isPositive = variance >= 0;
        return (
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-success-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-danger-600" />
            )}
            <span
              className={`font-bold ${
                isPositive ? "text-success-600" : "text-danger-600"
              }`}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(variance)}
            </span>
          </div>
        );
      },
    },
    {
      key: "startTime",
      label: "وقت البدء",
      render: (shift: Shift) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatTableDate((shift as any).startTime)}</span>
        </div>
      ),
    },
  ];

  // Handlers
  const handleOpenShift = async () => {
    if (!openFormData.registerId || !openFormData.openingBalance) {
      return;
    }

    await createShiftMutation.mutateAsync({
      companyId: company?.companyId || 0,
      registerId: openFormData.registerId,
      openingBalance: parseFloat(openFormData.openingBalance),
      notes: openFormData.notes || undefined,
    });

    setShowOpenModal(false);
    resetOpenForm();
  };

  const handleCloseShift = async () => {
    if (!currentShift || !closeFormData.actualCash) {
      return;
    }

    await closeShiftMutation.mutateAsync({
      id: currentShift.id,
      data: {
        companyId: company?.companyId || 0,
        actualCash: parseFloat(closeFormData.actualCash),
        closingNotes: closeFormData.closingNotes || undefined,
      },
    });

    setShowCloseModal(false);
    resetCloseForm();
  };

  const handleCashMovement = async () => {
    if (
      !currentShift ||
      !cashMovementFormData.amount ||
      !cashMovementFormData.reason
    ) {
      return;
    }

    await createCashMovementMutation.mutateAsync({
      companyId: company?.companyId || 0,
      shiftId: currentShift.id,
      amount: parseFloat(cashMovementFormData.amount),
      type: cashMovementFormData.type,
      reason: cashMovementFormData.reason,
      reference: cashMovementFormData.reference || undefined,
      notes: cashMovementFormData.notes || undefined,
    });

    setShowCashMovementModal(false);
    resetCashMovementForm();
  };

  const resetOpenForm = () => {
    setOpenFormData({
      registerId: "",
      openingBalance: "",
      notes: "",
    });
  };

  const resetCloseForm = () => {
    setCloseFormData({
      actualCash: "",
      closingNotes: "",
    });
  };

  const resetCashMovementForm = () => {
    setCashMovementFormData({
      type: "CASH_IN",
      amount: "",
      reason: "",
      reference: "",
      notes: "",
    });
  };

  // Available registers for opening shift (active and without open shifts)
  const availableRegisters =
    registersData?.cashRegisters?.filter(
      (r) =>
        r.isActive && (!r.shifts || r.shifts.length === 0)
    ) || [];

  const registerOptions = availableRegisters.map((r) => ({
    value: r.id,
    label: `${r.name} ${r.location ? `- ${r.location}` : ""}`,
  }));

  const statusFilterOptions = [
    { value: "", label: "جميع الحالات" },
    { value: "OPEN", label: "مفتوحة" },
    { value: "CLOSED", label: "مغلقة" },
  ];

  const cashMovementTypeOptions = [
    { value: "CASH_IN", label: "إيداع نقدي" },
    { value: "CASH_OUT", label: "سحب نقدي" },
    { value: "PAYOUT", label: "صرف" },
    { value: "BANK_DEPOSIT", label: "إيداع بنكي" },
    { value: "PETTY_CASH", label: "مصروفات نثرية" },
    { value: "CASH_CORRECTION", label: "تصحيح نقدي" },
  ];

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الورديات</h1>
            <p className="text-gray-600 mt-1">
              إدارة الورديات والحركات النقدية
            </p>
          </div>
          {isCashier && !hasOpenShift && (
            <Button onClick={() => setShowOpenModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              فتح وردية جديدة
            </Button>
          )}
        </div>

        {/* Current Shift Card */}
        {hasOpenShift && currentShift && currentSummary && (
          <Card padding="md" className="bg-gradient-to-r from-primary-50 to-blue-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-primary-600 ml-2" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      الوردية الحالية
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currentShift.register.name} - بدأت{" "}
                      {formatTableDate(currentShift.startTime)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCashMovementModal(true)}
                  >
                    <ArrowRightLeft className="w-4 h-4 ml-1" />
                    حركة نقدية
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCloseModal(true)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 ml-1" />
                    إغلاق الوردية
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600">الرصيد الافتتاحي</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(currentSummary.openingBalance)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600">إجمالي المبيعات</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(currentSummary.totalSalesAmount)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600">النقد المتوقع</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(currentSummary.expectedCash)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600">مدة الوردية</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentSummary.duration}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* No Open Shift Alert */}
        {!hasOpenShift && isCashier && (
          <Card padding="md" className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 ml-2" />
              <p className="text-sm text-yellow-800">
                لا توجد وردية مفتوحة حالياً. قم بفتح وردية جديدة للبدء.
              </p>
            </div>
          </Card>
        )}

        {/* Shifts Table with integrated search */}
        <DataTable<Shift>
          title="جميع الورديات"
          columns={columns}
          data={shiftsData?.data?.shifts || []}
          loading={isLoading}
          searchPlaceholder="البحث في الورديات..."
          onSearch={(value) => {
            // Search functionality can be added to API
            setCurrentPage(1);
          }}
          actions={[
            {
              icon: Eye,
              label: "عرض التفاصيل",
              onClick: (shift) => navigate(`/shifts/${shift.id}`),
              variant: "primary",
            },
          ]}
          totalItems={shiftsData?.data?.pagination?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد ورديات حتى الآن. قم بفتح وردية جديدة للبدء!"
        />

        {/* Open Shift Modal */}
        <Modal
          isOpen={showOpenModal}
          onClose={() => {
            setShowOpenModal(false);
            resetOpenForm();
          }}
          title="فتح وردية جديدة"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                صندوق النقد <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="اختر الصندوق"
                options={registerOptions}
                value={openFormData.registerId}
                onChange={(value) =>
                  setOpenFormData({ ...openFormData, registerId: value })
                }
              />
              {availableRegisters.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  لا توجد صناديق متاحة. جميع الصناديق النشطة لديها ورديات مفتوحة.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الرصيد الافتتاحي <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={openFormData.openingBalance}
                onChange={(e) =>
                  setOpenFormData({
                    ...openFormData,
                    openingBalance: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="ملاحظات اختيارية"
                value={openFormData.notes}
                onChange={(e) =>
                  setOpenFormData({ ...openFormData, notes: e.target.value })
                }
              />
            </div>

            <div className="flex space-x-3 space-x-reverse pt-4">
              <Button
                onClick={handleOpenShift}
                loading={createShiftMutation.isPending}
                disabled={
                  !openFormData.registerId || !openFormData.openingBalance
                }
              >
                فتح الوردية
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowOpenModal(false);
                  resetOpenForm();
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>

        {/* Close Shift Modal */}
        <Modal
          isOpen={showCloseModal}
          onClose={() => {
            setShowCloseModal(false);
            resetCloseForm();
          }}
          title="إغلاق الوردية"
        >
          {currentSummary && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">الرصيد الافتتاحي:</span>
                  <span className="font-medium">
                    {formatCurrency(currentSummary.openingBalance)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">مبيعات نقدية:</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(currentSummary.cashSales)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">حركات نقدية (صافي):</span>
                  <span
                    className={`font-medium ${
                      currentSummary.cashMovements.net >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {currentSummary.cashMovements.net >= 0 ? "+" : ""}
                    {formatCurrency(currentSummary.cashMovements.net)}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                  <span className="text-gray-900">النقد المتوقع:</span>
                  <span className="text-primary-600">
                    {formatCurrency(currentSummary.expectedCash)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  النقد الفعلي <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={closeFormData.actualCash}
                  onChange={(e) =>
                    setCloseFormData({
                      ...closeFormData,
                      actualCash: e.target.value,
                    })
                  }
                />
                {closeFormData.actualCash && (
                  <div className="mt-2">
                    <div
                      className={`flex items-center text-sm ${
                        parseFloat(closeFormData.actualCash) -
                          currentSummary.expectedCash >=
                        0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {parseFloat(closeFormData.actualCash) -
                        currentSummary.expectedCash >=
                      0 ? (
                        <TrendingUp className="w-4 h-4 ml-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 ml-1" />
                      )}
                      <span>
                        الفرق:{" "}
                        {formatCurrency(
                          parseFloat(closeFormData.actualCash) -
                            currentSummary.expectedCash
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات الإغلاق
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="ملاحظات اختيارية"
                  value={closeFormData.closingNotes}
                  onChange={(e) =>
                    setCloseFormData({
                      ...closeFormData,
                      closingNotes: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex space-x-3 space-x-reverse pt-4">
                <Button
                  onClick={handleCloseShift}
                  loading={closeShiftMutation.isPending}
                  disabled={!closeFormData.actualCash}
                  className="bg-red-600 hover:bg-red-700"
                >
                  إغلاق الوردية
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCloseModal(false);
                    resetCloseForm();
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Cash Movement Modal */}
        <Modal
          isOpen={showCashMovementModal}
          onClose={() => {
            setShowCashMovementModal(false);
            resetCashMovementForm();
          }}
          title="تسجيل حركة نقدية"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الحركة <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="اختر نوع الحركة"
                options={cashMovementTypeOptions}
                value={cashMovementFormData.type}
                onChange={(value) =>
                  setCashMovementFormData({
                    ...cashMovementFormData,
                    type: value as CashMovement["type"],
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المبلغ <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={cashMovementFormData.amount}
                onChange={(e) =>
                  setCashMovementFormData({
                    ...cashMovementFormData,
                    amount: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السبب <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="مثال: إيداع من المبيعات"
                value={cashMovementFormData.reason}
                onChange={(e) =>
                  setCashMovementFormData({
                    ...cashMovementFormData,
                    reason: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المرجع
              </label>
              <Input
                placeholder="رقم مرجعي اختياري"
                value={cashMovementFormData.reference}
                onChange={(e) =>
                  setCashMovementFormData({
                    ...cashMovementFormData,
                    reference: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="ملاحظات اختيارية"
                value={cashMovementFormData.notes}
                onChange={(e) =>
                  setCashMovementFormData({
                    ...cashMovementFormData,
                    notes: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex space-x-3 space-x-reverse pt-4">
              <Button
                onClick={handleCashMovement}
                loading={createCashMovementMutation.isPending}
                disabled={
                  !cashMovementFormData.amount || !cashMovementFormData.reason
                }
              >
                تسجيل الحركة
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCashMovementModal(false);
                  resetCashMovementForm();
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default Shifts;
