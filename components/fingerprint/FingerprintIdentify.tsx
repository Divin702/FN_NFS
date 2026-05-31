"use client";

import { useState } from "react";
import { Fingerprint, XCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { fingerprintAgent } from "@/lib/clients-api";
import { getToken } from "@/lib/auth";

type Phase = "idle" | "busy" | "error";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function FingerprintIdentify() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [poor, setPoor] = useState(false);

  async function handleIdentify() {
    const token = getToken();
    if (!token) {
      setPhase("error");
      setErrorMsg("Not authenticated.");
      return;
    }

    setPhase("busy");
    setStatusMsg("Place finger on scanner...");
    setErrorMsg("");
    setPoor(false);

    try {
      const result = await fingerprintAgent.identify(BACKEND_URL, token, 20000);

      if (result.matched && result.clientId) {
        setStatusMsg("Client found — opening...");
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
        loading={phase === "busy"}
        leftIcon={phase !== "busy" ? <Fingerprint size={14} /> : undefined}
        onClick={handleIdentify}
        disabled={phase === "busy"}
      >
        {phase === "busy" ? statusMsg : "Identify by Fingerprint"}
      </Button>

      {phase === "error" && (
        <p
          className={`text-xs flex items-center gap-1 ${
            poor ? "text-amber-600" : "text-red-500"
          }`}
        >
          {poor ? <AlertTriangle size={13} /> : <XCircle size={13} />}
          {errorMsg}
          {poor && " — place flat and try again."}
        </p>
      )}
    </div>
  );
}
