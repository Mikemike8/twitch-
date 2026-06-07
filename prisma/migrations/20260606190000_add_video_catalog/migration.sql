-- CreateEnum
CREATE TYPE "CatalogVisibility" AS ENUM ('DRAFT', 'PUBLIC', 'UNLISTED');

-- CreateEnum
CREATE TYPE "MaturityRating" AS ENUM ('G', 'PG', 'PG_13', 'TV_14', 'TV_MA', 'R');

-- CreateEnum
CREATE TYPE "VideoAssetStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('VIDEO_STARTED', 'VIDEO_PAUSED', 'VIDEO_COMPLETED', 'VIDEO_SEEKED', 'WATCH_TIME_UPDATED');

-- CreateTable
CREATE TABLE "CatalogTitle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Anime',
    "posterUrl" TEXT,
    "heroImageUrl" TEXT,
    "visibility" "CatalogVisibility" NOT NULL DEFAULT 'PUBLIC',
    "maturityRating" "MaturityRating" NOT NULL DEFAULT 'TV_14',
    "allowedRegions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "blockedRegions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "catalogTitleId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationSeconds" INTEGER,
    "thumbnailUrl" TEXT,
    "muxPlaybackId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoAsset" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mux',
    "sourceUrl" TEXT,
    "playbackId" TEXT,
    "status" "VideoAssetStatus" NOT NULL DEFAULT 'PROCESSING',
    "codec" TEXT,
    "resolution" TEXT,
    "bitrateKbps" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogTitleTag" (
    "catalogTitleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CatalogTitleTag_pkey" PRIMARY KEY ("catalogTitleId","tagId")
);

-- CreateTable
CREATE TABLE "PlaybackProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "positionSeconds" INTEGER NOT NULL,
    "durationSeconds" INTEGER,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaybackProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpisodeComment" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpisodeComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "userId" TEXT,
    "episodeId" TEXT,
    "positionSeconds" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogTitle_slug_key" ON "CatalogTitle"("slug");
CREATE INDEX "CatalogTitle_visibility_updatedAt_idx" ON "CatalogTitle"("visibility", "updatedAt");
CREATE INDEX "CatalogTitle_category_idx" ON "CatalogTitle"("category");
CREATE INDEX "CatalogTitle_title_idx" ON "CatalogTitle"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Season_catalogTitleId_number_key" ON "Season"("catalogTitleId", "number");
CREATE INDEX "Season_catalogTitleId_idx" ON "Season"("catalogTitleId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_number_key" ON "Episode"("seasonId", "number");
CREATE INDEX "Episode_seasonId_idx" ON "Episode"("seasonId");
CREATE INDEX "Episode_publishedAt_idx" ON "Episode"("publishedAt");

-- CreateIndex
CREATE INDEX "VideoAsset_episodeId_status_idx" ON "VideoAsset"("episodeId", "status");
CREATE INDEX "VideoAsset_provider_playbackId_idx" ON "VideoAsset"("provider", "playbackId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogTag_name_key" ON "CatalogTag"("name");
CREATE INDEX "CatalogTitleTag_tagId_idx" ON "CatalogTitleTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackProgress_userId_episodeId_key" ON "PlaybackProgress"("userId", "episodeId");
CREATE INDEX "PlaybackProgress_userId_updatedAt_idx" ON "PlaybackProgress"("userId", "updatedAt");
CREATE INDEX "PlaybackProgress_episodeId_idx" ON "PlaybackProgress"("episodeId");

-- CreateIndex
CREATE INDEX "EpisodeComment_episodeId_createdAt_idx" ON "EpisodeComment"("episodeId", "createdAt");
CREATE INDEX "EpisodeComment_userId_createdAt_idx" ON "EpisodeComment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");
CREATE INDEX "AnalyticsEvent_episodeId_createdAt_idx" ON "AnalyticsEvent"("episodeId", "createdAt");

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_catalogTitleId_fkey" FOREIGN KEY ("catalogTitleId") REFERENCES "CatalogTitle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VideoAsset" ADD CONSTRAINT "VideoAsset_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogTitleTag" ADD CONSTRAINT "CatalogTitleTag_catalogTitleId_fkey" FOREIGN KEY ("catalogTitleId") REFERENCES "CatalogTitle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogTitleTag" ADD CONSTRAINT "CatalogTitleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "CatalogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaybackProgress" ADD CONSTRAINT "PlaybackProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaybackProgress" ADD CONSTRAINT "PlaybackProgress_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EpisodeComment" ADD CONSTRAINT "EpisodeComment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EpisodeComment" ADD CONSTRAINT "EpisodeComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed initial catalog titles from the current demo catalog.
INSERT INTO "CatalogTitle" ("id", "slug", "title", "description", "category", "posterUrl", "visibility", "maturityRating", "allowedRegions", "blockedRegions", "updatedAt")
VALUES
  ('catalog_solo_leveling', 'solo-leveling', 'Solo Leveling', 'A hunter at the edge of death awakens a forbidden power and begins climbing through gates no one else can survive.', 'Anime', '/demo-posters/solo-leveling.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_demon_slayer', 'demon-slayer', 'Demon Slayer', 'A young swordsman enters a haunted mountain war where demons, grief, and family bonds collide beneath moonlit blades.', 'Anime', '/demo-posters/demon-slayer.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_jujutsu_kaisen', 'jujutsu-kaisen', 'Jujutsu Kaisen', 'Cursed energy turns a quiet school into a battlefield as students face monsters born from human fear.', 'Anime', '/demo-posters/jujutsu-kaisen.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_attack_on_titan', 'attack-on-titan', 'Attack on Titan', 'Humanity fights from behind broken walls while soldiers uncover the brutal truth hidden beyond the battlefield.', 'Anime', '/demo-posters/attack-on-titan.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_my_hero_academia', 'my-hero-academia', 'My Hero Academia', 'Young heroes train under impossible pressure as villains force them to decide what power is worth.', 'Anime', '/demo-posters/my-hero-academia.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_chainsaw_man', 'chainsaw-man', 'Chainsaw Man', 'A desperate fighter merges with a devil and is pulled into a violent world of contracts, blood, and ambition.', 'Anime', '/demo-posters/chainsaw-man.jpg', 'PUBLIC', 'TV_MA', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_one_piece', 'one-piece', 'One Piece', 'A fearless crew crosses dangerous seas in search of freedom, treasure, and legends older than empires.', 'Anime', '/demo-posters/one-piece.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_black_clover', 'black-clover', 'Black Clover', 'A magicless fighter challenges a kingdom of mages with stubborn will, brutal training, and an impossible dream.', 'Anime', '/demo-posters/black-clover.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP);

INSERT INTO "Season" ("id", "catalogTitleId", "number", "title", "updatedAt")
SELECT 'season_' || "slug" || '_1', "id", 1, 'Season 1', CURRENT_TIMESTAMP
FROM "CatalogTitle"
WHERE "id" LIKE 'catalog_%';

INSERT INTO "Episode" ("id", "seasonId", "number", "title", "description", "durationSeconds", "thumbnailUrl", "publishedAt", "updatedAt")
SELECT 'episode_' || ct."slug" || '_1', s."id", 1, 'Awakening',
  ct."title" || ' begins as the hero steps into a first battle that changes the entire season.',
  2520, ct."posterUrl", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "CatalogTitle" ct
JOIN "Season" s ON s."catalogTitleId" = ct."id" AND s."number" = 1
WHERE ct."id" LIKE 'catalog_%';

INSERT INTO "CatalogTag" ("id", "name")
VALUES
  ('tag_action', 'Action'),
  ('tag_fantasy', 'Fantasy'),
  ('tag_supernatural', 'Supernatural'),
  ('tag_drama', 'Drama'),
  ('tag_superhero', 'Superhero'),
  ('tag_horror', 'Horror'),
  ('tag_adventure', 'Adventure')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "CatalogTitleTag" ("catalogTitleId", "tagId")
VALUES
  ('catalog_solo_leveling', 'tag_action'),
  ('catalog_solo_leveling', 'tag_fantasy'),
  ('catalog_demon_slayer', 'tag_action'),
  ('catalog_demon_slayer', 'tag_supernatural'),
  ('catalog_jujutsu_kaisen', 'tag_action'),
  ('catalog_jujutsu_kaisen', 'tag_supernatural'),
  ('catalog_attack_on_titan', 'tag_action'),
  ('catalog_attack_on_titan', 'tag_drama'),
  ('catalog_my_hero_academia', 'tag_action'),
  ('catalog_my_hero_academia', 'tag_superhero'),
  ('catalog_chainsaw_man', 'tag_action'),
  ('catalog_chainsaw_man', 'tag_horror'),
  ('catalog_one_piece', 'tag_adventure'),
  ('catalog_one_piece', 'tag_fantasy'),
  ('catalog_black_clover', 'tag_action'),
  ('catalog_black_clover', 'tag_fantasy')
ON CONFLICT DO NOTHING;
