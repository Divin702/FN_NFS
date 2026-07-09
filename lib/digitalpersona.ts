"use client";

// DigitalPersona Web SDK wrapper
// Requires the DigitalPersona WebSDK service to be installed on the local machine
// (ships with the DigitalPersona device driver package for Windows).

import type {
  FingerprintReader,
  SamplesAcquired,
  ErrorOccurred,
  QualityReported,
  DeviceConnected,
} from "@digitalpersona/devices";
import type { BioSample } from "@digitalpersona/core";

export type DPSampleFormat = "Intermediate" | "PngImage" | "Raw" | "Compressed";

export interface DPSample {
  // Base64url-encoded biometric sample data (BioSample.Data)
  data: string;
  // Full BioSample object if you need metadata (header, quality, etc.)
  bioSample: BioSample;
  format: DPSampleFormat;
}

export interface DPStatus {
  ready: boolean;
  message: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function loadSDK() {
  // Dynamic import keeps Next.js SSR happy — this module uses WebSocket APIs
  const [devices, formats] = await Promise.all([
    import("@digitalpersona/devices"),
    import("@digitalpersona/devices"),
  ]);
  return { FingerprintReader: devices.FingerprintReader, SampleFormat: formats.SampleFormat };
}

function toSDKFormat(
  format: DPSampleFormat,
  SampleFormat: { Raw: number; Intermediate: number; Compressed: number; PngImage: number },
) {
  switch (format) {
    case "Raw":         return SampleFormat.Raw;
    case "Compressed":  return SampleFormat.Compressed;
    case "PngImage":    return SampleFormat.PngImage;
    default:            return SampleFormat.Intermediate;
  }
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Capture a single fingerprint sample.
 * Resolves once the user places their finger on the reader.
 * Rejects on timeout, device error, or if no device is connected.
 */
export function captureSample(
  format: DPSampleFormat = "Intermediate",
  timeoutMs = 20000,
): Promise<DPSample> {
  return new Promise(async (resolve, reject) => {
    let reader: FingerprintReader | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    function settle(fn: () => void) {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      try { reader?.stopAcquisition(); } catch { /* ignore */ }
      fn();
    }

    try {
      const { FingerprintReader, SampleFormat } = await loadSDK();
      reader = new FingerprintReader();

      (reader as FingerprintReader).onSamplesAcquired = (evt: SamplesAcquired) => {
        const bioSample = evt.samples?.[0];
        if (!bioSample) {
          settle(() => reject(new Error("No sample returned by the reader.")));
          return;
        }
        settle(() => resolve({ data: bioSample.Data, bioSample, format }));
      };

      (reader as FingerprintReader).onErrorOccurred = (evt: ErrorOccurred) => {
        settle(() =>
          reject(new Error(`DigitalPersona reader error (code ${evt.error}). Try again.`)),
        );
      };

      (reader as FingerprintReader).onQualityReported = (evt: QualityReported) => {
        // QualityCode.Good === 0; anything else means a poor scan
        if (evt.quality !== 0) {
          settle(() =>
            reject(new Error(`Poor scan quality (code ${evt.quality}). Place your finger flat and try again.`)),
          );
        }
      };

      timer = setTimeout(() => {
        settle(() =>
          reject(new Error(`Scan timed out after ${timeoutMs / 1000}s. Try again.`)),
        );
      }, timeoutMs);

      await reader.startAcquisition(toSDKFormat(format, SampleFormat));
    } catch {
      settle(() =>
        reject(
          new Error(
            "Could not connect to the DigitalPersona WebSDK service. " +
            "Make sure the device driver and WebSDK service are installed and running.",
          ),
        ),
      );
    }
  });
}

/**
 * Check whether a DigitalPersona reader is connected.
 * Resolves in ≤3s regardless of whether a device is present.
 */
export function getDeviceStatus(): Promise<DPStatus> {
  return new Promise(async (resolve) => {
    let reader: FingerprintReader | null = null;
    let settled = false;

    function settle(result: DPStatus) {
      if (settled) return;
      settled = true;
      try { reader?.stopAcquisition(); } catch { /* ignore */ }
      resolve(result);
    }

    const timeout = setTimeout(
      () => settle({ ready: false, message: "No DigitalPersona device detected." }),
      3000,
    );

    try {
      const { FingerprintReader, SampleFormat } = await loadSDK();
      reader = new FingerprintReader();

      (reader as FingerprintReader).onDeviceConnected = (_evt: DeviceConnected) => {
        clearTimeout(timeout);
        settle({ ready: true, message: "DigitalPersona reader ready." });
      };

      (reader as FingerprintReader).onErrorOccurred = (_evt: ErrorOccurred) => {
        clearTimeout(timeout);
        settle({ ready: false, message: "DigitalPersona reader error. Check device connection." });
      };

      // Trigger a temporary acquisition — fires DeviceConnected if a reader is present
      await reader.startAcquisition(SampleFormat.Intermediate).catch(() => {
        clearTimeout(timeout);
        settle({ ready: false, message: "DigitalPersona WebSDK service not running." });
      });
    } catch {
      clearTimeout(timeout);
      settle({ ready: false, message: "DigitalPersona WebSDK service not running." });
    }
  });
}
