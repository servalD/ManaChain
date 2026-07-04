# Registre Docker (exigence du sujet). admin_enabled : identifiants simples
# consommés par la CI (push) et par les nœuds Swarm (pull) — suffisant pour le
# projet ; passer à un service principal si besoin de granularité.
resource "azurerm_container_registry" "main" {
  name                = replace("acr${var.project_name}", "-", "")
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Basic"
  admin_enabled       = true
}
