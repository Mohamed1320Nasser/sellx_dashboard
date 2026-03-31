import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { userManagementService } from "../../services/userManagementService";
import { handleApiError } from "../../utils/errorHandler";
import toast from "react-hot-toast";

// System Users (for System Admins)
export const useSystemUsers = (params: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["system-users", params],
    queryFn: () => userService.getList(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateSystemUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, profileFile }: { data: any; profileFile?: File }) =>
      userService.create(data, profileFile),
    onSuccess: () => {
      // Invalidate ALL system-users queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["system-users"] });
      toast.success("تم إنشاء المستخدم بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Company Users
export const useCompanyUsers = (params: {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  role?: "CASHIER" | "MANAGER" | "ADMIN";
}) => {
  return useQuery({
    queryKey: ["company-users", params],
    queryFn: () => userManagementService.getCompanyUsers(params),
    enabled: !!params.companyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCompanyUser = (userId: number, companyId: number) => {
  return useQuery({
    queryKey: ["company-user", userId, companyId],
    queryFn: () => userManagementService.getCompanyUser(userId, companyId),
    enabled: !!userId && !!companyId,
  });
};

export const useCreateCompanyUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userManagementService.createCompanyUser,
    onSuccess: () => {
      // Invalidate ALL company-users queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast.success("تم إنشاء المستخدم بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userManagementService.inviteUser,
    onSuccess: () => {
      // Invalidate ALL company-users queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast.success("تم إرسال الدعوة بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useUpdateCompanyUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      userManagementService.editCompanyUser(userId, data),
    onSuccess: (_, variables) => {
      // Invalidate ALL company-users queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      queryClient.invalidateQueries({ queryKey: ["company-user", variables.userId] });
      toast.success("تم تحديث المستخدم بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useChangeUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      userManagementService.changeUserRole(userId, data),
    onSuccess: () => {
      // Invalidate ALL company-users queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast.success("تم تغيير الدور بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      companyId,
      action,
    }: {
      userId: number;
      companyId: number;
      action: "activate" | "deactivate";
    }) => {
      return action === "activate"
        ? userManagementService.activateUser(userId, companyId)
        : userManagementService.deactivateUser(userId, companyId);
    },
    onSuccess: (_, variables) => {
      // Invalidate ALL company-users queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast.success(
        variables.action === "activate"
          ? "تم تفعيل المستخدم بنجاح"
          : "تم إلغاء تفعيل المستخدم بنجاح"
      );
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useRemoveUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      companyId,
    }: {
      userId: number;
      companyId: number;
    }) => userManagementService.removeUser(userId, companyId),
    onSuccess: () => {
      // Invalidate ALL company-users queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast.success("تم إزالة المستخدم بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};
