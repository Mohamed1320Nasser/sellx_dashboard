import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReceiptData {
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

export const generateReceiptPDF = (data: ReceiptData): void => {
  try {
    const { sale } = data;

    // Validate required data
    if (!sale) {
      throw new Error("Sale data is missing");
    }

    if (!sale.receiptNumber) {
      throw new Error("Receipt number is missing");
    }

    // Create new PDF document
    const doc = new jsPDF();

    // Set font for Arabic support (using a basic approach)
    doc.setFont("helvetica");

    // SellX Header
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SellX", 105, 12, { align: "center" });

    // Company Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(sale.company?.name || "الشركة", 105, 22, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    if (sale.company?.address) {
      doc.text(sale.company.address, 105, 30, { align: "center" });
    }
    if (sale.company?.phone) {
      doc.text(`الهاتف: ${sale.company.phone}`, 105, 35, { align: "center" });
    }
    if (sale.company?.email) {
      doc.text(`البريد الإلكتروني: ${sale.company.email}`, 105, 40, {
        align: "center",
      });
    }

    // Receipt Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("فاتورة البيع", 105, 55, { align: "center" });

    // Receipt Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const startY = 70;
    let currentY = startY;

    // Receipt Number
    doc.text(`رقم الفاتورة: ${sale.receiptNumber}`, 20, currentY);
    currentY += 8;

    // Date
    const saleDate = new Date(sale.saleDate).toLocaleDateString("ar-EG");
    doc.text(`التاريخ: ${saleDate}`, 20, currentY);
    currentY += 8;

    // Employee
    doc.text(`الموظف: ${sale.user?.fullname || "غير محدد"}`, 20, currentY);
    currentY += 8;

    // Client Information
    if (sale.client) {
      doc.text(`العميل: ${sale.client.name}`, 20, currentY);
      currentY += 8;
      if (sale.client.phone) {
        doc.text(`الهاتف: ${sale.client.phone}`, 20, currentY);
        currentY += 8;
      }
      if (sale.client.email) {
        doc.text(`البريد الإلكتروني: ${sale.client.email}`, 20, currentY);
        currentY += 8;
      }
    } else {
      doc.text("العميل: عميل نقدي", 20, currentY);
      currentY += 8;
    }

    currentY += 10;

    // Items Table
    const tableData = (sale.items || []).map((item) => [
      item.product?.name || "منتج غير محدد",
      item.product?.sku || "غير محدد",
      item.quantity.toString(),
      `${item.unitPrice} جنيه`,
      `${item.totalPrice} جنيه`,
    ]);

    doc.autoTable({
      head: [["اسم المنتج", "كود المنتج", "الكمية", "سعر الوحدة", "المجموع"]],
      body: tableData,
      startY: currentY,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 60 }, // Product name
        1: { cellWidth: 30 }, // SKU
        2: { cellWidth: 20 }, // Quantity
        3: { cellWidth: 30 }, // Unit price
        4: { cellWidth: 30 }, // Total
      },
    });

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 10
      : currentY + 20;

    // Total Amount
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`المجموع الإجمالي: ${sale.totalAmount} جنيه`, 20, finalY);

    // Payment Method
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`طريقة الدفع: ${sale.paymentMethod || "نقدي"}`, 20, finalY + 10);

    // Footer
    doc.setFontSize(8);
    doc.text(`شكراً لاختياركم ${sale.company?.name || 'خدماتنا'}`, 105, finalY + 25, { align: "center" });
    doc.text("--------------------------------", 105, finalY + 30, { align: "center" });
    doc.text("نظام SellX لنقاط البيع", 105, finalY + 35, { align: "center" });

    // Save the PDF
    doc.save(`receipt-${sale.receiptNumber}.pdf`);
  } catch (error) {
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
