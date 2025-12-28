# Vercel Configuration
variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID (optional, for team deployments)"
  type        = string
  default     = null
}

variable "project_prefix" {
  description = "Prefix for Vercel project names"
  type        = string
  default     = "graphql-playground"
}

# Database
variable "database_url" {
  description = "PostgreSQL connection URL (pooled, with pgbouncer)"
  type        = string
  sensitive   = true
}

variable "database_direct_url" {
  description = "PostgreSQL direct connection URL (for migrations)"
  type        = string
  sensitive   = true
}

# Redis
variable "redis_url" {
  description = "Redis connection URL"
  type        = string
  sensitive   = true
}

# Authentication
variable "jwt_secret" {
  description = "JWT signing secret (32+ characters)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT secret must be at least 32 characters."
  }
}

variable "nextauth_secret" {
  description = "NextAuth.js secret (32+ characters)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.nextauth_secret) >= 32
    error_message = "NextAuth.js secret must be at least 32 characters."
  }
}

# Inngest
variable "inngest_signing_key" {
  description = "Inngest signing key"
  type        = string
  sensitive   = true
}

variable "inngest_event_key" {
  description = "Inngest event key"
  type        = string
  sensitive   = true
}
