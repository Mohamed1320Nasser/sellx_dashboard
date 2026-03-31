import React from 'react';
import { usePrinterConfigStore } from '../../stores/printerConfigStore';
import { useSessionAuthStore } from '../../stores/sessionAuthStore';

export function LivePreview() {
  const config = usePrinterConfigStore();
  const { user, company } = useSessionAuthStore();

  // Get width in pixels for CSS (approximate conversion)
  const widthPx = config.paperWidth === '58mm' ? '220px' : '302px';
  const fontSize = config.paperWidth === '58mm' ? '10px' : '11px';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">معاينة مباشرة</h3>
        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
          {config.paperWidth}
        </span>
      </div>

      {/* Thermal Receipt Preview */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-2 overflow-auto">
        <div
          className="bg-white font-mono leading-tight mx-auto"
          style={{
            width: widthPx,
            fontSize: fontSize,
            padding: `${config.marginTop}mm 2mm ${config.marginBottom}mm 2mm`,
          }}
        >
          {/* Logo */}
          {config.showLogo && company?.logo && (
            <div className="text-center mb-2">
              <img
                src={company.logo}
                alt="Logo"
                className="w-16 h-16 object-contain mx-auto filter grayscale"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Company Header */}
          <div className="text-center font-bold text-sm">
            {company?.name || 'اسم المتجر'}
          </div>
          <div className="text-center text-[10px] leading-tight">
            {company?.address || 'العنوان'}
          </div>
          <div className="text-center text-[10px]">
            {company?.phone || 'الهاتف'}
          </div>

          {/* Custom Header Text */}
          {config.headerText && (
            <div className="text-center text-[10px] mt-1 italic">
              {config.headerText}
            </div>
          )}

          <div className="border-t-2 border-dashed border-gray-400 my-2" />

          {/* Order Info */}
          {config.showOrderId && (
            <div className="text-[10px]">رقم الطلب: #123</div>
          )}

          <div className="text-[10px]">
            التاريخ: {new Date().toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <div className="text-[10px]">الكاشير: محمد أحمد</div>

          <div className="border-t-2 border-dashed border-gray-400 my-2" />

          {/* Sample Items */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="truncate">منتج تجريبي 1</span>
              <span className="ml-2 whitespace-nowrap">10.00</span>
            </div>
            <div className="text-[9px] text-gray-600 mr-2">
              2 × 5.00
            </div>

            <div className="flex justify-between text-[10px]">
              <span className="truncate">منتج تجريبي 2</span>
              <span className="ml-2 whitespace-nowrap">15.00</span>
            </div>
            <div className="text-[9px] text-gray-600 mr-2">
              1 × 15.00
            </div>

            <div className="flex justify-between text-[10px]">
              <span className="truncate">منتج طويل الاسم جداً</span>
              <span className="ml-2 whitespace-nowrap">8.50</span>
            </div>
            <div className="text-[9px] text-gray-600 mr-2">
              1 × 8.50
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-400 my-2" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span>الإجمالي الفرعي:</span>
              <span>33.50</span>
            </div>

            {config.showTaxBreakdown && (
              <>
                <div className="flex justify-between text-[10px]">
                  <span>الضريبة (15%):</span>
                  <span>5.03</span>
                </div>
              </>
            )}

            <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1 mt-1">
              <span>الإجمالي:</span>
              <span>38.53</span>
            </div>

            <div className="flex justify-between text-[10px] mt-1">
              <span>المدفوع:</span>
              <span>40.00</span>
            </div>

            <div className="flex justify-between text-[10px]">
              <span>الباقي:</span>
              <span>1.47</span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-400 my-2" />

          {/* Footer */}
          {config.footerText && (
            <div className="text-center text-[10px] leading-tight">
              {config.footerText}
            </div>
          )}

          {/* QR Code */}
          {config.showQRCode && (
            <div className="text-center mt-2">
              <div className="inline-block w-12 h-12 bg-gray-800 text-white text-[8px] flex items-center justify-center">
                QR
              </div>
              <div className="text-[8px] text-gray-500 mt-1">
                امسح للتقييم
              </div>
            </div>
          )}

          {/* Paper feed space */}
          <div className="h-4" />
        </div>
      </div>

      {/* Scale note */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        هذه معاينة تقريبية - الطباعة الفعلية قد تختلف قليلاً
      </p>
    </div>
  );
}
