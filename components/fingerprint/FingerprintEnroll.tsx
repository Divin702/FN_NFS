"use client";

import { useState } from "react";
import { Fingerprint, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { fingerprintApi, clientsKeys, type Client } from "@/lib/clients-api";
import { enrollFingerprint, getDeviceStatus, ENROLL_CAPTURES } from "@/lib/digitalpersona";

type Phase = "idle" | "checking" | "scanning" | "saving" | "success" | "poor_quality" | "error";

interface FingerprintEnrollProps {
  client: Client;
}

export function FingerprintEnroll({ client }: FingerprintEnrollProps) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [quality, setQuality] = useState<number | null>(null);

  const [localEnrolled, setLocalEnrolled] = useState<boolean | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const hasFingerprint = localEnrolled ?? !!client.fingerprintTemplate;

  const busy = phase === "checking" || phase === "scanning" || phase === "saving";

  const saveMutation = useMutation({
    mutationFn: (template: string) => fingerprintApi.save(client.id, template),
    onSuccess: () => {
      setLocalEnrolled(true);
      setPhase("success");
      queryClient.invalidateQueries({ queryKey: clientsKeys.detail(client.id) });
      setTimeout(() => setPhase("idle"), 3000);
    },
    onError: () => {
      setPhase("error");
      setErrorMsg("Failed to save fingerprint. Check backend connection.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => fingerprintApi.remove(client.id),
    onSuccess: () => {
      setLocalEnrolled(false);
      setPhase("idle");
      setQuality(null);
      setConfirmRemove(false);
      queryClient.invalidateQueries({ queryKey: clientsKeys.detail(client.id) });
    },
    onError: () => {
      setConfirmRemove(false);
      setPhase("error");
      setErrorMsg("Failed to remove fingerprint.");
    },
  });

  async function handleEnroll() {
    setPhase("checking");
    setErrorMsg("");
    setQuality(null);

    const status = await getDeviceStatus();
    if (!status.ready) {
      setPhase("error");
      setErrorMsg(status.message);
      return;
    }

    setPhase("scanning");

    try {
      const result = await enrollFingerprint();
      setPhase("saving");
      saveMutation.mutate(result.template);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("poor") || msg.toLowerCase().includes("quality")) {
        setPhase("poor_quality");
      } else {
        setPhase("error");
      }
      setErrorMsg(msg || "Scan failed. Try again.");
    }
  }

  const buttonLabel = () => {
    if (phase === "checking") return "Checking device...";
    if (phase === "scanning") return `Scanning — ${ENROLL_CAPTURES} placements...`;
    if (phase === "saving") return "Saving...";
    return hasFingerprint ? "Re-enroll" : "Enroll Fingerprint";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {hasFingerprint ? (
          <CheckCircle size={18} className="text-emerald-500 shrink-0" />
        ) : (
          <Fingerprint size={18} className="text-gray-400 shrink-0" />
        )}
        <span className="text-sm text-gray-600">
          {hasFingerprint ? "Fingerprint enrolled" : "No fingerprint enrolled"}
        </span>
        {quality !== null && phase === "success" && (
          <span className="text-xs text-gray-400">(quality {quality}/100)</span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={hasFingerprint ? "outline" : "primary"}
          loading={busy}
          leftIcon={<Fingerprint size={14} />}
          onClick={handleEnroll}
          disabled={busy || removeMutation.isPending}
        >
          {buttonLabel()}
        </Button>

        {hasFingerprint && (
          <Button
            size="sm"
            variant="danger"
            loading={removeMutation.isPending}
            onClick={() => setConfirmRemove(true)}
            disabled={busy}
          >
            Remove
          </Button>
        )}
      </div>

      {phase === "scanning" && (
        <p className="text-xs text-gray-400 animate-pulse">
          Place your finger on the reader {ENROLL_CAPTURES} times — lift and press again
          after each beep. Keep going until this message disappears.
        </p>
      )}
      {phase === "success" && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle size={13} /> Fingerprint enrolled successfully.
        </p>
      )}
      {phase === "poor_quality" && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle size={13} />
          {errorMsg} — place your finger flat and try again.
        </p>
      )}
      {phase === "error" && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <XCircle size={13} /> {errorMsg}
        </p>
      )}

      <ConfirmModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => removeMutation.mutate()}
        tone="danger"
        icon={Fingerprint}
        title="Remove this fingerprint?"
        confirmLabel="Remove fingerprint"
        loading={removeMutation.isPending}
        description={
          <>
            {client.firstName} {client.lastName} will no longer be identifiable by
            fingerprint. Re-enrolling means scanning their finger {ENROLL_CAPTURES}{" "}
            more times, so they need to be physically present.
          </>
        }
      />
    </div>
  );
}
