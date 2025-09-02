#!/bin/bash
set -e

echo "Starting Federal Deregulation Analysis Tool..."

# Wait a moment for any final database setup
sleep 2

echo "Running database migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

# Only run ingestion if RUN_INGESTION is set to true
if [ "$RUN_INGESTION" = "true" ]; then
    echo "RUN_INGESTION is set to true - Starting data ingestion..."
    # npm run ingest -- --max-agencies=10
    npm run ingest:all
else
    echo "Skipping data ingestion (RUN_INGESTION not set to true)"
fi

echo "Starting Next.js development server..."
npm run dev
