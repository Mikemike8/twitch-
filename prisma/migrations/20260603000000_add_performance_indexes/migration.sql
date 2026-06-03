CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "Stream_isLive_updatedAt_idx" ON "Stream"("isLive", "updatedAt");
CREATE INDEX "Stream_name_idx" ON "Stream"("name");
