#!/bin/bash

# Blood Stock Management System - Production Deployment Script

set -e

echo "🚀 Starting Blood Stock Management System deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found! Please copy .env.production.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("DB_PASSWORD" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set!"
        exit 1
    fi
done

echo "📋 Environment variables validated"

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose pull postgres

# Build application images
echo "🔨 Building application images..."
docker-compose build --no-cache

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose down

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
timeout=300
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose exec -T backend curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
        break
    fi
    
    counter=$((counter + 5))
    echo "⏳ Waiting for backend... ($counter/$timeout seconds)"
    sleep 5
done

if [ $counter -ge $timeout ]; then
    echo "❌ Backend failed to become healthy within $timeout seconds"
    docker-compose logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost:${FRONTEND_PORT:-80} > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend may not be accessible yet"
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://localhost:${FRONTEND_PORT:-80}"
echo "   Backend API: http://localhost:3002"
echo "   Health Check: http://localhost:3002/api/health"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"