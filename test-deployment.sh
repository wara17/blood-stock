#!/bin/bash
# test-deployment.sh - Script to test deployment health

echo "🔍 Testing Blood Stock App Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --connect-timeout 10)
    
    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
        return 1
    fi
}

# Function to check container health
check_container() {
    local container_name=$1
    local description=$2
    
    echo -n "Checking $description container... "
    
    status=$(docker-compose ps --format "table {{.Name}}\t{{.Status}}" | grep "$container_name" | awk '{print $2}')
    
    if [[ "$status" == "Up" ]]; then
        echo -e "${GREEN}✓ RUNNING${NC}"
    else
        echo -e "${RED}✗ NOT RUNNING${NC} (Status: $status)"
        return 1
    fi
}

# Set base URL (change if different)
BASE_URL="http://localhost"
API_URL="$BASE_URL/api"

echo
echo "1. Container Health Checks"
echo "=========================="

check_container "postgres" "Database (PostgreSQL)"
check_container "backend" "Backend API"
check_container "frontend" "Frontend (Nginx)"

echo
echo "2. API Endpoint Tests"
echo "===================="

# Test backend health
test_endpoint "$API_URL/health" "Backend Health Check"

# Test frontend
test_endpoint "$BASE_URL" "Frontend (Homepage)"

# Test API endpoints (these might return 401 but should be reachable)
test_endpoint "$API_URL/auth/profile" "Auth Profile Endpoint" 401

echo
echo "3. Database Connection Test"
echo "=========================="

# Test database through backend
echo -n "Testing database connection... "
db_response=$(docker-compose exec -T backend node -e "
const { testConnection } = require('./config/database');
testConnection().then(() => console.log('OK')).catch(() => console.log('ERROR'));
" 2>/dev/null)

if [[ "$db_response" == *"OK"* ]]; then
    echo -e "${GREEN}✓ CONNECTED${NC}"
else
    echo -e "${RED}✗ CONNECTION FAILED${NC}"
fi

echo
echo "4. Resource Usage"
echo "================="

echo "Container resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo
echo "5. Logs Summary"
echo "==============="

echo "Recent backend logs:"
docker-compose logs --tail=5 backend

echo
echo "Recent frontend logs:"
docker-compose logs --tail=5 frontend

echo
echo "🎯 Deployment Test Complete!"
echo
echo "Access your application:"
echo "📱 Frontend: $BASE_URL"
echo "🔌 Backend API: $API_URL"
echo "📊 Health Check: $API_URL/health"
echo
echo "Useful commands:"
echo "🔍 Monitor logs: docker-compose logs -f"
echo "📈 Check status: docker-compose ps"
echo "🔄 Restart: docker-compose restart"
echo "🛑 Stop: docker-compose down"