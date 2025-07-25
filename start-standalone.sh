#!/bin/bash

# Copy public assets
cp -r public .next/standalone/

# Ensure .next/standalone/.next exists
mkdir -p .next/standalone/.next

# Copy static assets
cp -r .next/static .next/standalone/.next/

# Start the Next.js standalone server
PORT=3003 node .next/standalone/server.js 