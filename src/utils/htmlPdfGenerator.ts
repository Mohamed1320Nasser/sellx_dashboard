export interface HtmlReceiptData {
  sale: {
    id: number;
    receiptNumber: string;
    saleDate: string;
    totalAmount: number;
    subtotal?: number;
    totalDiscount?: number;
    discountPercent?: number;
    taxAmount?: number;
    taxPercent?: number;
    paidAmount?: number;
    paymentStatus?: string;
    paymentMethod?: string;
    notes?: string;
    client?: {
      name: string;
      phone?: string;
      email?: string;
      address?: string;
    };
    user?: {
      fullname: string;
    };
    company?: {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      logo?: string;
    };
    items?: Array<{
      product?: {
        name: string;
        sku: string;
      };
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ar-EG", {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function getPaymentMethodLabel(method: string | undefined): string {
  switch (method) {
    case 'CASH': return 'نقدي';
    case 'CARD': return 'بطاقة';
    case 'CREDIT': return 'آجل';
    default: return 'نقدي';
  }
}

function getPaymentStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'PAID': return 'مدفوع';
    case 'PARTIAL': return 'مدفوع جزئياً';
    case 'UNPAID': return 'غير مدفوع';
    default: return 'مدفوع';
  }
}

function getPaymentStatusColor(status: string | undefined): string {
  switch (status) {
    case 'PAID': return '#10b981';
    case 'PARTIAL': return '#f59e0b';
    case 'UNPAID': return '#ef4444';
    default: return '#10b981';
  }
}

function generateReceiptHTML(data: HtmlReceiptData): string {
  const { sale } = data;
  const subtotal = sale.subtotal || sale.items?.reduce((sum, item) => sum + item.totalPrice, 0) || sale.totalAmount;
  const discount = sale.totalDiscount || 0;
  const tax = sale.taxAmount || 0;
  const remaining = (sale.totalAmount || 0) - (sale.paidAmount || sale.totalAmount || 0);

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة البيع - ${sale.receiptNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Cairo', 'Arial', sans-serif;
          direction: rtl;
          text-align: right;
          background: #f8fafc;
          color: #1e293b;
          line-height: 1.6;
          padding: 20px;
        }

        .invoice {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        /* Header Section */
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 30px 40px;
          position: relative;
          overflow: hidden;
        }

        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          z-index: 1;
        }

        .company-info {
          flex: 1;
        }

        .company-name {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .company-details {
          font-size: 13px;
          opacity: 0.9;
          line-height: 1.8;
        }

        .invoice-badge {
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          padding: 20px 25px;
          border-radius: 12px;
          text-align: center;
          min-width: 180px;
        }

        .invoice-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 5px;
        }

        .invoice-number {
          font-size: 22px;
          font-weight: 700;
        }

        /* Info Cards Section */
        .info-section {
          padding: 30px 40px;
          background: #f8fafc;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .info-card {
          background: white;
          padding: 18px 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid #e2e8f0;
        }

        .info-card-label {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 6px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-card-value {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        /* Client Section */
        .client-section {
          padding: 0 40px 30px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .client-box {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 20px 24px;
          border-radius: 12px;
          border-right: 4px solid #3b82f6;
        }

        .client-box-title {
          font-size: 12px;
          color: #3b82f6;
          font-weight: 700;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .client-name {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .client-detail {
          font-size: 13px;
          color: #64748b;
        }

        .employee-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 20px 24px;
          border-radius: 12px;
          border-right: 4px solid #22c55e;
        }

        .employee-box-title {
          font-size: 12px;
          color: #22c55e;
          font-weight: 700;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Items Table */
        .items-section {
          padding: 0 40px 30px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-title::before {
          content: '';
          width: 4px;
          height: 20px;
          background: #3b82f6;
          border-radius: 2px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .items-table th {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 16px 20px;
          font-size: 13px;
          font-weight: 600;
          text-align: right;
        }

        .items-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }

        .items-table tr:last-child td {
          border-bottom: none;
        }

        .items-table tr:nth-child(even) {
          background: #f8fafc;
        }

        .product-name {
          font-weight: 600;
          color: #1e293b;
        }

        .product-sku {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .quantity-badge {
          background: #e0f2fe;
          color: #0369a1;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 13px;
          display: inline-block;
        }

        .price {
          font-weight: 600;
          color: #1e293b;
        }

        .total-price {
          font-weight: 700;
          color: #3b82f6;
        }

        /* Summary Section */
        .summary-section {
          padding: 30px 40px;
          background: #f8fafc;
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 30px;
          align-items: start;
        }

        .payment-info {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .payment-method-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f0f9ff;
          color: #0369a1;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .payment-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          color: white;
        }

        .totals-box {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .totals-row:last-child {
          border-bottom: none;
        }

        .totals-label {
          color: #64748b;
          font-size: 14px;
        }

        .totals-value {
          font-weight: 600;
          font-size: 15px;
          color: #1e293b;
        }

        .discount-row {
          background: #fef2f2;
        }

        .discount-row .totals-value {
          color: #dc2626;
        }

        .tax-row {
          background: #fffbeb;
        }

        .tax-row .totals-value {
          color: #d97706;
        }

        .grand-total-row {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          padding: 20px 24px;
        }

        .grand-total-row .totals-label {
          color: rgba(255,255,255,0.9);
          font-size: 16px;
          font-weight: 600;
        }

        .grand-total-row .totals-value {
          color: white;
          font-size: 24px;
          font-weight: 800;
        }

        .remaining-row {
          background: #fef2f2;
        }

        .remaining-row .totals-label {
          color: #dc2626;
        }

        .remaining-row .totals-value {
          color: #dc2626;
          font-weight: 700;
        }

        /* Notes Section */
        .notes-section {
          padding: 0 40px 30px;
        }

        .notes-box {
          background: #fffbeb;
          border: 1px dashed #fbbf24;
          border-radius: 12px;
          padding: 16px 20px;
        }

        .notes-title {
          font-size: 13px;
          font-weight: 700;
          color: #d97706;
          margin-bottom: 8px;
        }

        .notes-content {
          font-size: 14px;
          color: #92400e;
        }

        /* Footer */
        .footer {
          background: #1e293b;
          color: white;
          padding: 30px 40px;
          text-align: center;
        }

        .thank-you {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .footer-brand {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        @media print {
          body {
            padding: 0;
            background: white;
          }

          .invoice {
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <div class="company-info">
              <div class="company-name">${sale.company?.name || "الشركة"}</div>
              <div class="company-details">
                ${sale.company?.address ? `${sale.company.address}<br>` : ""}
                ${sale.company?.phone ? `هاتف: ${sale.company.phone}<br>` : ""}
                ${sale.company?.email ? `${sale.company.email}` : ""}
              </div>
            </div>
            <div class="invoice-badge">
              <div class="invoice-label">رقم الفاتورة</div>
              <div class="invoice-number">${sale.receiptNumber}</div>
            </div>
          </div>
        </div>

        <!-- Info Cards -->
        <div class="info-section">
          <div class="info-card">
            <div class="info-card-label">تاريخ الفاتورة</div>
            <div class="info-card-value">${formatDate(sale.saleDate)}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">وقت الفاتورة</div>
            <div class="info-card-value">${formatTime(sale.saleDate)}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">عدد الأصناف</div>
            <div class="info-card-value">${sale.items?.length || 0} صنف</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">إجمالي الكمية</div>
            <div class="info-card-value">${sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} قطعة</div>
          </div>
        </div>

        <!-- Client & Employee -->
        <div class="client-section">
          <div class="client-box">
            <div class="client-box-title">بيانات العميل</div>
            <div class="client-name">${sale.client?.name || "عميل نقدي"}</div>
            ${sale.client?.phone ? `<div class="client-detail">📞 ${sale.client.phone}</div>` : ""}
            ${sale.client?.email ? `<div class="client-detail">✉️ ${sale.client.email}</div>` : ""}
          </div>
          <div class="employee-box">
            <div class="employee-box-title">الموظف المسؤول</div>
            <div class="client-name">${sale.user?.fullname || "غير محدد"}</div>
          </div>
        </div>

        <!-- Items Table -->
        ${sale.items && sale.items.length > 0 ? `
          <div class="items-section">
            <div class="section-title">تفاصيل المنتجات</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40%">المنتج</th>
                  <th style="width: 15%; text-align: center">الكمية</th>
                  <th style="width: 20%; text-align: center">سعر الوحدة</th>
                  <th style="width: 25%; text-align: center">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items.map(item => `
                  <tr>
                    <td>
                      <div class="product-name">${item.product?.name || "منتج"}</div>
                      <div class="product-sku">${item.product?.sku || ""}</div>
                    </td>
                    <td style="text-align: center">
                      <span class="quantity-badge">${item.quantity}</span>
                    </td>
                    <td style="text-align: center">
                      <span class="price">${formatCurrency(item.unitPrice)} ج.م</span>
                    </td>
                    <td style="text-align: center">
                      <span class="total-price">${formatCurrency(item.totalPrice)} ج.م</span>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}

        <!-- Summary -->
        <div class="summary-section">
          <div class="payment-info">
            <div class="payment-method-badge">
              💳 طريقة الدفع: ${getPaymentMethodLabel(sale.paymentMethod)}
            </div>
            <div class="payment-status-badge" style="background: ${getPaymentStatusColor(sale.paymentStatus)}">
              ✓ ${getPaymentStatusLabel(sale.paymentStatus)}
            </div>
          </div>

          <div class="totals-box">
            <div class="totals-row">
              <span class="totals-label">المجموع الفرعي</span>
              <span class="totals-value">${formatCurrency(subtotal)} ج.م</span>
            </div>
            ${discount > 0 ? `
              <div class="totals-row discount-row">
                <span class="totals-label">الخصم ${sale.discountPercent ? `(${sale.discountPercent}%)` : ""}</span>
                <span class="totals-value">- ${formatCurrency(discount)} ج.م</span>
              </div>
            ` : ""}
            ${tax > 0 ? `
              <div class="totals-row tax-row">
                <span class="totals-label">الضريبة ${sale.taxPercent ? `(${sale.taxPercent}%)` : ""}</span>
                <span class="totals-value">+ ${formatCurrency(tax)} ج.م</span>
              </div>
            ` : ""}
            <div class="totals-row grand-total-row">
              <span class="totals-label">المجموع الكلي</span>
              <span class="totals-value">${formatCurrency(sale.totalAmount)} ج.م</span>
            </div>
            ${sale.paymentStatus === 'PARTIAL' && sale.paidAmount ? `
              <div class="totals-row">
                <span class="totals-label">المدفوع</span>
                <span class="totals-value" style="color: #22c55e">${formatCurrency(sale.paidAmount)} ج.م</span>
              </div>
              <div class="totals-row remaining-row">
                <span class="totals-label">المتبقي</span>
                <span class="totals-value">${formatCurrency(remaining)} ج.م</span>
              </div>
            ` : ""}
          </div>
        </div>

        ${sale.notes ? `
          <div class="notes-section">
            <div class="notes-box">
              <div class="notes-title">📝 ملاحظات</div>
              <div class="notes-content">${sale.notes}</div>
            </div>
          </div>
        ` : ""}

        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">شكراً لتعاملكم معنا 🙏</div>
          <div>نتطلع لخدمتكم مرة أخرى</div>
          <div class="footer-brand">
            تم إنشاء هذه الفاتورة بواسطة نظام SellX
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

export const generateHtmlReceipt = async (data: HtmlReceiptData): Promise<void> => {
  try {
    const { sale } = data;

    // Validate required data
    if (!sale) {
      throw new Error("Sale data is missing");
    }

    if (!sale.receiptNumber) {
      throw new Error(
        `Receipt number is missing. Sale data: ${JSON.stringify(sale)}`
      );
    }

    // Generate HTML content
    const htmlContent = generateReceiptHTML(data);

    // Dynamically import html2canvas and jsPDF first
    const [html2canvasModule, jsPDFModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);
    const html2canvas = html2canvasModule.default;
    const { jsPDF } = jsPDFModule;

    // Create a hidden container to render the HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    container.style.pointerEvents = 'none';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Get the invoice element inside the container
    const invoiceElement = container.querySelector('.invoice') as HTMLElement;
    if (!invoiceElement) {
      document.body.removeChild(container);
      throw new Error("Could not find invoice element");
    }

    // Wait for fonts to load
    await document.fonts.ready;

    // Convert to canvas
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      windowWidth: invoiceElement.scrollWidth,
      windowHeight: invoiceElement.scrollHeight,
    });

    // Create PDF
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight
    );
    heightLeft -= pageHeight;

    // Handle multi-page if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(`فاتورة-${sale.receiptNumber}.pdf`);

    // Clean up
    document.body.removeChild(container);
  } catch (error) {
    throw new Error(
      `Failed to generate receipt: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
