import React, { useRef, useEffect } from 'react';
import { Tag, TestTube } from 'lucide-react';
import { Card, Input, Select, Button, Toggle } from '../ui';
import { usePrinterConfigStore } from '../../stores/printerConfigStore';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';

export const LabelsTab: React.FC = () => {
  const config = usePrinterConfigStore();
  const barcodeRef = useRef<SVGSVGElement>(null);

  // Generate barcode preview whenever settings change
  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, 'TEST123456', {
          format: config.barcodeFormat,
          width: config.barcodeWidth,
          height: config.barcodeHeight,
          displayValue: config.showBarcodeText,
          fontSize: 12,
          margin: 5,
        });
      } catch (error) {
        console.error('Error generating barcode preview:', error);
      }
    }
  }, [config.barcodeFormat, config.barcodeWidth, config.barcodeHeight, config.showBarcodeText]);

  const handleTestLabel = async () => {
    // Check if Electron printer API is available
    if (!window.printerAPI) {
      toast.error('الطابعة غير متصلة - يرجى التأكد من تشغيل التطبيق في وضع سطح المكتب');
      return;
    }

    try {
      toast.loading('جاري طباعة الملصق التجريبي...', { id: 'test-label' });

      // Pass complete printer config (not just label data)
      const printerConfig = {
        printerName: config.printerName,
        connectionType: config.connectionType,
        ipAddress: config.ipAddress,
        port: config.port,
        paperWidth: config.paperWidth,
        marginTop: config.marginTop,
        marginBottom: config.marginBottom,
        showLogo: config.showLogo,
        showOrderId: config.showOrderId,
        showTaxBreakdown: config.showTaxBreakdown,
        showQRCode: config.showQRCode,
        headerText: config.headerText || '',
        footerText: config.footerText || '',
        characterSet: 'windows-1256',
        cutPaper: config.cutPaper,
        printCopies: config.printCopies || 1,
      };

      const result = await window.printerAPI.printLabel(
        {
          productName: 'منتج تجريبي - Test Product',
          sku: 'TEST123456',
          price: 99.99,
          labelWidth: config.labelWidth,
          labelHeight: config.labelHeight,
          labelFontSize: config.labelFontSize,
          barcodeFormat: config.barcodeFormat,
          barcodeHeight: config.barcodeHeight,
          barcodeWidth: config.barcodeWidth,
        },
        printerConfig
      );

      if (result.success) {
        toast.success('✅ تم طباعة الملصق التجريبي بنجاح', { id: 'test-label' });
      } else {
        toast.error(result.error || 'فشلت طباعة الملصق', { id: 'test-label' });
      }
    } catch (error: any) {
      console.error('Test label print error:', error);
      toast.error('فشلت طباعة الملصق: ' + (error.message || 'خطأ غير معروف'), { id: 'test-label' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Label Dimensions */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            أبعاد الملصق
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عرض الملصق
            </label>
            <Input
              type="number"
              value={config.labelWidth}
              onChange={(e) => config.updateConfig({ labelWidth: parseInt(e.target.value) || 40 })}
              placeholder="40"
              min="20"
              max="100"
              className="text-right"
            />
            <p className="text-xs text-gray-500 mt-1">مم (20-100)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ارتفاع الملصق
            </label>
            <Input
              type="number"
              value={config.labelHeight}
              onChange={(e) => config.updateConfig({ labelHeight: parseInt(e.target.value) || 30 })}
              placeholder="30"
              min="15"
              max="80"
              className="text-right"
            />
            <p className="text-xs text-gray-500 mt-1">مم (15-80)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              حجم الخط
            </label>
            <Input
              type="number"
              value={config.labelFontSize}
              onChange={(e) => config.updateConfig({ labelFontSize: parseInt(e.target.value) || 12 })}
              placeholder="12"
              min="8"
              max="20"
              className="text-right"
            />
            <p className="text-xs text-gray-500 mt-1">بكسل (8-20)</p>
          </div>
        </div>

        {/* Barcode-specific settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ارتفاع الباركود
            </label>
            <Input
              type="number"
              value={config.barcodeHeight}
              onChange={(e) => config.updateConfig({ barcodeHeight: parseInt(e.target.value) || 60 })}
              placeholder="60"
              min="40"
              max="100"
              className="text-right"
            />
            <p className="text-xs text-gray-500 mt-1">
              بكسل (40-100) - 60px = 12 بوصة مسافة مسح
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عرض الأشرطة
            </label>
            <Select
              value={String(config.barcodeWidth)}
              onChange={(value) => config.updateConfig({ barcodeWidth: parseInt(value) })}
              options={[
                { value: '1', label: '1 - رفيع (ملصقات صغيرة)' },
                { value: '2', label: '2 - قياسي (موصى به) ✓' },
                { value: '3', label: '3 - عريض (مسافات بعيدة)' },
              ]}
            />
            <p className="text-xs text-gray-500 mt-1">
              عرض الأشرطة - 2 موصى به
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              إظهار النص
            </label>
            <div className="mt-3">
              <Toggle
                enabled={config.showBarcodeText}
                onChange={(enabled) => config.updateConfig({ showBarcodeText: enabled })}
                label={config.showBarcodeText ? 'نعم - إظهار الأرقام' : 'لا - إخفاء الأرقام'}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              إظهار الأرقام أسفل الباركود
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <span className="font-semibold">📏 الأحجام الشائعة:</span>
            <br />
            • 40×30 مم (قياسي) | 50×30 مم (كبير) | 35×25 مم (صغير)
          </p>
        </div>
      </Card>

      {/* Barcode Format */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">نوع الباركود</h3>

        <Select
          value={config.barcodeFormat}
          onChange={(value) => config.updateConfig({ barcodeFormat: value as any })}
          options={[
            { value: 'CODE128', label: 'CODE128 (موصى به - متعدد الاستخدامات)' },
            { value: 'EAN13', label: 'EAN13 (للمنتجات التجارية)' },
            { value: 'EAN8', label: 'EAN8 (قصير)' },
            { value: 'CODE39', label: 'CODE39 (صناعي / طبي)' },
          ]}
        />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CODE128 Example */}
          <div className={`
            p-4 rounded-lg border-2 transition-all cursor-pointer
            ${config.barcodeFormat === 'CODE128' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
          `}
            onClick={() => config.updateConfig({ barcodeFormat: 'CODE128' })}
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900 mb-2">CODE128</div>
              <div className="h-12 bg-gradient-to-r from-black via-gray-800 to-black bg-[length:200%_100%] mb-2"></div>
              <div className="text-xs text-gray-600">أرقام + حروف</div>
            </div>
          </div>

          {/* EAN13 Example */}
          <div className={`
            p-4 rounded-lg border-2 transition-all cursor-pointer
            ${config.barcodeFormat === 'EAN13' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
          `}
            onClick={() => config.updateConfig({ barcodeFormat: 'EAN13' })}
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900 mb-2">EAN13</div>
              <div className="h-12 bg-gradient-to-r from-black via-gray-700 to-black bg-[length:150%_100%] mb-2"></div>
              <div className="text-xs text-gray-600">13 رقم</div>
            </div>
          </div>

          {/* EAN8 Example */}
          <div className={`
            p-4 rounded-lg border-2 transition-all cursor-pointer
            ${config.barcodeFormat === 'EAN8' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
          `}
            onClick={() => config.updateConfig({ barcodeFormat: 'EAN8' })}
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900 mb-2">EAN8</div>
              <div className="h-12 bg-gradient-to-r from-black via-gray-600 to-black bg-[length:100%_100%] mb-2"></div>
              <div className="text-xs text-gray-600">8 أرقام</div>
            </div>
          </div>

          {/* CODE39 Example */}
          <div className={`
            p-4 rounded-lg border-2 transition-all cursor-pointer
            ${config.barcodeFormat === 'CODE39' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
          `}
            onClick={() => config.updateConfig({ barcodeFormat: 'CODE39' })}
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900 mb-2">CODE39</div>
              <div className="h-12 bg-gradient-to-r from-black via-gray-700 to-black bg-[length:180%_100%] mb-2"></div>
              <div className="text-xs text-gray-600">صناعي / طبي</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Label Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">معاينة الملصق</h3>

        <div className="flex justify-center">
          <div
            className="border-2 border-dashed border-gray-300 bg-white p-4 rounded-lg"
            style={{
              width: `${config.labelWidth * 2}px`,
              minHeight: `${config.labelHeight * 2}px`,
            }}
          >
            <div className="text-center space-y-2">
              <div
                className="font-semibold text-gray-900 truncate"
                style={{ fontSize: `${config.labelFontSize}px` }}
              >
                اسم المنتج
              </div>
              <div className="flex justify-center">
                <svg ref={barcodeRef}></svg>
              </div>
              <div className="text-xs text-gray-600">SKU: TEST123456</div>
              <div
                className="font-bold text-primary-600"
                style={{ fontSize: `${config.labelFontSize + 2}px` }}
              >
                99.99 ر.س
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center mt-4">
          المعاينة التقريبية للملصق (الحجم الفعلي: {config.labelWidth}×{config.labelHeight} مم)
        </p>
      </Card>

      {/* Test Print */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              طباعة ملصق اختباري
            </h3>
            <p className="text-sm text-blue-700">
              طباعة ملصق تجريبي للتحقق من الإعدادات
            </p>
          </div>
          <Button
            onClick={handleTestLabel}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <TestTube className="w-5 h-5" />
            طباعة اختبار
          </Button>
        </div>
      </Card>

      {/* Info Note */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">ملاحظة</h4>
            <p className="text-sm text-blue-800">
              تأكد من تكوين الاتصال بالطابعة في تبويب "الاتصال" قبل طباعة الملصقات. استخدم زر "طباعة اختبار" للتحقق من الإعدادات.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
