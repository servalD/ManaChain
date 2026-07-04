# Médium n°2 de la politique de sauvegarde 3-2-1 : object storage Azure.
# (n°1 : disque de la VM manager ; n°3 : bucket S3/R2 hors Azure via rclone.)

resource "azurerm_storage_account" "backups" {
  name                     = replace("st${var.project_name}bkp", "-", "")
  location                 = azurerm_resource_group.main.location
  resource_group_name      = azurerm_resource_group.main.name
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  # Les dumps DB sont sensibles : accès réseau fermé par défaut, ouvert
  # uniquement au subnet des nœuds (uploads rclone du service backup) et à
  # l'IP admin (Terraform gère les containers en data-plane + vérifs az cli).
  network_rules {
    default_action             = "Deny"
    bypass                     = ["AzureServices"] # services Azure de confiance (métriques, etc.)
    virtual_network_subnet_ids = [azurerm_subnet.nodes.id]
    ip_rules                   = [replace(var.admin_ip_cidr, "/32", "")]
  }
}

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_id    = azurerm_storage_account.backups.id
  container_access_type = "private"
}

# Rétention 30 jours.
resource "azurerm_storage_management_policy" "backups" {
  storage_account_id = azurerm_storage_account.backups.id

  rule {
    name    = "expire-backups"
    enabled = true

    filters {
      prefix_match = ["backups/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 30
      }
    }
  }
}
