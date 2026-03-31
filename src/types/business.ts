// Business Entity Types

// Absence Types
export enum AbsenceType {
  SICK_LEAVE = "SICK_LEAVE",
  VACATION = "VACATION",
  PERSONAL_LEAVE = "PERSONAL_LEAVE",
  MATERNITY_LEAVE = "MATERNITY_LEAVE",
  PATERNITY_LEAVE = "PATERNITY_LEAVE",
  BEREAVEMENT = "BEREAVEMENT",
  OTHER = "OTHER",
}

export enum AbsenceStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export interface Absence {
  id: string;
  userId: number;
  companyId: number;
  type: AbsenceType;
  status: AbsenceStatus;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  notes?: string;
  approvedBy?: number;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    fullname: string;
    email: string;
  };
  approver?: {
    id: number;
    fullname: string;
  };
  company?: {
    id: number;
    name: string;
  };
}

export interface CreateAbsenceRequest {
  userId: string;
  companyId: number;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  reason?: string;
  notes?: string;
}

export interface UpdateAbsenceRequest {
  type?: AbsenceType;
  startDate?: string;
  endDate?: string;
  reason?: string;
  notes?: string;
}

export interface ApproveAbsenceRequest {
  status: AbsenceStatus;
  notes?: string;
}

export interface GetAbsenceListRequest {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  type?: AbsenceType;
  status?: AbsenceStatus;
  startDate?: string;
  endDate?: string;
}

export interface AbsenceStatistics {
  totalAbsences: number;
  pendingAbsences: number;
  approvedAbsences: number;
  rejectedAbsences: number;
  cancelledAbsences: number;
  typeBreakdown: Array<{
    type: AbsenceType;
    _count: { type: number };
  }>;
  statusBreakdown: Array<{
    status: AbsenceStatus;
    _count: { status: number };
  }>;
  recentAbsences: Array<{
    id: string;
    type: AbsenceType;
    status: AbsenceStatus;
    startDate: string;
    endDate: string;
    totalDays: number;
    createdAt: string;
    user?: {
      id: number;
      fullname: string;
    };
  }>;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

// Product Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  originalBarcode?: string; // Factory/manufacturer barcode
  localBarcode?: string; // System-generated barcode
  barcodeFormat?: string; // Barcode format (CODE128, EAN13, etc.)
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  currentStock: number; // Add currentStock for sales
  minStockLevel: number;
  categoryId: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  _count?: {
    saleItems: number;
    purchaseItems: number;
    stockMovements: number;
  };
}

// Stock Movement Types
export enum StockMovementType {
  PURCHASE = "PURCHASE",
  SALE = "SALE",
  ADJUSTMENT = "ADJUSTMENT",
  RETURN = "RETURN",
}

export interface StockMovement {
  id: string;
  productId: string;
  companyId: number;
  userId: number;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    stockQuantity?: number;
  };
  user?: {
    id: number;
    fullname: string;
  };
  company?: {
    id: number;
    name: string;
  };
}

export interface StockMovementSummary {
  totalMovements: number;
  typeBreakdown: Array<{
    type: StockMovementType;
    _count: { type: number };
    _sum: { quantity: number | null };
  }>;
  recentMovements: Array<{
    id: string;
    type: StockMovementType;
    quantity: number;
    reference?: string;
    createdAt: string;
    product: {
      name: string;
      sku: string;
    };
  }>;
}

export interface ProductStockHistory {
  product: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
  };
  movements: Array<{
    id: string;
    type: StockMovementType;
    quantity: number;
    previousStock: number;
    newStock: number;
    reference?: string;
    createdAt: string;
    user: {
      fullname: string;
    };
  }>;
  summary: {
    totalIn: number;
    totalOut: number;
    netChange: number;
  };
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minStockLevel: number;
  category: {
    name: string;
  };
}

// Supplier Types
export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    purchases: number;
  };
}

// Client Types
export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sales: number;
  };
}

// Tax Setting Types
export enum TaxAppliesTo {
  ALL = "ALL",
  PRODUCTS = "PRODUCTS",
  SERVICES = "SERVICES",
}

export interface TaxSetting {
  id: string;
  companyId: number;
  name: string;
  rate: number;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  appliesTo: TaxAppliesTo;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxSettingRequest {
  companyId: number;
  name: string;
  rate: number;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  appliesTo?: TaxAppliesTo;
}

export interface UpdateTaxSettingRequest {
  companyId: number;
  name?: string;
  rate?: number;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  appliesTo?: TaxAppliesTo;
}

export interface GetTaxSettingsRequest {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

// Payment Status Type
export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

// Sale Types
export interface SaleItem {
  id: number;
  saleId: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice: number; // Historical cost at time of sale
  profit?: number;
  createdAt: string;
  product?: Product;
}

export interface Sale {
  id: number;
  receiptNumber: string;
  clientId?: number;
  companyId: number;
  userId: number;
  // Financial fields
  subtotal: number;
  discountAmount?: number;
  discountPercent?: number;
  taxSettingId?: string;
  taxRate?: number;
  taxAmount?: number;
  additionalFee?: number;
  additionalFeeLabel?: string;
  totalAmount: number;
  // Payment tracking
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: "CASH" | "CARD" | "CREDIT";
  // Profit tracking
  totalCost?: number;
  totalProfit?: number;
  // Timestamps
  saleDate: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  client?: Client;
  user?: any; // User type
  taxSetting?: TaxSetting;
  items?: SaleItem[];
  payments?: Payment[];
  _sum?: {
    payments: {
      amount: number;
    };
  };
}

export interface CreateSaleItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleRequest {
  companyId: number;
  receiptNumber: string;
  clientId?: number;
  paymentMethod?: "CASH" | "CARD" | "CREDIT";
  saleDate?: string;
  additionalFee?: number;
  additionalFeeLabel?: string;
  // New fields for tax and discount
  discountAmount?: number;
  discountPercent?: number;
  taxSettingId?: string;
  paidAmount?: number;
  items: CreateSaleItemRequest[];
}

export interface GetSaleListRequest {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  clientId?: number;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}

// Purchase Types
export interface PurchaseItem {
  id: string;
  purchaseId: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  product?: Product;
}

export interface Purchase {
  id: number;
  invoiceNumber: string;
  supplierId: number;
  companyId: number;
  userId: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  dueDate?: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  user?: any; // User type
  items?: PurchaseItem[];
}

// Payment Types
export interface Payment {
  id: string;
  saleId: string;
  companyId: number;
  userId: number;
  amount: number;
  paymentMethod:
    | "CASH"
    | "CARD"
    | "BANK_TRANSFER"
    | "CHECK"
    | "MOBILE_PAYMENT"
    | "OTHER";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  reference?: string;
  notes?: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  sale?: Sale;
  user?: any; // User type
}

// Stock Movement Types (already defined above)

// HR Types

export interface Salary {
  id: string;
  userId: number;
  companyId: number;
  month: number;
  year: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonuses: number;
  netSalary: number;
  workingDays: number;
  absentDays: number;
  status: "DRAFT" | "APPROVED" | "PAID" | "CANCELLED";
  paymentDate?: string;
  paymentMethod?: "BANK_TRANSFER" | "CASH" | "CHECK";
  notes?: string;
  approvedBy?: number;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: any; // User type
  approver?: any; // User type
}

// Quote Types
export interface QuoteItem {
  id: string;
  quoteId: string;
  productId: string;
  productName: string;
  productSku?: string;
  unitPrice: number;
  costPrice?: number; // Cost at quote time
  quantity: number;
  lineDiscount: number;
  packagingFee: number;
  lineTotal: number;
  lineProfit?: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  companyId: number;
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  currency: string;
  subtotal: number;
  totalDiscount: number;
  discountAmount?: number;
  discountPercent?: number;
  taxSettingId?: string;
  taxPercent: number;
  taxRate?: number;
  taxAmount: number;
  additionalFee?: number;
  additionalFeeLabel?: string;
  total: number;
  totalCost?: number;
  totalProfit?: number;
  status: "DRAFT" | "SENT" | "PRINTED" | "ACCEPTED" | "REJECTED";
  notes?: string;
  validUntil?: string;
  convertedToSaleId?: number;
  createdAt: string;
  updatedAt: string;
  items?: QuoteItem[];
  taxSetting?: TaxSetting;
  company?: any;
}

// Quote Request/Response Types
export interface CreateQuoteItemRequest {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateQuoteRequest {
  companyId: number;
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  currency?: string;
  taxSettingId?: string;
  taxPercent?: number;
  discountAmount?: number;
  discountPercent?: number;
  notes?: string;
  validUntil?: string;
  additionalFee?: number;
  additionalFeeLabel?: string;
  items: CreateQuoteItemRequest[];
}

export interface CalculateQuoteRequest {
  companyId: number;
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  currency?: string;
  taxPercent?: number;
  items: CreateQuoteItemRequest[];
}

export interface UpdateQuoteRequest {
  companyId?: number;
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  currency?: string;
  taxPercent?: number;
  taxSettingId?: string;
  discountAmount?: number;
  discountPercent?: number;
  notes?: string;
  validUntil?: string;
  status?: "DRAFT" | "SENT" | "PRINTED" | "ACCEPTED" | "REJECTED";
  items?: CreateQuoteItemRequest[];
}

export interface GetQuoteListRequest {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Financial Report Types
export enum ReportPeriod {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
  CUSTOM = "custom",
}

export interface SalesReportFilters {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  period?: ReportPeriod;
  productId?: string;
  clientId?: number;
}

export interface ProfitLossReportFilters {
  companyId: number;
  startDate?: string;
  endDate?: string;
  period?: ReportPeriod;
}

export interface SalesReportSummary {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalPaid: number;
  outstandingBalance: number;
  totalDiscount: number;
  totalTax: number;
}

export interface SalesReportItem {
  id: string;
  receiptNumber: string;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  totalCost?: number;
  totalProfit?: number;
  saleDate: string;
  createdAt: string;
  client?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    fullname: string;
  };
  taxSetting?: {
    name: string;
    rate: number;
  };
  _count: {
    items: number;
  };
  items: Array<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costPrice: number;
    profit?: number;
    product: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
}

export interface SalesReportResponse {
  list: SalesReportItem[];
  totalCount: number;
  filterCount: number;
  summary: SalesReportSummary;
}

export interface ProfitLossReport {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    grossRevenue: number;
    discounts: number;
    taxCollected: number;
    totalRevenue: number;
    totalReturns: number;
    totalRefunds: number;
    netRevenue: number;
    totalSalesOrders: number;
    totalReturnOrders: number;
    averageOrderValue: number;
    averageReturnValue: number;
  };
  costs: {
    costOfGoodsSold: number;
    operatingExpenses: number;
    totalPurchases: number;
    totalPurchaseOrders: number;
  };
  profit: {
    grossProfit: number;
    grossProfitMargin: number;
    netProfit: number;
    netProfitMargin: number;
  };
  cashFlow: {
    salesReceived: number;
    salesOutstanding: number;
    purchasesPaid: number;
    purchasesOutstanding: number;
    refundsPaid: number;
    netCashFlow: number;
  };
  summary: {
    totalRevenue: number;
    netRevenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    grossProfitMargin: number;
    operatingExpenses: number;
    netProfit: number;
    netProfitMargin: number;
    inventoryPurchases: number;
  };
}

export interface TopSellingProduct {
  product: {
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    sellingPrice?: number;
    purchasePrice?: number;
    category?: {
      name: string;
    };
  };
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  orderCount: number;
}

export interface SalesTrend {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  orders: number;
}

export interface SalesTrendsResponse {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  trends: SalesTrend[];
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    totalOrders: number;
    averageDailyRevenue: number;
    averageDailyProfit: number;
    overallProfitMargin: number;
  };
}

// Payment Summary Types (new)
export interface PaymentSummaryByStatus {
  status: PaymentStatus;
  count: number;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
}

export interface PaymentSummaryResponse {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  summary: {
    totalSales: number;
    totalPaid: number;
    outstanding: number;
    collectionRate: number;
    salesCount: number;
  };
  byStatus: PaymentSummaryByStatus[];
}

// Analytics Types
export enum TrendPeriod {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

export enum TrendMetric {
  REVENUE = "REVENUE",
  ORDERS = "ORDERS",
  UNITS_SOLD = "UNITS_SOLD",
  AVERAGE_ORDER_VALUE = "AVERAGE_ORDER_VALUE",
}

export enum PerformanceMetric {
  REVENUE = "REVENUE",
  UNITS_SOLD = "UNITS_SOLD",
  PROFIT_MARGIN = "PROFIT_MARGIN",
  TURNOVER_RATE = "TURNOVER_RATE",
  GROWTH_RATE = "GROWTH_RATE",
}

export enum CustomerMetric {
  TOTAL_SPENT = "TOTAL_SPENT",
  ORDER_COUNT = "ORDER_COUNT",
  AVERAGE_ORDER_VALUE = "AVERAGE_ORDER_VALUE",
  LAST_PURCHASE = "LAST_PURCHASE",
  PURCHASE_FREQUENCY = "PURCHASE_FREQUENCY",
}

export enum InventoryMetric {
  STOCK_LEVEL = "STOCK_LEVEL",
  TURNOVER_RATE = "TURNOVER_RATE",
  DAYS_OF_INVENTORY = "DAYS_OF_INVENTORY",
  STOCK_VALUE = "STOCK_VALUE",
  LOW_STOCK_ALERTS = "LOW_STOCK_ALERTS",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

// Sales Trends Analytics
export interface SalesTrendData {
  period: string;
  value: number;
}

export interface SalesTrendsAnalyticsResponse {
  trends: SalesTrendData[];
  period: TrendPeriod;
  metric: TrendMetric;
  summary: {
    totalPeriods: number;
    averageValue: number;
    maxValue: number;
    minValue: number;
  };
}

// Product Performance Analytics
export interface ProductPerformanceItem {
  product: {
    id: string;
    name: string;
    sku: string;
    category: {
      id: string;
      name: string;
    };
    stockQuantity: number;
    minStockLevel: number;
  };
  metrics: {
    revenue: number;
    unitsSold: number;
    averagePrice: number;
    turnoverRate: number;
    growthRate: number;
    profitMargin: number;
  };
}

export interface ProductPerformanceResponse {
  products: ProductPerformanceItem[];
  metric: PerformanceMetric;
  sortOrder: SortOrder;
  summary: {
    totalProducts: number;
    averageRevenue: number;
    totalRevenue: number;
    totalUnitsSold: number;
  };
}

// Customer Analytics
export interface CustomerAnalyticsItem {
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  metrics: {
    totalSpent: number;
    orderCount: number;
    averageOrderValue: number;
    lastPurchase: string | null;
    purchaseFrequency: number;
    totalUnits: number;
  };
}

export interface CustomerAnalyticsResponse {
  customers: CustomerAnalyticsItem[];
  metric: CustomerMetric;
  summary: {
    totalCustomers: number;
    averageTotalSpent: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
}

// Inventory Analytics
export interface InventoryAnalyticsItem {
  product: {
    id: string;
    name: string;
    sku: string;
    category: {
      id: string;
      name: string;
    };
    stockQuantity: number;
    minStockLevel: number;
  };
  metrics: {
    stockLevel: number;
    turnoverRate: number;
    daysOfInventory: number;
    stockValue: number;
    stockStatus: "LOW" | "MEDIUM" | "GOOD";
    isLowStock: boolean;
    totalUnitsSold: number;
  };
}

export interface InventoryAnalyticsResponse {
  inventory: InventoryAnalyticsItem[];
  metric: InventoryMetric;
  summary: {
    totalProducts: number;
    totalStockValue: number;
    averageStockLevel: number;
    lowStockCount: number;
    averageTurnoverRate: number;
  };
}

// Dashboard Summary
export interface DashboardSummary {
  overview: {
    currentRevenue: number;
    currentReturns: number;
    currentNetRevenue: number;
    previousRevenue: number;
    previousReturns: number;
    previousNetRevenue: number;
    revenueGrowth: number;
    currentOrders: number;
    previousOrders: number;
    orderGrowth: number;
    totalRevenue: number;
    totalReturns: number;
    netRevenue: number;
    customerCount: number;
    newCustomersToday: number;
    totalProducts: number;
    totalSuppliers: number;
    currentPurchases: number;
    previousPurchases: number;
    purchaseGrowth: number;
    currentPurchaseOrders: number;
    previousPurchaseOrders: number;
    purchaseOrderGrowth: number;
    totalPurchaseValue: number;
    grossProfit: number;
    profitMargin: number;
    averageOrderValue: number;
    returnRate: number;
    pendingPayments: number;
    completedPayments: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sku: string;
    unitsSold: number;
    revenue: number;
    currentStock: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    minStockLevel: number;
  }>;
  alerts: {
    lowStockCount: number;
    outOfStockCount: number;
  };
}

// Analytics Filters
export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  period?: TrendPeriod;
  metric?: TrendMetric | PerformanceMetric | CustomerMetric | InventoryMetric;
  sortOrder?: SortOrder;
  limit?: number;
  categoryId?: number;
}

// Return Types
export enum ReturnStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

export interface ReturnItem {
  id: string;
  returnId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason?: string;
  condition?: "NEW" | "USED" | "DAMAGED" | "DEFECTIVE";
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface Return {
  id: string;
  returnNumber: string;
  originalSaleId: number;
  clientId?: number;
  companyId: number;
  userId: number;
  totalAmount: number;
  refundAmount: number;
  status: ReturnStatus;
  reason?: string;
  notes?: string;
  returnDate: string;
  processedDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  originalSale?: {
    id: number;
    receiptNumber: string;
    saleDate: string;
    items?: SaleItem[];
  };
  client?: Client;
  user?: {
    id: number;
    fullname: string;
    email: string;
  };
  items?: ReturnItem[];
}

// Return Request/Response Types
export interface CreateReturnItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  reason?: string;
  condition?: "NEW" | "USED" | "DAMAGED" | "DEFECTIVE";
}

export interface CreateReturnRequest {
  originalSaleId: number;
  clientId?: number;
  companyId: number;
  userId: number;
  items: CreateReturnItemRequest[];
  reason?: string;
  notes?: string;
  refundAmount?: number;
}

export interface UpdateReturnStatusRequest {
  status: ReturnStatus;
  notes?: string;
  refundAmount?: number;
  companyId: number;
}

export interface GetReturnListRequest {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  status?: ReturnStatus;
  clientId?: number;
  originalSaleId?: number;
  startDate?: string;
  endDate?: string;
}

export interface ReturnStatistics {
  totalReturns: number;
  pendingReturns: number;
  completedReturns: number;
  rejectedReturns: number;
  totalRefundAmount: number;
}

// Note: The ProfitLossReport and DashboardSummary interfaces are already defined above
// The backend will return the updated data with returns included

// Label Preset Types - For barcode label printing
export interface LabelPreset {
  id: string;
  companyId: number;
  name: string;
  description?: string;
  labelWidth: number;
  labelHeight: number;
  barcodeHeight: number;
  barcodeWidth: number;
  barcodeFormat: string;
  barcodeFontSize: number;
  showBarcodeText: boolean;
  headerFontSize: number;
  footerFontSize: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelPresetRequest {
  companyId: number;
  name: string;
  description?: string;
  labelWidth: number;
  labelHeight: number;
  barcodeHeight: number;
  barcodeWidth: number;
  barcodeFormat?: string;
  barcodeFontSize?: number;
  showBarcodeText?: boolean;
  headerFontSize?: number;
  footerFontSize?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateLabelPresetRequest {
  companyId: number;
  name?: string;
  description?: string;
  labelWidth?: number;
  labelHeight?: number;
  barcodeHeight?: number;
  barcodeWidth?: number;
  barcodeFormat?: string;
  barcodeFontSize?: number;
  showBarcodeText?: boolean;
  headerFontSize?: number;
  footerFontSize?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface GetLabelPresetsRequest {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
