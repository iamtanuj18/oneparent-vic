# Server

Express.js backend for OneParent VIC — provides AI-powered features, event discovery, and community resources for single parents across Victoria.

**API:** [api.oneparentvic.me](https://api.oneparentvic.me/api/api-status)

## Tech Stack

- Node.js 20, Express.js
- Google Gemini AI (multi-model fallback with Redis-based rate tracking)
- PostgreSQL 16 (AWS RDS) — 4 schemas, 13 tables
- Redis 7 (Docker container) — rate tracking
- Ticketmaster + Eventfinda APIs
- Open-Meteo + Nominatim (weather + geocoding)

## Architecture

```
src/
├── server.js                      # Express app entry point
├── config.js                      # Environment configuration
├── routes/                        # API route handlers
│   ├── timeAndLearnHub.js         # AI schedule analysis (4 endpoints)
│   ├── events.js                  # Event discovery + weather (5 endpoints)
│   ├── communityMatch.js          # Suburb matching + demographics (8 endpoints)
│   ├── emotionTracker.js          # Mood tracking + AI insights (5 endpoints)
│   ├── journeyMap.js              # Journey milestones + AI guidance (7 endpoints)
│   ├── playdate.js                # AI activity suggestions (2 endpoints)
│   ├── insights.js                # Homepage dashboard data (3 endpoints)
│   ├── apiHealthCheck.js          # Health monitoring (1 endpoint)
│   ├── victoriaSuburbList.js      # Suburb autocomplete (1 endpoint)
│   └── contact.js                 # Contact form (1 endpoint)
├── services/                      # External integrations
│   ├── gemini.js                  # Gemini AI client — model tiers, fallback, rate tracking
│   ├── redis.js                   # Redis connection + rate limit helpers
│   ├── ticketmasterService.js     # Ticketmaster Discovery API v2
│   └── eventfindaService.js       # Eventfinda Australia API v2
├── db/
│   └── index.js                   # PostgreSQL connection pool (SSL)
├── middleware/                     # 6-layer security stack
│   ├── security.js                # Helmet + CORS
│   ├── rateLimit.js               # Redis-backed rate limiting
│   ├── bruteForceProtection.js    # IP-based brute force blocking
│   ├── xssProtection.js           # XSS input sanitisation
│   ├── parameterProtection.js     # HPP protection
│   └── errorHandler.js            # Global error handler
└── utils/
    ├── categoryMapping.js         # Event category normalisation
    ├── locationResolver.js        # Suburb/postcode resolution
    ├── logger.js                  # Structured logging
    └── weather.js                 # Open-Meteo weather client
```

## Gemini AI Integration

The server integrates Google Gemini AI across **14 call sites** using a multi-model fallback strategy with Redis-based rate tracking.

### Model Tiers

| Tier | Model | Rate Limit (RPM) | Use Case |
|------|-------|-------------------|----------|
| 1 | `gemini-2.5-flash` | 10 | Primary — fast, capable |
| 2 | `gemini-2.5-flash-lite` | 15 | Fallback — lighter, higher throughput |
| 3 | `gemini-2.0-flash` | 15 | Secondary fallback |
| 4 | `gemini-2.5-pro` | 5 | Complex tasks requiring deeper reasoning |

### How It Works

1. Request comes in requiring AI processing
2. `gemini.js` selects an available API key from the pool
3. Redis tracks per-key, per-model, per-minute usage with atomic counters
4. If the current model tier is exhausted, automatically falls back to the next tier
5. Exponential backoff on transient failures
6. All 14 call sites use two core functions: `generateContent()` and `validateAndParseJSON()`

### AI Call Sites

| Route | Call Sites | Purpose |
|-------|-----------|---------|
| Journey Map | 4 | Stage guidance, milestone advice, resource recommendations, progress analysis |
| Time & Learn Hub | 3 | Schedule analysis, time optimisation, learning suggestions |
| Emotion Tracker | 3 | Weekly insights, pattern analysis, coping strategies |
| Playdate Planner | 2 | Activity generation, personalisation |
| Events | 1 | Event relevance scoring |
| Insights | 1 | Homepage trend summaries |

## Database Schema

PostgreSQL with **4 schemas** and **13 tables**:

| Schema | Tables | Purpose |
|--------|--------|---------|
| `trends` | 4 | ABS single parent statistics, labour force data, PPS recipients, economic trends |
| `hilda` | 3 | HILDA survey data — time use, wellbeing, childcare |
| `community` | 5 | Stories, playdate activities, contact submissions, emotion logs, journey milestones |
| `vic_geo` | 1 | Victorian suburb geometry + demographics |

## API Endpoints

### Health
- `GET /api/api-status` — Health check + uptime

### Journey Map (7 endpoints)
- `GET /api/journey-map/stages` — All journey stages
- `GET /api/journey-map/stages/:stageId` — Single stage details
- `POST /api/journey-map/stages/:stageId/generate` — AI guidance for stage
- `GET /api/journey-map/milestones` — User milestones
- `POST /api/journey-map/milestones` — Save milestone
- `PUT /api/journey-map/milestones/:id` — Update milestone
- `DELETE /api/journey-map/milestones/:id` — Delete milestone

### Time & Learn Hub (4 endpoints)
- `POST /api/time-and-learn-hub/analyze` — AI schedule analysis
- `POST /api/time-and-learn-hub/optimize` — Time optimisation
- `POST /api/time-and-learn-hub/learn` — Learning recommendations
- `GET /api/time-and-learn-hub/categories` — Activity categories

### Emotion Tracker (5 endpoints)
- `POST /api/emotion-tracker/log` — Log daily mood
- `GET /api/emotion-tracker/logs` — Retrieve mood logs
- `POST /api/emotion-tracker/insights` — AI weekly insights
- `GET /api/emotion-tracker/trends` — Mood trends over time
- `DELETE /api/emotion-tracker/logs/:id` — Delete mood log

### Events (5 endpoints)
- `GET /api/events` — Aggregated events (Ticketmaster + Eventfinda)
- `GET /api/events/ticketmaster` — Ticketmaster events only
- `GET /api/events/eventfinda` — Eventfinda events only
- `GET /api/events/weather` — Weather for event location
- `GET /api/events/geocode` — Geocode suburb name

### Community Match (8 endpoints)
- `GET /api/community-match/suburbs` — Suburb search
- `GET /api/community-match/suburbs/:name` — Suburb details
- `GET /api/community-match/demographics` — Demographic data
- `GET /api/community-match/schools` — Schools by suburb
- `GET /api/community-match/housing` — Housing data
- `GET /api/community-match/childcare` — Childcare centres
- `GET /api/community-match/compare` — Compare suburbs
- `GET /api/community-match/geometry` — GeoJSON boundaries

### Playdate Planner (2 endpoints)
- `POST /api/playdate/suggestions` — AI activity suggestions
- `GET /api/playdate/categories` — Activity categories

### Insights (3 endpoints)
- `GET /api/insights/trends` — Single parent trend data
- `GET /api/insights/pps` — PPS recipient statistics
- `GET /api/insights/labour` — Labour force participation

### Other
- `GET /api/victoria-suburb-list` — Suburb autocomplete
- `POST /api/contact` — Contact form submission

**Total: 10 routes, 37 endpoints**

## Infrastructure

### Production
- **EC2 t3.micro** — Sydney (ap-southeast-2)
- **Nginx** — reverse proxy, SSL termination (Let's Encrypt / Certbot)
- **Docker** — Express container (`oneparent-server-blue`, port 5000) + Redis container (`oneparent-redis`, port 6379) on `oneparent-network` bridge
- **RDS PostgreSQL 16** — `db.t3.micro`, SSL connections
- **Memory:** 256MB limit per container, 0.5 CPU

### Container Layout

```
EC2 Instance
├── Nginx (port 443/80)
│   ├── /api/*    → upstream :5000 (Express)
│   └── /webhook  → proxy :3001 (Webhook Receiver)
│
├── Docker: oneparent-network
│   ├── oneparent-server-blue (:5000)
│   └── oneparent-redis (:6379)
│
└── Webhook Receiver (:3001)
    └── Signature verified → deploy.sh
```

### Blue-Green Deployment

Zero-downtime deployments via custom blue-green strategy:

1. GitHub webhook fires on push to `main` (if `server/` changed)
2. Webhook receiver (port 3001) verifies the webhook signature
3. `deploy.sh` executes:
   - Detect active container (blue on :5000)
   - `git pull` latest code
   - `docker build` new image
   - Start green container on :5001
   - Health check: `GET /api/api-status` × 30 attempts (2s apart)
   - If healthy: `sed` swap port in Nginx config → `nginx -s reload`
   - Stop old container + cleanup images
   - **If unhealthy: kill green, blue keeps serving (automatic rollback)**
4. Email notification sent on success/failure

### Monitoring

- **Daily health report** (cron at 06:00 UTC / 5PM Melbourne): API status, memory, disk, Docker stats
- **Deploy notifications**: Email on every deployment (success or failure)
- **Container healthcheck**: `GET /api/api-status` every 30s in Docker

## Development

```bash
cd server
npm install
cp .env.example .env.local
npm run dev                  # Runs on http://localhost:5000
```

### Environment Variables

Create `.env.local` with:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/oneparent_vic
REDIS_PASSWORD=your_redis_password
GEMINI_API_KEY_1=your_gemini_key
TICKETMASTER_KEY=your_ticketmaster_key
EVENTFINDA_USERNAME=your_username
EVENTFINDA_PASSWORD=your_password
CORS_ORIGINS=http://localhost:3000
```

### Docker (local)

```bash
docker build -t oneparent-vic-server .
docker run -p 5000:5000 --env-file .env.local oneparent-vic-server
```

With Redis:

```bash
docker-compose up -d
```

## Security

| Layer | Protection |
|-------|-----------|
| Helmet.js | Security headers (CSP, HSTS, X-Frame) |
| CORS | Restricted to allowed origins |
| Rate Limiting | Redis-backed, 60 req/min per IP |
| Brute Force | IP-based blocking on sensitive endpoints |
| XSS | Input sanitisation on all request data |
| HPP | HTTP Parameter Pollution protection |
| PostgreSQL | SSL-only connections to RDS |
| Docker | Non-root user, minimal Alpine image |
