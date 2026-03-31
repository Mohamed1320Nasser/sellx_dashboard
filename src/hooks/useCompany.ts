import { useSessionAuthStore } from "../stores/sessionAuthStore";

/**
 * Company data structure returned by useCompany hook
 */
export interface CompanyData {
  id: number;
  name: string;
  status: string;
  companyId: number; // For backward compatibility
  company: {
    id: number;
    name: string;
    status: string;
  };
}

/**
 * Hook for easy access to company data across the application
 * Use this hook in components that need company information for:
 * - PDFs and receipts
 * - Documents and reports
 * - Display in UI (header, footer, etc.)
 *
 * The company object supports multiple access patterns:
 * - company?.id (new pattern)
 * - company?.companyId (backward compatible)
 * - company?.name (new pattern)
 * - company?.company?.name (backward compatible)
 */
export const useCompany = () => {
  const { company } = useSessionAuthStore();

  return {
    // Company ID for API calls (supports both patterns)
    companyId: company?.id || company?.companyId || 0,

    // Company name for display (PDFs, receipts, headers)
    companyName: company?.name || company?.company?.name || "",

    // Company status
    companyStatus: company?.status || "",

    // Full company object if needed
    company: company as CompanyData | null,

    // Helper to check if company data is available
    hasCompany: !!(company?.id || company?.companyId),
  };
};

export default useCompany;
