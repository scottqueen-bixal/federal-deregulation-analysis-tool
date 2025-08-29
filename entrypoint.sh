#!/bin/bash
set -e

echo "Starting Federal Deregulation Analysis Tool..."

# Wait a moment for any final database setup
sleep 2

echo "Running database migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Starting data ingestion..."
npm run ingest -- --max-agencies=30

echo "Starting Next.js development server..."
npm run dev
