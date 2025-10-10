# OneParent VIC - Internal Redis Deployment

This folder contains an internal Redis deployment solution for OneParent VIC using direct container communication.

## Architecture

- **Redis Container**: Persistent Redis 7 instance with password authentication
- **Internal Access**: Direct container-to-server communication on localhost
- **SSH Tunnel**: Encrypted access for external development connections
- **Data Persistence**: Volume-mounted data directory for crash recovery
- **Container Isolation**: Redis only accessible via localhost:6379

## Security Features

- **Password Authentication**: Strong Redis password protection
- **Internal Only**: No public port exposure (127.0.0.1 binding)
- **SSH Tunnel Development**: Secure external access for local development
- **Container Isolation**: Isolated Docker networking

## Files

- `docker-compose.yml` - Redis container configuration
- `redis.conf` - Redis server configuration with security and performance settings
- `deploy-redis.ps1` - PowerShell script to deploy Redis container on EC2
- `README.md` - This documentation file

## Quick Start

### 1. Deploy to EC2
```powershell
# From aws/redis directory
.\deploy-redis.ps1 -EC2PublicIP YOUR_EC2_IP
```

### 2. Connect from your application

#### Production (Node.js server on AWS):
```javascript
// Your server connects directly to Redis container
API_ENV=aws-prod
REDIS_PASSWORD=your_generated_password

// GET a key
const response = await fetch(`${REDIS_URL}/get/mykey`);
const data = await response.json();

// SET a key
await fetch(`${REDIS_URL}/set/mykey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'hello world' })
});
```

#### Option B: SSH Tunnel (for local development)
```bash
# Start tunnel
ssh -i ../ec2/oneparent-vic-key.pem -L 6379:localhost:6379 ec2-user@YOUR_EC2_IP

# Connect with any Redis client
redis-cli -h localhost -p 6379 -a your_redis_password
```

#### Option C: Direct Redis Protocol over SSL
```javascript
// For Node.js applications using ioredis or redis
const Redis = require('ioredis');
const redis = new Redis('rediss://:password@redis.yourdomain.com:6380');
```

## REST API Endpoints

### Basic Operations
- `GET /get/:key` - Get value by key
- `POST /set/:key` - Set key-value pair
- `POST /setex/:key/:seconds` - Set key with expiration
- `DELETE /del/:key` - Delete key
- `POST /expire/:key/:seconds` - Set expiration on key
- `GET /ttl/:key` - Get time to live
- `GET /exists/:key` - Check if key exists

### List Operations
- `POST /lpush/:key` - Push to list (left)
- `POST /rpush/:key` - Push to list (right)
- `GET /lrange/:key/:start/:stop` - Get list range

### Set Operations
- `POST /sadd/:key` - Add to set
- `GET /smembers/:key` - Get set members

### Hash Operations
- `POST /hset/:key/:field` - Set hash field
- `GET /hget/:key/:field` - Get hash field
- `GET /hgetall/:key` - Get all hash fields

### Advanced Operations
- `POST /multi` - Execute multiple commands as pipeline
- `POST /command` - Execute any Redis command

### Health Check
- `GET /health` - Service health status

## Security Features

1. **SSL/TLS Encryption**: All connections encrypted with SSL certificates
2. **HTTP Basic Authentication**: Username/password protection for REST API
3. **Redis Password**: Additional password authentication for direct Redis access
4. **Rate Limiting**: 100 requests per minute with burst allowance
5. **CORS Support**: Configurable cross-origin resource sharing
6. **Network Isolation**: Docker network prevents unauthorized access

## Performance Optimizations

- **Memory Management**: 256MB limit with LRU eviction policy
- **Connection Pooling**: Efficient connection reuse
- **Health Monitoring**: Automatic container restart on failure
- **Resource Limits**: CPU and memory constraints for t3.micro compatibility
- **Logging**: Structured logging with size limits

## Environment Variables

```bash
# Redis configuration
REDIS_PASSWORD=your_secure_redis_password
REDIS_MAXMEMORY=256mb
REDIS_MAXMEMORY_POLICY=allkeys-lru

# Authentication
REDIS_USERNAME=redis_admin
NGINX_PASSWORD=your_nginx_password

# Node.js REST adapter
REDIS_URL=redis://oneparent-redis:6379
NODE_ENV=production
```

## Monitoring and Troubleshooting

### Check container status
```bash
docker-compose ps
docker-compose logs redis
docker-compose logs redis-rest-adapter
docker-compose logs redis-proxy
```

### Test Redis connection
```bash
# Test direct Redis
docker exec oneparent-redis redis-cli -a your_password ping

# Test REST API
curl -u username:password https://redis.yourdomain.com/health

# Test through nginx proxy
curl -k https://localhost/health
```

### Performance monitoring
```bash
# Redis stats
docker exec oneparent-redis redis-cli -a your_password info stats

# Container resource usage
docker stats oneparent-redis redis-rest-adapter oneparent-redis-proxy
```

## Migration from Upstash

This deployment is designed as a drop-in replacement for Upstash Redis:

1. **Change URL**: Replace your Upstash URL with `https://username:password@redis.yourdomain.com`
2. **Authentication**: Use HTTP basic auth instead of Upstash tokens
3. **API Compatibility**: All endpoints work the same as Upstash REST API
4. **Data Migration**: Export from Upstash and import using REST API or Redis protocol

## Production Deployment Checklist

- [ ] Set up domain DNS record
- [ ] Configure SSL certificates (auto-generated or custom)
- [ ] Set strong passwords for Redis and nginx authentication
- [ ] Configure rate limiting appropriate for your usage
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy for Redis data
- [ ] Test failover and recovery procedures
- [ ] Document connection details securely

## Costs

- **EC2 t3.micro**: ~$8.50/month (free tier eligible)
- **Data Transfer**: Minimal for typical usage
- **Domain**: ~$10-15/year (if using custom domain)
- **Total**: ~$10-25/month vs $200+/month for managed Redis services

This provides enterprise-grade Redis hosting at a fraction of the cost of managed services.