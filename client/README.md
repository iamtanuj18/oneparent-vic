# Client

Next.js frontend for OneParent VIC. Digital support platform for single parents across Victoria, Australia.

🌐 **Live**: [https://oneparentvic.me](https://oneparentvic.me)

## Tech Stack

- Next.js 15 (App Router, Static Export)
- React 19 with TypeScript
- Tailwind CSS + Framer Motion
- Leaflet (maps)
- SWR (data fetching)
- Upstash Redis (caching)

## Features

**Time & Learn Hub** - Upload your weekly schedule, get AI analysis of time usage, identify free time blocks, and receive personalized optimization suggestions.

**Emotion Tracker** - Track daily mood with visual ratings, view weekly patterns, get insights into emotional trends over time.

**PlayDate Planner** - Get activity suggestions based on child's age, interests, and budget. Discover local family-friendly activities.

**Community Match** - Explore Victorian neighborhoods with data on schools, cultural diversity, housing costs, and single parent demographics. Interactive map visualization.

**Event Finder** - Browse family-friendly events from Ticketmaster and Eventfinda. Filter by age group, location, and date range.

**Journey Map** - Track milestones and progress across different areas of single parenting. Set goals and celebrate achievements.

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── your-journey-map/  # Milestone tracking
│   ├── time-and-learn-hub/# AI schedule analysis
│   ├── emotion-tracker/   # Mood tracking
│   ├── playdate/          # Activity planner
│   ├── community-match/   # Neighborhood finder
│   └── events/            # Event discovery
├── components/            # React components
│   ├── ui/                # Base UI components
│   ├── layout/            # Navbar, Footer
│   └── [feature]/         # Feature-specific components
├── lib/
│   ├── api/               # Backend API clients
│   ├── utils/             # Utilities
│   └── config.ts          # API configuration
└── types/                 # TypeScript interfaces
```

## Development

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

The app connects to the backend API for AI analysis, event data, and community resources. Make sure the backend server is running (see [server/README.md](../server/README.md)).

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

For production, set:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api
```

## Deployment

Deployed on **AWS CloudFront + S3** with automated CI/CD via AWS CodeBuild.

**How it works:**
1. Push code changes to `main` branch
2. GitHub webhook triggers AWS CodePipeline
3. CodeBuild runs `npm ci && npm run build` with Node.js 20
4. Static files (`/out` directory) deployed to S3
5. CloudFront cache invalidated for immediate updates
6. Live at [oneparentvic.me](https://oneparentvic.me) within minutes

**Build config**: `aws/client/build-configuration.yml`

Environment variables set in AWS CodeBuild for production builds.

See [aws/client/README.md](../aws/client/README.md) for full deployment setup and infrastructure details.

## Build

```bash
npm run build
npm start
```

Output in `/out` directory (static export).

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Integration

Backend provides:
- AI schedule analysis (Gemini AI)
- Event data (Ticketmaster, Eventfinda)
- Victorian suburb/school data
- Community resources

API client: `src/lib/api/client.ts`
