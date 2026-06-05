terraform {
  required_version = ">= 1.6"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
  }

  # State liegt lokal in infra/terraform/terraform.tfstate (in .gitignore).
  # Backup der State-Datei an einem sicheren Ort aufbewahren —
  # ohne sie kann Terraform die bestehende Infrastruktur nicht mehr verwalten.
}
