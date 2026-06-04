# Setup — Neuen Verein einrichten

## Voraussetzungen

- Hetzner Cloud Account
- Domain oder Subdomain
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
# Passwort merken — wird bei jedem Ansible-Aufruf abgefragt
```

**GitHub Secrets** setzen (Repository → Settings → Secrets):
- `DEPLOY_WEBHOOK_SECRET` — gleicher Wert wie `vault_deploy_webhook_secret` in infra/ansible/group_vars/all/vault.yml
- `SHOP_DOMAIN` — gleicher Wert wie `shop_domain` in infra/ansible/group_vars/all/vars.yml

---

## Schritt 3 — Server provisionieren

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply

terraform output server_ip   # IP für Schritt 4 notieren
```

Nach `terraform apply`: CPX21-Server in Nürnberg läuft, Firewall aktiv, 20 GB Datenvolume gemountet, DNS-Eintrag gesetzt.

---

## Schritt 4 — Server konfigurieren

```bash
cd infra/ansible

ansible-playbook \
  -i "$(cd ../terraform && terraform output -raw server_ip)," \
  --ask-vault-pass \
  playbooks/setup.yml
```

Dauer: ~5–10 Minuten. Das Playbook härtet das OS, installiert Docker, legt den Deploy-User an und startet den gesamten Stack.

---

## Schritt 5 — Erstmaliges Deployment

Nach dem Setup läuft das erste Deployment automatisch sobald auf `main` gepusht wird. Alternativ manuell:

```bash
ssh shop@<server-ip>
cd /opt/shop
docker compose pull
docker compose up -d
```

Datenbankmigrationen laufen **automatisch** beim Container-Start — kein manueller Schritt nötig.

Ersten Admin-Account anlegen:
```bash
curl -s -X POST https://<domain>/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@meinverein.de",
    "name": "Admin",
    "password": "SICHERES_PASSWORT"
  }'
```

Danach **sofort** `disableSignUp: true` in `apps/web/lib/auth.ts` setzen und deployen — sonst kann sich jeder registrieren (siehe [Authentifizierung](architecture.md#authentifizierung)).

---

## Schritt 6 — Shop einrichten

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

## Schritt 7 — Monitoring einrichten

Nach `terraform apply` stehen beide Server-IPs fest. Eintragen in `infra/ansible/group_vars/all/vars.yml`:

```yaml
app_server_ip: "1.2.3.4"        # terraform output server_ip
monitoring_server_ip: "5.6.7.8" # terraform output monitoring_ip
alert_email: "admin@meinverein.de"
```

Und `vault_grafana_admin_password` in `vault.yml` setzen. Dann:

```bash
cd infra/ansible

ansible-playbook \
  -i "$(cd ../terraform && terraform output -raw monitoring_ip)," \
  --ask-vault-pass \
  playbooks/setup-monitoring.yml
```

Grafana ist danach erreichbar unter `http://<monitoring-ip>:3000` (nur von `admin_ips`).

**Was automatisch provisioniert ist:**
- Datasources: Prometheus + Loki
- Alerts: App down (2 min), Disk >80%, Fehlerrate >10%
- Alert-Kanal: E-Mail an `alert_email`

---

## Zweiten Verein hinzufügen

Jeder Verein bekommt seine eigene Server-Instanz mit eigener Datenbank.

1. `terraform.tfvars` mit neuem `club_slug` und neuer `subdomain` anpassen
2. `terraform init -backend-config="key=shops/<neuer-slug>/terraform.tfstate" ...`
3. `terraform apply`
4. `ansible-playbook setup.yml` mit angepassten `group_vars` (andere Domain, SMTP, Club-Werte)
5. Fertig — dasselbe Docker-Image, andere Konfiguration via Env Vars
