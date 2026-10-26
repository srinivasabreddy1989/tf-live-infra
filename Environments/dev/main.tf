terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.80, < 7.0"
    }
  }
}

locals {
  environment = "dev"
  aws_region  = "us-east-1"
}

provider "aws" {
  region = local.aws_region
}

module "vpc" {
  source = "../../modules/vpc"

  name               = "vpc-dev"
  environment        = local.environment
  availability_zones = ["us-east-1a", "us-east-1b"]

  tags = {
    Environment = local.environment
    Region      = local.aws_region
  }
}

module "app_server" {
  source = "../../modules/ec2"

  name              = "bus-travel-dev-ec2"
  environment       = local.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_id  = module.vpc.public_subnet_ids[0]
  ssh_key_name      = "devops"
  ssh_ingress_cidrs = ["0.0.0.0/0"]
  application_port  = 8080
  ingress_cidrs     = ["0.0.0.0/0"]
  instance_type     = "t3.medium"

  tags = {
    Environment = local.environment
    Region      = local.aws_region
  }
}