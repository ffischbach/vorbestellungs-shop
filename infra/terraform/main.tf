provider "hcloud" {
  token = var.hcloud_token
}

data "hcloud_ssh_key" "admin" {
  name = var.admin_ssh_key_name
}

# ── Private Network ────────────────────────────────────────────────────────

resource "hcloud_network" "main" {
  name     = "network-${var.club_slug}"
  ip_range = "10.0.0.0/24"
}

resource "hcloud_network_subnet" "main" {
  network_id   = hcloud_network.main.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.0.0/24"
}

# ── Monitoring-Server (CPX11) ──────────────────────────────────────────────

resource "hcloud_firewall" "monitoring" {
  name = "monitoring-fw-${var.club_slug}"

  rule {
    direction  = "in"
    port       = "22"
    protocol   = "tcp"
    source_ips = var.admin_ips
  }

  # Grafana nur für Admins erreichbar
  rule {
    direction  = "in"
    port       = "3000"
    protocol   = "tcp"
    source_ips = var.admin_ips
  }

  # Loki empfängt Logs vom App-Server (via Private Network)
  rule {
    direction  = "in"
    port       = "3100"
    protocol   = "tcp"
    source_ips = [hcloud_network.main.ip_range]
  }
}

resource "hcloud_server" "monitoring" {
  name         = "monitoring-${var.club_slug}"
  server_type  = "cx23"
  image        = "ubuntu-24.04"
  location     = "nbg1"
  ssh_keys     = [data.hcloud_ssh_key.admin.id]
  firewall_ids = [hcloud_firewall.monitoring.id]
  user_data    = file("${path.module}/cloud-init.yml")

  network {
    network_id = hcloud_network.main.id
  }

  depends_on = [hcloud_network_subnet.main]
}

# ── App-Server (CPX21) ────────────────────────────────────────────────────

resource "hcloud_firewall" "shop" {
  name = "shop-fw-${var.club_slug}"

  rule {
    direction  = "in"
    port       = "22"
    protocol   = "tcp"
    source_ips = var.admin_ips
  }

  rule {
    direction  = "in"
    port       = "80"
    protocol   = "tcp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    port       = "443"
    protocol   = "tcp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Node Exporter — nur für Monitoring-Server (via Private Network)
  rule {
    direction  = "in"
    port       = "9100"
    protocol   = "tcp"
    source_ips = [hcloud_network.main.ip_range]
  }
}

resource "hcloud_server" "shop" {
  name         = "shop-${var.club_slug}"
  server_type  = "cx23"
  image        = "ubuntu-24.04"
  location     = "nbg1"
  ssh_keys     = [data.hcloud_ssh_key.admin.id]
  firewall_ids = [hcloud_firewall.shop.id]
  user_data    = file("${path.module}/cloud-init.yml")

  network {
    network_id = hcloud_network.main.id
  }

  depends_on = [hcloud_network_subnet.main]
}

resource "hcloud_volume" "data" {
  name      = "shop-data-${var.club_slug}"
  size      = 20
  server_id = hcloud_server.shop.id
  automount = true
  format    = "ext4"
}

