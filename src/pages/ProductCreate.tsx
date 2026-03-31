import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { Layout } from '../components/layout';
import { Button, Input, Textarea, Select, Card, Modal } from '../components/ui';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { useCreateProduct, useProducts } from '../hooks/api/useProducts';
import { useCategories } from '../hooks/api/useCategories';
import { productService } from '../services/productService';
import toast from 'react-hot-toast';
import { validateBarcodeFormat } from '../services/barcodeService';
import type { Product } from '../types';

const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || company?.company?.id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '', // Single barcode field
    barcodeFormat: '',
    description: '',
    purchasePrice: '',
    sellingPrice: '',
    stockQuantity: '',
    minStockLevel: '',
    categoryId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [barcodeSource, setBarcodeSource] = useState<'scanned' | 'generated' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [barcodeInputValue, setBarcodeInputValue] = useState('');

  // Fetch categories
  const { data: categoriesData } = useCategories({
    companyId: companyId!,
    page: 1,
    limit: 100,
  });

  // Fetch products for barcode checking
  const { data: productsData } = useProducts({
    companyId: companyId!,
    page: 1,
    limit: 1000,
  });

  // Create mutation
  const createMutation = useCreateProduct();

  // Check if barcode exists
  const checkBarcodeExists = useCallback((barcode: string) => {
    const products = (productsData as any)?.data?.list || [];
    return products.find((p: any) =>
      p.originalBarcode === barcode || p.localBarcode === barcode || p.sku === barcode
    );
  }, [productsData]);

  // Handle barcode scan (original barcode from product)
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    // Validate format
    const validation = validateBarcodeFormat(barcode);
    if (!validation.isValid) {
      toast.error(validation.error || 'باركود غير صالح');
      return;
    }

    // Check if exists
    const existing = checkBarcodeExists(barcode);
    if (existing) {
      toast.error(`الباركود موجود مسبقاً: ${existing.name}`);
      setErrors(prev => ({ ...prev, barcode: 'الباركود موجود مسبقاً' }));
      return;
    }

    // Set barcode - use original barcode as-is for SKU
    // Original barcode should be saved without any prefix
    setBarcodeSource('scanned');
    setFormData(prev => ({
      ...prev,
      barcode,
      sku: barcode,  // Use original barcode as SKU (no prefix)
      barcodeFormat: validation.format || 'CODE128'
    }));
    setErrors(prev => ({ ...prev, barcode: '' }));
    toast.success('تم مسح الباركود بنجاح');
  }, [checkBarcodeExists]);


  // Generate barcode
  const generateBarcode = useCallback(async () => {
    if (!companyId) return;

    setIsGenerating(true);
    try {
      const result = await productService.generateBarcode(companyId, 'PROD');
      if (result?.data?.data?.barcode) {
        const barcode = result.data.data.barcode;
        setBarcodeSource('generated');
        setFormData(prev => ({
          ...prev,
          barcode,
          sku: barcode,
          barcodeFormat: result.data.data.format || 'CODE128'
        }));
        setErrors(prev => ({ ...prev, barcode: '' }));
        toast.success('تم توليد الباركود');
      }
    } catch (error) {
      toast.error('فشل توليد الباركود');
    } finally {
      setIsGenerating(false);
    }
  }, [companyId]);

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'اسم المنتج مطلوب';
    if (!formData.barcode) newErrors.barcode = 'الباركود مطلوب';
    if (!formData.categoryId) newErrors.categoryId = 'الفئة مطلوبة';
    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = 'سعر الشراء مطلوب';
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = 'سعر البيع مطلوب';
    }
    if (!formData.stockQuantity) newErrors.stockQuantity = 'الكمية مطلوبة';
    if (!formData.minStockLevel) newErrors.minStockLevel = 'الحد الأدنى مطلوب';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // Handle submit
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء');
      return;
    }

    try {
      const response = await createMutation.mutateAsync({
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        originalBarcode: barcodeSource === 'scanned' ? formData.barcode : undefined,
        localBarcode: barcodeSource === 'generated' ? formData.barcode : undefined,
        barcodeFormat: formData.barcodeFormat || undefined,
        description: formData.description.trim(),
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        stockQuantity: parseInt(formData.stockQuantity),
        minStockLevel: parseInt(formData.minStockLevel),
        categoryId: formData.categoryId,
        companyId: companyId!,
      });

      toast.success('تم إنشاء المنتج بنجاح');
      navigate('/products');
    } catch (error) {
      console.error('Create error:', error);
      toast.error('حدث خطأ أثناء الإنشاء');
    }
  }, [formData, barcodeSource, validateForm, createMutation, companyId, navigate]);

  // Category options
  const categoryOptions = [
    { value: '', label: 'اختر الفئة' },
    ...((categoriesData as any)?.data?.list || []).map((category: any) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/products')}
              className="text-gray-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">إضافة منتج جديد</h1>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 ml-2" />
            {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Barcode Section - Simplified */}
          <Card padding="lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">الباركود</h3>
              </div>

              {!formData.barcode ? (
                // No barcode yet - show generate button
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateBarcode}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? 'جاري التوليد...' : 'توليد باركود جديد'}
                  </Button>
                </div>
              ) : (
                // Barcode set - show it
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">
                    {barcodeSource === 'scanned' ? 'باركود ممسوح' : 'باركود محلي'}
                  </p>
                  <p className="text-2xl font-mono font-bold text-gray-900">
                    {formData.barcode}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, barcode: '', sku: '' }));
                      setBarcodeSource(null);
                    }}
                    className="text-xs text-blue-600 hover:underline mt-2"
                  >
                    تغيير
                  </button>
                </div>
              )}
              {errors.barcode && (
                <p className="text-sm text-red-600">{errors.barcode}</p>
              )}
            </div>
          </Card>

          {/* Product Info */}
          <Card padding="lg">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4" />
                معلومات المنتج
              </h3>

              <Input
                label="اسم المنتج"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                placeholder="أدخل اسم المنتج"
                required
              />

              <Select
                label="الفئة"
                options={categoryOptions}
                value={formData.categoryId}
                onChange={(value) => handleInputChange('categoryId', value)}
                error={errors.categoryId}
                required
              />

              <Textarea
                label="الوصف (اختياري)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="وصف المنتج"
                rows={2}
              />
            </div>
          </Card>

          {/* Pricing & Stock */}
          <Card padding="lg">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">التسعير والمخزون</h3>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="سعر الشراء"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                  error={errors.purchasePrice}
                  placeholder="0.00"
                  required
                />

                <Input
                  label="سعر البيع"
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                  error={errors.sellingPrice}
                  placeholder="0.00"
                  required
                />

                <Input
                  label="الكمية"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                  error={errors.stockQuantity}
                  placeholder="0"
                  required
                />

                <Input
                  label="الحد الأدنى"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => handleInputChange('minStockLevel', e.target.value)}
                  error={errors.minStockLevel}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </Card>
        </form>
      </div>
    </Layout>
  );
};

export default ProductCreate;
