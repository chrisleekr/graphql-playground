output "api_project_id" {
  description = "Vercel project ID for API"
  value       = vercel_project.api.id
}

output "web_project_id" {
  description = "Vercel project ID for Web"
  value       = vercel_project.web.id
}

output "api_project_name" {
  description = "Vercel project name for API"
  value       = vercel_project.api.name
}

output "web_project_name" {
  description = "Vercel project name for Web"
  value       = vercel_project.web.name
}


output "api_domain" {
  description = "All domains assigned to API deployment"
  value       = local.api_domain
}

output "web_domain" {
  description = "All domains assigned to Web deployment"
  value       = local.web_domain
}

output "inngest_endpoint" {
  description = "Inngest serve endpoint URL"
  value       = "${local.api_domain}/api/inngest"
}
