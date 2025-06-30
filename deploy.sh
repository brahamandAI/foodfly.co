#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Install dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Start with PM2
echo "Starting applications with PM2..."
pm2 delete all || true
pm2 start ecosystem.config.js

echo "Deployment completed successfully!" 