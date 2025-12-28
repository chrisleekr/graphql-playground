
# Refer: https://registry.terraform.io/providers/vercel/vercel/latest/docs/resources/project
resource "vercel_project" "api" {
  name = "${var.project_prefix}-api"

  # (String) The framework that is being used for this project. If omitted, no framework is selected.
  framework = "nestjs"

  # (String) The build command for this project. If omitted, this value will be automatically detected.
  build_command = "cd ../../ && bun run build:api"
  # (String) The output directory of the project. If omitted, this value will be automatically detected.
  output_directory = "dist"
  # (String) The install command for this project. If omitted, this value will be automatically detected.
  install_command = "cd ../../ && bun install"
  # (String) The name of a directory or relative path to the source code of your project. If omitted, it will default to the project root.
  root_directory = "apps/api"
}

resource "vercel_project" "web" {
  name = "${var.project_prefix}-web"

  # (String) The framework that is being used for this project. If omitted, no framework is selected.
  framework = "nextjs"

  # (String) The build command for this project. If omitted, this value will be automatically detected.
  build_command = "cd ../../ && bun run build:web"
  # (String) The output directory of the project. If omitted, this value will be automatically detected.
  output_directory = ".next"
  # (String) The install command for this project. If omitted, this value will be automatically detected.
  install_command = "cd ../../ && bun install"
  # (String) The name of a directory or relative path to the source code of your project. If omitted, it will default to the project root.
  root_directory = "apps/web"
}

# Locals for unified project references
locals {
  # Production domains (deterministic for free tier)
  api_domain = "https://${vercel_project.api.name}.vercel.app"
  web_domain = "https://${vercel_project.web.name}.vercel.app"
}


# API-Specific Environment Variables
# Refer: https://registry.terraform.io/providers/vercel/vercel/latest/docs/resources/project_environment_variables
resource "vercel_project_environment_variables" "api" {
  project_id = vercel_project.api.id

  variables = [

    {
      key    = "DATABASE_URL"
      value  = var.database_url
      target = ["production", "preview"]
    },
    {
      key    = "REDIS_URL"
      value  = var.redis_url
      target = ["production", "preview"]
    },
    {
      key    = "JWT_SECRET"
      value  = var.jwt_secret
      target = ["production", "preview"]
    },
    {
      key    = "LOG_LEVEL",
      value  = "trace", # I set to trace for debug.
      target = ["production", "preview"]
    },
    {
      key    = "INNGEST_SERVE_HOST"
      value  = local.api_domain
      target = ["production", "preview"]
    },
    {
      key    = "INNGEST_SIGNING_KEY"
      value  = var.inngest_signing_key
      target = ["production", "preview"]
    },
    {
      key    = "INNGEST_EVENT_KEY"
      value  = var.inngest_event_key
      target = ["production", "preview"]
    },
    {
      key    = "CORS_ORIGIN"
      value  = local.web_domain
      target = ["production", "preview"]
    },
  ]
}

# Web-Specific Environment Variables
resource "vercel_project_environment_variables" "web" {
  project_id = vercel_project.web.id

  variables = [
    {
      key    = "DATABASE_URL"
      value  = var.database_url
      target = ["production", "preview"]
    },
    {
      key    = "REDIS_URL"
      value  = var.redis_url
      target = ["production", "preview"]
    },

    {
      key    = "NEXTAUTH_SECRET"
      value  = var.nextauth_secret
      target = ["production", "preview"]
    },
    {
      key    = "NEXTAUTH_URL"
      value  = local.web_domain
      target = ["production", "preview"]
    },
    {
      key    = "NEXT_PUBLIC_API_URL"
      value  = local.api_domain
      target = ["production", "preview"]
    },
    # Why no NEXT_PUBLIC_: Runtime env vars must be read server-side.
    # NEXT_PUBLIC_ vars are inlined at build time and cannot change per-environment.
    {
      key    = "GRAPHQL_API_URL"
      value  = "${local.api_domain}/graphql"
      target = ["production", "preview"]
    },
  ]
}
