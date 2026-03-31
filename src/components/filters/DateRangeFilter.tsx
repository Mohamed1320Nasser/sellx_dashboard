import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, X, RotateCcw, Clock } from 'lucide-react';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  onClear?: () => void;
  className?: string;
  showPresets?: boolean;
  showClearButton?: boolean;
  showResetButton?: boolean;
  placeholder?: {
    startDate?: string;
    endDate?: string;
  };
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  onClear,
  className = '',
  showPresets = true,
  showClearButton = true,
  showResetButton = true,
  placeholder = {
    startDate: 'من تاريخ',
    endDate: 'إلى تاريخ',
  },
  disabled = false,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange>(value);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update temp values when prop value changes
  useEffect(() => {
    setTempDateRange(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1.5 h-8',
    md: 'text-sm px-3 py-2 h-9',
    lg: 'text-sm px-4 py-2.5 h-10',
  };

  const presetRanges = [
    {
      label: 'اليوم',
      icon: <Clock className="w-3 h-3" />,
      getValue: () => {
        const today = new Date().toISOString().split('T')[0];
        return { startDate: today, endDate: today };
      },
    },
    {
      label: 'أمس',
      icon: <Clock className="w-3 h-3" />,
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        return { startDate: dateStr, endDate: dateStr };
      },
    },
    {
      label: 'آخر 7 أيام',
      icon: <Calendar className="w-3 h-3" />,
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        };
      },
    },
    {
      label: 'آخر 30 يوم',
      icon: <Calendar className="w-3 h-3" />,
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        };
      },
    },
    {
      label: 'هذا الشهر',
      icon: <Calendar className="w-3 h-3" />,
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        };
      },
    },
    {
      label: 'الشهر الماضي',
      icon: <Calendar className="w-3 h-3" />,
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        };
      },
    },
    {
      label: 'هذا العام',
      icon: <Calendar className="w-3 h-3" />,
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        };
      },
    },
  ];

  const handleApply = () => {
    onChange(tempDateRange);
    setActivePreset(null);
    setIsOpen(false);
  };

  const handleClear = () => {
    const emptyRange = { startDate: '', endDate: '' };
    setTempDateRange(emptyRange);
    onChange(emptyRange);
    setActivePreset(null);
    onClear?.();
    setIsOpen(false);
  };

  const handleReset = () => {
    const emptyRange = { startDate: '', endDate: '' };
    setTempDateRange(emptyRange);
    onChange(emptyRange);
    setActivePreset(null);
    setIsOpen(false);
  };

  const handlePresetClick = (preset: typeof presetRanges[0], presetLabel: string) => {
    const presetValue = preset.getValue();
    setTempDateRange(presetValue);
    setActivePreset(presetLabel);
    onChange(presetValue);
    setIsOpen(false);
  };

  const formatDisplayDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      calendar: 'gregory',
    });
  };

  const getDisplayText = () => {
    if (!value.startDate && !value.endDate) {
      return 'اختر الفترة الزمنية';
    }
    if (value.startDate && value.endDate) {
      return `${formatDisplayDate(value.startDate)} - ${formatDisplayDate(value.endDate)}`;
    }
    if (value.startDate) {
      return `من ${formatDisplayDate(value.startDate)}`;
    }
    if (value.endDate) {
      return `إلى ${formatDisplayDate(value.endDate)}`;
    }
    return 'اختر الفترة الزمنية';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full ${sizeClasses[size]} 
          flex items-center justify-between
          bg-white border border-gray-300 rounded-lg
          text-gray-700 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          hover:border-gray-400 transition-all duration-200
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500 shadow-sm' : 'shadow-sm'}
        `}
      >
        <div className="flex items-center space-x-2 space-x-reverse min-w-0 flex-1">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="truncate text-left">{getDisplayText()}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden w-[400px] max-w-[calc(100vw-4rem)] sm:max-w-[calc(100vw-6rem)] lg:max-w-[calc(100vw-8rem)]">
          {/* Header */}
          <div className="px-4 py-3 bg-blue-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-900">اختر الفترة الزمنية</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Preset Ranges */}
            {showPresets && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2">فترات سريعة</h4>
                <div className="grid grid-cols-2 gap-2">
                  {presetRanges.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handlePresetClick(preset, preset.label)}
                      className={`
                        flex items-center space-x-2 space-x-reverse p-3 rounded-lg text-sm font-medium
                        transition-all duration-150
                        ${activePreset === preset.label 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }
                      `}
                    >
                      {preset.icon}
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Date Range */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-600">فترة مخصصة</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {placeholder.startDate}
                  </label>
                  <input
                    type="date"
                    value={tempDateRange.startDate}
                    onChange={(e) =>
                      setTempDateRange(prev => ({ ...prev, startDate: e.target.value }))
                    }
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    max={tempDateRange.endDate || undefined}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {placeholder.endDate}
                  </label>
                  <input
                    type="date"
                    value={tempDateRange.endDate}
                    onChange={(e) =>
                      setTempDateRange(prev => ({ ...prev, endDate: e.target.value }))
                    }
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={tempDateRange.startDate || undefined}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <div className="flex space-x-1 space-x-reverse">
                {showClearButton && (
                  <button
                    onClick={handleClear}
                    className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 
                             hover:bg-gray-100 rounded transition-colors"
                  >
                    مسح
                  </button>
                )}
                {showResetButton && (
                  <button
                    onClick={handleReset}
                    className="flex items-center space-x-1 space-x-reverse px-2 py-1 text-xs font-medium 
                             text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>إعادة تعيين</span>
                  </button>
                )}
              </div>
              
              <button
                onClick={handleApply}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium 
                         rounded transition-colors"
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
