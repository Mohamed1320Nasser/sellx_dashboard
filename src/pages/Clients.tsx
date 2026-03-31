import React, { useState } from "react";
import { Plus, Edit, Trash2, Users, User, Phone, Mail, Calendar, ShoppingBag } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, Modal, Input, ConfirmDialog, DataTable, Badge } from "../components/ui";
import type { Column } from "../components/ui/DataTable";
import { PermissionGuard } from "../components/common/PermissionGuard";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "../hooks/api/useClients";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Client } from "../types";
import { formatTableDate } from "../utils/dateUtils";

const clientSchema = z.object({
  name: z.string().min(1, "اسم العميل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

const ClientForm: React.FC<{
  client?: Client;
  companyId: number;
  onSubmit: (data: ClientFormData & { companyId: number }) => void;
  loading?: boolean;
  onCancel?: () => void;
}> = ({ client, companyId, onSubmit, loading = false, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      address: client?.address || "",
    },
  });

  const handleFormSubmit = (data: ClientFormData) => {
    onSubmit({ ...data, companyId });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Input
        label="اسم العميل"
        placeholder="أدخل اسم العميل"
        {...register("name")}
        error={errors.name?.message}
        disabled={loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="البريد الإلكتروني"
          type="email"
          placeholder="أدخل البريد الإلكتروني"
          {...register("email")}
          error={errors.email?.message}
          disabled={loading}
        />

        <Input
          label="رقم الهاتف"
          placeholder="أدخل رقم الهاتف"
          {...register("phone")}
          error={errors.phone?.message}
          disabled={loading}
        />
      </div>

      <Input
        label="العنوان"
        placeholder="أدخل العنوان"
        {...register("address")}
        error={errors.address?.message}
        disabled={loading}
      />

      <div className="flex justify-end space-x-4 space-x-reverse">
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
        <Button type="submit" loading={loading}>
          {client ? "تحديث العميل" : "إنشاء عميل جديد"}
        </Button>
      </div>
    </form>
  );
};

const Clients: React.FC = () => {
  const { company } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({ isOpen: false, client: null });

  // API hooks
  const { data: clientsData, isLoading } = useClients({
    companyId: company?.companyId || company?.company?.id,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
  });

  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  // Table columns
  const columns: Column<Client>[] = [
    {
      key: "name",
      label: "اسم العميل",
      render: (client: Client) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-primary-500/30">
            {client.name[0].toUpperCase()}
          </div>
          <span className="font-medium text-gray-900">{client.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "البريد الإلكتروني",
      render: (client: Client) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span>{client.email || "غير محدد"}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "رقم الهاتف",
      render: (client: Client) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{client.phone || "غير محدد"}</span>
        </div>
      ),
    },
    {
      key: "_count",
      label: "عدد المبيعات",
      render: (client: Client) => (
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-primary-600" />
          <span className="font-bold text-primary-600">{(client as any)._count?.sales || 0}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "تاريخ الإضافة",
      render: (client: Client) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatTableDate((client as any).createdAt)}</span>
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
    if (editingClient) {
      updateMutation.mutate(
        { id: editingClient.id, data },
        {
          onSuccess: () => {
            setEditingClient(null);
          },
        }
      );
    }
  };

  const handleDelete = (client: Client) => {
    setDeleteConfirm({ isOpen: true, client });
  };

  const confirmDelete = () => {
    if (deleteConfirm.client) {
      deleteMutation.mutate({
        id: deleteConfirm.client.id,
        companyId: company?.companyId || company?.company?.id,
      });
      setDeleteConfirm({ isOpen: false, client: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, client: null });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة العملاء</h1>
            <p className="text-gray-600 mt-1">
              إدارة العملاء وبيانات الاتصال بهم
            </p>
          </div>
          <PermissionGuard permission="canCreateClients">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة عميل جديد
            </Button>
          </PermissionGuard>
        </div>

        {/* Summary Card */}
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">إجمالي العملاء</p>
              <p className="text-2xl font-bold text-gray-900">
                {(clientsData as any)?.data?.totalCount || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Clients Table with integrated search */}
        <DataTable<Client>
          title="جميع العملاء"
          columns={columns}
          data={clientsData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في العملاء (الاسم، البريد الإلكتروني، رقم الهاتف...)"
          onSearch={handleSearch}
          actions={[
            {
              icon: Edit,
              label: "تعديل العميل",
              onClick: (client) => setEditingClient(client),
              variant: "warning",
            },
            {
              icon: Trash2,
              label: "حذف العميل",
              onClick: (client) => handleDelete(client),
              variant: "danger",
            },
          ]}
          totalItems={clientsData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد عملاء حتى الآن. قم بإضافة عميل جديد للبدء!"
        />

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="إضافة عميل جديد"
        >
          <ClientForm
            companyId={company?.companyId || company?.company?.id}
            onSubmit={handleCreate}
            loading={createMutation.isPending}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          title="تعديل العميل"
        >
          {editingClient && (
            <ClientForm
              client={editingClient}
              companyId={company?.companyId || company?.company?.id}
              onSubmit={handleUpdate}
              loading={updateMutation.isPending}
              onCancel={() => setEditingClient(null)}
            />
          )}
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف العميل "${deleteConfirm.client?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          type="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
};

export default Clients;
