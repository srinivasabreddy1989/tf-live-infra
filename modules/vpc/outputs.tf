output "vpc_id" {
  description = "ID of the VPC."
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "IPv4 CIDR of the VPC."
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs by AZ index."
  value       = [for key in sort(keys(aws_subnet.public)) : aws_subnet.public[key].id]
}

output "private_subnet_ids" {
  description = "Private application subnet IDs by AZ index."
  value       = [for key in sort(keys(aws_subnet.private)) : aws_subnet.private[key].id]
}

output "database_subnet_ids" {
  description = "Isolated database subnet IDs."
  value       = [for key in sort(keys(aws_subnet.database)) : aws_subnet.database[key].id]
}

output "public_subnet_cidrs" {
  description = "Public subnet CIDRs."
  value       = [for key in sort(keys(aws_subnet.public)) : aws_subnet.public[key].cidr_block]
}

output "private_subnet_cidrs" {
  description = "Private application subnet CIDRs."
  value       = [for key in sort(keys(aws_subnet.private)) : aws_subnet.private[key].cidr_block]
}

output "database_subnet_cidrs" {
  description = "Database subnet CIDRs."
  value       = [for key in sort(keys(aws_subnet.database)) : aws_subnet.database[key].cidr_block]
}

