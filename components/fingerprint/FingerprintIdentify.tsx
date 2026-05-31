"use client";

import { useState } from "react";
import { Fingerprint, XCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { fingerprintAgent } from "@/lib/clients-api";
import { getToken } from "@/lib/auth";

type Phase = "idle" | "scanning" | "matching" | "error";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Identify by Fingerprint",
  scanning: "Place finger on scanner...",
  matching: "Searching client...",
  error: "Identify by Fingerprint",
};

export function FingerprintIdentify() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [poor, setPoor] = useState(false);

  const busy = phase === "scanning" || phase === "matching";

  async function handleIdentify() {
    const token = getToken();
    if (!token) {
      setPhase("error");
      setErrorMsg("Not authenticated.");
      return;
    }

    setPhase("scanning");
    setErrorMsg("");
    setPoor(false);

    try {
      // Agent: scan + fetch templates from backend + ARATEK SDK match
      const result = await fingerprintAgent.identify(BACKEND_URL, token, 20000);
      setPhase("matching");

      if (result.matched && result.clientId) {
        router.push(`/dashboard/clients/${result.clientId}`);
      } else {
        setPhase("error");
        setErrorMsg("No matching client found.");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setPhase("error");
        setErrorMsg("Timed out (20 s). Try again.");
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("poor") || msg.toLowerCase().includes("quality")) {
        setPoor(true);
      }
      setPhase("error");
      setErrorMsg(msg || "Identify failed.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        loading={busy}
        leftIcon={busy ? undefined : <Fingerprint size={14} />}
        onClick={handleIdentify}
        disabled={busy}
      >
        {PHASE_LABEL[phase]}
      </Button>

      {phase === "scanning" && (
        <p className="text-xs text-gray-400 animate-pulse">
          Waiting for finger... (20 s timeout)
        </p>
      )}

      {phase === "error" && (
        <p className={`text-xs flex items-center gap-1 ${poor ? "text-amber-600" : "text-red-500"}`}>
          {poor ? <AlertTriangle size={13} /> : <XCircle size={13} />}
          {errorMsg}
          {poor && " — place flat and try again."}
        </p>
      )}
    </div>
  );
}
