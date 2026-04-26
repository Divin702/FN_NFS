import { api } from "./api";

export const authApi = {
  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>("/auth/reset-password", { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>("/auth/change-password", {
      currentPassword,
      newPassword,
    }),

  inviteUser: (data: {
    firstName: string;
    lastName: string;
    email: string;
    nationalId: string;
    phoneNumber: string;
    role: "legal_clerk" | "notary_public" | "administrator";
    organization?: string;
  }) => api.post<{ message: string }>("/auth/invite", data),
};
