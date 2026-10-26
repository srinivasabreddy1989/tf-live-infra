variable "name" {
  description = "Name for the EC2 application host."
  type        = string
}

variable "environment" {
  description = "Environment name applied to resource tags."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the EC2 security group."
  type        = string
}

variable "public_subnet_id" {
  description = "Public subnet ID in which to launch the instance."
  type        = string
}

variable "ssh_key_name" {
  description = "Existing EC2 key-pair name used for SSH access."
  type        = string
}

variable "ssh_ingress_cidrs" {
  description = "IPv4 CIDRs allowed to connect to SSH. Restrict this to trusted addresses."
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type for the Docker Compose application host."
  type        = string
  default     = "t3.medium"
}

variable "application_port" {
  description = "Public frontend port exposed by the application."
  type        = number
  default     = 8080
  validation {
    condition     = var.application_port >= 1 && var.application_port <= 65535
    error_message = "The application port must be between 1 and 65535."
  }
}

variable "ingress_cidrs" {
  description = "IPv4 CIDRs allowed to reach the frontend port."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "root_volume_size" {
  description = "Encrypted root EBS volume size in GiB."
  type        = number
  default     = 30
  validation {
    condition     = var.root_volume_size >= 8
    error_message = "The root volume must be at least 8 GiB."
  }
}

variable "tags" {
  description = "Additional tags applied to supported resources."
  type        = map(string)
  default     = {}
}