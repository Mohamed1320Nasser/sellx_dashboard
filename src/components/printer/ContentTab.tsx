import React from 'react';
import { Card, Input, Toggle } from '../ui';
import { usePrinterConfigStore } from '../../stores/printerConfigStore';
import { LivePreview } from './LivePreview';

export const ContentTab: React.FC = () => {
  const config = usePrinterConfigStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Settings */}
      <div className="space-y-6">
        {/* Display Options */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">خيارات العرض</h3>

          <div className="space-y-4">
            <Toggle
              enabled={config.showLogo}
              onChange={(enabled) => config.updateConfig({ showLogo: enabled })}
              label="عرض الشعار"
              description="إظهار شعار الشركة في أعلى الفاتورة"
            />

            <div className="border-t border-gray-200 pt-4">
              <Toggle
                enabled={config.showOrderId}
                onChange={(enabled) => config.updateConfig({ showOrderId: enabled })}
                label="عرض رقم الطلب"
                description="إظهار رقم الطلب في الفاتورة"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <Toggle
                enabled={config.showTaxBreakdown}
                onChange={(enabled) => config.updateConfig({ showTaxBreakdown: enabled })}
                label="تفاصيل الضريبة"
                description="إظهار تفاصيل الضريبة المضافة"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <Toggle
                enabled={config.showQRCode}
                onChange={(enabled) => config.updateConfig({ showQRCode: enabled })}
                label="رمز QR"
                description="رمز QR للفواتير الإلكترونية (ZATCA)"
              />
            </div>
          </div>
        </Card>

        {/* Custom Text */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">نصوص مخصصة</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نص العنوان (Header)
              </label>
              <Input
                value={config.headerText}
                onChange={(e) => config.updateConfig({ headerText: e.target.value })}
                placeholder="نص اختياري يظهر في أعلى الفاتورة"
                className="text-right"
              />
              <p className="text-xs text-gray-500 mt-1">
                مثال: "عروض خاصة - خصم 10% على جميع المنتجات"
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نص التذييل (Footer)
              </label>
              <Input
                value={config.footerText}
                onChange={(e) => config.updateConfig({ footerText: e.target.value })}
                placeholder="شكراً لزيارتكم"
                className="text-right"
              />
              <p className="text-xs text-gray-500 mt-1">
                رسالة الشكر أو معلومات إضافية
              </p>
            </div>
          </div>
        </Card>

        {/* Margins */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الهوامش</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الهامش العلوي
              </label>
              <Input
                type="number"
                value={config.marginTop}
                onChange={(e) => config.updateConfig({ marginTop: parseInt(e.target.value) || 0 })}
                placeholder="5"
                min="0"
                max="20"
                className="text-right"
              />
              <p className="text-xs text-gray-500 mt-1">مم (0-20)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الهامش السفلي
              </label>
              <Input
                type="number"
                value={config.marginBottom}
                onChange={(e) => config.updateConfig({ marginBottom: parseInt(e.target.value) || 0 })}
                placeholder="5"
                min="0"
                max="20"
                className="text-right"
              />
              <p className="text-xs text-gray-500 mt-1">مم (0-20)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column - Live Preview */}
      <div className="lg:sticky lg:top-6 h-fit">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">معاينة مباشرة</h3>
          <LivePreview />
        </Card>
      </div>
    </div>
  );
};
