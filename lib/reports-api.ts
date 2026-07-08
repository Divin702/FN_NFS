import { apiClient } from "./api";
import type { Dossier } from "./dossiers-api";

export interface ReportSummary {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  archived: number;
  totalOfficialFees: number;
  totalNotaryFees: number;
  totalFees: number;
  uniqueClients: number;
  totalDocuments: number;
  totalParties: number;
}

export interface ReportNotary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ReportResponse {
  summary: ReportSummary;
  dossiers: Dossier[];
  notaries: ReportNotary[];
}

export interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  assignedNotaryId?: string;
  serviceId?: string;
}

export const reportsApi = {
  get: (filter: ReportFilter) =>
    apiClient
      .get<ReportResponse, { data: ReportResponse }>("/reports", {
        params: filter,
      })
      .then((r) => r.data),
};
