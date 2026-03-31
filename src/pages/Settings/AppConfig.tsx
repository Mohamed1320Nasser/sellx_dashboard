import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Card, Button, Select } from '@/components/ui';
import { useAppConfig } from '@/hooks/useAppConfig';
import { refreshApiClientConfig } from '@/services/apiClient';
import {
  Download,
  Upload,
  RotateCcw,
  AlertCircle,
  Settings,
  Palette,
  Globe,
  Type,
  Server,
  Printer,
  Monitor,
  Database,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AppConfigPage() {
  const {
    config,
    loading,
    error,
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,
  } = useAppConfig();

  const handleUpdateConfig = async (section: string, updates: any) => {
    const success = await updateConfig({ [section]: updates });
    if (success) {
      refreshApiClientConfig();
      toast.success('تم حفظ الإعدادات بنجاح');
    } else {
      toast.error('فشل في حفظ الإعدادات');
    }
  };

  const handleExportConfig = async () => {
    const configData = await exportConfig();
    if (configData) {
      const blob = new Blob([configData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sellx-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تصدير الإعدادات بنجاح');
    }
  };

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importConfig(text);
      if (success) {
        toast.success('تم استيراد الإعدادات بنجاح');
      } else {
        toast.error('فشل في استيراد الإعدادات');
      }
    } catch (error) {
      toast.error('خطأ في قراءة الملف');
    }
  };

  const handleResetConfig = async () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      const success = await resetConfig();
      if (success) {
        toast.success('تم إعادة تعيين الإعدادات بنجاح');
      } else {
        toast.error('فشل في إعادة تعيين الإعدادات');
      }
    }
  };

  // Helper function to get theme label
  const getThemeLabel = (theme: string) => {
    const themes: Record<string, string> = {
      light: 'فاتح',
      dark: 'داكن',
      auto: 'تلقائي',
    };
    return themes[theme] || theme;
  };

  // Helper function to get language label
  const getLanguageLabel = (lang: string) => {
    const languages: Record<string, string> = {
      ar: 'العربية',
      en: 'English',
    };
    return languages[lang] || lang;
  };

  // Helper function to get font size label
  const getFontSizeLabel = (size: string) => {
    const sizes: Record<string, string> = {
      small: 'صغير',
      medium: 'متوسط',
      large: 'كبير',
    };
    return sizes[size] || size;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-gray-600 mb-4">خطأ في تحميل الإعدادات: {error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إعدادات التطبيق</h1>
            <p className="text-gray-600 mt-1">إدارة إعدادات الأجهزة والواجهة</p>
          </div>
        </div>

        {/* UI Configuration */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">إعدادات الواجهة</h2>
          <p className="text-sm text-gray-600 mb-6">تخصيص مظهر التطبيق</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                label="المظهر"
                options={[
                  { value: 'light', label: 'فاتح' },
                  { value: 'dark', label: 'داكن' },
                  { value: 'auto', label: 'تلقائي' },
                ]}
                value={config.ui.theme}
                onChange={(value) => handleUpdateConfig('ui', { ...config.ui, theme: value })}
              />
            </div>

            <div>
              <Select
                label="اللغة"
                options={[
                  { value: 'ar', label: 'العربية' },
                  { value: 'en', label: 'English' },
                ]}
                value={config.ui.language}
                onChange={(value) => handleUpdateConfig('ui', { ...config.ui, language: value })}
              />
            </div>

            <div>
              <Select
                label="حجم الخط"
                options={[
                  { value: 'small', label: 'صغير' },
                  { value: 'medium', label: 'متوسط' },
                  { value: 'large', label: 'كبير' },
                ]}
                value={config.ui.fontSize}
                onChange={(value) => handleUpdateConfig('ui', { ...config.ui, fontSize: value })}
              />
            </div>
          </div>
        </Card>

        {/* Configuration Management */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">إدارة الإعدادات</h2>
          <p className="text-sm text-gray-600 mb-6">تصدير واستيراد وإعادة تعيين الإعدادات</p>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleExportConfig}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير الإعدادات
            </Button>

            <label className="cursor-pointer">
              <Button
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4 ml-2" />
                استيراد الإعدادات
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImportConfig}
                className="hidden"
              />
            </label>

            <Button
              onClick={handleResetConfig}
              className="bg-red-600 hover:bg-red-700"
            >
              <RotateCcw className="w-4 h-4 ml-2" />
              إعادة تعيين
            </Button>
          </div>
        </Card>

        {/* Current Configuration Display - Beautifully Designed */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">الإعدادات الحالية</h2>
          <p className="text-sm text-gray-600 mb-6">عرض جميع الإعدادات المطبقة</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Backend Settings */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">الخادم</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">رابط API</span>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={config.backend?.apiUrl}>
                    {config.backend?.apiUrl || 'غير محدد'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">مهلة الاتصال</span>
                  <span className="text-sm font-medium text-gray-900">{config.backend?.timeout || 30000} مللي ثانية</span>
                </div>
              </div>
            </div>

            {/* UI Settings */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">الواجهة</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> المظهر
                  </span>
                  <span className="text-sm font-medium text-gray-900">{getThemeLabel(config.ui?.theme)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> اللغة
                  </span>
                  <span className="text-sm font-medium text-gray-900">{getLanguageLabel(config.ui?.language)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Type className="w-3 h-3" /> حجم الخط
                  </span>
                  <span className="text-sm font-medium text-gray-900">{getFontSizeLabel(config.ui?.fontSize)}</span>
                </div>
              </div>
            </div>

            {/* Printer Settings */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">الطابعة</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">الجهاز</span>
                  <span className="text-sm font-medium text-gray-900">{config.hardware?.printer?.deviceId || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">العرض</span>
                  <span className="text-sm font-medium text-gray-900">{config.hardware?.printer?.width || 80} مم</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">النسخ</span>
                  <span className="text-sm font-medium text-gray-900">{config.hardware?.printer?.copies || 1}</span>
                </div>
              </div>
            </div>

            {/* Scanner Settings */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">الماسح الضوئي</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">الوضع</span>
                  <span className="text-sm font-medium text-gray-900">{config.hardware?.scanner?.mode?.toUpperCase() || 'HID'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">معدل البود</span>
                  <span className="text-sm font-medium text-gray-900">{config.hardware?.scanner?.baudRate || 9600}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">تأخير</span>
                  <span className="text-sm font-medium text-gray-900">{config.hardware?.scanner?.debounceMs || 100} مللي ثانية</span>
                </div>
              </div>
            </div>

            {/* Print Queue Settings */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">قائمة الطباعة</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">الحالة</span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${(config as any).printQueue?.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {(config as any).printQueue?.enabled ? (
                      <><CheckCircle className="w-3 h-3" /> مفعّل</>
                    ) : (
                      <><XCircle className="w-3 h-3" /> معطّل</>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">أقصى محاولات</span>
                  <span className="text-sm font-medium text-gray-900">{(config as any).printQueue?.maxRetries || 3}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">تأخير المحاولة</span>
                  <span className="text-sm font-medium text-gray-900">{(config as any).printQueue?.retryDelay || 5000} مللي ثانية</span>
                </div>
              </div>
            </div>

            {/* Features Settings */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">الميزات</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">وضع عدم الاتصال</span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${(config as any).features?.offlineMode ? 'text-green-600' : 'text-gray-500'}`}>
                    {(config as any).features?.offlineMode ? (
                      <><CheckCircle className="w-3 h-3" /> مفعّل</>
                    ) : (
                      <><XCircle className="w-3 h-3" /> معطّل</>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">طباعة تلقائية</span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${(config as any).features?.autoPrint ? 'text-green-600' : 'text-gray-500'}`}>
                    {(config as any).features?.autoPrint ? (
                      <><CheckCircle className="w-3 h-3" /> مفعّل</>
                    ) : (
                      <><XCircle className="w-3 h-3" /> معطّل</>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">تأكيد الصوت</span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${(config as any).features?.soundOnScan ? 'text-green-600' : 'text-gray-500'}`}>
                    {(config as any).features?.soundOnScan ? (
                      <><CheckCircle className="w-3 h-3" /> مفعّل</>
                    ) : (
                      <><XCircle className="w-3 h-3" /> معطّل</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
