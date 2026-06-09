CREATE TYPE "CreatorFilmVisibility" AS ENUM ('DRAFT', 'PUBLIC');

CREATE TABLE "CreatorFilm" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "posterUrl" TEXT,
  "playbackUrl" TEXT,
  "category" TEXT NOT NULL DEFAULT 'Independent Film',
  "visibility" "CreatorFilmVisibility" NOT NULL DEFAULT 'PUBLIC',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreatorFilm_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CreatorFilm"
  ADD CONSTRAINT "CreatorFilm_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CreatorFilm_userId_updatedAt_idx" ON "CreatorFilm"("userId", "updatedAt");
CREATE INDEX "CreatorFilm_visibility_updatedAt_idx" ON "CreatorFilm"("visibility", "updatedAt");
CREATE INDEX "CreatorFilm_title_idx" ON "CreatorFilm"("title");
