import React, { useState, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  FileText,
  Shield,
  Send,
} from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, Modal, CountUpNumber, DataTable, Badge } from "../components/ui";
import type { Column, TableFilter } from "../components/ui/DataTable";
import { AbsenceForm, AbsenceApprovalForm } from "../components/forms";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { formatTableDate } from "../utils/dateUtils";
import {
  useAbsences,
  useAbsenceSummary,
  useCreateAbsence,
  useApproveAbsence,
  useDeleteAbsence,
} from "../hooks/api/useAbsences";
import { useCompanyUsers } from "../hooks/api/useUsers";
import type { Absence, AbsenceType, AbsenceStatus, CreateAbsenceRequest, ApproveAbsenceRequest } from "../types";

const Absences: React.FC = () => {
  const { company, user } = useSessionAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AbsenceStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<AbsenceType | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);

  // API hooks
  const { data: absencesData, isLoading } = useAbsences({
    companyId: company?.companyId || 0,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });

  const { data: summary } = useAbsenceSummary(company?.companyId || 0);
  const { data: usersData } = useCompanyUsers({ companyId: company?.companyId || 0 });

  const createMutation = useCreateAbsence();
  const approveMutation = useApproveAbsence();
  const deleteMutation = useDeleteAbsence();

  // Table columns
  const columns: Column<Absence>[] = [
    {
      key: "user",
      label: "الموظف",
      render: (absence: Absence) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-purple-500/30">
            {(absence.user?.fullname || "U")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{absence.user?.fullname || "غير محدد"}</div>
            {absence.user?.email && (
              <div className="text-sm text-gray-500">{absence.user.email}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "نوع الغياب",
      render: (absence: Absence) => {
        const typeLabels: Record<string, string> = {
          SICK_LEAVE: "إجازة مرضية",
          VACATION: "إجازة سنوية",
          PERSONAL_LEAVE: "إجازة شخصية",
          MATERNITY_LEAVE: "إجازة أمومة",
          PATERNITY_LEAVE: "إجازة أبوة",
          BEREAVEMENT: "إجازة وفاة",
          OTHER: "أخرى",
        };
        return (
          <Badge variant="primary">
            {typeLabels[absence.type] || absence.type}
          </Badge>
        );
      },
    },
    {
      key: "dates",
      label: "التواريخ",
      render: (absence: Absence) => (
        <div>
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>{formatTableDate(absence.startDate)}</span>
          </div>
          <div className="text-sm text-gray-500">إلى {formatTableDate(absence.endDate)}</div>
        </div>
      ),
    },
    {
      key: "totalDays",
      label: "عدد الأيام",
      render: (absence: Absence) => (
        <div className="text-center">
          <Badge variant="default">{absence.totalDays} يوم</Badge>
        </div>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      render: (absence: Absence) => {
        const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'error' | 'default'; Icon: any }> = {
          PENDING: { label: "في الانتظار", variant: "warning", Icon: Clock },
          APPROVED: { label: "موافق عليه", variant: "success", Icon: CheckCircle },
          REJECTED: { label: "مرفوض", variant: "error", Icon: XCircle },
          CANCELLED: { label: "ملغي", variant: "default", Icon: XCircle },
        };
        const config = statusConfig[absence.status] || statusConfig.PENDING;
        const Icon = config.Icon;
        return (
          <Badge variant={config.variant}>
            <Icon className="w-3 h-3 ml-1 inline" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "creationType",
      label: "نوع الإنشاء",
      render: (absence: Absence) => {
        const isDirectCreation = absence.approvedBy === absence.userId;
        return (
          <div className="flex items-center gap-1">
            {isDirectCreation ? (
              <>
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">مباشر</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">طلب</span>
              </>
            )}
          </div>
        );
      },
    },
  ];

  // Handle form submissions
  const handleCreateAbsence = (data: CreateAbsenceRequest) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowCreateModal(false);
      },
    });
  };

  const handleApproveAbsence = (data: ApproveAbsenceRequest) => {
    if (!selectedAbsence) return;
    
    approveMutation.mutate(
      { id: selectedAbsence.id, data },
      {
        onSuccess: () => {
          setShowApprovalModal(false);
          setSelectedAbsence(null);
        },
      }
    );
  };

  // Filter handlers
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value as AbsenceStatus | "");
    setCurrentPage(1);
  }, []);

  const handleTypeFilter = useCallback((value: string) => {
    setTypeFilter(value as AbsenceType | "");
    setCurrentPage(1);
  }, []);

  // Filter options
  const statusFilterOptions = useMemo(() => [
    { value: "", label: "جميع الحالات" },
    { value: "PENDING", label: "في الانتظار" },
    { value: "APPROVED", label: "موافق عليه" },
    { value: "REJECTED", label: "مرفوض" },
    { value: "CANCELLED", label: "ملغي" },
  ], []);

  const typeFilterOptions = useMemo(() => [
    { value: "", label: "جميع الأنواع" },
    { value: "SICK_LEAVE", label: "إجازة مرضية" },
    { value: "VACATION", label: "إجازة سنوية" },
    { value: "PERSONAL_LEAVE", label: "إجازة شخصية" },
    { value: "MATERNITY_LEAVE", label: "إجازة أمومة" },
    { value: "PATERNITY_LEAVE", label: "إجازة أبوة" },
    { value: "BEREAVEMENT", label: "إجازة وفاة" },
    { value: "OTHER", label: "أخرى" },
  ], []);

  // Table filters configuration
  const tableFilters: TableFilter[] = useMemo(() => [
    {
      key: 'status',
      label: 'الحالة',
      type: 'select',
      options: statusFilterOptions,
      value: statusFilter,
      onChange: (value) => handleStatusFilter(value as string),
    },
    {
      key: 'type',
      label: 'نوع الغياب',
      type: 'select',
      options: typeFilterOptions,
      value: typeFilter,
      onChange: (value) => handleTypeFilter(value as string),
    },
  ], [statusFilterOptions, typeFilterOptions, statusFilter, typeFilter, handleStatusFilter, handleTypeFilter]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الغياب</h1>
            <p className="text-gray-600">إدارة طلبات الغياب والإجازات</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className={isAdmin ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
          >
            <Plus className="w-4 h-4 ml-2" />
            {isAdmin ? "إضافة غياب مباشر" : "طلب إجازة جديد"}
          </Button>
        </div>

        {/* Statistics Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <CountUpNumber value={summary.totalAbsences} />
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/30">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">في الانتظار</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <CountUpNumber value={summary.pendingAbsences} />
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">موافق عليها</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <CountUpNumber value={summary.approvedAbsences} />
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">مرفوضة</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <CountUpNumber value={summary.rejectedAbsences} />
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Absences Table with integrated search and filters */}
        <DataTable<Absence>
          title="جميع طلبات الغياب"
          columns={columns}
          data={absencesData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في طلبات الغياب (اسم الموظف...)"
          onSearch={handleSearch}
          filters={tableFilters}
          actions={[
            {
              icon: Eye,
              label: "عرض التفاصيل",
              onClick: (absence) => {
                setSelectedAbsence(absence);
                setShowDetailsModal(true);
              },
              variant: "primary",
            },
            {
              icon: CheckCircle,
              label: "الموافقة",
              onClick: (absence) => {
                setSelectedAbsence(absence);
                setShowApprovalModal(true);
              },
              variant: "success",
              show: (absence) => absence.status === "PENDING",
            },
            {
              icon: Trash2,
              label: "حذف الطلب",
              onClick: (absence) => {
                if (confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
                  deleteMutation.mutate(absence.id);
                }
              },
              variant: "danger",
            },
          ]}
          totalItems={absencesData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد طلبات غياب حتى الآن. قم بإضافة طلب جديد للبدء!"
        />
      </div>

      {/* Create Absence Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={isAdmin ? "إضافة غياب مباشر" : "طلب إجازة جديد"}
        size="lg"
      >
        <AbsenceForm
          companyId={company?.companyId || 0}
          users={usersData?.data?.list || []}
          onSubmit={handleCreateAbsence}
          loading={createMutation.isPending}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedAbsence(null);
        }}
        title="معالجة طلب الغياب"
        size="lg"
      >
        {selectedAbsence && (
          <AbsenceApprovalForm
            absence={selectedAbsence}
            onSubmit={handleApproveAbsence}
            loading={approveMutation.isPending}
            onCancel={() => {
              setShowApprovalModal(false);
              setSelectedAbsence(null);
            }}
          />
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAbsence(null);
        }}
        title="تفاصيل طلب الغياب"
        size="lg"
      >
        {selectedAbsence && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">الموظف</label>
                <p className="text-gray-900">{selectedAbsence.user?.fullname || "غير محدد"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">نوع الغياب</label>
                <p className="text-gray-900">{selectedAbsence.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">تاريخ البداية</label>
                <p className="text-gray-900">{formatTableDate(selectedAbsence.startDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">تاريخ النهاية</label>
                <p className="text-gray-900">{formatTableDate(selectedAbsence.endDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">عدد الأيام</label>
                <p className="text-gray-900">{selectedAbsence.totalDays} يوم</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">الحالة</label>
                <p className="text-gray-900">{selectedAbsence.status}</p>
              </div>
            </div>
            {selectedAbsence.reason && (
              <div>
                <label className="block text-sm font-medium text-gray-700">السبب</label>
                <p className="text-gray-900">{selectedAbsence.reason}</p>
              </div>
            )}
            {selectedAbsence.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
                <p className="text-gray-900">{selectedAbsence.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Absences;
