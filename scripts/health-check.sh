#!/bin/bash

# Health Check Script for Consumer TestApp Lanek
# This script checks the health of all services in the Docker Compose stack

set -e

echo "🏥 Consumer TestApp Lanek - Health Check"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"
TIMEOUT=10

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null); then
        if [ "$response" -eq "$expected_status" ]; then
            echo -e "${GREEN}✅ Healthy${NC} (HTTP $response)"
            return 0
        else
            echo -e "${YELLOW}⚠️  Warning${NC} (HTTP $response, expected $expected_status)"
            return 1
        fi
    else
        echo -e "${RED}❌ Unhealthy${NC} (Connection failed)"
        return 1
    fi
}

# Function to check Docker Compose services
check_docker_services() {
    echo "Docker Services:"
    if command -v docker >/dev/null 2>&1; then
        if docker compose ps --format table >/dev/null 2>&1; then
            docker compose ps --format table
        else
            echo -e "${YELLOW}⚠️  Docker Compose not running or not available${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Docker not available${NC}"
    fi
    echo ""
}

# Function to check database connectivity
check_database() {
    echo -n "Checking database connection... "
    
    if command -v docker >/dev/null 2>&1; then
        if docker compose exec -T postgres pg_isready -U postgres -d consumer_testapp >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Healthy${NC}"
            return 0
        else
            echo -e "${RED}❌ Unhealthy${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Cannot check (Docker not available)${NC}"
        return 1
    fi
}

# Main health check
main() {
    local overall_status=0
    
    echo "Service Health Checks:"
    echo "----------------------"
    
    # Check services
    check_service "Frontend" "$FRONTEND_URL" || overall_status=1
    check_service "Backend API" "$BACKEND_URL/api/health" || overall_status=1
    check_database || overall_status=1
    
    echo ""
    check_docker_services
    
    echo "Overall Status:"
    echo "---------------"
    if [ $overall_status -eq 0 ]; then
        echo -e "${GREEN}✅ All services are healthy${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some services are unhealthy${NC}"
        echo ""
        echo "Troubleshooting tips:"
        echo "• Check logs: make docker-logs"
        echo "• Restart services: make docker-restart"
        echo "• Check environment: cat .env"
        exit 1
    fi
}

# Help function
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -q, --quiet    Quiet mode (minimal output)"
    echo "  -v, --verbose  Verbose mode (detailed output)"
    echo ""
    echo "This script checks the health of all Consumer TestApp Lanek services."
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -q|--quiet)
            # Redirect output for quiet mode
            exec >/dev/null 2>&1
            shift
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main