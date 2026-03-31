import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

interface MultiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  label?: string;
  error?: string;
  helper?: string;
  options: MultiSelectOption[];
  placeholder?: string;
  value?: (string | number)[];
  onChange?: (values: (string | number)[]) => void;
  disabled?: boolean;
  loading?: boolean;
  maxSelections?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  error,
  helper,
  options,
  placeholder,
  value = [],
  onChange,
  disabled = false,
  loading = false,
  maxSelections,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Find selected options
  const selectedOptions = options.filter(option => value.includes(option.value));

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    if (disabled || loading) return;

    const newValues = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];

    // Check max selections limit
    if (maxSelections && newValues.length > maxSelections) {
      return;
    }

    if (onChange) {
      onChange(newValues);
    }
  };

  const handleRemove = (optionValue: string | number) => {
    if (disabled || loading) return;
    
    const newValues = value.filter(v => v !== optionValue);
    if (onChange) {
      onChange(newValues);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const baseClasses = `
    w-full px-4 py-3 pr-10
    bg-white border border-gray-300 rounded-xl
    text-gray-900 text-sm font-medium
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-all duration-200 ease-in-out
    hover:border-gray-400 hover:shadow-sm
    ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
    ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-lg' : ''}
  `;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Custom Select Button */}
        <button
          type="button"
          className={baseClasses}
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 text-right">
              {loading ? (
                <span className="text-gray-500">جاري التحميل...</span>
              ) : selectedOptions.length === 0 ? (
                <span className="text-gray-500">{placeholder || 'اختر خيارات'}</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.slice(0, 3).map((option) => (
                    <span
                      key={option.value}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                    >
                      {option.label}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(option.value);
                          }}
                          className="mr-1 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {selectedOptions.length > 3 && (
                    <span className="text-gray-500 text-xs">
                      +{selectedOptions.length - 3} أخرى
                    </span>
                  )}
                </div>
              )}
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden">
            {/* Search Input */}
            {options.length > 5 && (
              <div className="p-3 border-b border-gray-100">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="ابحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Max Selections Warning */}
            {maxSelections && value.length >= maxSelections && (
              <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
                <p className="text-xs text-yellow-700">
                  تم الوصول للحد الأقصى من الخيارات ({maxSelections})
                </p>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  {searchTerm ? 'لا توجد نتائج' : 'لا توجد خيارات متاحة'}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  const isDisabled = option.disabled || (maxSelections && value.length >= maxSelections && !isSelected);
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`
                        w-full px-4 py-3 text-right text-sm font-medium
                        hover:bg-blue-50 hover:text-blue-700
                        focus:outline-none focus:bg-blue-50 focus:text-blue-700
                        transition-colors duration-150
                        flex items-center justify-between
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                      `}
                      onClick={() => !isDisabled && handleSelect(option.value)}
                      disabled={isDisabled}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error and Helper Messages */}
      {error && (
        <p className="text-sm text-red-600 font-medium flex items-center">
          <span className="w-1 h-1 bg-red-600 rounded-full ml-2"></span>
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
};

export default MultiSelect;
