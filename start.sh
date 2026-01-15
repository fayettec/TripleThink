#!/bin/bash

# ============================================================
# TripleThink v4.1 - Start Script
# Launches API server (port 3000) and GUI (port 8080)
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
  echo -e "${BLUE}▶${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

# ============================================================
# VALIDATION
# ============================================================

print_step "Validating environment..."

if [ ! -d "/app" ]; then
  print_error "App directory not found at /app"
  exit 1
fi

if [ ! -f "/app/api/server.js" ]; then
  print_error "API server not found at /app/api/server.js"
  exit 1
fi

if [ ! -d "/app/gui" ]; then
  print_error "GUI directory not found at /app/gui"
  exit 1
fi

print_success "Environment validated"

# ============================================================
# DATABASE SETUP
# ============================================================

print_step "Checking database..."

if [ ! -f "/app/api/triplethink.db" ]; then
  print_step "Initializing database..."
  cd /app && node db/init-database.js
  if [ $? -eq 0 ]; then
    print_success "Database initialized"
  else
    print_error "Database initialization failed"
    exit 1
  fi
else
  print_success "Database exists"
fi

# ============================================================
# INSTALL DEPENDENCIES
# ============================================================

print_step "Checking dependencies..."

if [ ! -d "/app/node_modules" ]; then
  print_step "Installing root dependencies..."
  cd /app && npm install --silent
  print_success "Root dependencies installed"
fi

if [ ! -d "/app/api/node_modules" ]; then
  print_step "Installing API dependencies..."
  cd /app/api && npm install --silent
  print_success "API dependencies installed"
fi

print_success "All dependencies ready"

# ============================================================
# START SERVERS
# ============================================================

print_step "Starting servers..."

# Create a temp directory for PIDs
PIDFILE_API="/tmp/triplethink-api.pid"
PIDFILE_GUI="/tmp/triplethink-gui.pid"

# Function to cleanup on exit
cleanup() {
  print_step "Shutting down servers..."

  if [ -f "$PIDFILE_API" ]; then
    PID=$(cat "$PIDFILE_API")
    kill $PID 2>/dev/null || true
    rm -f "$PIDFILE_API"
  fi

  if [ -f "$PIDFILE_GUI" ]; then
    PID=$(cat "$PIDFILE_GUI")
    kill $PID 2>/dev/null || true
    rm -f "$PIDFILE_GUI"
  fi

  print_success "Servers stopped"
  exit 0
}

trap cleanup EXIT INT TERM

# Start API server
print_step "Starting API server on port 3000..."
cd /app/api && npm start > /tmp/triplethink-api.log 2>&1 &
API_PID=$!
echo $API_PID > $PIDFILE_API

# Give API time to start
sleep 2

# Check if API started successfully
if ! ps -p $API_PID > /dev/null; then
  print_error "API server failed to start"
  cat /tmp/triplethink-api.log
  exit 1
fi

print_success "API server started (PID: $API_PID)"

# Start GUI server
print_step "Starting GUI server on port 8080..."

# Check if serve is installed globally, if not install it
if ! command -v serve &> /dev/null; then
  print_step "Installing serve..."
  npm install -g serve --silent
fi

serve -s /app/gui -l 8080 > /tmp/triplethink-gui.log 2>&1 &
GUI_PID=$!
echo $GUI_PID > $PIDFILE_GUI

# Give GUI time to start
sleep 2

# Check if GUI started successfully
if ! ps -p $GUI_PID > /dev/null; then
  print_error "GUI server failed to start"
  cat /tmp/triplethink-gui.log
  exit 1
fi

print_success "GUI server started (PID: $GUI_PID)"

# ============================================================
# READY
# ============================================================

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  TripleThink v4.1 is ready!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}API:${NC}     http://localhost:3000"
echo -e "  ${BLUE}GUI:${NC}     http://localhost:8080"
echo ""
echo -e "  ${YELLOW}Logs:${NC}"
echo -e "    API: /tmp/triplethink-api.log"
echo -e "    GUI: /tmp/triplethink-gui.log"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Keep the script running
wait
