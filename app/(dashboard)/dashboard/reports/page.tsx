"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileBarChart2,
  Download,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { reportsApi, type ReportFilter } from "@/lib/reports-api";
import { notaryServicesApi } from "@/lib/notary-services-api";
import { getUser } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { RichSelect } from "@/components/ui/RichSelect";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
} from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-RW") + " RWF";
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  archived: "bg-gray-100 text-gray-500",
};

// ── page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const currentUser = getUser();
  const isAdmin = currentUser?.role === "administrator";

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filter, setFilter] = useState<ReportFilter>({
    dateFrom: thirtyDaysAgoStr(),
    dateTo: todayStr(),
  });

  const [applied, setApplied] = useState<ReportFilter>({
    dateFrom: thirtyDaysAgoStr(),
    dateTo: todayStr(),
  });

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["reports", applied],
    queryFn: () => reportsApi.get(applied),
  });

  const { data: servicesData } = useQuery({
    queryKey: ["notary-services-report"],
    queryFn: () => notaryServicesApi.list({ isActive: true, limit: 200 }),
  });

  const isDirty =
    filter.dateFrom !== applied.dateFrom ||
    filter.dateTo !== applied.dateTo ||
    filter.status !== applied.status ||
    filter.assignedNotaryId !== applied.assignedNotaryId ||
    filter.serviceId !== applied.serviceId;

  const summary = data?.summary;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dossiers = data?.dossiers ?? [];
  const notaries = data?.notaries ?? [];
  const services = servicesData?.data ?? [];

  const hasFilter =
    !!applied.status ||
    !!applied.assignedNotaryId ||
    !!applied.serviceId ||
    applied.dateFrom !== thirtyDaysAgoStr() ||
    applied.dateTo !== todayStr();

  function applyFilters() {
    setApplied({ ...filter });
  }

  function clearFilters() {
    const reset: ReportFilter = {
      dateFrom: thirtyDaysAgoStr(),
      dateTo: todayStr(),
    };
    setFilter(reset);
    setApplied(reset);
  }

  // ── export helpers ──────────────────────────────────────────────────────────

  const exportRows = useMemo(
    () =>
      dossiers.map((d) => ({
        "Dossier #": d.number,
        Client: d.client ? `${d.client.firstName} ${d.client.lastName}` : "—",
        "National ID": d.client?.nationalId ?? "—",
        Service: d.serviceName ?? d.serviceType ?? "—",
        "Assigned Notary": d.assignedNotary
          ? `${d.assignedNotary.firstName} ${d.assignedNotary.lastName}`
          : "—",
        Status: STATUS_LABELS[d.status] ?? d.status,
        Documents: d.documents?.length ?? 0,
        "Official Fee (RWF)": d.officialFee ?? 0,
        "Notary Fee (RWF)": d.notaryFee ?? 0,
        "Total Fee (RWF)": d.totalFee ?? 0,
        "Created Date": fmtDate(d.createdAt),
      })),
    [dossiers],
  );

  function exportCSV() {
    if (!exportRows.length) return;
    const headers = Object.keys(exportRows[0]);
    const rows = exportRows.map((r) =>
      headers
        .map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? ""))
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nfs-report-${applied.dateFrom ?? "all"}-to-${applied.dateTo ?? "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportXLSX() {
    if (!exportRows.length) return;

    const exportedBy = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim() ||
        currentUser.email
      : "System";
    const exportDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);

    // Append footer rows after the data
    const dataLen = exportRows.length + 1;
    const footerStartRow = dataLen + 2;

    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [],
        ["Prepared and Generated by:", exportedBy],
        ["Signature:", "___________________________"],
        ["Date:", exportDate],
      ],
      { origin: { r: footerStartRow, c: 0 } },
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dossiers Report");
    XLSX.writeFile(
      wb,
      `nfs-report-${applied.dateFrom ?? "all"}-to-${applied.dateTo ?? "all"}.xlsx`,
    );
  }

  async function exportPDF() {
    const exportedBy = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim() ||
        currentUser.email
      : "System";
    // Only a notary's report carries a company name — an admin's report is NFS itself.
    const companyName = isAdmin ? "" : (currentUser?.organization ?? "").trim();
    const exportDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Pre-load logo image
    let logoDataUrl: string | null = null;
    try {
      const resp = await fetch("/loggo.png");
      const blob = await resp.blob();
      logoDataUrl = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      // skip logo if unavailable
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    const W = doc.internal.pageSize.getWidth();

    const BRAND = [16, 48, 96] as [number, number, number];
    const TINT = [232, 239, 250] as [number, number, number];
    const WHITE = [255, 255, 255] as [number, number, number];
    const DARK = [28, 35, 48] as [number, number, number];
    const MID = [90, 100, 118] as [number, number, number];

    // ── header (white background — default PDF bg) ────────────────────────────

    // Logo image — top left
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", 8, 3, 20, 20);
    }

    // Company name below logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);

    // Center block — large "NFS" + optional company name + subtitle
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...BRAND);
    doc.text("NFS", W / 2, companyName ? 10 : 12, { align: "center" });

    if (companyName) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(companyName, W / 2, 16, { align: "center" });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text("Dossier Report", W / 2, companyName ? 22 : 20, {
      align: "center",
    });

    // Right block — report period
    const RX = W - 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...BRAND);
    doc.text("REPORT PERIOD", RX, 8, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(fmtDate(applied.dateFrom), RX, 15, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MID);
    doc.text("—", RX, 20.5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(fmtDate(applied.dateTo), RX, 26.5, { align: "right" });

    // Separator line
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.7);
    doc.line(8, 32, W - 8, 32);

    // ── dossier table ─────────────────────────────────────────────────────────
    const tableStartY = 37;

    autoTable(doc, {
      startY: tableStartY,
      margin: { left: 10, right: 10 },
      head: [
        [
          "#",
          "Dossier #",
          "Client",
          "National ID",
          "Service",
          "Notary",
          "Status",
          "Docs",
          "Official Fee",
          "Notary Fee",
          "Total Fee",
          "Date",
        ],
      ],
      body: exportRows.map((r, idx) => [
        idx + 1,
        r["Dossier #"],
        r["Client"],
        r["National ID"],
        r["Service"],
        r["Assigned Notary"],
        r["Status"],
        r["Documents"],
        (r["Official Fee (RWF)"] as number).toLocaleString("en-RW"),
        (r["Notary Fee (RWF)"] as number).toLocaleString("en-RW"),
        (r["Total Fee (RWF)"] as number).toLocaleString("en-RW"),
        r["Created Date"],
      ]),
      headStyles: {
        fillColor: BRAND,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: TINT },
      bodyStyles: { fontSize: 7, textColor: DARK },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 22 },
        4: { cellWidth: 28 },
        7: { halign: "center", cellWidth: 12 },
        8: { halign: "right", cellWidth: 26, fontStyle: "bold" },
        9: { halign: "right", cellWidth: 22 },
      },
      foot: exportRows.length
        ? [
            [
              "",
              "",
              "",
              "",
              "",
              "",
              "TOTAL",
              "",
              exportRows
                .reduce((s, r) => s + (r["Official Fee (RWF)"] as number), 0)
                .toLocaleString("en-RW"),
              exportRows
                .reduce((s, r) => s + (r["Notary Fee (RWF)"] as number), 0)
                .toLocaleString("en-RW"),
              exportRows
                .reduce((s, r) => s + (r["Total Fee (RWF)"] as number), 0)
                .toLocaleString("en-RW"),
              "",
            ],
          ]
        : undefined,
      footStyles: {
        fillColor: BRAND,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 7.5,
      },
      showFoot: "lastPage",
    });

    const H = doc.internal.pageSize.getHeight();
    const tableEndY = (doc as unknown as { lastAutoTable: { finalY: number } })
      .lastAutoTable.finalY;
    const footerY = Math.min(tableEndY + 10, H - 42);

    // Divider line
    doc.setDrawColor(...MID);
    doc.setLineWidth(0.3);
    doc.line(12, footerY, W - 12, footerY);

    const col1 = 12;
    const lineLen = W / 2 - 20;

    // Prepared & Generated by (with signature line)
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Prepared & Generated by:", col1, footerY + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    doc.text(exportedBy, col1, footerY + 14);

    // Signature line
    doc.setDrawColor(...MID);
    doc.setLineWidth(0.4);
    doc.line(col1, footerY + 24, col1 + lineLen, footerY + 24);
    doc.setFontSize(6.5);
    doc.setTextColor(...MID);
    doc.text("Signature", col1, footerY + 28);

    // Date
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Date:", col1, footerY + 36);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    doc.text(exportDate, col1 + 12, footerY + 36);

    doc.save(
      `nfs-report-${applied.dateFrom ?? "all"}-to-${applied.dateTo ?? "all"}.pdf`,
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Reports" />

      <main className="flex-1 p-5 sm:p-6 overflow-auto space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
              <FileBarChart2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-none">
                Dossier Report
              </h2>
              <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                {isFetching && (
                  <Loader2 size={11} className="animate-spin shrink-0" />
                )}
                {isLoading
                  ? "Loading…"
                  : `${dossiers.length} dossier${dossiers.length !== 1 ? "s" : ""} in selected period`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Download size={13} />}
              onClick={exportCSV}
              disabled={!dossiers.length}
            >
              CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FileSpreadsheet size={13} />}
              onClick={exportXLSX}
              disabled={!dossiers.length}
            >
              XLSX
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FileText size={13} />}
              onClick={exportPDF}
              disabled={!dossiers.length}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              PDF
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          {/* Toggle header */}
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-surface transition-colors"
          >
            <SlidersHorizontal size={14} className="text-muted shrink-0" />
            <span className="text-sm font-medium text-foreground">Filters</span>
            {hasFilter && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white leading-none">
                {[
                  applied.status,
                  applied.serviceId,
                  applied.assignedNotaryId,
                ].filter(Boolean).length +
                  (applied.dateFrom !== thirtyDaysAgoStr() ||
                  applied.dateTo !== todayStr()
                    ? 1
                    : 0)}
              </span>
            )}
            <ChevronDown
              size={14}
              className={cn(
                "ml-auto text-muted transition-transform duration-200",
                filtersOpen && "rotate-180",
              )}
            />
          </button>

          {/* Collapsible body */}
          {filtersOpen && (
            <div className="px-4 pt-3 pb-4 border-t border-border">
              <div
                className={cn(
                  "grid gap-3 items-end",
                  isAdmin
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-7"
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
                )}
              >
                <Input
                  label="Date From"
                  type="date"
                  value={filter.dateFrom ?? ""}
                  max={filter.dateTo ?? todayStr()}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, dateFrom: e.target.value }))
                  }
                />
                <Input
                  label="Date To"
                  type="date"
                  value={filter.dateTo ?? ""}
                  min={filter.dateFrom}
                  max={todayStr()}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, dateTo: e.target.value }))
                  }
                />
                <Select
                  label="Status"
                  value={filter.status ?? ""}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      status: e.target.value || undefined,
                    }))
                  }
                  options={[
                    { value: "", label: "All statuses" },
                    { value: "open", label: "Open" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "completed", label: "Completed" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
                <Select
                  label="Service"
                  value={filter.serviceId ?? ""}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      serviceId: e.target.value || undefined,
                    }))
                  }
                  options={[
                    { value: "", label: "All services" },
                    ...services.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                />
                {isAdmin && (
                  <RichSelect
                    label="Notary"
                    placeholder="All notaries"
                    searchable
                    value={filter.assignedNotaryId ?? ""}
                    onChange={(val) =>
                      setFilter((f) => ({
                        ...f,
                        assignedNotaryId: val || undefined,
                      }))
                    }
                    disabled={isLoading}
                    options={[
                      { value: "", label: "All notaries" },
                      ...notaries.map((n) => ({
                        value: n.id,
                        label: `${n.firstName} ${n.lastName}`,
                      })),
                    ]}
                  />
                )}
                <Button
                  size="sm"
                  className={cn(
                    isDirty && "ring-2 ring-brand-400 ring-offset-1",
                  )}
                  onClick={applyFilters}
                >
                  {isDirty ? "Apply ●" : "Apply"}
                </Button>
                {hasFilter && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-red-600 transition-colors h-10 rounded-md border border-border px-3 bg-white"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error state */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Failed to load report data. Check your connection and try again.
          </div>
        )}

        {/* Dossiers table */}
        <div
          className={cn(
            "rounded-xl border border-border bg-white overflow-hidden relative",
            isFetching && !isLoading && "opacity-60 pointer-events-none",
          )}
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Dossier Details
            </h3>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Dossier #</TableTh>
                <TableTh>Client</TableTh>
                <TableTh className="hidden md:table-cell">Service</TableTh>
                <TableTh className="hidden lg:table-cell">Notary</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="hidden xl:table-cell text-center">
                  Docs
                </TableTh>
                <TableTh className="hidden xl:table-cell">Official Fee</TableTh>
                <TableTh className="hidden xl:table-cell">Notary Fee</TableTh>
                <TableTh className="hidden lg:table-cell">Total</TableTh>
                <TableTh className="hidden md:table-cell">Date</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableTd colSpan={10} className="p-0">
                    <TableSkeleton rows={6} cols={9} />
                  </TableTd>
                </TableRow>
              ) : dossiers.length === 0 ? (
                <TableRow>
                  <TableTd colSpan={10} className="p-0">
                    <EmptyState
                      icon={FileBarChart2}
                      title="No dossiers in this period"
                      description="Adjust the date range or filters above to see results."
                    />
                  </TableTd>
                </TableRow>
              ) : (
                dossiers.map((d) => (
                  <TableRow key={d.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {d.number}
                    </TableTd>

                    <TableTd>
                      {d.client ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {d.client.firstName} {d.client.lastName}
                          </p>
                          <p className="text-xs text-muted font-mono">
                            {d.client.nationalId}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">
                          No client
                        </span>
                      )}
                    </TableTd>

                    <TableTd className="hidden md:table-cell text-xs text-muted">
                      {d.serviceName ?? d.serviceType ?? "—"}
                    </TableTd>

                    <TableTd className="hidden lg:table-cell text-xs text-muted">
                      {d.assignedNotary
                        ? `${d.assignedNotary.firstName} ${d.assignedNotary.lastName}`
                        : "—"}
                    </TableTd>

                    <TableTd>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_COLORS[d.status] ??
                            "bg-gray-100 text-gray-500",
                        )}
                      >
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                    </TableTd>

                    <TableTd className="hidden xl:table-cell text-center text-xs text-muted">
                      {d.documents?.length ?? 0}
                    </TableTd>

                    <TableTd className="hidden xl:table-cell text-xs text-muted">
                      {d.officialFee != null ? fmt(d.officialFee) : "—"}
                    </TableTd>

                    <TableTd className="hidden xl:table-cell text-xs text-muted">
                      {d.notaryFee != null ? fmt(d.notaryFee) : "—"}
                    </TableTd>

                    <TableTd className="hidden lg:table-cell text-sm font-semibold text-foreground">
                      {d.totalFee != null ? fmt(d.totalFee) : "—"}
                    </TableTd>

                    <TableTd className="hidden md:table-cell text-xs text-muted">
                      {fmtDate(d.createdAt)}
                    </TableTd>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Fee totals footer */}
          {!isLoading && summary && dossiers.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-surface flex items-center justify-end gap-8 text-sm">
              <span className="text-muted">
                Official Fees:{" "}
                <strong className="text-foreground">
                  {fmt(summary.totalOfficialFees)}
                </strong>
              </span>
              <span className="text-muted">
                Notary Fees:{" "}
                <strong className="text-foreground">
                  {fmt(summary.totalNotaryFees)}
                </strong>
              </span>
              <span className="text-muted">
                Total Revenue:{" "}
                <strong className="text-emerald-600 text-base">
                  {fmt(summary.totalFees)}
                </strong>
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
