import React from 'react';
import { Cable, Wifi, TestTube } from 'lucide-react';
import { Card, Input, Button } from '../ui';
import { usePrinterConfigStore } from '../../stores/printerConfigStore';
import toast from 'react-hot-toast';

export const ConnectionTab: React.FC = () => {
  const config = usePrinterConfigStore();

  const handleTestConnection = async () => {
    if (!window.printerAPI) {
      toast.error('يجب تشغيل التطبيق من خلال Electron لاستخدام الطباعة');
      return;
    }

    try {
      toast.loading('جاري الاتصال بالطابعة...');

      const result = await window.printerAPI.runComprehensiveTest(
        config.connectionType,
        config.ipAddress,
        config.port,
        config.paperWidth
      );

      if (result.connectionTest.success) {
        if (result.printTest?.success) {
          toast.success(`✓ تم الطباعة بنجاح!\nزمن الاستجابة: ${result.connectionTest.latencyMs}ms`);
        } else {
          toast.error(`الاتصال ناجح لكن الطباعة فشلت\n${result.printTest?.error || ''}`);
        }
      } else {
        toast.error(`فشل الاتصال بالطابعة\n${result.connectionTest.error || ''}`);
      }
    } catch (error: any) {
      console.error('Test print error:', error);
      toast.error('خطأ في الطباعة: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Type */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">نوع الاتصال</h3>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => config.updateConfig({ connectionType: 'USB' })}
            className={`
              p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-3
              ${
                config.connectionType === 'USB'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }
            `}
          >
            <Cable className="w-8 h-8" />
            <div className="text-center">
              <div className="font-semibold">USB</div>
              <div className="text-xs text-gray-500 mt-1">اتصال مباشر</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => config.updateConfig({ connectionType: 'LAN' })}
            className={`
              p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-3
              ${
                config.connectionType === 'LAN'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }
            `}
          >
            <Wifi className="w-8 h-8" />
            <div className="text-center">
              <div className="font-semibold">LAN (شبكة)</div>
              <div className="text-xs text-gray-500 mt-1">طابعة شبكة</div>
            </div>
          </button>
        </div>
      </Card>

      {/* Printer Name */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">اسم الطابعة</h3>
        <Input
          value={config.printerName}
          onChange={(e) => config.updateConfig({ printerName: e.target.value })}
          placeholder="أدخل اسم الطابعة"
          className="text-right"
        />
        <p className="text-sm text-gray-500 mt-2">
          الاسم التعريفي للطابعة (مثال: Thermal Printer 80mm)
        </p>
      </Card>

      {/* Network Settings (only for LAN) */}
      {config.connectionType === 'LAN' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إعدادات الشبكة</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان IP
              </label>
              <Input
                value={config.ipAddress}
                onChange={(e) => config.updateConfig({ ipAddress: e.target.value })}
                placeholder="192.168.1.50"
                className="text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المنفذ (Port)
              </label>
              <Input
                type="number"
                value={config.port}
                onChange={(e) => config.updateConfig({ port: parseInt(e.target.value) || 9100 })}
                placeholder="9100"
                className="text-right"
              />
              <p className="text-sm text-gray-500 mt-2">
                المنفذ الافتراضي للطابعات الحرارية: 9100
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Paper Width */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">عرض الورق</h3>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => config.updateConfig({ paperWidth: '80mm' })}
            className={`
              p-4 rounded-lg border-2 transition-all text-center
              ${
                config.paperWidth === '80mm'
                  ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }
            `}
          >
            <div className="text-2xl font-bold">80mm</div>
            <div className="text-xs text-gray-500 mt-1">قياسي (موصى به)</div>
          </button>

          <button
            type="button"
            onClick={() => config.updateConfig({ paperWidth: '58mm' })}
            className={`
              p-4 rounded-lg border-2 transition-all text-center
              ${
                config.paperWidth === '58mm'
                  ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }
            `}
          >
            <div className="text-2xl font-bold">58mm</div>
            <div className="text-xs text-gray-500 mt-1">صغير</div>
          </button>
        </div>
      </Card>

      {/* Test Connection */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              اختبار الاتصال
            </h3>
            <p className="text-sm text-blue-700">
              تحقق من الاتصال بالطابعة وطباعة صفحة اختبار
            </p>
          </div>
          <Button
            onClick={handleTestConnection}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <TestTube className="w-5 h-5" />
            اختبار
          </Button>
        </div>
      </Card>
    </div>
  );
};
