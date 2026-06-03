import { createUploadthing, type FileRouter } from "uploadthing/next";
import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

const upload = createUploadthing();

export const uploadRouter = {
  thumbnailUploader: upload({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const self = await getSelf();
      await enforceActionRateLimit("thumbnail-upload", self.id, 20);
      return { userId: self.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const stream = await db.stream.update({
        where: { userId: metadata.userId },
        data: { thumbnailUrl: file.ufsUrl },
      });
      await writeAuditLog(metadata.userId, "upload_thumbnail", stream.id);

      return { fileUrl: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
