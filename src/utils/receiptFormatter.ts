/**
 * Thermal Receipt Formatter
 *
 * Formats sale data for 80mm thermal printers with ESC/POS commands.
 * Uses special markers that NetworkPrinter converts to ESC/POS:
 * - **text** = Bold and centered
 * - --- = Separator line
 * - BARCODE:data = Barcode
 * - QR:data = QR code
 */

interface SaleItem {
  product: {
    name: string;
    sku?: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SaleData {
  id: number;
  receiptNumber: string;
  saleDate: string;
  company: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  client?: {
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  user: {
    fullname: string;
  };
  items: SaleItem[];
  subtotal: number;
  discountAmount?: number | null;
  discountPercent?: number | null;
  taxAmount?: number | null;
  taxRate?: number | null;
  taxSetting?: {
    name: string;
  } | null;
  additionalFee?: number | null;
  additionalFeeLabel?: string | null;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string;
}

/**
 * Format sale data as thermal receipt content with ESC/POS markers
 */
export function formatThermalReceipt(sale: SaleData): string {
  const remainingAmount = sale.totalAmount - sale.paidAmount;

  // Format date
  const saleDate = new Date(sale.saleDate).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const saleTime = new Date(sale.saleDate).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Build receipt with ESC/POS formatting markers
  let receipt = `**فاتورة البيع**
---

رقم الفاتورة: ${sale.receiptNumber}
التاريخ: ${saleDate}
الوقت: ${saleTime}
---
**${sale.company.name}**`;

  // Add company details if available
  if (sale.company.address) {
    receipt += `\n${sale.company.address}`;
  }
  if (sale.company.phone) {
    receipt += `\nت: ${sale.company.phone}`;
  }
  if (sale.company.email) {
    receipt += `\n${sale.company.email}`;
  }

  receipt += `\n---\n`;

  // Client info
  receipt += `\nالعميل: ${sale.client?.name || "عميل نقدي"}`;
  if (sale.client?.phone) {
    receipt += `\nالهاتف: ${sale.client.phone}`;
  }

  // Cashier
  receipt += `\nالموظف: ${sale.user.fullname}`;

  // Items section
  receipt += `\n\n**المنتجات:**\n---\n`;

  sale.items.forEach((item) => {
    const itemName = item.product.name;
    const quantity = item.quantity;
    const unitPrice = item.unitPrice.toFixed(2);
    const total = item.totalPrice.toFixed(2);

    receipt += `${itemName}\n`;
    receipt += `  ${quantity} × ${unitPrice} = ${total} ج\n`;
  });

  receipt += `---\n\n`;

  // Financial summary
  receipt += `المجموع الفرعي: ${sale.subtotal.toFixed(2)} ج\n`;

  if (sale.discountAmount && sale.discountAmount > 0) {
    const discountText = sale.discountPercent
      ? ` (${sale.discountPercent.toFixed(0)}%)`
      : "";
    receipt += `الخصم: -${sale.discountAmount.toFixed(2)} ج${discountText}\n`;
  }

  if (sale.taxAmount && sale.taxAmount > 0) {
    const taxText = sale.taxRate
      ? ` (${sale.taxRate.toFixed(0)}%)`
      : "";
    receipt += `الضريبة: +${sale.taxAmount.toFixed(2)} ج${taxText}\n`;
  }

  if (sale.additionalFee && sale.additionalFee > 0) {
    const feeLabel = sale.additionalFeeLabel || "رسوم إضافية";
    receipt += `${feeLabel}: +${sale.additionalFee.toFixed(2)} ج\n`;
  }

  receipt += `---\n`;
  receipt += `**المجموع الإجمالي: ${sale.totalAmount.toFixed(2)} ج**\n`;
  receipt += `المدفوع: ${sale.paidAmount.toFixed(2)} ج\n`;

  if (remainingAmount > 0) {
    receipt += `**المتبقي: ${remainingAmount.toFixed(2)} ج**\n`;
  }

  // Payment info
  receipt += `حالة الدفع: ${translatePaymentStatus(sale.paymentStatus)}\n`;
  receipt += `طريقة الدفع: ${translatePaymentMethod(sale.paymentMethod)}\n`;

  receipt += `---\n\n`;
  receipt += `**شكراً لاختياركم خدماتنا**\n`;

  // Optional: Add QR code with receipt number
  // receipt += `\nQR:${sale.receiptNumber}\n`;

  return receipt.trim();
}

/**
 * Translate payment status to Arabic
 */
function translatePaymentStatus(status: string): string {
  switch (status.toUpperCase()) {
    case "PAID":
      return "مدفوع بالكامل";
    case "PARTIAL":
      return "مدفوع جزئياً";
    case "UNPAID":
      return "غير مدفوع";
    default:
      return status;
  }
}

/**
 * Translate payment method to Arabic
 */
function translatePaymentMethod(method: string): string {
  if (!method) return "نقدي";
  switch (method.toUpperCase()) {
    case "CASH":
      return "نقدي";
    case "CARD":
      return "بطاقة";
    case "CREDIT":
      return "آجل";
    default:
      return method;
  }
}
