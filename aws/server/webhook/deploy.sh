#!/bin/bash
# zero downtime deployment script for oneparent vic server
# implements blue-green deployment with health checks

set -e  # exit on any error

# configuration
PROJECT_DIR="/home/ec2-user/oneparent-vic"
SERVER_DIR="$PROJECT_DIR/server"
REPO_URL="https://github.com/iamtanuj18/oneparent-vic.git"
BRANCH="main"
LOG_FILE="$PROJECT_DIR/webhook/deployment.log"

# logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# health check function
check_health() {
    local port=$1
    local max_attempts=30
    local attempt=1
    
    log "checking health on port $port"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 5 "http://127.0.0.1:$port/api/api-status" > /dev/null 2>&1; then
            log "health check passed on port $port"
            return 0
        fi
        
        log "health check attempt $attempt/$max_attempts failed, retrying in 2 seconds"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log "health check failed on port $port after $max_attempts attempts"
    return 1
}

# get current active deployment
get_active_deployment() {
    if docker ps --format "table {{.Names}}" | grep -q "oneparent-server-blue"; then
        if docker ps --format "table {{.Names}}" | grep -q "oneparent-server-green"; then
            # both running, check which is active in nginx
            if grep -q "127.0.0.1:5000" /etc/nginx/conf.d/oneparent-vic.conf; then
                echo "blue"
            else
                echo "green"
            fi
        else
            echo "blue"
        fi
    elif docker ps --format "table {{.Names}}" | grep -q "oneparent-server-green"; then
        echo "green"
    else
        echo "none"
    fi
}

# main deployment function
deploy() {
    log "starting zero downtime deployment"
    
    # determine current active deployment
    current_deployment=$(get_active_deployment)
    log "current active deployment: $current_deployment"
    
    # determine target deployment
    if [ "$current_deployment" = "blue" ]; then
        target_deployment="green"
        target_port="5001"
        old_deployment="blue"
    elif [ "$current_deployment" = "green" ]; then
        target_deployment="blue"
        target_port="5000"
        old_deployment="green"
    else
        # no deployment running, default to blue
        target_deployment="blue"
        target_port="5000"
        old_deployment="none"
    fi
    
    log "deploying to: $target_deployment (port $target_port)"
    
    # create project directory if it doesn't exist
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # git operations
    if [ -d ".git" ]; then
        log "updating existing repository"
        git fetch origin
        git reset --hard origin/$BRANCH
    else
        log "cloning repository"
        git clone "$REPO_URL" .
        git checkout "$BRANCH"
    fi
    
    # copy server files to deployment location
    log "copying server files"
    cp -r server/* "$SERVER_DIR/"
    
    # copy environment file
    if [ -f "$SERVER_DIR/.env.production" ]; then
        log "using existing production environment file"
    else
        log "creating production environment file from template"
        cp "$SERVER_DIR/.env.production.template" "$SERVER_DIR/.env.production"
        log "warning: please update .env.production with actual values"
    fi
    
    # build docker image
    log "building docker image"
    cd "$SERVER_DIR"
    docker build -t oneparent-vic-server:latest .
    
    # start target deployment
    log "starting $target_deployment deployment"
    if [ "$target_deployment" = "blue" ]; then
        docker-compose -f docker-compose.prod.yml up -d oneparent-server-blue
    else
        docker-compose -f docker-compose.prod.yml --profile green-deployment up -d oneparent-server-green
    fi
    
    # wait for container to be ready
    log "waiting for container to start"
    sleep 10
    
    # health check on new deployment
    if check_health "$target_port"; then
        log "new deployment healthy, updating nginx configuration"
        
        # update nginx upstream configuration
        if [ "$target_deployment" = "blue" ]; then
            # switch to blue (port 5000)
            sed -i 's/127\.0\.0\.1:5001/127.0.0.1:5000/g' /etc/nginx/conf.d/oneparent-vic.conf
        else
            # switch to green (port 5001)
            sed -i 's/127\.0\.0\.1:5000/127.0.0.1:5001/g' /etc/nginx/conf.d/oneparent-vic.conf
        fi
        
        # reload nginx configuration
        sudo nginx -t && sudo nginx -s reload
        log "nginx configuration reloaded"
        
        # wait a moment for nginx to switch
        sleep 5
        
        # remove old deployment if it exists
        if [ "$old_deployment" != "none" ]; then
            log "removing old $old_deployment deployment"
            if [ "$old_deployment" = "blue" ]; then
                docker-compose -f docker-compose.prod.yml stop oneparent-server-blue
                docker-compose -f docker-compose.prod.yml rm -f oneparent-server-blue
            else
                docker-compose -f docker-compose.prod.yml stop oneparent-server-green
                docker-compose -f docker-compose.prod.yml rm -f oneparent-server-green
            fi
        fi
        
        # cleanup old docker images
        log "cleaning up old docker images"
        docker image prune -f
        
        log "deployment completed successfully"
        
    else
        log "new deployment failed health check, rolling back"
        
        # stop failed deployment
        if [ "$target_deployment" = "blue" ]; then
            docker-compose -f docker-compose.prod.yml stop oneparent-server-blue
            docker-compose -f docker-compose.prod.yml rm -f oneparent-server-blue
        else
            docker-compose -f docker-compose.prod.yml stop oneparent-server-green
            docker-compose -f docker-compose.prod.yml rm -f oneparent-server-green
        fi
        
        log "deployment failed and rolled back"
        exit 1
    fi
}

# run deployment
deploy