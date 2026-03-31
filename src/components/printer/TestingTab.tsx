import React, { useState } from 'react';
import { usePrinterConfigStore } from '../../stores/printerConfigStore';
import { Zap, Image, FileText, Layers, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Testing Tab - Compare 4 different printing methods
 *
 * This tab helps identify which printing method works best with USB thermal printers
 */
export function TestingTab() {
  const config = usePrinterConfigStore();
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const testMethods = [
    {
      id: 'method1',
      title: 'Method 1: Electron Native',
      description: 'استخدام طباعة Electron الأصلية (الطريقة الحالية)',
      details: 'يولد HTML → يستخدم webContents.print()',
      icon: FileText,
      color: 'blue',
      status: 'قد لا يعمل مع الطابعات الحرارية',
    },
    {
      id: 'method2',
      title: 'Method 2: Image → ESC/POS',
      description: 'تحويل HTML إلى صورة ثم إرسال ESC/POS',
      details: 'HTML → PNG → ESC/POS bitmap',
      icon: Image,
      color: 'green',
      status: 'موصى به ⭐',
    },
    {
      id: 'method3',
      title: 'Method 3: Pure ESC/POS',
      description: 'نص خالص باستخدام أوامر ESC/POS',
      details: 'لا HTML، لا صور - نص فقط',
      icon: FileText,
      color: 'purple',
      status: 'موثوق ولكن بسيط',
    },
    {
      id: 'method4',
      title: 'Method 4: Hybrid',
      description: 'ESC/POS هجين + صورة',
      details: 'رأس الصفحة كصورة + المحتوى كنص',
      icon: Layers,
      color: 'orange',
      status: 'أفضل من الجانبين 🌟',
    },
  ];

  const runTest = async (methodId: string) => {
    // Validate printer configuration
    if (!config.printerName && config.connectionType === 'USB') {
      toast.error('⚠️ يرجى تكوين الطابعة أولاً');
      return;
    }

    if (config.connectionType === 'LAN' && (!config.ipAddress || !config.port)) {
      toast.error('⚠️ يرجى تكوين عنوان IP والمنفذ أولاً');
      return;
    }

    setTesting({ ...testing, [methodId]: true });
    setTestResults({ ...testResults, [methodId]: null });

    try {
      const loadingToast = toast.loading(`جاري اختبار ${methodId}...`);

      // Call the test method via Electron IPC
      const printerConfig = {
        printerName: config.printerName,
        connectionType: config.connectionType,
        ipAddress: config.ipAddress,
        port: config.port,
        paperWidth: config.paperWidth,
        cutPaper: config.cutPaper,
      };

      let result;
      switch (methodId) {
        case 'method1':
          result = await window.printerAPI?.testMethod1(printerConfig);
          break;
        case 'method2':
          result = await window.printerAPI?.testMethod2(printerConfig);
          break;
        case 'method3':
          result = await window.printerAPI?.testMethod3(printerConfig);
          break;
        case 'method4':
          result = await window.printerAPI?.testMethod4(printerConfig);
          break;
        default:
          throw new Error('طريقة غير معروفة');
      }

      setTestResults({ ...testResults, [methodId]: result });

      if (result?.success) {
        toast.success(`✅ ${methodId} نجح: ${result.message}`, { id: loadingToast });
      } else {
        toast.error(`❌ ${methodId} فشل: ${result?.error || 'خطأ غير معروف'}`, { id: loadingToast });
      }
    } catch (error: any) {
      console.error(`${methodId} error:`, error);
      const errorResult = {
        success: false,
        error: error.message || 'فشل الاختبار',
      };
      setTestResults({ ...testResults, [methodId]: errorResult });
      toast.error(`❌ خطأ في ${methodId}: ${error.message}`);
    } finally {
      setTesting({ ...testing, [methodId]: false });
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; button: string }> = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        button: 'bg-blue-600 hover:bg-blue-700',
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        button: 'bg-green-600 hover:bg-green-700',
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        button: 'bg-purple-600 hover:bg-purple-700',
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        button: 'bg-orange-600 hover:bg-orange-700',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-2">🧪 اختبار طرق الطباعة</h2>
        <p className="text-purple-100">
          اختبر 4 طرق مختلفة للطباعة لتحديد الطريقة الأفضل للطابعة الحرارية USB الخاصة بك
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">كيفية الاستخدام:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>تأكد من حفظ إعدادات الطابعة في تبويب "الاتصال"</li>
            <li>اضغط على "اختبار" لكل طريقة</li>
            <li>تحقق من جودة الطباعة على الطابعة الفعلية</li>
            <li>اختر الطريقة التي تعطي أفضل نتيجة</li>
          </ol>
        </div>
      </div>

      {/* Test Method Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testMethods.map((method) => {
          const Icon = method.icon;
          const colors = getColorClasses(method.color);
          const result = testResults[method.id];
          const isLoading = testing[method.id];

          return (
            <div
              key={method.id}
              className={`border-2 ${colors.border} ${colors.bg} rounded-xl p-6 transition-all hover:shadow-lg`}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 ${colors.button} rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{method.title}</h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 mb-1">التفاصيل التقنية:</p>
                <p className="text-sm font-mono text-gray-700">{method.details}</p>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colors.text} bg-white border ${colors.border}`}>
                  {method.status}
                </span>
              </div>

              {/* Test Button */}
              <button
                onClick={() => runTest(method.id)}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
                  isLoading ? 'bg-gray-400 cursor-not-allowed' : colors.button
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الاختبار...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    اختبار الطريقة
                  </>
                )}
              </button>

              {/* Result Display */}
              {result && (
                <div className={`mt-4 p-3 rounded-lg border-2 ${
                  result.success
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.success ? 'نجح ✓' : 'فشل ✗'}
                      </p>
                      <p className={`text-xs ${result.success ? 'text-green-700' : 'text-red-700'} mt-1`}>
                        {result.message || result.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-bold text-yellow-900 mb-2">📋 ملاحظات مهمة:</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li><strong>Method 1</strong> قد ينتج أحرفًا غير مقروءة على الطابعات الحرارية USB</li>
          <li><strong>Method 2</strong> موصى به للحصول على فواتير جميلة ومقروءة</li>
          <li><strong>Method 3</strong> الأسرع والأكثر موثوقية ولكن بدون تنسيق متقدم</li>
          <li><strong>Method 4</strong> يجمع بين جمال Method 2 وسرعة Method 3</li>
          <li>بعد اختبار جميع الطرق، سيتم تحديث النظام لاستخدام الطريقة الأفضل</li>
        </ul>
      </div>
    </div>
  );
}
