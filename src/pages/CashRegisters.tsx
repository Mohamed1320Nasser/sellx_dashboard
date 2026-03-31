import React, { useState } from "react";
import { Plus, Edit, Trash2, DollarSign, Clock, User, CheckCircle, XCircle, Hash, MapPin, Calendar } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, Input, Modal, DataTable, Badge } from "../components/ui";
import type { Column } from "../components/ui/DataTable";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import {
  useCashRegisters,
  useCreateCashRegister,
  useUpdateCashRegister,
  useDeleteCashRegister,
} from "../hooks/api/useCashRegisters";
import { formatTableDate } from "../utils/dateUtils";
import type { CashRegister } from "../services/cashRegisterService";

const CashRegisters: React.FC = () => {
  const { company, user } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    serialNumber: "",
  });

  // API hooks
  const { data: registersData, isLoading } = useCashRegisters(company?.companyId || 0);
  const createMutation = useCreateCashRegister();
  const updateMutation = useUpdateCashRegister();
  const deleteMutation = useDeleteCashRegister();

  // Check if user has manager role
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  // Table columns
  const columns: Column<CashRegister>[] = [
    {
      key: "name",
      label: "اسم الصندوق",
      render: (register: CashRegister) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-900">{register.name}</span>
        </div>
      ),
    },
    {
      key: "location",
      label: "الموقع",
      render: (register: CashRegister) => (
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{register.location || "-"}</span>
        </div>
      ),
    },
    {
      key: "serialNumber",
      label: "الرقم التسلسلي",
      render: (register: CashRegister) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Hash className="w-4 h-4 text-gray-400" />
          <span>{register.serialNumber || "-"}</span>
        </div>
      ),
    },
    {
      key: "isActive",
      label: "الحالة",
      render: (register: CashRegister) => (
        <Badge variant={register.isActive ? "success" : "error"}>
          {register.isActive ? (
            <>
              <CheckCircle className="w-3 h-3 ml-1 inline" />
              نشط
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 ml-1 inline" />
              غير نشط
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "shifts",
      label: "الوردية المفتوحة",
      render: (register: CashRegister) => {
        const openShift = (register.shifts as any)?.[0];
        if (openShift) {
          return (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600 font-medium">{openShift.user.fullname}</span>
            </div>
          );
        }
        return <span className="text-gray-400">لا توجد وردية</span>;
      },
    },
    {
      key: "createdAt",
      label: "تاريخ الإنشاء",
      render: (register: CashRegister) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatTableDate((register as any).createdAt)}</span>
        </div>
      ),
    },
  ];

  // Handlers
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      return;
    }

    await createMutation.mutateAsync({
      companyId: company?.companyId || 0,
      name: formData.name,
      location: formData.location || undefined,
      description: formData.description || undefined,
      serialNumber: formData.serialNumber || undefined,
    });

    setShowCreateModal(false);
    resetForm();
  };

  const handleEdit = (register: CashRegister) => {
    setSelectedRegister(register);
    setFormData({
      name: register.name,
      location: register.location || "",
      description: register.description || "",
      serialNumber: register.serialNumber || "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedRegister || !formData.name.trim()) {
      return;
    }

    await updateMutation.mutateAsync({
      id: selectedRegister.id,
      data: {
        companyId: company?.companyId || 0,
        name: formData.name,
        location: formData.location || undefined,
        description: formData.description || undefined,
        serialNumber: formData.serialNumber || undefined,
      },
    });

    setShowEditModal(false);
    setSelectedRegister(null);
    resetForm();
  };

  const handleDelete = async (register: CashRegister) => {
    if (
      window.confirm(
        `هل أنت متأكد من حذف صندوق النقد "${register.name}"؟`
      )
    ) {
      await deleteMutation.mutateAsync({
        id: register.id,
        companyId: company?.companyId || 0,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      description: "",
      serialNumber: "",
    });
  };

  // Calculate statistics
  const totalRegisters = registersData?.cashRegisters?.length || 0;
  const activeRegisters =
    registersData?.cashRegisters?.filter((r) => r.isActive).length || 0;
  const openShifts =
    registersData?.cashRegisters?.filter(
      (r) => r.shifts && r.shifts.length > 0
    ).length || 0;

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              إدارة صناديق النقد
            </h1>
            <p className="text-gray-600 mt-1">
              إدارة صناديق النقد والورديات
            </p>
          </div>
          {isManager && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              صندوق نقد جديد
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الصناديق</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalRegisters}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الصناديق النشطة</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeRegisters}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الورديات المفتوحة</p>
                <p className="text-2xl font-bold text-blue-600">
                  {openShifts}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Registers Table with integrated search */}
        <DataTable<CashRegister>
          title="جميع صناديق النقد"
          columns={columns}
          data={registersData?.cashRegisters || []}
          loading={isLoading}
          searchPlaceholder="البحث في صناديق النقد (الاسم، الموقع، الرقم التسلسلي...)"
          onSearch={(value) => {
            // Search functionality can be added
          }}
          actions={[
            {
              icon: Edit,
              label: "تعديل الصندوق",
              onClick: (register) => handleEdit(register),
              variant: "warning",
              show: () => isManager,
            },
            {
              icon: Trash2,
              label: "حذف الصندوق",
              onClick: (register) => handleDelete(register),
              variant: "danger",
              show: (register) => isManager && (!register.shifts || register.shifts.length === 0),
            },
          ]}
          totalItems={registersData?.cashRegisters?.length || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد صناديق نقد حتى الآن. قم بإضافة صندوق جديد للبدء!"
        />

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="إضافة صندوق نقد جديد"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الصندوق <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="مثال: صندوق 1"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الموقع
              </label>
              <Input
                placeholder="مثال: الطابق الأول"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الرقم التسلسلي
              </label>
              <Input
                placeholder="مثال: CR-001"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="وصف اختياري للصندوق"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="flex space-x-3 space-x-reverse pt-4">
              <Button
                onClick={handleCreate}
                loading={createMutation.isPending}
                disabled={!formData.name.trim()}
              >
                إضافة
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRegister(null);
            resetForm();
          }}
          title="تعديل صندوق النقد"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الصندوق <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="مثال: صندوق 1"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الموقع
              </label>
              <Input
                placeholder="مثال: الطابق الأول"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الرقم التسلسلي
              </label>
              <Input
                placeholder="مثال: CR-001"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="وصف اختياري للصندوق"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="flex space-x-3 space-x-reverse pt-4">
              <Button
                onClick={handleUpdate}
                loading={updateMutation.isPending}
                disabled={!formData.name.trim()}
              >
                حفظ التغييرات
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRegister(null);
                  resetForm();
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

export default CashRegisters;
