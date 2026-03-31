import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Edit, Trash2, Eye, MoreVertical, Filter, ChevronDown, Check, Loader2 } from 'lucide-react';
import { DateRangeFilter, DateRange } from '../filters';

export interface Column<T> {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
}

interface Action<T> {
    icon: React.ComponentType<any>;
    label: string;
    onClick: (item: T) => void;
    variant?: 'primary' | 'danger' | 'success' | 'warning';
    show?: (item: T) => boolean;
}

export interface FilterOption {
    value: string;
    label: string;
}

export interface TableFilter {
    key: string;
    label: string;
    type: 'select' | 'checkbox';
    options?: FilterOption[];
    value: string | boolean;
    onChange: (value: string | boolean) => void;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    title?: string;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
    actions?: Action<T>[];
    pageSize?: number;
    totalItems?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    loading?: boolean;
    emptyMessage?: string;
    showSearch?: boolean;
    showPagination?: boolean;
    showEntriesSelector?: boolean;
    filters?: TableFilter[];
    onClearFilters?: () => void;
    dateRangeFilter?: {
        value: DateRange;
        onChange: (dateRange: DateRange) => void;
    };
}

// Custom Filter Select Dropdown Component (matches Select.tsx style)
interface FilterSelectDropdownProps {
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const FilterSelectDropdown: React.FC<FilterSelectDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'اختر...'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 min-w-[180px] px-4 py-2.5
                    bg-white border rounded-xl text-sm font-medium
                    transition-all duration-200 ease-in-out
                    hover:border-gray-400 hover:shadow-sm
                    ${isOpen ? 'ring-2 ring-primary-500 border-transparent shadow-lg' : 'border-gray-300'}
                    ${value ? 'text-gray-900' : 'text-gray-500'}
                `}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-hidden">
                    {/* Search Input */}
                    {options.length > 5 && (
                        <div className="p-3 border-b border-gray-100">
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="ابحث..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                لا توجد نتائج
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                                        w-full px-4 py-3 text-right text-sm font-medium
                                        hover:bg-primary-50 hover:text-primary-700
                                        focus:outline-none focus:bg-primary-50 focus:text-primary-700
                                        transition-colors duration-150
                                        flex items-center justify-between
                                        ${option.value === value ? 'bg-primary-50 text-primary-700' : 'text-gray-900'}
                                    `}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {option.value === value && (
                                        <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Actions Dropdown Component (3 dots menu)
interface ActionsDropdownProps<T> {
    actions: Action<T>[];
    item: T;
    loading?: boolean;
}

function ActionsDropdown<T>({ actions, item, loading }: ActionsDropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const visibleActions = actions.filter(action => action.show ? action.show(item) : true);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (visibleActions.length === 0) return null;

    const getVariantClasses = (variant?: string) => {
        switch (variant) {
            case 'danger':
                return 'text-red-600 hover:bg-red-50';
            case 'success':
                return 'text-green-600 hover:bg-green-50';
            case 'warning':
                return 'text-amber-600 hover:bg-amber-50';
            case 'primary':
            default:
                return 'text-gray-700 hover:bg-gray-100';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className={`p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 ${
                    isOpen ? 'bg-gray-100 border-gray-300' : ''
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="الإجراءات"
            >
                <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop to capture clicks */}
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                    {/* Dropdown menu with fixed positioning */}
                    <div
                        className="fixed z-[101] w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                        style={{
                            top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 8 : 0,
                            left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().left : 0,
                        }}
                    >
                        {visibleActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                        action.onClick(item);
                                        setIsOpen(false);
                                    }}
                                    disabled={loading}
                                    className={`w-full px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors duration-150 ${getVariantClasses(action.variant)} ${
                                        loading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span>{action.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

// Entries Select Dropdown for pagination (same style as filter dropdown)
interface EntriesSelectDropdownProps {
    value: number;
    onChange: (value: number) => void;
    options: number[];
}

const EntriesSelectDropdown: React.FC<EntriesSelectDropdownProps> = ({
    value,
    onChange,
    options
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: number) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 min-w-[70px] px-3 py-2
                    bg-white border rounded-xl text-sm font-semibold
                    transition-all duration-200 ease-in-out
                    hover:border-gray-400 hover:shadow-sm
                    ${isOpen ? 'ring-2 ring-primary-500 border-transparent shadow-lg' : 'border-gray-300'}
                    text-gray-900
                `}
            >
                <span>{value}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden bottom-full mb-2">
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className={`
                                w-full px-3 py-2.5 text-center text-sm font-medium
                                hover:bg-primary-50 hover:text-primary-700
                                focus:outline-none focus:bg-primary-50 focus:text-primary-700
                                transition-colors duration-150
                                flex items-center justify-between
                                ${option === value ? 'bg-primary-50 text-primary-700' : 'text-gray-900'}
                            `}
                        >
                            <span>{option}</span>
                            {option === value && (
                                <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

function DataTable<T extends { id?: string | number }>({
    columns,
    data,
    title,
    searchPlaceholder = 'بحث...',
    onSearch,
    actions = [],
    pageSize: initialPageSize = 10,
    totalItems,
    currentPage: externalCurrentPage,
    onPageChange,
    onPageSizeChange,
    loading = false,
    emptyMessage = 'لا توجد بيانات',
    showSearch = true,
    showPagination = true,
    showEntriesSelector = true,
    filters = [],
    dateRangeFilter,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [internalPageSize, setInternalPageSize] = useState(initialPageSize);
    const [previousData, setPreviousData] = useState<T[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Keep previous data while loading new data (for smooth transitions)
    const displayData = useMemo(() => {
        if (loading && previousData.length > 0 && !isInitialLoad) {
            return previousData;
        }
        return data;
    }, [data, loading, previousData, isInitialLoad]);

    // Update previous data when new data arrives
    useEffect(() => {
        if (!loading && data.length > 0) {
            setPreviousData(data);
            setIsInitialLoad(false);
        }
    }, [data, loading]);

    const currentPage = externalCurrentPage || internalCurrentPage;
    const pageSize = internalPageSize;
    const total = totalItems || data.length;
    const totalPages = Math.ceil(total / pageSize);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (onSearch) {
            onSearch(query);
        }
    };

    const handlePageChange = (page: number) => {
        if (onPageChange) {
            onPageChange(page);
        } else {
            setInternalCurrentPage(page);
        }
    };

    const handlePageSizeChange = (size: number) => {
        setInternalPageSize(size);
        if (onPageSizeChange) {
            onPageSizeChange(size);
        }
        handlePageChange(1); // Reset to first page
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            pages.push(totalPages);
        }

        return pages;
    };

    const getActionVariantClasses = (variant?: string) => {
        switch (variant) {
            case 'danger':
                return 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200';
            case 'success':
                return 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200';
            case 'warning':
                return 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border border-yellow-200';
            case 'primary':
            default:
                return 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col gap-4">
                    {/* Title Row */}
                    {title && (
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    )}

                    {/* Search and Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        {showSearch && (
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200 text-sm"
                                />
                            </div>
                        )}

                        {/* Filters */}
                        {filters.length > 0 && filters.map((filter) => (
                            <div key={filter.key} className="flex items-center">
                                {filter.type === 'select' && filter.options && (
                                    <FilterSelectDropdown
                                        options={filter.options}
                                        value={filter.value as string}
                                        onChange={(val) => filter.onChange(val)}
                                        placeholder={filter.label}
                                    />
                                )}
                                {filter.type === 'checkbox' && (
                                    <label className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl cursor-pointer transition-all duration-200 text-sm ${
                                        filter.value ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                    }`}>
                                        <input
                                            type="checkbox"
                                            checked={filter.value as boolean}
                                            onChange={(e) => filter.onChange(e.target.checked)}
                                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <span className="font-medium whitespace-nowrap">{filter.label}</span>
                                    </label>
                                )}
                            </div>
                        ))}

                        {/* Date Range Filter */}
                        {dateRangeFilter && (
                            <div className="flex items-center">
                                <DateRangeFilter
                                    value={dateRangeFilter.value}
                                    onChange={dateRangeFilter.onChange}
                                    size="md"
                                    showPresets={true}
                                    showClearButton={true}
                                    showResetButton={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto relative">
                {/* Subtle loading overlay - keeps previous data visible */}
                {loading && !isInitialLoad && displayData.length > 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
                        <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-xl shadow-lg border border-gray-200">
                            <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                            <span className="text-sm font-medium text-gray-600">جاري التحميل...</span>
                        </div>
                    </div>
                )}
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={column.key}
                                    className={`px-6 py-4 text-right text-sm font-semibold text-gray-700 ${
                                        column.width || ''
                                    }`}
                                >
                                    {column.label}
                                </th>
                            ))}
                            {actions.length > 0 && (
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 w-32">
                                    الإجراءات
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading && isInitialLoad ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                                    className="px-6 py-12 text-center"
                                >
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                                        <span className="mr-3 text-gray-600">جاري التحميل...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : displayData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                                    className="px-6 py-12 text-center text-gray-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            displayData.map((item, rowIndex) => (
                                <tr
                                    key={item.id || rowIndex}
                                    className={`hover:bg-gray-50 transition-all duration-200 ${loading ? 'opacity-60' : ''}`}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className="px-6 py-4 text-sm text-gray-900"
                                        >
                                            {column.render
                                                ? column.render(item)
                                                : (item as any)[column.key]}
                                        </td>
                                    ))}
                                    {actions.length > 0 && (
                                        <td className="px-6 py-4">
                                            <ActionsDropdown
                                                actions={actions}
                                                item={item}
                                                loading={loading}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {showPagination && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Entries Selector - Right side in RTL */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">عرض</span>
                            <EntriesSelectDropdown
                                value={pageSize}
                                onChange={handlePageSizeChange}
                                options={[5, 10, 25, 50, 100]}
                            />
                            <span className="text-sm font-medium text-gray-600">صف</span>
                        </div>

                        {/* Page Numbers - Center */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                {/* Previous Button */}
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                    {getPageNumbers().map((page, index) => (
                                        <React.Fragment key={index}>
                                            {page === '...' ? (
                                                <span className="px-2 py-1 text-gray-400 text-sm">...</span>
                                            ) : (
                                                <button
                                                    onClick={() => handlePageChange(page as number)}
                                                    disabled={loading}
                                                    className={`min-w-[36px] h-9 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                                                        currentPage === page
                                                            ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/30 scale-105'
                                                            : 'bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700 hover:text-primary-700 shadow-sm'
                                                    } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                >
                                                    {page}
                                                </button>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        )}

                        {/* Showing info - Left side in RTL */}
                        <div className="text-sm text-gray-500 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
                            <span className="text-gray-400">عرض</span>
                            <span className="font-semibold text-primary-600 mx-1">{Math.min((currentPage - 1) * pageSize + 1, total)}</span>
                            <span className="text-gray-400">إلى</span>
                            <span className="font-semibold text-primary-600 mx-1">{Math.min(currentPage * pageSize, total)}</span>
                            <span className="text-gray-400">من</span>
                            <span className="font-semibold text-gray-700 mx-1">{total}</span>
                            <span className="text-gray-400">صف</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
