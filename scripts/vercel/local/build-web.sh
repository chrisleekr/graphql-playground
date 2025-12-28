#!/bin/bash
# This script is to build the Web service for Vercel and prepare it for deployment.
# It should only be used to test local deployment.
#
# Why prebuilt deployment?
#  This projects uses self-hosted GitLab without native Vercel Git integration.
#  Instead of letting Vercel pull from Git and build, I will
#  1. Build locally
#  2. Deploy the prebuilt artifacts
#
# Why temporary directory?
#  In a monorepo, `vercel build` creates a `.vercel/` directory in the root directory.
#  If build API and Web in the same directory, they will overwrite each other's `.vercel/` directory.
#  To avoid this, I copy the entire monorepo to a temporary directory and build in that directory.

set -eo pipefail

SCRIPT_DIR=$(dirname "$0")

# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

# Prevent deploying uncommitted changes
ensure_all_committed
load_env

# Clean up previous Vercel build artifacts and build outputs
cleanup_vercel
cleanup_build_output

# Set Vercel project ID for the Web service
export VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID_WEB

TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Create isolated build environment
# Copy all files to the temporary directory
# Note: This is a workaround to avoid collision with other services because vercel deploy --prebuilt requires a .vercel directory in the current working directory but build should be done with all services in the same directory.
# Create a tar archive of tracked files only, then extract
echo "Creating tar archive of tracked files and extracting to temporary directory..."
git -C "$SCRIPT_DIR/../../../" archive --format=tar HEAD | tar -xf - -C "$TEMP_DIR/"

# Change to the temporary directory
cd "$TEMP_DIR"

# Load nvm and use the version from .nvmrc
load_nvm && nvm use

# Pull Vercel project configuration for the Web service
vercel pull --environment=production --yes
echo "Pulled projects to temporary directory: $TEMP_DIR"

# Use Vercel CLI to build the Web service
vercel build --prod
echo "Built Web in temporary directory: $TEMP_DIR"

# Export the temporary directory
export TEMP_DIR
echo "Built Web in temporary directory: $TEMP_DIR"
