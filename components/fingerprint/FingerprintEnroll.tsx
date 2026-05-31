"use client";

import { useState } from "react";
import { Fingerprint, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import {
  fingerprintAgent,
  fingerprintApi,
  clientsKeys,
  type Client,
} from "@/lib/clients-api";

type Phase =
  | "idle"
  | "checking"
  | "scanning"
  | "saving"
  | "success"
  | "poor_quality"
  | "error";

interface FingerprintEnrollProps {
  client: Client;
}

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  checking: "Checking scanner...",
  scanning: "Place your finger on the scanner...",
  saving: "Saving fingerprint...",
  success: "Fingerprint enrolled.",
  poor_quality: "",
  error: "",
};

export function FingerprintEnroll({ client }: FingerprintEnrollProps) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [quality, setQuality] = useState<number | null>(null);

  const hasFingerprint = !!client.fingerprintTemplate;
  const busy = phase === "checking" || phase === "scanning" || phase === "saving";

  const saveMutation = useMutation({
    mutationFn: (template: string) => fingerprintApi.save(client.id, template),
    onSuccess: () => {
      setPhase("success");
      queryClient.invalidateQueries({ queryKey: clientsKeys.detail(client.id) });
    },
    onError: () => {
      setPhase("error");
      setErrorMsg("Failed to save fingerprint. Check backend connection.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => fingerprintApi.remove(client.id),
    onSuccess: () => {
      setPhase("idle");
      setQuality(null);
      queryClient.invalidateQueries({ queryKey: clientsKeys.detail(client.id) });
    },
    onError: () => {
      setPhase("error");
      setErrorMsg("Failed to remove fingerprint.");
    },
  });

  async function handleEnroll() {
    setPhase("checking");
    setErrorMsg("");
    setQuality(null);

    try {
      const status = await fingerprintAgent.status();
      if (!status.ready) {
        setPhase("error");
        setErrorMsg(status.message || "Scanner not ready.");
        return;
      }
    } catch {
      setPhase("error");
      setErrorMsg("Cannot reach fingerprint agent on localhost:9000. Make sure it is running on this Windows machine.");
      return;
    }

    setPhase("scanning");

    try {
      const result = await fingerprintAgent.capture(15000);
      setQuality(result.quality);
      setPhase("saving");
      saveMutation.mutate(result.template);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setPhase("error");
        setErrorMsg("Scan timed out (15 s). Please try again.");
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("poor")) {
        setPhase("poor_quality");
        setErrorMsg(msg);
      } else {
        setPhase("error");
        setErrorMsg(msg || "Scan failed. Try again.");
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Status row */}
      <div className="flex items-center gap-2">
        {hasFingerprint && phase !== "error" ? (
          <CheckCircle size={18} className="text-green-500 shrink-0" />
        ) : (
          <Fingerprint size={18} className="text-gray-400 shrink-0" />
        )}
        <span className="text-sm text-gray-600">
          {hasFingerprint ? "Fingerprint enrolled" : "No fingerprint enrolled"}
        </span>
        {quality !== null && phase === "success" && (
          <span className="text-xs text-gray-400 ml-1">(quality {quality}/100)</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={hasFingerprint ? "outline" : "primary"}
          loading={busy}
          leftIcon={<Fingerprint size={14} />}
          onClick={handleEnroll}
          disabled={busy || removeMutation.isPending}
        >
          {busy
            ? PHASE_LABEL[phase]
            : hasFingerprint
            ? "Re-enroll"
            : "Enroll Fingerprint"}
        </Button>

        {hasFingerprint && (
          <Button
            size="sm"
            variant="danger"
            loading={removeMutation.isPending}
            onClick={() => removeMutation.mutate()}
            disabled={busy}
          >
            Remove
          </Button>
        )}
      </div>

      {/* Feedback messages */}
      {phase === "poor_quality" && (
        <p className="text-xs flex items-center gap-1 text-amber-600">
          <AlertTriangle size={13} />
          {errorMsg} — place your finger flat and try again.
        </p>
      )}
      {phase === "error" && (
        <p className="text-xs flex items-center gap-1 text-red-500">
          <XCircle size={13} />
          {errorMsg}
        </p>
      )}
      {phase === "scanning" && (
        <p className="text-xs text-gray-400 animate-pulse">
          Waiting for finger... (times out in 15 s)
        </p>
      )}
    </div>
  );
}
