import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, LoadingSpinner } from "../ui";

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
  };
  onRowClick?: (record: T) => void;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  onRowClick,
}: DataTableProps<T>) {
  const renderCell = (column: Column<T>, record: T) => {
    const value = record[column.key as keyof T];
    return column.render ? column.render(value, record) : value;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8">
          <LoadingSpinner size="lg" text="جاري تحميل البيانات..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.width || ""
                  }`}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length > 0 ? (
              data.map((record, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {renderCell(column, record)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  لا توجد بيانات للعرض
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              عرض{" "}
              <span className="font-medium">
                {(pagination.current - 1) * pagination.pageSize + 1}
              </span>{" "}
              إلى{" "}
              <span className="font-medium">
                {Math.min(
                  pagination.current * pagination.pageSize,
                  pagination.total
                )}
              </span>{" "}
              من <span className="font-medium">{pagination.total}</span> نتيجة
            </p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onChange(pagination.current - 1)}
              disabled={pagination.current <= 1}
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </Button>
            <span className="px-3 py-1 text-sm text-gray-700">
              صفحة {pagination.current} من{" "}
              {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onChange(pagination.current + 1)}
              disabled={
                pagination.current >=
                Math.ceil(pagination.total / pagination.pageSize)
              }
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
