#!/bin/bash
# This script is to build the Web service and deploy it to Vercel.
# It should only be used to test local deployment.
#
# THE WORKFLOW
# ────────────

# ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
# │   Pre-flight │───▶│  Temp Dir    │───▶│   Vercel     │───▶│   Deploy     │
# │   Checks     │    │  Setup       │    │   Build      │    │              │
# └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
#        │                   │                   │                   │
#        ▼                   ▼                   ▼                   ▼
#   • Git clean?        • mktemp -d        • vercel pull       • vercel deploy
#   • .env exists?      • git archive      • vercel build        --prebuilt
#   • Load env vars     • cd $TEMP_DIR

set -eo pipefail

SCRIPT_DIR=$(dirname "$0")

# shellcheck source=/dev/null
source "$SCRIPT_DIR/build-web.sh"

# Deploy the Web service to Vercel from the temporary directory
echo "Deploying Web in temporary directory: $TEMP_DIR"
vercel deploy --prebuilt --prod --yes --cwd "$TEMP_DIR"
echo "Deployed Web in temporary directory: $TEMP_DIR"

# Cleanup the temporary directory
echo "Cleaning up temporary directory: $TEMP_DIR"
rm -rf "$TEMP_DIR"
echo "Cleaned up temporary directory: $TEMP_DIR"

