variable "name" {
  description = "Name for the VPC resource."
  type        = string
}

variable "environment" {
  description = "Environment name used in resource tags and subnet names."
  type        = string
}

variable "vpc_cidr" {
  description = "IPv4 CIDR block for the VPC. Ensure it does not overlap with connected networks."
  type        = string
  default     = "10.20.0.0/16"
}

variable "availability_zones" {
  description = "Exactly two AZ names in the selected AWS region."
  type        = list(string)
  validation {
    condition     = length(var.availability_zones) == 2 && length(distinct(var.availability_zones)) == 2
    error_message = "Provide exactly two unique Availability Zones."
  }
}

variable "public_subnet_cidrs" {
  description = "One public subnet CIDR per AZ."
  type        = list(string)
  default     = ["10.20.0.0/24", "10.20.1.0/24"]
  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "Provide exactly two public subnet CIDRs."
  }
}

variable "private_subnet_cidrs" {
  description = "One private application subnet CIDR per AZ."
  type        = list(string)
  default     = ["10.20.16.0/20", "10.20.32.0/20"]
  validation {
    condition     = length(var.private_subnet_cidrs) == 2
    error_message = "Provide exactly two private subnet CIDRs."
  }
}

variable "database_subnet_cidrs" {
  description = "One isolated database subnet CIDR per AZ."
  type        = list(string)
  default     = ["10.20.64.0/24", "10.20.65.0/24"]
  validation {
    condition     = length(var.database_subnet_cidrs) == 2
    error_message = "Provide exactly two database subnet CIDRs."
  }
}

variable "tags" {
  description = "Additional tags applied to supported resources."
  type        = map(string)
  default     = {}
}
