"use client";

import { useState } from "react";
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
  const [status, setStatus] = useState("");

  if (!configured) {
    return (
      <div className="break-words rounded border border-dashed border-white/20 bg-black p-4 text-xs leading-5 text-[#b3b3b3]">
        Add <code className="text-[#e50914]">UPLOADTHING_TOKEN</code> to <code className="text-[#e50914]">.env</code> to upload thumbnails.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {thumbnailUrl && <p className="break-all text-xs text-[#b3b3b3]">Current thumbnail: {thumbnailUrl}</p>}
      <div className="min-w-0 overflow-hidden rounded border border-dashed border-white/20 bg-black p-2 sm:p-3">
        <UploadDropzone
          endpoint="thumbnailUploader"
          onUploadBegin={() => setStatus("Uploading thumbnail...")}
          onClientUploadComplete={() => {
            setStatus("Thumbnail updated");
            router.refresh();
          }}
          onUploadError={(error: Error) => setStatus(`Upload failed: ${error.message}`)}
          appearance={{
            button: "bg-[#e50914] px-3 py-2 text-xs font-bold text-white hover:bg-[#f50723]",
            label: "text-sm text-white",
            allowedContent: "text-xs text-[#b3b3b3]",
          }}
        />
      </div>
      {status && <p className="rounded border border-white/10 bg-black/35 px-3 py-2 text-xs text-[#d2d2d2]">{status}</p>}
    </div>
  );
}
