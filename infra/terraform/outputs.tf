output "server_ip" {
  value = hcloud_server.shop.ipv4_address
}

output "server_name" {
  value = hcloud_server.shop.name
}

output "monitoring_ip" {
  value = hcloud_server.monitoring.ipv4_address
}

