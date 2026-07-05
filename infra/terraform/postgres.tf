# Base managée : Azure Database for PostgreSQL Flexible Server, accès privé
# uniquement (subnet délégué), SSL imposé par Azure. Le back se connecte avec
# DATABASE_SSL=true.

resource "random_password" "postgres_admin" {
  length  = 32
  special = false
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                = "pg-${var.project_name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  version                       = "16"
  sku_name                      = "B_Standard_B1ms"
  storage_mb                    = 32768
  backup_retention_days         = 7
  public_network_access_enabled = false

  delegated_subnet_id = azurerm_subnet.postgres.id
  private_dns_zone_id = azurerm_private_dns_zone.postgres.id

  administrator_login    = "manachain_admin"
  administrator_password = random_password.postgres_admin.result

  # Pas de HA (coût) : les sauvegardes Azure + la politique 3-2-1 maison
  # couvrent le besoin de recouvrement du projet.
  zone = "1"

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]
}

# Azure refuse CREATE EXTENSION pour toute extension non allow-listée ici.
# La migration baseline fait `CREATE EXTENSION "uuid-ossp"`.
resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "UUID-OSSP"
}

resource "azurerm_postgresql_flexible_server_database" "manachain" {
  name      = "manachain"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}
