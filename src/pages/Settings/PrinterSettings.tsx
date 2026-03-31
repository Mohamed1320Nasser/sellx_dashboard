import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout';
import { usePrinterConfigStore } from '../../stores/printerConfigStore';
import { useSessionAuthStore } from '../../stores/sessionAuthStore';
import { TabPanel, TabContent } from '../../components/ui';
import { ConnectionTab } from '../../components/printer/ConnectionTab';
import { ContentTab } from '../../components/printer/ContentTab';
import { AutomationTab } from '../../components/printer/AutomationTab';
import { LabelsTab } from '../../components/printer/LabelsTab';
import { Printer, Save, RotateCcw, AlertCircle, Cable, Receipt, Zap, Tag, TestTube } from 'lucide-react';
import toast from 'react-hot-toast';
import { printBarcode } from '../../services/printService';

export default function PrinterSettings() {
  const config = usePrinterConfigStore();
  const { company } = useSessionAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');

  // Load config on mount
  useEffect(() => {
    if (company?.companyId) {
      config.loadConfig(company.companyId);
    }
  }, [company?.companyId]);

  const handleSave = async () => {
    if (!company?.companyId) {
      toast.error('لم يتم العثور على معرف الشركة');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await config.saveConfig(company.companyId);
      setSaveSuccess(true);
      toast.success('✓ تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to save:', error);
      const errorMessage = error.response?.data?.message || error.message || 'فشل حفظ الإعدادات';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('هل أنت متأكد من استعادة الإعدادات الافتراضية؟')) {
      config.resetToDefaults();
      toast.success('تم استعادة الإعدادات الافتراضية');
    }
  };

  const handleTestPrint = async () => {
    // Check if printer is configured
    if (!config.printerName && config.connectionType === 'USB') {
      toast.error('⚠️ يرجى حفظ إعدادات الطابعة أولاً قبل الطباعة التجريبية');
      return;
    }

    if (config.connectionType === 'LAN' && (!config.ipAddress || !config.port)) {
      toast.error('⚠️ يرجى تكوين عنوان IP والمنفذ وحفظ الإعدادات أولاً');
      return;
    }

    try {
      const loadingToast = toast.loading('جاري طباعة ملصق تجريبي...');
      await printBarcode({
        sku: 'TEST-12345',
        productName: 'منتج تجريبي / Test Product',
        price: 99.99,
        quantity: 1,
      });
      toast.success('✓ تم إرسال الملصق التجريبي للطباعة', { id: loadingToast });
    } catch (error: any) {
      toast.error(error.message || 'فشلت الطباعة التجريبية');
      console.error('Test print error:', error);
    }
  };

  const tabs = [
    {
      id: 'connection',
      label: 'الاتصال',
      icon: Cable,
    },
    {
      id: 'content',
      label: 'محتوى الفاتورة',
      icon: Receipt,
    },
    {
      id: 'automation',
      label: 'التشغيل التلقائي',
      icon: Zap,
    },
    {
      id: 'labels',
      label: 'الملصقات',
      icon: Tag,
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إعدادات الطابعة</h1>
                <p className="text-sm text-gray-600">تكوين طابعة الإيصالات الحرارية وملصقات الباركود</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestPrint}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <TestTube className="w-4 h-4" />
                طباعة تجريبية
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                استعادة الافتراضي
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  px-6 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition-all
                  ${isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : saveSuccess
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                  }
                `}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'جاري الحفظ...' : saveSuccess ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {config.error && (
          <div className="mx-6 mt-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">خطأ</p>
                <p className="text-red-600 text-sm">{config.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <TabPanel
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          <TabContent id="connection" activeTab={activeTab}>
            <ConnectionTab />
          </TabContent>

          <TabContent id="content" activeTab={activeTab}>
            <ContentTab />
          </TabContent>

          <TabContent id="automation" activeTab={activeTab}>
            <AutomationTab />
          </TabContent>

          <TabContent id="labels" activeTab={activeTab}>
            <LabelsTab />
          </TabContent>
        </TabPanel>

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {config.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري التحميل...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>جاهز للحفظ</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                استعادة الافتراضي
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  px-8 py-3 text-sm font-semibold text-white rounded-lg shadow-lg flex items-center gap-2 transition-all
                  ${isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : saveSuccess
                    ? 'bg-green-600 hover:bg-green-700 scale-105'
                    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-xl'
                  }
                `}
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'جاري الحفظ...' : saveSuccess ? '✓ تم الحفظ بنجاح' : 'حفظ جميع الإعدادات'}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom spacing for sticky bar */}
        <div className="h-24"></div>
      </div>
    </Layout>
  );
}
