const value = process.env.BACKUP_RESTORE_VERIFIED_AT;

if (!value) {
  console.error("BACKUP: BACKUP_RESTORE_VERIFIED_AT must record the latest verified restore timestamp.");
  process.exit(1);
}

const verifiedAt = new Date(value);
if (Number.isNaN(verifiedAt.getTime())) {
  console.error("BACKUP: BACKUP_RESTORE_VERIFIED_AT must be an ISO-8601 timestamp.");
  process.exit(1);
}

const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
if (Date.now() - verifiedAt.getTime() > maxAgeMs) {
  console.error("BACKUP: latest verified restore is older than 30 days.");
  process.exit(1);
}

console.log(`Backup restore verification is current: ${verifiedAt.toISOString()}`);
