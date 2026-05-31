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
      <div className="rounded-md border border-dashed border-[#4a4a52] bg-[#242429] p-4 text-xs leading-5 text-[#adadb8]">
        Add <code className="text-[#bf94ff]">UPLOADTHING_TOKEN</code> to <code className="text-[#bf94ff]">.env</code> to upload thumbnails.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {thumbnailUrl && <p className="truncate text-xs text-[#adadb8]">Current thumbnail: {thumbnailUrl}</p>}
      <div className="rounded-md border border-dashed border-[#4a4a52] bg-[#242429] p-3">
        <UploadDropzone
          endpoint="thumbnailUploader"
          onClientUploadComplete={() => router.refresh()}
          onUploadError={(error: Error) => window.alert(`Upload failed: ${error.message}`)}
          appearance={{
            button: "bg-[#9147ff] px-3 py-2 text-xs font-bold text-white hover:bg-[#a970ff]",
            label: "text-sm text-[#efeff1]",
            allowedContent: "text-xs text-[#adadb8]",
          }}
        />
      </div>
    </div>
  );
}
