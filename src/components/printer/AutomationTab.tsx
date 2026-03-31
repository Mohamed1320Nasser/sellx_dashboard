import React from 'react';
import { Zap, Scissors, Copy } from 'lucide-react';
import { Card, Input, Toggle } from '../ui';
import { usePrinterConfigStore } from '../../stores/printerConfigStore';

export const AutomationTab: React.FC = () => {
  const config = usePrinterConfigStore();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Auto Print */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                طباعة تلقائية بعد الدفع
              </h3>
              <Toggle
                enabled={config.autoPrintOnPayment}
                onChange={(enabled) => config.updateConfig({ autoPrintOnPayment: enabled })}
              />
            </div>
            <p className="text-sm text-gray-600 mb-3">
              طباعة الفاتورة تلقائياً بعد إتمام عملية البيع دون الحاجة للتأكيد
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">
                <span className="font-semibold">💡 نصيحة:</span> عند التفعيل، سيتم طباعة الفاتورة مباشرة بعد إتمام البيع. إذا كان معطلاً، ستظهر نافذة معاينة مع خيارات متعددة.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Auto Cut Paper */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                قص الورق تلقائياً
              </h3>
              <Toggle
                enabled={config.cutPaper}
                onChange={(enabled) => config.updateConfig({ cutPaper: enabled })}
              />
            </div>
            <p className="text-sm text-gray-600 mb-3">
              قص الورق الحراري تلقائياً بعد الطباعة (يتطلب طابعة بها قاطع)
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">ℹ️ ملاحظة:</span> هذه الميزة تعمل فقط مع الطابعات التي تحتوي على قاطع ورق مدمج.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Print Copies */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Copy className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              عدد النسخ
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              عدد نسخ الفاتورة التي سيتم طباعتها (1-5)
            </p>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="number"
                  value={config.printCopies}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const copies = Math.min(Math.max(value, 1), 5);
                    config.updateConfig({ printCopies: copies });
                  }}
                  min="1"
                  max="5"
                  className="text-right text-center text-2xl font-bold"
                />
              </div>

              {/* Visual Copies Indicator */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => config.updateConfig({ printCopies: num })}
                    className={`
                      w-10 h-10 rounded-lg border-2 font-semibold transition-all
                      ${
                        config.printCopies >= num
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-800">
                <span className="font-semibold">📋 مثال:</span> نسخة للعميل + نسخة للمحاسبة + نسخة للأرشيف
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Card */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">ملخص الإعدادات</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">الطباعة التلقائية:</span>
            <span className={`font-semibold ${config.autoPrintOnPayment ? 'text-green-600' : 'text-gray-400'}`}>
              {config.autoPrintOnPayment ? '✓ مفعّلة' : '✗ معطلة'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">قص الورق:</span>
            <span className={`font-semibold ${config.cutPaper ? 'text-blue-600' : 'text-gray-400'}`}>
              {config.cutPaper ? '✓ مفعّل' : '✗ معطل'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">عدد النسخ:</span>
            <span className="font-semibold text-purple-600">
              {config.printCopies} {config.printCopies === 1 ? 'نسخة' : 'نسخ'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
