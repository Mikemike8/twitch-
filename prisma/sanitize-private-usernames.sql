UPDATE "Stream" AS stream
SET "name" = 'creator-' || substring(md5("user"."externalUserId"), 1, 7) || '''s stream'
FROM "User" AS "user"
WHERE stream."userId" = "user"."id"
  AND "user"."username" LIKE 'user\_%' ESCAPE '\'
  AND stream."name" LIKE '%' || "user"."username" || '%';

UPDATE "User"
SET "username" = 'creator-' || substring(md5("externalUserId"), 1, 7)
WHERE "username" LIKE 'user\_%' ESCAPE '\';
