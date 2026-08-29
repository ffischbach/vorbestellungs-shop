#!/usr/bin/env bash
# Setzt die aktuelle öffentliche IP als admin_ips in terraform.tfvars und
# appliet nur die betroffenen Firewall-Ressourcen (kein Server-/Volume-Diff).
#
# Usage: infra/scripts/update-admin-ip.sh [-y]
#   -y   terraform apply ohne interaktive Bestätigung (-auto-approve)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$SCRIPT_DIR/../terraform"
TFVARS="$TF_DIR/terraform.tfvars"

AUTO_APPROVE=""
if [[ "${1:-}" == "-y" ]]; then
  AUTO_APPROVE="-auto-approve"
fi

if [[ ! -f "$TFVARS" ]]; then
  echo "Fehler: $TFVARS nicht gefunden." >&2
  exit 1
fi

echo "Ermittle aktuelle öffentliche IP..."
CURRENT_IP="$(curl -fsS https://api.ipify.org)"

if [[ ! "$CURRENT_IP" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]]; then
  echo "Fehler: Konnte keine gültige IPv4-Adresse ermitteln (erhalten: '$CURRENT_IP')." >&2
  exit 1
fi

CIDR="${CURRENT_IP}/32"
echo "Aktuelle IP: $CIDR"

EXISTING_LINE="$(grep -E '^admin_ips\s*=' "$TFVARS" || true)"

if [[ "$EXISTING_LINE" == *"$CIDR"* ]]; then
  echo "admin_ips enthält bereits $CIDR — keine Änderung nötig."
else
  # Ersetzt die komplette admin_ips-Zeile durch eine Liste mit nur der aktuellen IP.
  # Mehrere feste Admin-IPs (z.B. Büro) müssten separat verwaltet werden.
  TMP_FILE="$(mktemp)"
  awk -v cidr="$CIDR" '
    /^admin_ips[[:space:]]*=/ {
      sub(/=.*/, "= [\"" cidr "\"]")
    }
    { print }
  ' "$TFVARS" > "$TMP_FILE"
  mv "$TMP_FILE" "$TFVARS"
  echo "terraform.tfvars aktualisiert: admin_ips = [\"$CIDR\"]"
fi

echo "Terraform apply (nur Firewall-Ressourcen)..."
cd "$TF_DIR"
terraform apply $AUTO_APPROVE \
  -target=hcloud_firewall.shop \
  -target=hcloud_firewall.monitoring

echo "Fertig."
