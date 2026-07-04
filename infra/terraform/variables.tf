variable "project_name" {
  description = "Préfixe des ressources Azure."
  type        = string
  default     = "manachain"
}

variable "location" {
  description = "Région Azure."
  type        = string
  default     = "swedencentral"
}

variable "admin_ip_cidr" {
  description = "IP publique (CIDR /32) autorisée à SSH sur le manager — la tienne."
  type        = string
}

variable "ssh_public_key_path" {
  description = "Chemin de la clé publique SSH injectée sur les VMs."
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "admin_username" {
  description = "Utilisateur admin des VMs."
  type        = string
  default     = "azureuser"
}

variable "vm_size" {
  description = "Taille des VMs du cluster Swarm."
  type        = string
  default     = "Standard_B2s_v2"
}

variable "worker_count" {
  description = "Nombre de workers Swarm (en plus du manager)."
  type        = number
  default     = 2
}

variable "auto_shutdown_time" {
  description = "Heure d'extinction automatique quotidienne des VMs (HHmm, heure de Paris) — filet de sécurité budget puisque le cluster ne doit pas tourner h24. Mettre \"\" pour désactiver."
  type        = string
  default     = "2000"
}
