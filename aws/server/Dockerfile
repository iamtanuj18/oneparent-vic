# dockerfile for oneparent vic server
# builds nodejs express server with production optimizations

from node:20-alpine

# set working directory
workdir /app

# create non-root user for security
run addgroup -g 1001 -S nodejs
run adduser -S -u 1001 -G nodejs nodejs

# copy package files first for better caching
copy package*.json ./

# install dependencies with production optimizations
run npm ci --only=production --silent

# copy application source code
copy src/ ./src/

# change ownership to nodejs user
run chown -R nodejs:nodejs /app
user nodejs

# expose application port
expose 5000

# health check endpoint
healthcheck --interval=30s --timeout=10s --start-period=40s --retries=3 \
  cmd node -e "require('http').get('http://localhost:5000/api/api-status', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# start application
cmd ["node", "src/server.js"]