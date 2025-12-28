#!/bin/bash

set -eo pipefail

# Current file directory
SCRIPT_DIR=$(dirname "$0")

# TODO: Do I only need - VERCEL_PROJECT_ID_API, VERCEL_PROJECT_ID_WEB, VERCEL_TOKEN?
load_env() {
    echo "Loading environment variables from .env file..."
    if [ ! -f "$SCRIPT_DIR/../../../.env" ]; then
        echo "Error: .env file not found"
        exit 1
    fi

    set -a  # Enable auto-export
    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/../../../.env"
    set +a  # Disable auto-export

    echo "Environment variables loaded successfully"
}

# Remove previous Vercel build artifacts to ensure clean builds.
# Without cleanup, stale artifacts could cause deployment issues.
cleanup_vercel() {
    echo "Cleaning up Vercel directories..."
    rm -rf "$SCRIPT_DIR/../../../.vercel"
    rm -rf "$SCRIPT_DIR/../../../.vercel-api"
    rm -rf "$SCRIPT_DIR/../../../.vercel-web"
    echo "Vercel directories cleaned up successfully"
}

# Remove previous application build outputs.
cleanup_build_output() {
    echo "Cleaning up build output..."
    rm -rf "$SCRIPT_DIR/../../../apps/api/dist"
    rm -rf "$SCRIPT_DIR/../../../apps/web/.next"
    echo "Build output cleaned up successfully"
}

# Node Version Manager (nvm) allows switching between Node.js versions
load_nvm() {
    echo "Loading nvm..."
    export NVM_DIR="$HOME/.nvm"
    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
        echo "Error: nvm not found"
        exit 1
    fi

    # shellcheck source=/dev/null
    source "$NVM_DIR/nvm.sh"

    # Install the version from .nvmrc if not already installed, then use it
    nvm install
    echo "Using Node.js $(node --version)"
}

# We use 'git archive HEAD' to copy files to a temp directory.
# This command only includes COMMITTED files (tracked by git).
ensure_all_committed() {
    echo "Checking if all changes are committed..."
    if git status --porcelain | grep -q "M"; then
        echo "Error: There are uncommitted changes"
        exit 1
    fi
    echo "All changes are committed"
}
