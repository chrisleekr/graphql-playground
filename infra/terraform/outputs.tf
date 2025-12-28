output "api_project_id" {
  description = "Vercel project ID for API"
  value       = module.vercel.api_project_id
}

output "web_project_id" {
  description = "Vercel project ID for Web"
  value       = module.vercel.web_project_id
}

output "api_domain" {
  description = "All domains assigned to API deployment"
  value       = module.vercel.api_domain
}

output "web_domain" {
  description = "All domains assigned to Web deployment"
  value       = module.vercel.web_domain
}

output "inngest_endpoint" {
  description = "Inngest serve endpoint URL"
  value       = module.vercel.inngest_endpoint
}
