#!/bin/bash

# PromptFoo AI Validation - Quick Run (Bash Wrapper)
# 
# Usage: 
#   bash scripts/quick-run.sh
#   OR
#   ./scripts/quick-run.sh (after chmod +x)
#
# Features:
# - Auto-detects OS (macOS, Linux, Windows)
# - Sets up environment variables
# - Runs the Node.js self-healing script
# - Handles errors gracefully

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# Utility functions
print_header() {
  echo -e "\n${CYAN}${BOLD}=== $1 ===${RESET}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${RESET}"
}

print_error() {
  echo -e "${RED}❌ $1${RESET}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${RESET}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${RESET}"
}

# Check OS
detect_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
  else
    OS="unknown"
  fi
  
  print_info "Detected OS: $OS"
}

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"

  if ! command -v node &> /dev/null; then
    print_error "Node.js not found"
    print_info "Install from: https://nodejs.org"
    exit 1
  fi
  NODE_VERSION=$(node --version)
  print_success "Node.js: $NODE_VERSION"

  if ! command -v npm &> /dev/null; then
    print_error "npm not found"
    exit 1
  fi
  NPM_VERSION=$(npm --version)
  print_success "npm: $NPM_VERSION"

  if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python3: $PYTHON_VERSION"
  else
    print_warning "Python3 not found (HTML report generation will be skipped)"
  fi
}

# Setup environment
setup_environment() {
  print_header "Setting Up Environment"

  # Check for API key
  if [ -z "$OPENAI_API_KEY" ]; then
    print_warning "OPENAI_API_KEY not set in environment"
    
    if [ -f ".env" ]; then
      print_info "Loading from .env file..."
      export $(cat .env | grep OPENAI_API_KEY)
      
      if [ -z "$OPENAI_API_KEY" ]; then
        print_error "OPENAI_API_KEY not found in .env"
        print_info "Add to .env: OPENAI_API_KEY=sk-your-key"
        exit 1
      else
        MASKED_KEY="${OPENAI_API_KEY:0:7}...${OPENAI_API_KEY: -4}"
        print_success "Loaded API key from .env: $MASKED_KEY"
      fi
    else
      print_error "No .env file found and OPENAI_API_KEY not set"
      print_info "Set via: export OPENAI_API_KEY='sk-your-key'"
      print_info "Or create .env file with: OPENAI_API_KEY=sk-your-key"
      exit 1
    fi
  else
    MASKED_KEY="${OPENAI_API_KEY:0:7}...${OPENAI_API_KEY: -4}"
    print_success "OPENAI_API_KEY is set: $MASKED_KEY"
  fi

  # Ensure directories exist
  mkdir -p tests ai-evaluation scripts test-data
  print_success "Project directories ready"
}

# Run the Node.js quick-run script
run_quick_run() {
  print_header "Starting AI Validation Workflow"
  
  if [ ! -f "scripts/quick-run.js" ]; then
    print_error "scripts/quick-run.js not found"
    print_info "Please ensure quick-run.js is in scripts/ directory"
    exit 1
  fi

  # Run with API key exported
  export OPENAI_API_KEY="$OPENAI_API_KEY"
  node scripts/quick-run.js
  
  return $?
}

# View results
view_results() {
  if [ -f "ai-evaluation/report.html" ]; then
    print_success "HTML Report generated successfully"
    
    case $OS in
      macos)
        print_info "Opening report in browser..."
        open ai-evaluation/report.html
        ;;
      linux)
        if command -v xdg-open &> /dev/null; then
          print_info "Opening report in browser..."
          xdg-open ai-evaluation/report.html
        else
          print_info "Open report manually: ai-evaluation/report.html"
        fi
        ;;
      windows)
        print_info "Opening report in browser..."
        start ai-evaluation/report.html
        ;;
      *)
        print_info "Open report manually: ai-evaluation/report.html"
        ;;
    esac
  fi
}

# Main execution
main() {
  echo -e "${CYAN}${BOLD}"
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║  🚀 PromptFoo AI Validation - Self-Healing Quick Run            ║"
  echo "║                                                                ║"
  echo "║  This script will:                                             ║"
  echo "║  1. Validate prerequisites (Node.js, npm, Python)              ║"
  echo "║  2. Check environment and API keys                             ║"
  echo "║  3. Run Playwright tests (collect responses)                   ║"
  echo "║  4. Format responses for PromptFoo                             ║"
  echo "║  5. Run GPT-4 evaluation                                       ║"
  echo "║  6. Generate beautiful HTML report                             ║"
  echo "║                                                                ║"
  echo "║  Estimated time: 5-10 minutes                                  ║"
  echo "║  Cost: ~$0.50-$1.00 (GPT-4 API calls)                          ║"
  echo "╚════════════════════════════════════════════════════════════════╝${RESET}\n"

  detect_os
  check_prerequisites
  setup_environment
  
  echo -e "\n${GREEN}${BOLD}Ready to start workflow...${RESET}\n"
  sleep 2
  
  run_quick_run
  RESULT=$?
  
  view_results
  
  exit $RESULT
}

# Run main
main
