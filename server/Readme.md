# Server

Node.js backend for OneParent VIC. Provides AI-powered schedule analysis, event discovery, and community resources for single parents across Victoria.

## Tech Stack

- Node.js 20 + Express
- Google Gemini AI (multi-key rotation for free tier limits)
- PostgreSQL (AWS RDS) for community data
- Redis (Docker container) for API key rotation tracking
- Ticketmaster + Eventfinda APIs for events
- Puppeteer for web scraping

## Architecture

```
src/
├── server.js                      # Express app + startup
├── config.js                      # Environment config
├── routes/                        # API endpoints
│   ├── timeAndLearnHub.js         # Schedule AI analysis
│   ├── events.js                  # Event discovery
│   ├── communityMatch.js          # Suburb matching
│   ├── emotionTracker.js          # Mood tracking
│   ├── journeyMap.js              # Progress tracking
│   ├── apiHealthCheck.js          # Health monitoring
│   └── victoriaSuburbList.js      # Location data
├── services/                      # External integrations
│   ├── gemini.js                  # Gemini AI + key rotation
│   ├── redis.js                   # Redis client + rate limiting
│   ├── ticketmasterService.js     # Ticketmaster API
│   └── eventfindaService.js       # Eventfinda API
├── db/
│   └── index.js                   # PostgreSQL connection pool
├── middleware/
│   ├── security.js                # Helmet + CORS
│   ├── rateLimit.js               # Redis-backed rate limiting
│   ├── bruteForceProtection.js    # IP-based blocking
│   ├── xssProtection.js           # XSS sanitization
│   ├── parameterProtection.js     # HPP protection
│   └── errorHandler.js            # Global error handling
└── utils/
    ├── categoryMapping.js         # Event categorization
    ├── locationResolver.js        # Suburb resolution
    └── weather.js                 # Weather integration
```

## How It Works

1. **Client requests AI analysis** → Server selects best available Gemini API key from pool
2. **Redis tracks key usage** → Atomic counters prevent rate limit violations (RPM/RPD per tier)
3. **Key rotation** → Shuffled keys spread load evenly across 10 free-tier Gemini accounts
4. **Fallback strategy** → 4-tier model system (Pro → Flash → Lite → Flash-2.0) ensures reliability
5. **PostgreSQL serves community data** → Demographics, schools, housing from AWS RDS
6. **Event aggregation** → Ticketmaster + Eventfinda APIs filtered for family-friendly content
7. **Health monitoring** → Daily cron job emails server metrics + container status

## Gemini API Key Rotation

**Why:** Google Gemini free tier has strict limits (5-15 RPM per key, 1500 RPD)

**Solution:** Multi-key pool with Redis-based atomic rotation
```javascript
// 10 API keys pooled with different rate limits per model tier
GEMINI_API_KEY_1 through GEMINI_API_KEY_10

// Redis tracks usage per key, per model tier, per time window
rate_limit:{keyHash}:{tier}:minute:{timestamp}
rate_limit:{keyHash}:{tier}:day:{timestamp}

// Shuffled key order per minute spreads load evenly
// Falls back to next tier if current tier exhausted
```

**Model Tiers:**
- **Tier 1:** `gemini-2.5-pro` (5 RPM), `gemini-2.5-flash` (10 RPM)
- **Tier 2:** `gemini-2.5-flash-lite` (15 RPM), `gemini-2.0-flash` (15 RPM)

Redis ensures atomic key selection and prevents rate limit violations across concurrent requests.

## Infrastructure

**Production Deployment:** AWS EC2 t3.micro (Sydney ap-southeast-2)

**Container Architecture:**
```
┌─────────────────────────────────────┐
│  Nginx (Port 443)                   │
│  SSL Termination + Reverse Proxy    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  oneparent-server-green             │
│  Node.js + Express (Port 5000)      │
│  Docker: oneparent-vic-server       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  oneparent-redis                    │
│  Redis 7 Alpine (Port 6379)         │
│  Key rotation + rate limit tracking │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  AWS RDS PostgreSQL 16              │
│  Community data + demographics      │
└─────────────────────────────────────┘
```

**Blue-Green Deployment:**
1. GitHub webhook triggers on push to `main`
2. EC2 runs deployment script
3. Builds new Docker image: `oneparent-vic-server:latest`
4. Starts new container: `oneparent-server-green`
5. Health check validates new container
6. Nginx switches traffic to new container
7. Old container stopped after 30s grace period

**Zero downtime** ensured by health checks before traffic switch.

## Automated Monitoring

**Daily Health Reports** (Cron job at 06:00 UTC):
- API status + response time
- Memory/disk usage
- Docker container health (2 containers)
- System uptime
- SSL certificate validity
- Auto-deployment status

**Email sent to:** Production admin  
**Monitored endpoint:** `https://api.oneparentvic.me/api/api-status`

**Automation Systems:**
- GitHub webhook for instant deployments
- Daily health check emails
- Container health monitoring
- SSL auto-renewal

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Runs on `http://localhost:5000`

### Environment Variables

Create `.env.local`:
```env
# Server
NODE_ENV=development
API_ENV=local
PORT=5000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/oneparent_vic

# Redis (local: use localhost, AWS: oneparent-redis container)
REDIS_PASSWORD=your_redis_password

# Gemini API Keys (10 keys for rotation)
GEMINI_API_KEY_1=your_key_1
GEMINI_API_KEY_2=your_key_2
# ... up to GEMINI_API_KEY_10

# External APIs
TICKETMASTER_KEY=your_ticketmaster_key
EVENTFINDA_USERNAME=your_username
EVENTFINDA_PASSWORD=your_password

# CORS
CORS_ORIGINS=http://localhost:3000
```

### Local Redis Connection

For local development with EC2 Redis:
```bash
# SSH tunnel to EC2 Redis
ssh -i key.pem -L 6379:localhost:6379 ubuntu@ec2-instance

# Set API_ENV=local in .env.local
# Server connects to localhost:6379 (tunneled to EC2)
```

## API Endpoints

- `GET /api/api-status` - Health check
- `POST /api/time-and-learn-hub/analyze` - AI schedule analysis
- `GET /api/events` - Family events (Ticketmaster + Eventfinda)
- `GET /api/community-match` - Suburb matching
- `POST /api/emotion-tracker/insights` - Mood insights generation
- `GET /api/journey-map` - Progress tracking
- `GET /api/victoria-suburb-list` - Location data

## Docker

Production build:
```bash
docker build -t oneparent-vic-server .
docker run -p 5000:5000 --env-file .env.local oneparent-vic-server
```

Docker Compose (with Redis):
```bash
docker-compose up -d
```

## Security

- Helmet.js for security headers
- CORS restricted to allowed origins
- Rate limiting: 60 req/min per IP
- Brute force protection on sensitive endpoints
- XSS sanitization on all inputs
- HPP (HTTP Parameter Pollution) protection
- PostgreSQL SSL with RDS certificates

## Troubleshooting

**Gemini API rate limits:**
- Check Redis key rotation logs
- Verify all 10 API keys configured
- Increase key pool if hitting limits consistently

**Container connection issues:**
```bash
# Check container health
docker ps
docker logs oneparent-server-green
docker logs oneparent-redis

# Test Redis connection
docker exec -it oneparent-redis redis-cli PING
```

**Database connection:**
- Verify RDS security group allows EC2 IP
- Check `DATABASE_URL` format
- SSL certificates must be valid
