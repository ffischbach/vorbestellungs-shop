FROM alpine:3.21

RUN apk add --no-cache postgresql16-client aws-cli python3 tzdata

COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

# Cron-Job: täglich um 02:00 Uhr
RUN echo "0 2 * * * /backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

CMD ["crond", "-f", "-l", "2"]
