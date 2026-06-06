#!/bin/sh
set -eo pipefail

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup: $BACKUP_FILE"

pg_dump "$DATABASE_URL" | gzip | \
  aws s3 cp - "s3://${S3_BUCKET_NAME}/backups/${BACKUP_FILE}" \
    --endpoint-url "$S3_ENDPOINT" \
    --region "$S3_REGION" \
    --acl private

echo "[$(date)] Backup uploaded: $BACKUP_FILE"

# Backups älter als 30 Tage löschen (aws s3 ls gibt YYYY-MM-DD als erstes Feld aus)
CUTOFF=$(python3 -c "from datetime import date,timedelta; print((date.today()-timedelta(days=30)).isoformat())")

echo "[$(date)] Deleting backups older than $CUTOFF"

aws s3 ls "s3://${S3_BUCKET_NAME}/backups/" \
    --endpoint-url "$S3_ENDPOINT" \
    --region "$S3_REGION" | \
while read -r file_date _ _ key; do
  if [ -n "$key" ] && [ "$file_date" \< "$CUTOFF" ]; then
    aws s3 rm "s3://${S3_BUCKET_NAME}/backups/$key" \
      --endpoint-url "$S3_ENDPOINT" \
      --region "$S3_REGION"
    echo "[$(date)] Deleted: $key"
  fi
done

echo "[$(date)] Backup complete"
