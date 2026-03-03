# Client

Next.js 15 frontend for OneParent VIC — a digital support platform for single parents across Victoria, Australia.

**Live:** [oneparentvic.me](https://oneparentvic.me)

## Tech Stack

- Next.js 15 (App Router, Static Export)
- React 19, TypeScript
- Tailwind CSS + Framer Motion (animations)
- Leaflet (interactive maps)
- SWR (data fetching + caching)

## Features

| Feature | Route | Description |
|---------|-------|-------------|
| **Your Journey Map** | `/your-journey-map` | Interactive milestone roadmap with AI-generated guidance at each parenting stage |
| **Time & Learn Hub** | `/time-and-learn-hub` | Upload weekly schedule → AI identifies free time, optimisation suggestions, learning recommendations |
| **Emotion Tracker** | `/emotion-tracker` | Daily mood logging, visual patterns, weekly AI insights, trend analysis |
| **Playdate Planner** | `/playdate` | AI activity suggestions based on child's age, interests, weather, budget |
| **Community Match** | `/community-match` | Victorian suburb explorer with schools, demographics, housing data + interactive map |
| **Events** | `/events` | Family-friendly events from Ticketmaster + Eventfinda, filtered by age/location/date |

## Project Structure

```
src/
├── app/                    # Next.js pages (App Router)
│   ├── page.tsx           # Landing page (hero, timeline, community stories, tools showcase)
│   ├── layout.tsx         # Root layout with Navbar + Footer
│   ├── your-journey-map/  # Journey Map feature
│   ├── time-and-learn-hub/# Time & Learn Hub feature
│   ├── emotion-tracker/   # Emotion Tracker feature
│   ├── playdate/          # Playdate Planner feature
│   ├── community-match/   # Community Match feature
│   └── events/            # Event Discovery feature
├── components/            # React components
│   ├── ui/                # Base UI components (buttons, cards, modals)
│   ├── layout/            # Navbar, Footer
│   └── [feature]/         # Feature-specific components
├── lib/
│   ├── api/               # Backend API client (client.ts)
│   ├── utils/             # Utility functions
│   └── config.ts          # API base URL configuration
└── types/                 # TypeScript interfaces
```

## Development

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Requires the backend server running — see [server/Readme.md](../server/Readme.md).

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

Production:
```env
NEXT_PUBLIC_API_BASE_URL=https://api.oneparentvic.me/api
```

## Deployment

Deployed on **AWS CloudFront + S3** with automated CI/CD:

1. Push to `main` branch on GitHub
2. AWS CodePipeline detects the change
3. AWS CodeBuild runs the build (Node.js 20, Amazon Linux 2):
   - `cd client && npm ci && npm run build`
   - Outputs static files to `/out` directory
4. Build artifacts synced to S3 bucket
5. CloudFront cache invalidated for immediate updates
6. Live at [oneparentvic.me](https://oneparentvic.me) within minutes

**DNS:** Cloudflare CNAME records point `oneparentvic.me` and `www.oneparentvic.me` to the CloudFront distribution.

**SSL:** AWS Certificate Manager — managed automatically.

## Build

```bash
npm run build     # Static export to /out
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build static export |
| `npm run lint` | Run ESLint |

## API Integration

The frontend communicates with the backend via REST API calls through the client at `src/lib/api/client.ts`. All AI processing, event aggregation, and database queries happen server-side.

Key API interactions:
- Schedule analysis → Gemini AI processing
- Event discovery → Ticketmaster + Eventfinda aggregation
- Community data → PostgreSQL queries
- Mood insights → Gemini AI pattern analysis
