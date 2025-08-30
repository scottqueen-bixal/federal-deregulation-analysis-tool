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
if [ "$NODE_ENV" = "production" ]; then
  echo "Production environment detected - ingesting all agencies"
  npm run ingest:all
else
  echo "Development environment - ingesting 30 agencies for testing"
  npm run ingest -- --max-agencies=30
fi

echo "Starting Next.js development server..."
npm run dev
