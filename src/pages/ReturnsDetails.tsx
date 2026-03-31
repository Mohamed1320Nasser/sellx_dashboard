import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Package, User, FileText, DollarSign, Check, XCircle } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card } from "../components/ui";
import { PermissionButton } from "../components/common/PermissionButton";
import { formatCurrency, formatNumber } from "../utils/currencyUtils";
import { formatDate } from "../utils/dateUtils";
import { useReturn, useUpdateReturnStatus } from "../hooks/api/useReturns";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { ReturnStatus } from "../types";

const ReturnsDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();

  // Get return data from API
  const { data: returnData, isLoading, error } = useReturn(id || "", company?.companyId || 0);
  const updateStatusMutation = useUpdateReturnStatus();


  // Extract the actual return data from the response
  const actualReturnData = (returnData as any)?.data || returnData;

  // Status update handler
  const handleStatusUpdate = (status: ReturnStatus) => {
    if (company?.companyId && id) {
      updateStatusMutation.mutate(
        { 
          id, 
          data: { status, companyId: company.companyId } 
        }
      );
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">جاري التحميل...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">خطأ في تحميل بيانات الإرجاع</div>
            <div className="text-sm text-gray-500">
              {error.message || 'حدث خطأ غير متوقع'}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!actualReturnData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-500 mb-2">لم يتم العثور على الإرجاع</div>
            <div className="text-sm text-gray-400">
              قد يكون الإرجاع غير موجود أو لا تملك صلاحية للوصول إليه
            </div>
          </div>
        </div>
      </Layout>
    );
  }


  const subtotal = actualReturnData.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              variant="ghost"
              onClick={() => navigate('/returns')}
              className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة للإرجاعات</span>
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تفاصيل الإرجاع</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => navigate(`/returns/${id}/edit`)}
            >
              تعديل الإرجاع
            </Button>
            <Button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              طباعة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Return Information */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <RotateCcw className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">معلومات الإرجاع</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">رقم الإرجاع</label>
                      <p className="text-sm text-gray-900 font-mono">{actualReturnData.returnNumber || 'غير محدد'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الإرجاع</label>
                      <p className="text-sm text-gray-900">{actualReturnData.createdAt ? formatDate(actualReturnData.createdAt) : 'غير محدد'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          actualReturnData.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          actualReturnData.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          actualReturnData.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {actualReturnData.status === 'COMPLETED' ? 'مكتمل' :
                           actualReturnData.status === 'PENDING' ? 'معلق' :
                           actualReturnData.status === 'REJECTED' ? 'مرفوض' :
                           actualReturnData.status || 'غير محدد'}
                        </span>
                        
                        {/* Status Update Buttons - Only show for pending returns */}
                        {actualReturnData.status === 'PENDING' && (
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <PermissionButton
                              permission="canEditReturns"
                              onClick={() => handleStatusUpdate(ReturnStatus.COMPLETED)}
                              className="text-green-600 hover:text-green-700 border border-green-300 rounded px-2 py-1 hover:bg-green-50 text-xs"
                              disabled={updateStatusMutation.isPending}
                            >
                              <Check className="w-3 h-3 ml-1" />
                              تأكيد
                            </PermissionButton>
                            <PermissionButton
                              permission="canEditReturns"
                              onClick={() => handleStatusUpdate(ReturnStatus.REJECTED)}
                              className="text-red-600 hover:text-red-700 border border-red-300 rounded px-2 py-1 hover:bg-red-50 text-xs"
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="w-3 h-3 ml-1" />
                              رفض
                            </PermissionButton>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">البيع الأصلي</label>
                      <p className="text-sm text-gray-900">#{actualReturnData.originalSaleId || 'غير محدد'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ الإجمالي</label>
                      <p className="text-sm text-gray-900">{formatCurrency(actualReturnData.totalAmount || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ الاسترداد</label>
                      <p className="text-sm text-gray-900">{formatCurrency(actualReturnData.refundAmount || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  {actualReturnData.reason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سبب الإرجاع</label>
                      <p className="text-sm text-gray-900">{actualReturnData.reason}</p>
                    </div>
                  )}
                  {actualReturnData.notes && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                      <p className="text-sm text-gray-900">{actualReturnData.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Items */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mr-3">المنتجات المرجعة</h3>
                  </div>
                  <div className="text-sm text-gray-500">
                    {actualReturnData.items?.length || 0} منتج
                  </div>
                </div>

                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          المنتج
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الكمية
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          سعر الوحدة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          المجموع
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          سبب الإرجاع
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {actualReturnData.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.product?.name || `منتج ${item.productId}`}
                              </div>
                              {item.product?.sku && (
                                <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(item.quantity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.totalPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.reason || '-'}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            لا توجد منتجات مرجعة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card padding="lg">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">معلومات العميل</h3>
                </div>
                <div className="space-y-3">
                  {actualReturnData.client ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                        <p className="text-sm text-gray-900">{actualReturnData.client.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                        <p className="text-sm text-gray-900">{actualReturnData.client.phone || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                        <p className="text-sm text-gray-900">{actualReturnData.client.email || '-'}</p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نوع العميل</label>
                      <p className="text-sm text-gray-900">عميل نقدي</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Summary */}
            <Card padding="lg">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">ملخص الإرجاع</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">المجموع الفرعي</span>
                    <span className="text-sm font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">مبلغ الاسترداد</span>
                      <span className="text-lg font-semibold text-green-600">{formatCurrency(actualReturnData.refundAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* System Information */}
            <Card padding="lg">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">معلومات النظام</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تم الإنشاء بواسطة</label>
                    <p className="text-sm text-gray-900">{actualReturnData.user?.fullname || `مستخدم ${actualReturnData.userId || 'غير محدد'}`}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الإنشاء</label>
                    <p className="text-sm text-gray-900">{actualReturnData.createdAt ? formatDate(actualReturnData.createdAt) : 'غير محدد'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الشركة</label>
                    <p className="text-sm text-gray-900">شركة {actualReturnData.companyId || 'غير محدد'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReturnsDetails;
