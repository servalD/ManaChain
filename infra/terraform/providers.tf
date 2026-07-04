# Provisionnement Azure de ManaChain (Projet Annuel).
# State local par défaut : suffisant pour un projet mono-équipe ; passer à un
# backend azurerm (Storage Account) si le state doit être partagé.
terraform {
  required_version = ">= 1.7"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

provider "azurerm" {
  features {}
}
