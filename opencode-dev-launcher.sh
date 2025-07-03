#!/bin/bash

# OpenCode Dev Launcher Script
# This script properly launches the development version of opencode

# Change to the opencode package directory
cd "$(dirname "$0")/packages/opencode"

# Run the development version using bun
exec bun run ./src/index.ts "$@"