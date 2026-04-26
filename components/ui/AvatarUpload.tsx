"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Camera, Loader2, User } from "lucide-react";
import { cn } from "@/lib/cn";

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { wrapper: "h-16 w-16", icon: 20, camera: 14 },
  md: { wrapper: "h-24 w-24", icon: 28, camera: 16 },
  lg: { wrapper: "h-32 w-32", icon: 36, camera: 18 },
};

interface CloudinaryResult {
  secure_url: string;
}

export function AvatarUpload({
  value,
  onChange,
  name = "avatar",
  size = "md",
  className,
}: AvatarUploadProps) {
  const [loading, setLoading] = useState(false);
  const s = sizeMap[size];

  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      options={{
        cropping: true,
        croppingAspectRatio: 1,
        showSkipCropButton: false,
        maxFiles: 1,
        resourceType: "image",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        maxFileSize: 5_000_000,
        folder: "nfs/avatars",
        publicId: name,
      }}
      onSuccess={(result) => {
        const info = result?.info as CloudinaryResult | undefined;
        if (info?.secure_url) onChange(info.secure_url);
        setLoading(false);
      }}
      onQueuesStart={() => setLoading(true)}
      onQueuesEnd={() => setLoading(false)}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className={cn(
            "group relative flex items-center justify-center rounded-full",
            "border-2 border-dashed border-border hover:border-brand-400",
            "bg-surface overflow-hidden transition-colors cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
            s.wrapper,
            className
          )}
          aria-label="Upload profile picture"
        >
          {/* preview image */}
          {value && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Profile picture"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* placeholder icon */}
          {!value && !loading && (
            <User size={s.icon} className="text-muted group-hover:text-brand-400 transition-colors" />
          )}

          {/* loading spinner */}
          {loading && (
            <Loader2 size={s.icon} className="text-brand-500 animate-spin" />
          )}

          {/* camera overlay on hover */}
          {!loading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera size={s.camera} className="text-white" />
            </span>
          )}
        </button>
      )}
    </CldUploadWidget>
  );
}
