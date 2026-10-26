output "instance_id" {
  description = "ID of the EC2 application host."
  value       = aws_instance.this.id
}

output "public_ip" {
  description = "Public IPv4 address of the EC2 application host."
  value       = aws_instance.this.public_ip
}

output "public_dns" {
  description = "Public DNS name of the EC2 application host."
  value       = aws_instance.this.public_dns
}

output "application_url" {
  description = "HTTP URL for the frontend once the application is running."
  value       = "http://${aws_instance.this.public_dns}:${var.application_port}"
}

output "security_group_id" {
  description = "Security group ID attached to the EC2 application host."
  value       = aws_security_group.this.id
}