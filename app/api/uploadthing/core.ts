import { createUploadthing, type FileRouter } from "uploadthing/next";
import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

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
      return { userId: self.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.stream.update({
        where: { userId: metadata.userId },
        data: { thumbnailUrl: file.ufsUrl },
      });

      return { fileUrl: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
