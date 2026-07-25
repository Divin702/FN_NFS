"use client";

// DigitalPersona capture via the local Python agent (fingerprint-agent/agent.py).
//
// The browser cannot talk to the U.are.U reader directly: @digitalpersona/devices
// needs the DigitalPersona Lite Client, which is a separate HID product and is not
// installed here (the U.are.U RTE has no WebSDK feature). Instead a small Flask
// agent on :9000 owns the SDK — it does capture via dpfpdd and, for identification,
// real ANSI-378 minutiae matching via dpfj.
//
// Start it with:  py -3.9 agent.py    (from BN_NFS/fingerprint-agent)

import { getToken } from "@/lib/auth";

const AGENT_URL =
  process.env.NEXT_PUBLIC_FINGERPRINT_AGENT_URL ?? "http://localhost:9000";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Number of finger placements the agent asks for during enrolment (ENROLL_CAPTURES). */
export const ENROLL_CAPTURES = 4;

export interface DPStatus {
  ready: boolean;
  message: string;
}

export interface EnrollResult {
  /** Base64 ANSI-378 enrolment template, ready to POST to the backend. */
  template: string;
  captures: number;
}

export interface IdentifyResult {
  matched: boolean;
  clientId: string | null;
  score: number;
  /** How many clients had a template to compare against. 0 => nobody enrolled yet. */
  enrolled?: number;
}

/** Message for a non-match, distinguishing "nothing enrolled" from "no match". */
export function noMatchMessage(result: IdentifyResult): string {
  if (result.enrolled === 0) {
    return "No client has a fingerprint enrolled yet. Open a client and use " +
           "“Enroll Fingerprint” first, then scan here.";
  }
  return `No matching client found (compared against ${result.enrolled ?? "all"} enrolled fingerprint(s)).`;
}

// ── internals ────────────────────────────────────────────────────────────────

/** Distinguish "agent isn't running" from a real error, so the UI can say something useful. */
function agentDownError(): Error {
  return new Error(
    `Fingerprint agent is not running. Start it with "py -3.9 agent.py" ` +
      `in BN_NFS/fingerprint-agent, then try again.`,
  );
}

async function agentFetch<T>(
  path: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${AGENT_URL}${path}`, { ...init, signal: controller.signal });
  } catch (err) {
    // AbortError = our timeout; anything else on a localhost fetch means no listener.
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`The reader did not respond in ${Math.round(timeoutMs / 1000)}s. Try again.`);
    }
    throw agentDownError();
  } finally {
    clearTimeout(timer);
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON body — handled below */
  }

  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `Agent returned HTTP ${res.status}.`;
    throw new Error(msg);
  }

  return body as T;
}

// ── public API ───────────────────────────────────────────────────────────────

/** Check that the agent is up and the reader is open. Resolves in ≤3s. */
export async function getDeviceStatus(): Promise<DPStatus> {
  try {
    await agentFetch<{ status: string; message: string }>("/health", { method: "GET" }, 3000);
    return { ready: true, message: "DigitalPersona reader ready." };
  } catch (err) {
    return { ready: false, message: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Capture ENROLL_CAPTURES placements and return one enrolment template.
 * The agent blocks per capture (15s each), so allow a generous timeout.
 */
export function enrollFingerprint(): Promise<EnrollResult> {
  return agentFetch<EnrollResult>(
    "/enroll",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    120_000,
  );
}

/**
 * Capture one finger and 1:N match it against every enrolled template.
 * Matching happens inside the agent (real dpfj minutiae comparison) — the agent
 * pulls the templates from the backend itself, so it needs the caller's JWT.
 */
export function identifyFingerprint(): Promise<IdentifyResult> {
  return agentFetch<IdentifyResult>(
    "/identify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backendUrl: BACKEND_URL, token: getToken() ?? "" }),
    },
    60_000,
  );
}
