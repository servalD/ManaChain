# Outputs consommés par Ansible (génération d'inventaire), la CI et les
# scripts cluster-start/stop. `terraform output -json` est la source unique.

output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "manager_public_ip" {
  value = azurerm_public_ip.manager.ip_address
}

output "manager_private_ip" {
  value = azurerm_network_interface.manager.private_ip_address
}

output "worker_private_ips" {
  value = { for name, nic in azurerm_network_interface.worker : name => nic.private_ip_address }
}

output "admin_username" {
  value = var.admin_username
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "acr_admin_username" {
  value = azurerm_container_registry.main.admin_username
}

output "acr_admin_password" {
  value     = azurerm_container_registry.main.admin_password
  sensitive = true
}

output "postgres_host" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "postgres_admin_user" {
  value = azurerm_postgresql_flexible_server.main.administrator_login
}

output "postgres_admin_password" {
  value     = random_password.postgres_admin.result
  sensitive = true
}

output "backup_storage_account" {
  value = azurerm_storage_account.backups.name
}

output "backup_storage_key" {
  value     = azurerm_storage_account.backups.primary_access_key
  sensitive = true
}

output "backup_container" {
  value = azurerm_storage_container.backups.name
}
