# OneParent VIC - Support Platform for Single Parents

A digital companion for single parents across Victoria. Combines AI-powered schedule analysis, community resources, and emotional wellbeing tools to make single parenting less overwhelming and more connected.

## 🚀 [Live Platform](https://www.oneparentvic.me)

Try it out: **[www.oneparentvic.me](https://www.oneparentvic.me)**

## What's This?

Single parenting is hard. Between work, childcare, school runs, and trying to maintain your own wellbeing, finding time feels impossible. OneParent VIC helps you reclaim those moments.

The platform analyzes your weekly schedule using AI to find hidden pockets of free time, discovers family-friendly events happening near you, connects you with other single parents in your suburb, and provides mental health resources when you need them most.

It's not just another app—it's a support system that understands the unique challenges of raising kids solo.

## Features

- **Time & Learn Hub**: AI analyzes your schedule and finds free time you didn't know you had
- **Event Discovery**: Family-friendly events from Ticketmaster and Eventfinda filtered for single parents
- **Community Match**: Find other single parents in your area based on kids' ages, interests, and location
- **Emotion Tracker**: Track your mental health journey with AI-powered weekly insights
- **Journey Map**: Interactive roadmap of single parenting milestones and resources
- **Government Resources**: Benefits, childcare facilities, and support services in Victoria

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js 20, Express, PostgreSQL, Redis
- **AI**: Google Gemini AI (10-key rotation for free tier)
- **Deployment**: AWS (CloudFront, S3, EC2, RDS)
- **APIs**: Ticketmaster, Eventfinda

## Project Structure

```
├── client/          # Next.js frontend
├── server/          # Node.js backend API
└── test-cases/      # Pre-populated test data for AI features
```

## Deployment

### Frontend
Deployed on **AWS CloudFront + S3**
- Static export hosted on S3
- Global CDN via CloudFront
- Auto-deploys from `main` branch via CodeBuild
- SSL: `www.oneparentvic.me`

### Backend
Deployed on **AWS EC2 (Sydney)**
- Docker containers: `oneparent-server-green` + `oneparent-redis`
- Nginx reverse proxy with SSL
- PostgreSQL on AWS RDS
- GitHub webhook triggers blue-green deployment
- Daily health monitoring via cron job emails

**Zero downtime deployments:** Health checks ensure new container is ready before traffic switch.

## How It Works

**AI Schedule Analysis:**  
You input your weekly schedule. Gemini AI processes it through 10 rotating API keys (tracked by Redis) to handle free tier limits. The system analyzes patterns, identifies gaps, and suggests optimal free time slots for self-care, study, or socializing.

**Event Discovery:**  
Backend aggregates events from Ticketmaster and Eventfinda, filters them by family-friendly categories, and ranks by proximity to your suburb. Events are cached in Redis to reduce API calls.

**Community Matching:**  
PostgreSQL stores Victorian demographic data (suburbs, schools, childcare). The system matches you with nearby single parents based on children's ages, school zones, and shared interests.

**Emotional Tracking:**  
Weekly mood logs are sent to Gemini AI for pattern analysis. The system identifies burnout signs, suggests coping strategies, and tracks recovery progress over weeks.

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Redis server
- Google Gemini API keys
- Ticketmaster + Eventfinda API keys

### Setup

**Backend:**
```bash
cd server
npm install
cp .env.example .env.local  # Add your API keys and database URL
npm run dev
```

**Frontend:**
```bash
cd client
npm install
cp .env.example .env.local  # Add API base URL
npm run dev
```

Frontend runs on `http://localhost:3000`  
Backend runs on `http://localhost:5000`

## Testing AI Features

The `test-cases/` folder contains pre-populated data to test AI features without waiting:

**Emotion Tracker:** Paste test case in browser console → See 3 weeks of mood data + AI insights  
**Time Hub:** Paste test case → Auto-fill schedule with realistic single parent scenarios

See [test-cases/README.md](test-cases/README.md) for details.

## More Info

- [Frontend Documentation](client/README.md) - Next.js setup, features, deployment
- [Backend Documentation](server/README.md) - API architecture, Gemini rotation, infrastructure

