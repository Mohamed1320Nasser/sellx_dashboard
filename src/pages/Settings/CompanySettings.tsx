import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import { Card, Button } from "@/components/ui";
import { useSessionAuthStore } from "@/stores/sessionAuthStore";
import {
  useCompanyProfile,
  useUpdateCompanyProfile,
} from "@/hooks/api/useCompanyProfile";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Save,
  Upload,
  Camera,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function CompanySettings() {
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || company?.id || 0;

  // Fetch company profile
  const {
    data: companyProfile,
    isLoading,
    error,
  } = useCompanyProfile(companyId);
  const updateMutation = useUpdateCompanyProfile();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxNumber: "",
  });

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load company data into form
  useEffect(() => {
    if (companyProfile) {
      setFormData({
        name: companyProfile.name || "",
        email: companyProfile.email || "",
        phone: companyProfile.phone || "",
        address: companyProfile.address || "",
        taxNumber: companyProfile.taxNumber || "",
      });

      // Set logo preview if company has logoUrl from backend
      if (companyProfile.logoUrl) {
        setLogoPreview(companyProfile.logoUrl);
      }
    }
  }, [companyProfile]);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("يرجى اختيار ملف صورة صالح");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
        return;
      }

      setLogoFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      toast.error("لم يتم العثور على معرف الشركة");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        data: {
          companyId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          taxNumber: formData.taxNumber || undefined,
        },
        logoFile: logoFile || undefined,
      });

      // Clear the file input after successful upload
      setLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <Card padding="lg">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="mr-3 text-gray-600">جاري تحميل بيانات الشركة...</span>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <Card padding="lg">
            <div className="flex flex-col items-center justify-center py-12">
              <XCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                خطأ في تحميل البيانات
              </h2>
              <p className="text-gray-600">
                {(error as any)?.message || "حدث خطأ أثناء تحميل بيانات الشركة"}
              </p>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إعدادات الشركة</h1>
            <p className="text-gray-600 mt-1">
              تعديل بيانات الشركة والشعار
            </p>
          </div>
          {companyProfile?.status && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                companyProfile.status === "APPROVED"
                  ? "bg-green-100 text-green-700"
                  : companyProfile.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {companyProfile.status === "APPROVED" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {companyProfile.status === "APPROVED"
                ? "معتمدة"
                : companyProfile.status === "PENDING"
                ? "قيد المراجعة"
                : "مرفوضة"}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo Section */}
            <Card padding="lg" className="lg:col-span-1">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Camera className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    شعار الشركة
                  </h3>
                </div>

                {/* Logo Preview */}
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center mb-4">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="شعار الشركة"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">لا يوجد شعار</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUploadClick}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 ml-2" />
                    {logoPreview ? "تغيير الشعار" : "رفع شعار"}
                  </Button>

                  <p className="text-xs text-gray-500 mt-3 text-center">
                    الصيغ المدعومة: JPG, PNG, WEBP
                    <br />
                    الحجم الأقصى: 5 ميجابايت
                  </p>
                </div>
              </div>
            </Card>

            {/* Company Info Section */}
            <Card padding="lg" className="lg:col-span-2">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    معلومات الشركة
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="w-4 h-4 inline-block ml-1" />
                      اسم الشركة
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="أدخل اسم الشركة"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline-block ml-1" />
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="example@company.com"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline-block ml-1" />
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="05xxxxxxxx"
                    />
                  </div>

                  {/* Tax Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline-block ml-1" />
                      الرقم الضريبي
                    </label>
                    <input
                      type="text"
                      name="taxNumber"
                      value={formData.taxNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="أدخل الرقم الضريبي"
                    />
                  </div>

                  {/* Address - Full Width */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline-block ml-1" />
                      العنوان
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="أدخل عنوان الشركة الكامل"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="min-w-[150px]"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ التغييرات
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </form>
      </div>
    </Layout>
  );
}
