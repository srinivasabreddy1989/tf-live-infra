output "vpc_id" {
  description = "ID of the dev VPC."
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the dev public subnets."
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the dev private application subnets."
  value       = module.vpc.private_subnet_ids
}

output "database_subnet_ids" {
  description = "IDs of the dev database subnets."
  value       = module.vpc.database_subnet_ids
}

output "app_server_instance_id" {
  description = "ID of the dev application EC2 instance."
  value       = module.app_server.instance_id
}

output "app_server_public_ip" {
  description = "Public IP of the dev application EC2 instance."
  value       = module.app_server.public_ip
}

output "app_server_public_dns" {
  description = "Public DNS name of the dev application EC2 instance."
  value       = module.app_server.public_dns
}

output "application_url" {
  description = "Frontend URL once the application has been deployed."
  value       = module.app_server.application_url
}