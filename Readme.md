# OneParent VIC

A digital support platform for single parents across Victoria, Australia. Combines AI-powered schedule analysis, community resources, event discovery, and emotional wellbeing tools.

**Live:** [www.oneparentvic.me](https://www.oneparentvic.me)

## Features

- **Your Journey Map** — Interactive milestone roadmap for the single parenting journey with personalised AI-generated guidance at each stage
- **Time & Learn Hub** — Upload your weekly schedule and get AI analysis that identifies free time blocks, optimisation suggestions, and learning recommendations
- **Emotion Tracker** — Daily mood logging with visual patterns, weekly AI-generated insights, and long-term trend analysis
- **Playdate Planner** — AI-powered activity suggestions based on child's age, interests, weather, and budget
- **Community Match** — Explore Victorian suburbs with interactive maps showing schools, cultural diversity, housing data, and single parent demographics
- **Events** — Family-friendly events aggregated from Ticketmaster and Eventfinda, filtered by age group, location, and date

## Architecture

```
                          ┌─────────────────────────────────────────────────────────┐
                          │                    AWS Cloud (Sydney)                    │
                          │                                                         │
  ┌───────┐   ┌────────┐ │  ┌─────────────── Frontend ──────────────────┐          │
  │       │   │Cloud-  │ │  │                                           │          │
  │ Users ├──►│flare   ├─┼─►│  CloudFront CDN  ──►  S3 Bucket          │          │
  │       │   │DNS+SSL │ │  │  (ACM SSL)            (Next.js 15 Static) │          │
  └───────┘   └───┬────┘ │  └───────────────────────────────────────────┘          │
                  │       │                                                         │
                  │       │  ┌─────────────── EC2 Backend (t3.micro) ────────────┐  │
                  │       │  │                                                   │  │
                  └───────┼─►│  Nginx (:443, Let's Encrypt SSL)                  │  │
                          │  │    │                                               │  │
                          │  │    ├── /api/*  ──► 6 Security Middleware           │  │
                          │  │    │                    │                          │  │
                          │  │    │              ┌─────┴──── Docker Network ───┐  │  │
                          │  │    │              │                             │  │  │
                          │  │    │              │  Express API (:5000)        │  │  │
                          │  │    │              │  10 routes · 35 endpoints   │  │  │
                          │  │    │              │       │                     │  │  │
                          │  │    │              │  Redis 7 (:6379)            │  │  │
                          │  │    │              │  Rate Limiting + Cache      │  │  │
                          │  │    │              └─────────────────────────────┘  │  │
                          │  │    │                                               │  │
                          │  │    └── /webhook ──► Webhook Receiver (:3001)       │  │
                          │  │                     Signature Verification         │  │
                          │  │                     Blue-Green Zero-Downtime Deploy│  │
                          │  └───────────────────────────────────────────────────┘  │
                          │                                                         │
                          │  ┌─────────────── Database ─────────────────┐           │
                          │  │  RDS PostgreSQL 16                       │           │
                          │  │  4 Schemas: trends · hilda · community   │           │
                          │  │             · vic_geo                     │           │
                          │  │  13 Tables                               │           │
                          │  └──────────────────────────────────────────┘           │
                          └─────────────────────────────────────────────────────────┘

                          Express API connects to:
                            → Google Gemini 2.0 Flash (6 AI features, 14 call sites)
                            → Ticketmaster Discovery v2 (events)
                            → Eventfinda Australia v2 (events)
                            → Open-Meteo (weather forecasts)
                            → Nominatim (geocoding)

                          CI/CD:
                            Frontend: GitHub → CodePipeline → CodeBuild → S3 + CloudFront invalidation
                            Backend:  GitHub webhook → deploy.sh → blue-green Docker swap (zero downtime)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Leaflet, SWR |
| Backend | Node.js 20, Express.js |
| AI | Google Gemini (multi-model fallback with Redis-based rate tracking) |
| Database | PostgreSQL 16 (AWS RDS) — 4 schemas, 13 tables |
| Cache | Redis 7 (Docker container) |
| Hosting | AWS — CloudFront + S3 (frontend), EC2 (backend), RDS (database) |
| CI/CD | AWS CodePipeline + CodeBuild (frontend), GitHub webhook + blue-green deploy (backend) |
| DNS | Cloudflare (domain via Namecheap) |
| SSL | AWS Certificate Manager (frontend), Let's Encrypt (API) |
| External APIs | Ticketmaster, Eventfinda, Open-Meteo, Nominatim |

## Project Structure

```
├── client/          # Next.js 15 frontend (static export)
├── server/          # Express.js backend API (Dockerised)
└── test-cases/      # Pre-populated test data for AI features
```

## Deployment

### Frontend
- **AWS CloudFront + S3** — static export served via global CDN
- **CI/CD:** Push to `main` → CodePipeline → CodeBuild (Node 20, `npm run build`) → S3 sync → CloudFront invalidation
- **SSL:** AWS Certificate Manager
- **URL:** [oneparentvic.me](https://oneparentvic.me)

### Backend
- **AWS EC2 t3.micro** (Sydney, ap-southeast-2)
- **Docker:** Express container + Redis container on a shared bridge network
- **Nginx:** Reverse proxy with SSL termination (Let's Encrypt / Certbot)
- **CI/CD:** GitHub webhook → signature verification → blue-green deployment script
- **Zero downtime:** Health checks validate the new container before Nginx traffic switch. Failed health check triggers automatic rollback.
- **Database:** AWS RDS PostgreSQL 16 — connected via SSL
- **Monitoring:** Daily health report cron job (API status, memory, disk, Docker)

### DNS
- **Domain:** Namecheap (`oneparentvic.me`)
- **DNS:** Cloudflare — CNAME records to CloudFront (frontend), A record to EC2 (API)

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Redis server
- Google Gemini API key(s)
- Ticketmaster + Eventfinda API keys

### Setup

**Backend:**
```bash
cd server
npm install
cp .env.example .env.local  # Add your API keys and database URL
npm run dev                  # Runs on http://localhost:5000
```

**Frontend:**
```bash
cd client
npm install
cp .env.example .env.local  # Set NEXT_PUBLIC_API_BASE_URL
npm run dev                  # Runs on http://localhost:3000
```

## Testing AI Features

The `test-cases/` folder contains pre-populated data to quickly test AI-powered features:

- **Emotion Tracker** — Paste test case in browser console → loads 3 weeks of mood data + AI insights
- **Time & Learn Hub** — Paste test case → auto-fills realistic single parent schedule scenarios

See [test-cases/](test-cases/) for details.

## Documentation

- [Frontend README](client/README.md) — Next.js setup, components, deployment
- [Backend README](server/Readme.md) — API routes, services, infrastructure

