# Setup — Neuen Verein einrichten

## Voraussetzungen

- Hetzner Cloud Account
- Domain oder Subdomain (A-Record muss auf den Server zeigen)
- SMTP-Zugangsdaten
- Terraform >= 1.6 und Ansible >= 2.15 lokal installiert
- SSH-Key in Hetzner Cloud hinterlegt (Cloud → SSH Keys)

---

## Schritt 1 — Konfiguration

<!--- todo: anleitung erstellen: how to hcloud_token anlegen  -->

**Terraform-Variablen:**
```bash
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
# Werte in terraform.tfvars eintragen
```

**Ansible-Variablen:**

```bash
cp infra/ansible/group_vars/all/vars.yml.example infra/ansible/group_vars/all/vars.yml
# Werte in vars.yml eintragen (shop_domain, smtp_*, alert_email)
```

Secrets anlegen und direkt verschlüsseln:
```bash
cp infra/ansible/group_vars/all/vault.yml.example infra/ansible/group_vars/all/vault.yml
# Werte in vault.yml eintragen
ansible-vault encrypt infra/ansible/group_vars/all/vault.yml
```

**Hetzner Object Storage einrichten:**

Object Storage wird für Produktbilder und automatische Datenbank-Backups genutzt. Die gesamte Einrichtung erfolgt per AWS CLI (Hetzner Object Storage ist S3-kompatibel).

1. Im [Hetzner Cloud Panel](https://console.hetzner.cloud) unter **Object Storage → Credentials** ein S3-Zugangspaar generieren.

2. AWS CLI lokal konfigurieren:
   ```bash
   export AWS_ACCESS_KEY_ID="<Access Key>"
   export AWS_SECRET_ACCESS_KEY="<Secret Key>"
   export S3_ENDPOINT="https://fsn1.your-objectstorage.com"
   export S3_BUCKET="shop-assets"
   ```

3. Bucket anlegen:
   ```bash
   aws s3 mb "s3://$S3_BUCKET" \
     --endpoint-url "$S3_ENDPOINT" \
     --region fsn1
   ```

   > Bucket-Policies werden von Hetzner Object Storage nicht unterstützt. Produktbilder werden beim Upload automatisch mit `ACL: public-read` hochgeladen — Backups bleiben ohne ACL (private).

4. Werte in `vars.yml` eintragen:
   ```yaml
   s3_endpoint: "https://fsn1.your-objectstorage.com"
   s3_region: "fsn1"
   s3_bucket_name: "shop-assets"
   s3_public_url: "https://shop-assets.fsn1.your-objectstorage.com"
   ```

6. Credentials in `vault.yml` eintragen:
   ```yaml
   vault_s3_access_key_id: "<Access Key>"
   vault_s3_secret_access_key: "<Secret Key>"
   ```

> **Backups:** Der `backup`-Container läuft automatisch täglich um 02:00 Uhr, erstellt einen `pg_dump` und legt ihn unter `backups/backup_YYYY-MM-DD_*.sql.gz` ab. Backups älter als 30 Tage werden automatisch gelöscht.

---

**GitHub Secrets** setzen (Repository → Settings → Secrets):
- `DEPLOY_WEBHOOK_SECRET` — gleicher Wert wie `vault_deploy_webhook_secret` in `vault.yml`
- `SHOP_DOMAIN` — gleicher Wert wie `shop_domain` in `vars.yml`

---

## Schritt 2 — DNS

Den A-Record der Domain/Subdomain auf die Server-IP zeigen lassen (wird nach Schritt 3 bekannt). DNS wird manuell beim jeweiligen Hoster gepflegt — Terraform provisioniert nur den Server selbst.

---

## Schritt 3 — Server provisionieren

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply

terraform output server_ip   # IP für DNS und Schritt 4 notieren
```

---

## Schritt 4 — Server konfigurieren

```bash
cd infra/ansible

# Host-Key des neuen Servers akzeptieren
ssh-keyscan "$(cd ../terraform && terraform output -raw server_ip)" >> ~/.ssh/known_hosts

make setup
```

Der `make`-Befehl holt die Server-IP automatisch aus dem Terraform State und übergibt sie als `SHOP_SERVER_IP`-Env-Variable an Ansible. Alternativ manuell:

```bash
SHOP_SERVER_IP=$(cd ../terraform && terraform output -raw server_ip) \
  ansible-playbook playbooks/setup.yml --ask-vault-pass
```

Dauer: ~5–10 Minuten. Das Playbook härtet das OS, installiert Docker, legt den Deploy-User an und startet den gesamten Stack.

---

## Config-Updates deployen (nach Erstinstallation)

Wenn sich `docker-compose.yml`, `Caddyfile` oder `.env`-Werte ändern (aber kein neues Image gebaut wird):

```bash
cd infra/ansible
make deploy
```

Das Playbook kopiert die aktualisierten Dateien auf den Server und startet betroffene Container neu.

---

## Schritt 5 — Erstmaliges Deployment

Nach dem Setup läuft das erste Deployment automatisch sobald auf `main` gepusht wird. Alternativ manuell:

```bash
ssh shop@<server-ip>
cd /opt/shop
docker compose pull
docker compose up -d
```

Datenbankmigrationen laufen **automatisch** beim Container-Start.

---

## Schritt 6 — Ersten Admin-Account anlegen

Sign-up ist in Production standardmäßig deaktiviert. Für den ersten Account `ADMIN_SIGNUP_ENABLED=true` temporär in `/opt/shop/.env` setzen:

```bash
ssh shop@<server-ip>
cd /opt/shop

# Einmalig Sign-up freischalten
echo "ADMIN_SIGNUP_ENABLED=true" >> .env
docker compose up -d app

# Admin-Account anlegen
ADMIN_EMAIL=admin@meinverein.de ADMIN_PASSWORD=SICHERES_PASSWORT \
  docker compose exec app pnpm admin:create

# Sign-up sofort wieder deaktivieren
sed -i '/ADMIN_SIGNUP_ENABLED/d' .env
docker compose up -d app
```

Beim ersten Login im Admin-Panel TOTP einrichten.

---

## Schritt 7 — Shop einrichten

Im Admin-Panel unter `https://shop.meinverein.de/admin`:

1. Kategorien anlegen
2. Zeitslots anlegen
3. Produkte anlegen und Zeitslots zuweisen
4. Validierungsregeln aktivieren
5. Shop freischalten

---

## Checkliste vor Go-Live

- [ ] `https://<domain>/api/health` antwortet mit `{"status":"ok"}`
- [ ] HTTPS aktiv (Caddy holt Let's Encrypt-Zertifikat automatisch)
- [ ] Test-Bestellung durchführen und Bestätigungs-E-Mail prüfen
- [ ] Admin-TOTP aktiviert und getestet
- [ ] CSV-Export heruntergeladen und Format geprüft
- [ ] Testbild im Admin hochladen und prüfen ob es unter `https://<bucket>.fsn1.your-objectstorage.com/products/...` erreichbar ist
- [ ] Ersten Backup manuell auslösen: `docker compose exec backup /backup.sh` und im S3-Bucket unter `backups/` prüfen

---

## Folge-Deployments

Automatisch bei jedem Push auf `main`:
```
git push origin main
  → CI: typecheck + lint + test
  → Docker-Image bauen und nach GHCR pushen
  → Webhook → Server: pull → migrate → restart
```

---

## Schritt 8 — Monitoring einrichten

Nach `terraform apply` stehen beide Server-IPs fest. Eintragen in `infra/ansible/group_vars/all/vars.yml`:

```yaml
app_server_ip: "1.2.3.4"        # terraform output server_ip
monitoring_server_ip: "5.6.7.8" # terraform output monitoring_ip
alert_email: "admin@meinverein.de"
```

Und `vault_grafana_admin_password` in `vault.yml` setzen. Dann:

```bash
cd infra/ansible
ssh-keyscan "$(cd ../terraform && terraform output -raw monitoring_ip)" >> ~/.ssh/known_hosts

ansible-playbook \
  -i "$(cd ../terraform && terraform output -raw monitoring_ip)," \
  --ask-vault-pass \
  playbooks/setup-monitoring.yml
```

Grafana erreichbar unter `http://<monitoring-ip>:3000` (nur von `admin_ips`).

**Automatisch provisioniert:**
- Datasources: Prometheus + Loki
- Alerts: App down (2 min), Disk >80%, Fehlerrate >10%
- Alert-Kanal: E-Mail an `alert_email`

---

## Zweiten Verein hinzufügen

Jeder Verein bekommt seine eigene Server-Instanz mit eigener Datenbank.

1. `terraform.tfvars` mit neuem `club_slug` anpassen
2. `terraform init -backend-config="key=shops/<neuer-slug>/terraform.tfstate"`
3. `terraform apply`
4. `ansible-playbook setup.yml` mit angepassten `group_vars` (andere Domain, SMTP, Club-Werte)
5. Fertig — dasselbe Docker-Image, andere Konfiguration via Env Vars
