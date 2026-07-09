"use client";

import { useState } from "react";
import { Fingerprint, XCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { fingerprintApi } from "@/lib/clients-api";
import { captureSample, getDeviceStatus } from "@/lib/digitalpersona";

type Phase = "idle" | "checking" | "scanning" | "matching" | "found" | "error";

export function FingerprintIdentify() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [poor, setPoor] = useState(false);
  const [deviceReady, setDeviceReady] = useState<boolean | null>(null);

  const busy = phase === "checking" || phase === "scanning" || phase === "matching";

  async function handleIdentify() {
    setPhase("checking");
    setErrorMsg("");
    setPoor(false);

    const status = await getDeviceStatus();
    setDeviceReady(status.ready);

    if (!status.ready) {
      setPhase("error");
      setErrorMsg(status.message);
      return;
    }

    setPhase("scanning");

    let sampleData: string;
    try {
      const sample = await captureSample("Intermediate", 20000);
      sampleData = sample.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("poor") || msg.toLowerCase().includes("quality")) {
        setPoor(true);
      }
      setPhase("error");
      setErrorMsg(msg || "Scan failed. Try again.");
      return;
    }

    setPhase("matching");

    try {
      const result = await fingerprintApi.identify(sampleData);
      if (result.matched && result.clientId) {
        setPhase("found");
        setTimeout(() => router.push(`/dashboard/clients/${result.clientId}`), 500);
      } else {
        setPhase("error");
        setErrorMsg("No matching client found for this fingerprint.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPhase("error");
      setErrorMsg(msg || "Matching failed. Try again.");
    }
  }

  function reset() {
    setPhase("idle");
    setErrorMsg("");
    setPoor(false);
  }

  const statusLabel = () => {
    if (phase === "checking")  return "Checking device...";
    if (phase === "scanning")  return "Place finger on reader...";
    if (phase === "matching")  return "Matching fingerprint...";
    if (phase === "found")     return "Client found — opening...";
    return "Identify by Fingerprint";
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Device indicator */}
      {deviceReady !== null && phase === "idle" && (
        <div className={`flex items-center gap-1.5 text-xs ${deviceReady ? "text-emerald-600" : "text-red-500"}`}>
          {deviceReady
            ? <><Wifi size={12} /> DigitalPersona reader ready</>
            : <><WifiOff size={12} /> Device not detected</>}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        loading={busy || phase === "found"}
        leftIcon={!busy && phase !== "found" ? <Fingerprint size={14} /> : undefined}
        onClick={phase === "idle" || phase === "error" ? handleIdentify : undefined}
        disabled={busy || phase === "found"}
      >
        {statusLabel()}
      </Button>

      {phase === "scanning" && (
        <p className="text-xs text-gray-400 animate-pulse">
          Waiting for finger on DigitalPersona reader... (20s timeout)
        </p>
      )}

      {phase === "error" && (
        <div className="flex items-start gap-1.5">
          <span className="mt-0.5 shrink-0">
            {poor ? <AlertTriangle size={13} className="text-amber-500" /> : <XCircle size={13} className="text-red-500" />}
          </span>
          <div className="flex flex-col gap-1">
            <p className={`text-xs ${poor ? "text-amber-600" : "text-red-500"}`}>
              {errorMsg}
              {poor && " — place your finger flat and try again."}
            </p>
            <button type="button" onClick={reset} className="text-xs text-brand-600 underline text-left w-fit">
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
