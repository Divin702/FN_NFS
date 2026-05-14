"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WebcamCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export function WebcamCapture({ onCapture, onCancel }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError("Camera not accessible. Please allow camera permissions and try again.");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the image to match the preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture(dataUrl);
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Camera size={14} />
          </div>
          <span className="text-sm font-medium text-foreground">Camera</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
          aria-label="Close camera"
        >
          <X size={15} />
        </button>
      </div>

      <div className="p-4 flex flex-col items-center gap-3">
        {error ? (
          <div className="w-full rounded-lg bg-red-50 border border-red-200 px-4 py-6 text-center">
            <Camera size={28} className="mx-auto text-red-300 mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="flex items-center gap-2 text-white text-sm">
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Starting camera…</span>
                  </div>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1"
                disabled={!ready}
                leftIcon={<Camera size={14} />}
                onClick={capture}
              >
                Capture Photo
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
