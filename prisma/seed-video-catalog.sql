INSERT INTO "CatalogTitle" ("id", "slug", "title", "description", "category", "posterUrl", "visibility", "maturityRating", "allowedRegions", "blockedRegions", "updatedAt")
VALUES
  ('catalog_solo_leveling', 'solo-leveling', 'Solo Leveling', 'A hunter at the edge of death awakens a forbidden power and begins climbing through gates no one else can survive.', 'Anime', '/demo-posters/solo-leveling.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_demon_slayer', 'demon-slayer', 'Demon Slayer', 'A young swordsman enters a haunted mountain war where demons, grief, and family bonds collide beneath moonlit blades.', 'Anime', '/demo-posters/demon-slayer.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_jujutsu_kaisen', 'jujutsu-kaisen', 'Jujutsu Kaisen', 'Cursed energy turns a quiet school into a battlefield as students face monsters born from human fear.', 'Anime', '/demo-posters/jujutsu-kaisen.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_attack_on_titan', 'attack-on-titan', 'Attack on Titan', 'Humanity fights from behind broken walls while soldiers uncover the brutal truth hidden beyond the battlefield.', 'Anime', '/demo-posters/attack-on-titan.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_my_hero_academia', 'my-hero-academia', 'My Hero Academia', 'Young heroes train under impossible pressure as villains force them to decide what power is worth.', 'Anime', '/demo-posters/my-hero-academia.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_chainsaw_man', 'chainsaw-man', 'Chainsaw Man', 'A desperate fighter merges with a devil and is pulled into a violent world of contracts, blood, and ambition.', 'Anime', '/demo-posters/chainsaw-man.jpg', 'PUBLIC', 'TV_MA', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_one_piece', 'one-piece', 'One Piece', 'A fearless crew crosses dangerous seas in search of freedom, treasure, and legends older than empires.', 'Anime', '/demo-posters/one-piece.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('catalog_black_clover', 'black-clover', 'Black Clover', 'A magicless fighter challenges a kingdom of mages with stubborn will, brutal training, and an impossible dream.', 'Anime', '/demo-posters/black-clover.jpg', 'PUBLIC', 'TV_14', ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "posterUrl" = EXCLUDED."posterUrl",
  "visibility" = EXCLUDED."visibility",
  "maturityRating" = EXCLUDED."maturityRating",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Season" ("id", "catalogTitleId", "number", "title", "updatedAt")
SELECT 'season_' || "slug" || '_1', "id", 1, 'Season 1', CURRENT_TIMESTAMP
FROM "CatalogTitle"
WHERE "id" LIKE 'catalog_%'
ON CONFLICT ("catalogTitleId", "number") DO UPDATE SET
  "title" = EXCLUDED."title",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Episode" ("id", "seasonId", "number", "title", "description", "durationSeconds", "thumbnailUrl", "publishedAt", "updatedAt")
SELECT 'episode_' || ct."slug" || '_1', s."id", 1, 'Awakening',
  ct."title" || ' begins as the hero steps into a first battle that changes the entire season.',
  2520, ct."posterUrl", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "CatalogTitle" ct
JOIN "Season" s ON s."catalogTitleId" = ct."id" AND s."number" = 1
WHERE ct."id" LIKE 'catalog_%'
ON CONFLICT ("seasonId", "number") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "durationSeconds" = EXCLUDED."durationSeconds",
  "thumbnailUrl" = EXCLUDED."thumbnailUrl",
  "updatedAt" = CURRENT_TIMESTAMP;

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
