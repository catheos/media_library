#!/bin/bash
set -e

echo "🏗️  Building..."

cd frontend
npm install
npm run build
cd ..

docker-compose build

echo "✅ Done!"
echo ""
echo "docker-compose up -d    # Start"
echo "docker-compose logs -f  # Logs"
echo "docker-compose down     # Stop"