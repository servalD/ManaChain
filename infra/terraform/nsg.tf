# Pare-feu Azure (NSG) — première couche ; ufw sur les hôtes (Ansible) fait la
# seconde. Les règles par défaut Azure autorisent déjà l'intra-VNet (65000) et
# refusent tout le reste en entrée (65500) ; on rend néanmoins les flux Swarm
# explicites pour la lisibilité.

resource "azurerm_network_security_group" "manager" {
  name                = "nsg-${var.project_name}-manager"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "allow-ssh-admin"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.admin_ip_cidr
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-http"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-https"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_security_group" "worker" {
  name                = "nsg-${var.project_name}-worker"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  # Ports du plan de contrôle/données Swarm, uniquement depuis le VNet :
  # 2377/tcp (management), 7946/tcp+udp (gossip), 4789/udp (overlay VXLAN).
  security_rule {
    name                       = "allow-swarm-vnet"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_ranges    = ["2377", "7946", "4789"]
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_interface_security_group_association" "manager" {
  network_interface_id      = azurerm_network_interface.manager.id
  network_security_group_id = azurerm_network_security_group.manager.id
}

resource "azurerm_network_interface_security_group_association" "worker" {
  for_each = azurerm_network_interface.worker

  network_interface_id      = each.value.id
  network_security_group_id = azurerm_network_security_group.worker.id
}
