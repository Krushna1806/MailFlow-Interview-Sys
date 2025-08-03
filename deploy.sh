#!/bin/bash

# MailFlow Deployment Script
# This script helps deploy MailFlow to various cloud platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║                          MailFlow Deployer                          ║"
    echo "║                    AI-Powered Email Marketing Platform              ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if required tools are installed
    command -v node >/dev/null 2>&1 || log_error "Node.js is required but not installed."
    command -v npm >/dev/null 2>&1 || log_error "npm is required but not installed."
    command -v git >/dev/null 2>&1 || log_error "git is required but not installed."
    
    log_success "All dependencies are installed"
}

setup_environment() {
    log_info "Setting up environment variables..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "Created .env file from .env.example. Please update with your actual values."
        else
            log_error ".env.example file not found. Please create environment configuration."
        fi
    fi
    
    # Check for critical environment variables
    if [ -z "$MONGODB_URI" ] && [ -z "$DATABASE_URL" ]; then
        log_warning "Database connection string not found. Make sure to set MONGODB_URI or DATABASE_URL."
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        # Generate a random JWT secret
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
        echo "JWT_SECRET=$JWT_SECRET" >> .env
        log_success "Generated JWT_SECRET"
    fi
    
    log_success "Environment setup complete"
}

build_application() {
    log_info "Building application..."
    
    # Install backend dependencies
    log_info "Installing backend dependencies..."
    cd backend
    npm ci --only=production
    cd ..
    
    # Install frontend dependencies and build
    log_info "Building frontend..."
    npm ci
    npm run build
    
    log_success "Application built successfully"
}

deploy_railway() {
    log_info "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI is not installed. Install it from: https://railway.app/cli"
    fi
    
    # Login check
    if ! railway whoami &> /dev/null; then
        log_info "Please login to Railway first:"
        railway login
    fi
    
    # Deploy
    railway up
    
    log_success "Deployed to Railway successfully!"
    log_info "Your application should be available at your Railway domain"
}

deploy_vercel() {
    log_info "Deploying frontend to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed. Install it with: npm i -g vercel"
    fi
    
    # Deploy frontend
    vercel --prod
    
    log_success "Frontend deployed to Vercel successfully!"
    log_warning "Don't forget to deploy your backend separately (Railway, Heroku, etc.)"
}

deploy_docker() {
    log_info "Deploying with Docker..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
    fi
    
    # Build and run with docker-compose
    docker-compose down
    docker-compose build
    docker-compose up -d
    
    log_success "Application deployed with Docker!"
    log_info "Frontend: http://localhost:3000"
    log_info "Backend: http://localhost:8000"
    log_info "MailHog (Email testing): http://localhost:8025"
}

deploy_heroku() {
    log_info "Deploying to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        log_error "Heroku CLI is not installed. Install it from: https://devcenter.heroku.com/articles/heroku-cli"
    fi
    
    # Login check
    if ! heroku auth:whoami &> /dev/null; then
        log_info "Please login to Heroku first:"
        heroku login
    fi
    
    # Create Heroku app if it doesn't exist
    if [ -z "$HEROKU_APP_NAME" ]; then
        read -p "Enter Heroku app name: " HEROKU_APP_NAME
    fi
    
    # Create app
    heroku create $HEROKU_APP_NAME 2>/dev/null || log_info "App already exists"
    
    # Add MongoDB addon
    heroku addons:create mongolab:sandbox -a $HEROKU_APP_NAME 2>/dev/null || log_info "MongoDB addon already exists"
    
    # Add Redis addon
    heroku addons:create heroku-redis:hobby-dev -a $HEROKU_APP_NAME 2>/dev/null || log_info "Redis addon already exists"
    
    # Set environment variables
    heroku config:set NODE_ENV=production -a $HEROKU_APP_NAME
    heroku config:set JWT_SECRET=$(openssl rand -base64 32) -a $HEROKU_APP_NAME
    
    # Deploy
    git push heroku main
    
    log_success "Deployed to Heroku successfully!"
    heroku open -a $HEROKU_APP_NAME
}

show_post_deployment() {
    log_success "Deployment completed!"
    echo
    log_info "🚀 Your MailFlow application is now deployed!"
    echo
    log_info "📋 Post-deployment checklist:"
    echo "   • Update environment variables with production values"
    echo "   • Configure email service (SendGrid, etc.)"
    echo "   • Set up domain and SSL certificates"
    echo "   • Configure OpenAI API key for AI features"
    echo "   • Set up monitoring and logging"
    echo "   • Test email functionality"
    echo
    log_info "📚 Documentation: https://github.com/your-repo/mailflow"
    log_info "🆘 Support: https://github.com/your-repo/mailflow/issues"
}

# Main script
main() {
    print_banner
    
    DEPLOYMENT_TARGET=${1:-""}
    
    if [ -z "$DEPLOYMENT_TARGET" ]; then
        echo "Please select a deployment option:"
        echo "1) Railway (Full-stack)"
        echo "2) Vercel (Frontend only)"
        echo "3) Docker (Local/VPS)"
        echo "4) Heroku (Full-stack)"
        echo "5) Build only"
        echo
        read -p "Enter your choice (1-5): " choice
        
        case $choice in
            1) DEPLOYMENT_TARGET="railway";;
            2) DEPLOYMENT_TARGET="vercel";;
            3) DEPLOYMENT_TARGET="docker";;
            4) DEPLOYMENT_TARGET="heroku";;
            5) DEPLOYMENT_TARGET="build";;
            *) log_error "Invalid choice";;
        esac
    fi
    
    check_dependencies
    setup_environment
    
    case $DEPLOYMENT_TARGET in
        "railway")
            build_application
            deploy_railway
            ;;
        "vercel")
            build_application
            deploy_vercel
            ;;
        "docker")
            deploy_docker
            ;;
        "heroku")
            build_application
            deploy_heroku
            ;;
        "build")
            build_application
            log_success "Build completed. Files are ready for deployment."
            ;;
        *)
            log_error "Unknown deployment target: $DEPLOYMENT_TARGET"
            ;;
    esac
    
    show_post_deployment
}

# Handle script interruption
trap 'log_error "Deployment interrupted"' INT TERM

# Run main function
main "$@"