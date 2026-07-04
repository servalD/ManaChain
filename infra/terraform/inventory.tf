# Génère l'inventaire Ansible à chaque apply : plus rien à recopier à la main.
#   - hosts.ini      : hôtes + ProxyJump vers les workers (pas de secret)
#   - tf_outputs.yml : valeurs d'infra dont secrets (ACR, Postgres, storage)
# Les deux vivent dans infra/ansible/inventory/ (gitignoré).

locals {
  ansible_inventory_dir = "${path.module}/../ansible/inventory"
}

resource "local_file" "ansible_hosts" {
  filename        = "${local.ansible_inventory_dir}/hosts.ini"
  file_permission = "0644"

  content = templatefile("${path.module}/templates/hosts.ini.tftpl", {
    manager_public_ip  = azurerm_public_ip.manager.ip_address
    manager_private_ip = azurerm_network_interface.manager.private_ip_address
    admin_username     = var.admin_username
    workers            = { for name, nic in azurerm_network_interface.worker : name => nic.private_ip_address }
  })
}

resource "local_sensitive_file" "ansible_tf_outputs" {
  filename        = "${local.ansible_inventory_dir}/tf_outputs.yml"
  file_permission = "0600"

  content = templatefile("${path.module}/templates/tf_outputs.yml.tftpl", {
    resource_group         = azurerm_resource_group.main.name
    acr_login_server       = azurerm_container_registry.main.login_server
    acr_admin_username     = azurerm_container_registry.main.admin_username
    acr_admin_password     = azurerm_container_registry.main.admin_password
    database_host          = azurerm_postgresql_flexible_server.main.fqdn
    database_name          = azurerm_postgresql_flexible_server_database.manachain.name
    database_user          = azurerm_postgresql_flexible_server.main.administrator_login
    database_password      = random_password.postgres_admin.result
    backup_storage_account = azurerm_storage_account.backups.name
    backup_storage_key     = azurerm_storage_account.backups.primary_access_key
    backup_container       = azurerm_storage_container.backups.name
  })
}
