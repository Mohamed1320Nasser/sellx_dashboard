import React, { useState } from "react";
import { Plus, Edit, Trash2, UserCheck, UserX, User as UserIcon, Mail, Phone, Calendar } from "lucide-react";
import { Button, Card, Modal, Input, Select, DataTable, Badge } from "../components/ui";
import type { Column } from "../components/ui/DataTable";
import { CompanyUserForm } from "../components/forms";
import { Layout } from "../components/layout";
import { PermissionGuard } from "../components/common/PermissionGuard";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { usePermissionStore } from "../stores/permissionStore";
import { getRoleDisplayName } from "../utils/permissions";
import {
  useCompanyUsers,
  useCreateCompanyUser,
  useUpdateCompanyUser,
  useToggleUserStatus,
  useRemoveUser,
} from "../hooks/api/useUsers";

const UserManagement: React.FC = () => {
  const { company, user } = useSessionAuthStore();
  const { hasPermission } = usePermissionStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // API hooks
  // Don't make API call if companyId is 0 or invalid
  const shouldFetch = company?.companyId && company.companyId > 0;

  const { data: usersData, isLoading, error } = useCompanyUsers({
    companyId: company?.companyId || 0,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    role: roleFilter ? (roleFilter as "CASHIER" | "MANAGER" | "ADMIN") : undefined,
  });

  const createMutation = useCreateCompanyUser();
  const updateMutation = useUpdateCompanyUser();
  const toggleStatusMutation = useToggleUserStatus();
  const removeMutation = useRemoveUser();

  // Show message if company ID is invalid
  if (!shouldFetch) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              لا يمكن تحميل بيانات المستخدمين
            </h2>
            <p className="text-gray-600">
              يرجى التأكد من تسجيل الدخول بحساب شركة صحيح
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Company ID: {company?.companyId || "غير محدد"}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error message if API call failed
  if (error) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              خطأ في تحميل بيانات المستخدمين
            </h2>
            <p className="text-gray-600">
              {error instanceof Error ? error.message : "حدث خطأ غير متوقع"}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Table columns
  const columns: Column<any>[] = [
    {
      key: "fullname",
      label: "اسم المستخدم",
      render: (record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-primary-500/30">
            {(record.user?.fullname || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{record.user?.fullname || "غير محدد"}</p>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Mail className="w-3 h-3" />
              <span>{record.user?.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "رقم الهاتف",
      render: (record: any) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{record.user?.phone || "غير محدد"}</span>
        </div>
      ),
    },
    {
      key: "role",
      label: "الدور",
      render: (record: any) => {
        const role = record.role;
        const roleColors: Record<string, 'primary' | 'success' | 'warning'> = {
          ADMIN: "warning",
          MANAGER: "primary",
          CASHIER: "success",
        };
        return (
          <Badge variant={roleColors[role] || "primary"}>
            {getRoleDisplayName(role as any)}
          </Badge>
        );
      },
    },
    {
      key: "isActive",
      label: "الحالة",
      render: (record: any) => (
        <Badge variant={record.isActive ? "success" : "error"}>
          {record.isActive ? "نشط" : "غير نشط"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "تاريخ الانضمام",
      render: (record: any) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {record.createdAt
              ? new Date(record.createdAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  calendar: "gregory"
                })
              : "غير محدد"
            }
          </span>
        </div>
      ),
    },
  ];

  // Handlers
  const handleCreate = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowCreateModal(false);
      },
    });
  };

  const handleUpdate = (data: any) => {
    if (editingUser) {
      updateMutation.mutate(
        { userId: editingUser.id, data },
        {
          onSuccess: () => {
            setEditingUser(null);
          },
        }
      );
    }
  };

  const handleToggleStatus = (user: any, activate: boolean) => {
    toggleStatusMutation.mutate({
      userId: user.user?.id || user.id,
      companyId: company?.companyId || 0,
      action: activate ? "activate" : "deactivate",
    });
  };

  const handleRemoveUser = (user: any) => {
    if (window.confirm(`هل أنت متأكد من إزالة المستخدم "${user.user?.fullname || user.fullname}"؟`)) {
      removeMutation.mutate({
        userId: user.user?.id || user.id,
        companyId: company?.companyId || 0,
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const roleOptions = [
    { value: "", label: "جميع الأدوار" },
    { value: "CASHIER", label: "كاشير" },
    { value: "MANAGER", label: "مدير" },
    { value: "ADMIN", label: "مدير شركة" },
  ];

  // Calculate summary stats
  const totalUsers = usersData?.data?.totalCount || 0;
  const activeUsers = (usersData?.data?.list || []).filter(
    (u: any) => u.isActive
  ).length || 0;

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
            <p className="text-gray-600 mt-1">
              إدارة مستخدمي الشركة وصلاحياتهم
            </p>
          </div>
          <PermissionGuard permission="canCreateUsers">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مستخدم جديد
            </Button>
          </PermissionGuard>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المستخدمون النشطون</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                <UserX className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المستخدمون غير النشطين</p>
                <p className="text-2xl font-bold text-red-600">{totalUsers - activeUsers}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Users Table with integrated search */}
        <DataTable<any>
          title="جميع المستخدمين"
          columns={columns}
          data={usersData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في المستخدمين (الاسم، البريد الإلكتروني، رقم الهاتف...)"
          onSearch={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          actions={[
            {
              icon: Edit,
              label: "تعديل المستخدم",
              onClick: (record) => setEditingUser(record),
              variant: "warning",
              show: () => hasPermission("canEditUsers"),
            },
            {
              icon: UserX,
              label: "تعطيل/تفعيل",
              onClick: (record) => handleToggleStatus(record, !record.isActive),
              variant: "warning",
              show: () => hasPermission("canEditUsers"),
            },
            {
              icon: Trash2,
              label: "حذف المستخدم",
              onClick: (record) => handleRemoveUser(record),
              variant: "danger",
              show: () => hasPermission("canDeleteUsers"),
            },
          ]}
          totalItems={usersData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا يوجد مستخدمون حتى الآن. قم بإضافة مستخدم جديد للبدء!"
        />

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="إضافة مستخدم جديد"
        >
          <CompanyUserForm
            companyId={company?.companyId || 0}
            onSubmit={handleCreate}
            loading={createMutation.isPending}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title="تعديل المستخدم"
        >
          {editingUser && (
            <CompanyUserForm
              companyId={company?.companyId || 0}
              onSubmit={handleUpdate}
              loading={updateMutation.isPending}
              onCancel={() => setEditingUser(null)}
              isEdit={true}
              initialData={{
                fullname: editingUser.user?.fullname || editingUser.fullname,
                email: editingUser.user?.email || editingUser.email,
                phone: editingUser.user?.phone || editingUser.phone,
                role: editingUser.role,
              }}
            />
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default UserManagement;
