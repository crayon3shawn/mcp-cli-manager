#!/bin/bash

# Clean all dist directories
echo "Cleaning dist directories..."
pnpm -r clean

# Build all packages
echo "Building packages..."
pnpm -r build

# Run tests
echo "Running tests..."
pnpm -r test

# Check build results
echo "Checking build results..."
for package in packages/*; do
  if [ -d "$package" ]; then
    if [ ! -d "$package/dist" ]; then
      echo "Error: $package/dist directory not found"
      exit 1
    fi
  fi
done

echo "Build completed successfully!" 