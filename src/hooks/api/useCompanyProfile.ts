import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService, CompanyProfile, UpdateCompanyData } from "../../services/companyService";
import toast from "react-hot-toast";

// Get company profile
export const useCompanyProfile = (companyId: number) => {
  return useQuery({
    queryKey: ["companyProfile", companyId],
    queryFn: () => companyService.getProfile(companyId),
    enabled: !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update company profile
export const useUpdateCompanyProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      logoFile,
    }: {
      data: UpdateCompanyData;
      logoFile?: File;
    }) => companyService.updateProfile(data, logoFile),
    onSuccess: (result, variables) => {
      // Invalidate and refetch company profile
      queryClient.invalidateQueries({
        queryKey: ["companyProfile", variables.data.companyId],
      });
      toast.success(result.message || "تم تحديث بيانات الشركة بنجاح");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "حدث خطأ أثناء تحديث بيانات الشركة";
      toast.error(message);
    },
  });
};

export default useCompanyProfile;
