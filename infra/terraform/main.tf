module "vercel" {
  source = "./vercel"

  vercel_api_token = var.vercel_api_token
  vercel_team_id   = var.vercel_team_id
  project_prefix   = var.project_prefix

  database_url        = var.database_url
  database_direct_url = var.database_direct_url
  redis_url           = var.redis_url
  jwt_secret          = var.jwt_secret
  nextauth_secret     = var.nextauth_secret
  inngest_signing_key = var.inngest_signing_key
  inngest_event_key   = var.inngest_event_key
}
