# Cluster Swarm : 1 manager (seule VM avec IP publique) + N workers privés.
# Le provisionnement logiciel (Docker, ufw, swarm init/join) est du ressort
# d'Ansible — cloud-init reste volontairement minimal.

locals {
  vm_image = {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }
  workers = { for i in range(var.worker_count) : "worker-${i + 1}" => i }
}

resource "azurerm_network_interface" "manager" {
  name                = "nic-${var.project_name}-manager"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.nodes.id
    private_ip_address_allocation = "Static"
    private_ip_address            = "10.10.1.10"
    public_ip_address_id          = azurerm_public_ip.manager.id
  }
}

resource "azurerm_network_interface" "worker" {
  for_each = local.workers

  name                = "nic-${var.project_name}-${each.key}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.nodes.id
    private_ip_address_allocation = "Static"
    private_ip_address            = "10.10.1.${11 + each.value}"
  }
}

resource "azurerm_linux_virtual_machine" "manager" {
  name                  = "vm-${var.project_name}-manager"
  location              = azurerm_resource_group.main.location
  resource_group_name   = azurerm_resource_group.main.name
  size                  = var.vm_size
  admin_username        = var.admin_username
  network_interface_ids = [azurerm_network_interface.manager.id]

  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = 64
  }

  source_image_reference {
    publisher = local.vm_image.publisher
    offer     = local.vm_image.offer
    sku       = local.vm_image.sku
    version   = local.vm_image.version
  }
}

resource "azurerm_linux_virtual_machine" "worker" {
  for_each = local.workers

  name                  = "vm-${var.project_name}-${each.key}"
  location              = azurerm_resource_group.main.location
  resource_group_name   = azurerm_resource_group.main.name
  size                  = var.vm_size
  admin_username        = var.admin_username
  network_interface_ids = [azurerm_network_interface.worker[each.key].id]

  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = 32
  }

  source_image_reference {
    publisher = local.vm_image.publisher
    offer     = local.vm_image.offer
    sku       = local.vm_image.sku
    version   = local.vm_image.version
  }
}

# Filet de sécurité budget : extinction (deallocate) quotidienne automatique,
# le cluster n'étant allumé que pour tester/démontrer.
resource "azurerm_dev_test_global_vm_shutdown_schedule" "manager" {
  count = var.auto_shutdown_time == "" ? 0 : 1

  virtual_machine_id    = azurerm_linux_virtual_machine.manager.id
  location              = azurerm_resource_group.main.location
  enabled               = true
  daily_recurrence_time = var.auto_shutdown_time
  timezone              = "Romance Standard Time"

  notification_settings {
    enabled = false
  }
}

resource "azurerm_dev_test_global_vm_shutdown_schedule" "worker" {
  for_each = var.auto_shutdown_time == "" ? {} : local.workers

  virtual_machine_id    = azurerm_linux_virtual_machine.worker[each.key].id
  location              = azurerm_resource_group.main.location
  enabled               = true
  daily_recurrence_time = var.auto_shutdown_time
  timezone              = "Romance Standard Time"

  notification_settings {
    enabled = false
  }
}
