"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  FolderOpen,
  Phone,
  Mail,
  Camera,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { clientsApi, clientsKeys } from "@/lib/clients-api";
import { dossiersApi, dossiersKeys, type DossierStatus } from "@/lib/dossiers-api";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<DossierStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  archived: { label: "Archived", className: "bg-gray-100 text-gray-600" },
};

function StatusBadge({ status }: { status: DossierStatus }) {
  const cfg = STATUS_BADGE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function DossierSkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-36 bg-surface rounded" />
        <div className="h-5 w-20 bg-surface rounded-full" />
      </div>
      <div className="h-3 w-24 bg-surface rounded" />
      <div className="h-3 w-full bg-surface rounded" />
      <div className="h-3 w-5/6 bg-surface rounded" />
      <div className="h-8 w-28 bg-surface rounded-md" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: client,
    isLoading: clientLoading,
    isError: clientError,
  } = useQuery({
    queryKey: clientsKeys.detail(id),
    queryFn: () => clientsApi.getOne(id),
    enabled: !!id,
  });

  const {
    data: dossiersData,
    isLoading: dossiersLoading,
  } = useQuery({
    queryKey: [...dossiersKeys.lists(), { clientId: id }],
    queryFn: () => dossiersApi.list({ clientId: id } as Parameters<typeof dossiersApi.list>[0]),
    enabled: !!id,
  });

  const dossiers = dossiersData?.data ?? [];

  // ── Loading state ──
  if (clientLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="Client" />
        <main className="flex-1 p-5 sm:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-4 w-24 bg-surface rounded animate-pulse" />
            <div className="rounded-xl border border-border bg-white p-6 animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-surface shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-48 bg-surface rounded" />
                  <div className="h-3 w-32 bg-surface rounded" />
                  <div className="h-3 w-40 bg-surface rounded" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-28 bg-surface rounded animate-pulse" />
              <DossierSkeletonCard />
              <DossierSkeletonCard />
              <DossierSkeletonCard />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Error / not found ──
  if (clientError || !client) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="Client" />
        <main className="flex-1 p-5 sm:p-6 overflow-auto flex items-center justify-center">
          <div className="text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-xl bg-surface text-muted mb-4">
              <FolderOpen size={28} />
            </div>
            <p className="text-sm font-semibold text-foreground">Client not found</p>
            <p className="text-sm text-muted mt-1 mb-4">
              This client may have been deleted or does not exist.
            </p>
            <Link href="/dashboard/clients">
              <Button size="sm" variant="outline" leftIcon={<ChevronLeft size={14} />}>
                Back to Clients
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Client Detail" />

      <main className="flex-1 p-5 sm:p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Back link */}
          <Link
            href="/dashboard/clients"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={15} />
            Clients
          </Link>

          {/* ── Client info card ── */}
          <div className="rounded-xl border border-border bg-white p-6">
            <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
              {/* Avatar */}
              <div className="shrink-0">
                {client.photoUrl ? (
                  <div className="h-20 w-20 rounded-full overflow-hidden border border-border">
                    <Image
                      src={client.photoUrl}
                      alt={`${client.firstName} ${client.lastName}`}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-brand-100 border border-border flex flex-col items-center justify-center gap-1">
                    <span className="text-xl font-bold text-brand-600">
                      {initials(client.firstName, client.lastName)}
                    </span>
                    <Camera size={12} className="text-brand-400" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {client.firstName} {client.lastName}
                </h2>
                <p className="text-sm font-mono text-muted tracking-wide">
                  {client.nationalId}
                </p>

                <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1">
                  {client.phone && (
                    <span className="flex items-center gap-1.5 text-sm text-muted">
                      <Phone size={13} />
                      {client.phone}
                    </span>
                  )}
                  {client.email && (
                    <span className="flex items-center gap-1.5 text-sm text-muted">
                      <Mail size={13} />
                      {client.email}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted pt-0.5">
                  Registered {formatDate(client.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* ── Dossiers section ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Dossiers</h3>
              {!dossiersLoading && (
                <span className="inline-flex items-center rounded-full bg-brand-50 border border-brand-200 text-brand-700 px-2 py-0.5 text-xs font-medium">
                  {dossiers.length}
                </span>
              )}
            </div>

            {dossiersLoading ? (
              <div className="space-y-4">
                <DossierSkeletonCard />
                <DossierSkeletonCard />
                <DossierSkeletonCard />
              </div>
            ) : dossiers.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No dossiers yet"
                description="This client hasn't been involved in any dossier."
              />
            ) : (
              <div className="space-y-4">
                {dossiers.map((dossier) => {
                  // Find this client's role in the dossier
                  const clientParty = dossier.parties.find(
                    (p) => p.clientId === id,
                  );

                  return (
                    <div
                      key={dossier.id}
                      className="rounded-xl border border-border bg-white p-5 space-y-3"
                    >
                      {/* Top row: number + status */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-semibold font-mono text-foreground">
                            {dossier.number}
                          </span>
                          <StatusBadge status={dossier.status} />
                          {clientParty && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                              {clientParty.roleLabel}
                            </span>
                          )}
                        </div>
                        {dossier.totalFee != null && (
                          <span className="text-sm font-medium text-foreground shrink-0">
                            {dossier.totalFee.toLocaleString()} RWF
                          </span>
                        )}
                      </div>

                      {/* Service name */}
                      {dossier.serviceName && (
                        <p className="text-sm text-muted">{dossier.serviceName}</p>
                      )}

                      {/* Parties */}
                      {dossier.parties.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {dossier.parties.map((party) => (
                            <span
                              key={party.id}
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                                party.clientId === id
                                  ? "bg-brand-50 text-brand-700 border-brand-200"
                                  : "bg-surface text-muted border-border",
                              )}
                            >
                              {party.roleLabel}:{" "}
                              {party.client.firstName} {party.client.lastName}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-muted">
                        {dossier.assignedNotary && (
                          <span>
                            Notary:{" "}
                            {dossier.assignedNotary.firstName}{" "}
                            {dossier.assignedNotary.lastName}
                          </span>
                        )}
                        <span>Created {formatDate(dossier.createdAt)}</span>
                      </div>

                      {/* Open dossier button */}
                      <div>
                        <Link href={`/dashboard/dossiers/${dossier.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            rightIcon={<ExternalLink size={13} />}
                          >
                            Open Dossier
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
