# OneParent VIC - Frontend Application

A comprehensive web application providing digital tools and resources specifically designed for single parents across Victoria, Australia. The platform offers AI-powered insights, community resources, and practical tools to support single parenting journeys.

## What This App Does

**OneParent VIC** is a digital support platform that helps single parents with:

- **Schedule Management**: AI-powered analysis of weekly routines to identify free time and optimization opportunities
- **Emotional Wellbeing**: Mood tracking and mental health insights with weekly pattern analysis
- **Activity Planning**: Personalized activity suggestions for children based on age, interests, and location
- **Community Discovery**: Find single parent-friendly neighborhoods with cultural diversity and school ratings
- **Event Finding**: Discover family-friendly events from Ticketmaster and local community sources
- **Journey Mapping**: Track milestones and progress through different aspects of single parenting
- **Resource Access**: Government support information, childcare options, and community services

## Technology Stack

**Frontend Framework**
- Next.js 14 with App Router for server-side rendering and routing
- React 18 with TypeScript for type-safe component development
- Tailwind CSS for responsive utility-first styling
- Framer Motion for smooth animations and transitions

**UI & UX**
- Lucide React for consistent iconography
- Custom design system optimized for single parent workflows
- Mobile-first responsive design with touch-friendly interfaces
- Accessibility compliance (WCAG 2.1 AA standards)

**Data & State Management**
- Local Storage for user preferences and offline functionality
- React hooks for component state management
- Custom API client with error handling and loading states
- TypeScript interfaces for data consistency

## Application Structure

```
client/
├── src/
│   ├── app/                     # Next.js App Router (pages and routing)
│   │   ├── page.tsx             # Homepage with navigation to all tools
│   │   ├── layout.tsx           # Root layout with navigation and footer
│   │   ├── your-journey-map/    # Single parenting milestone tracking
│   │   ├── time-and-learn-hub/  # AI-powered schedule analysis
│   │   ├── emotion-tracker/     # Daily mood and wellbeing tracking
│   │   ├── playdate/            # Activity suggestions and planning
│   │   ├── community-match/     # Neighborhood discovery tool
│   │   ├── find-events/         # Family-friendly event discovery
│   │   └── resources/           # Government support and services
│   ├── components/              # Reusable React components
│   │   ├── ui/                  # Base components (buttons, cards, forms)
│   │   ├── shared/              # Navigation, footer, common layouts
│   │   └── [feature]/           # Feature-specific components
│   ├── lib/
│   │   ├── api/                 # Backend API client functions
│   │   ├── utils/               # Helper functions and utilities
│   │   └── types/               # TypeScript type definitions
│   └── types/                   # Global TypeScript interfaces
├── public/
│   ├── images/                  # Static images and assets
│   ├── data/                    # Static JSON data files
│   └── sitemap.xml             # SEO sitemap
├── next.config.ts              # Next.js build and deployment config
├── tailwind.config.js          # Tailwind CSS styling configuration
└── package.json                # Dependencies and build scripts
```

## Core Features

**Time & Learn Hub**: AI-powered weekly schedule analysis that identifies free time pockets and provides optimization suggestions using Google Gemini AI.

**Emotion Tracker**: Daily mood tracking with 5-point scale and weekly emotional pattern analysis to support mental wellbeing.

**PlayDate Planner**: Personalized activity suggestions based on child age, interests, and budget with integration to local event data.

**Community Match**: Neighborhood discovery tool helping single parents find communities with good schools, cultural diversity, and family support services.

**Find Events**: Family-friendly event discovery with integration to Ticketmaster and Eventfinda APIs, filtered by age groups and location.

**Journey Map**: Milestone tracking system for single parenting progress across different life areas with goal setting and achievement visualization.

**Resource Hub**: Access to government support information, childcare options, and community services specific to Victoria, Australia.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- npm package manager

### Installation & Running

```bash
# Navigate to client directory
cd client

# Install all dependencies
npm install

# Start development server
npm run dev

# Application will be available at http://localhost:3000
```

### Environment Configuration

Create `.env.local` file in the client directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Available Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build production version
npm run start        # Start production server  
npm run lint         # Run code quality checks
npm run type-check   # Validate TypeScript types
```

## Backend Integration

The frontend communicates with the Node.js backend API for:
- **AI Analysis**: Schedule analysis via Google Gemini AI integration
- **Event Data**: Real-time events from Ticketmaster and Eventfinda APIs  
- **Community Data**: Demographics, school ratings, and neighborhood information
- **Data Persistence**: User preferences and application state storage

All API calls include proper error handling, loading states, and retry logic through the `/src/lib/api/` client functions.

## Design & Accessibility

**Mobile-First Design**: Responsive layout optimized for single parents who primarily use mobile devices while managing daily routines.

**Accessibility Compliant**: WCAG 2.1 AA standards with keyboard navigation, screen reader support, and high contrast color schemes.

**Performance Optimized**: Next.js automatic code splitting, image optimization, and lazy loading for fast loading on any device.

**Browser Support**: Modern browsers including Chrome 90+, Firefox 88+, Safari 14+, and mobile browsers.
