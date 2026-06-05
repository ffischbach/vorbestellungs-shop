variable "hcloud_token" {
  type      = string
  sensitive = true
}

variable "club_slug" {
  type        = string
  description = "Kurzname des Vereins, z.B. 'asg-ettlingen'. Wird für Ressourcennamen verwendet."
}

variable "admin_ssh_key_name" {
  type        = string
  description = "Name des SSH-Keys in Hetzner Cloud (muss dort bereits hinterlegt sein)"
}

variable "admin_ips" {
  type        = list(string)
  description = "IPs mit SSH-Zugang (CIDR, z.B. ['1.2.3.4/32'])"
}
