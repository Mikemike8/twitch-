"use client";

import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";

export function ThumbnailUpload({
  configured,
  thumbnailUrl,
}: {
  configured: boolean;
  thumbnailUrl: string | null;
}) {
  const router = useRouter();

  if (!configured) {
    return (
      <div className="rounded border border-dashed border-white/20 bg-black p-4 text-xs leading-5 text-[#b3b3b3]">
        Add <code className="text-[#e50914]">UPLOADTHING_TOKEN</code> to <code className="text-[#e50914]">.env</code> to upload thumbnails.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {thumbnailUrl && <p className="truncate text-xs text-[#b3b3b3]">Current thumbnail: {thumbnailUrl}</p>}
      <div className="rounded border border-dashed border-white/20 bg-black p-3">
        <UploadDropzone
          endpoint="thumbnailUploader"
          onClientUploadComplete={() => router.refresh()}
          onUploadError={(error: Error) => window.alert(`Upload failed: ${error.message}`)}
          appearance={{
            button: "bg-[#e50914] px-3 py-2 text-xs font-bold text-white hover:bg-[#f50723]",
            label: "text-sm text-white",
            allowedContent: "text-xs text-[#b3b3b3]",
          }}
        />
      </div>
    </div>
  );
}
