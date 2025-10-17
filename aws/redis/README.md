# AWS Redis Setup

Redis cache deployment using Docker containers on EC2 for session storage and caching. Provides secure Redis instance accessible via SSH tunnel for development and direct connection for production.

## What This Does

Creates secure Redis cache infrastructure:
- Redis 7 container with password authentication and data persistence
- Internal-only access on localhost:6379 (no public exposure)
- SSH tunnel support for development access from local machine
- Optimized for t3.micro with 256MB memory limit and LRU eviction
- Automatic container restart and health monitoring

## Files Overview

- `deploy-redis.ps1` - Deploys Redis container to EC2 instance with security configuration
- `docker-compose.yml` - Redis container configuration with health checks and limits
- `redis-simple.conf` - Redis server configuration with security and performance settings
- `redis-connection-details.txt` - Connection information (created after deployment)

## Prerequisites

- EC2 instance already deployed (from EC2 folder setup)
- SSH key for EC2 access
- Docker installed on EC2 (included in EC2 setup)

## Quick Setup

```powershell
# Deploy Redis to existing EC2 instance
./deploy-redis.ps1 -EC2PublicIP <your-ec2-ip>
```

## Connection Methods

### Production (Node.js on EC2)
```javascript
// Direct localhost connection from server
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: 'your_generated_password'
});
```

### Development (SSH Tunnel)
```bash
# Create SSH tunnel for local development
ssh -i ../ec2/oneparent-vic-key.pem -L 6379:localhost:6379 ec2-user@<ec2-ip>

# Then connect locally
redis-cli -h localhost -p 6379 -a <redis-password>
```

## Configuration

- **Memory**: 256MB limit with LRU eviction policy
- **Persistence**: RDB snapshots + AOF logging for data durability
- **Security**: Password authentication, disabled dangerous commands
- **Health Check**: Automatic container restart on failure
- **Port**: Internal 6379 (localhost only, accessed via SSH tunnel)

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