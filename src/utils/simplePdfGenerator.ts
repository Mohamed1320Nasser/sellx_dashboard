import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface SimpleReceiptData {
  sale: {
    id: number;
    receiptNumber: string;
    saleDate: string;
    totalAmount: number;
    paymentMethod?: string;
    client?: {
      name: string;
      phone?: string;
      email?: string;
    };
    user?: {
      fullname: string;
    };
    company?: {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
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

export const generateSimpleReceiptPDF = (data: SimpleReceiptData): void => {
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

    // Create new PDF document
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica");

    // SellX Header
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SellX", 105, 12, { align: "center" });

    // Company Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(sale.company?.name || "الشركة", 105, 22, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (sale.company?.address) {
      doc.text(sale.company.address, 105, 30, { align: "center" });
    }
    if (sale.company?.phone) {
      doc.text(`الهاتف: ${sale.company.phone}`, 105, 35, { align: "center" });
    }

    // Receipt Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("فاتورة البيع", 105, 50, { align: "center" });

    // Receipt Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    let yPos = 70;

    // Receipt Number
    doc.text(`رقم الفاتورة: ${sale.receiptNumber}`, 20, yPos);
    yPos += 8;

    // Date
    const saleDate = new Date(sale.saleDate).toLocaleDateString("ar-EG");
    doc.text(`التاريخ: ${saleDate}`, 20, yPos);
    yPos += 8;

    // Employee
    doc.text(`الموظف: ${sale.user?.fullname || "غير محدد"}`, 20, yPos);
    yPos += 8;

    // Client Information
    if (sale.client) {
      doc.text(`العميل: ${sale.client.name}`, 20, yPos);
      yPos += 8;
      if (sale.client.phone) {
        doc.text(`الهاتف: ${sale.client.phone}`, 20, yPos);
        yPos += 8;
      }
    } else {
      doc.text("العميل: عميل نقدي", 20, yPos);
      yPos += 8;
    }

    yPos += 10;

    // Items Section
    if (sale.items && sale.items.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("المنتجات:", 20, yPos);
      yPos += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      // Table headers
      doc.text("اسم المنتج", 20, yPos);
      doc.text("الكمية", 100, yPos);
      doc.text("السعر", 130, yPos);
      doc.text("المجموع", 160, yPos);
      yPos += 8;

      // Draw line under headers
      doc.line(20, yPos - 2, 190, yPos - 2);
      yPos += 5;

      // Items
      sale.items.forEach((item) => {
        const productName = item.product?.name || "منتج غير محدد";
        const quantity = item.quantity.toString();
        const unitPrice = `${item.unitPrice} ج.م`;
        const total = `${item.totalPrice} ج.م`;

        doc.text(productName, 20, yPos);
        doc.text(quantity, 100, yPos);
        doc.text(unitPrice, 130, yPos);
        doc.text(total, 160, yPos);
        yPos += 8;
      });
    }

    yPos += 10;

    // Total Amount
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`المجموع الإجمالي: ${sale.totalAmount} جنيه`, 20, yPos);
    yPos += 8;

    // Payment Method
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`طريقة الدفع: ${sale.paymentMethod || "نقدي"}`, 20, yPos);
    yPos += 15;

    // Footer
    doc.setFontSize(8);
    doc.text(`شكراً لاختياركم ${sale.company?.name || 'خدماتنا'}`, 105, yPos, { align: "center" });
    doc.text("--------------------------------", 105, yPos + 5, { align: "center" });
    doc.text("نظام SellX لنقاط البيع", 105, yPos + 10, { align: "center" });

    // Save the PDF
    doc.save(`receipt-${sale.receiptNumber}.pdf`);
  } catch (error) {
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
