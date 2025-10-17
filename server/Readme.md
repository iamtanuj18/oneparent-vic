# OneParent VIC - Backend Server

Node.js/Express API server providing AI-powered analysis, community data processing, and external service integrations for the OneParent VIC platform. Handles schedule analysis, event discovery, community matching, and resource management for single parents.

## What This Server Does

**Backend API Services** for all OneParent VIC features:

- **AI Schedule Analysis**: Google Gemini AI integration for weekly schedule optimization and free time identification
- **Event Discovery**: Real-time family-friendly events from Ticketmaster and Eventfinda APIs with filtering and recommendations
- **Community Data**: PostgreSQL database serving demographic, school, and housing data for neighborhood matching
- **Resource Management**: Government benefits, childcare facilities, and mental health resources with location-based lookup
- **Data Processing**: Emotional tracking analytics, journey mapping progress, and personalized recommendations

## Technology Stack

**Core Framework**
- Node.js 18+ with Express.js for RESTful API architecture
- PostgreSQL for community demographics and user data persistence
- Redis for session storage, API caching, and rate limiting
- Environment-based configuration with secure credential management

**AI & External Integrations** 
- Google Gemini AI for natural language processing and schedule analysis
- Ticketmaster API for major event discovery and ticket information
- Eventfinda API for local community events and activities
- Address validation services for location-based features

**Security & Performance**
- Helmet.js for comprehensive security headers and XSS protection
- CORS middleware with configurable origin restrictions
- Rate limiting with Redis backend (100 req/15min per IP)
- Input validation and SQL injection prevention
- Request/response logging with error tracking

## Server Architecture

```
server/
├── src/
│   ├── server.js                # Express app setup and server startup
│   ├── config.js               # Environment configuration and constants
│   ├── routes/                 # API endpoint definitions
│   │   ├── time-and-learn-hub.js   # Schedule analysis with Gemini AI
│   │   ├── events.js               # Event discovery (Ticketmaster/Eventfinda)
│   │   ├── playdate.js             # Activity suggestions and planning
│   │   ├── benefits.js             # Government support services
│   │   ├── childcare.js            # Childcare facility information
│   │   ├── wellbeing.js            # Mental health resources
│   │   ├── address.js              # Location and suburb lookup
│   │   └── health.js               # System health monitoring
│   ├── middleware/             # Request processing layers
│   │   ├── security.js             # Helmet security headers + CORS
│   │   ├── rateLimiting.js         # Redis-based rate limiting
│   │   ├── errorHandler.js         # Global error handling and logging
│   │   └── validation.js           # Input validation and sanitization
│   ├── services/               # External service integrations
│   │   ├── geminiService.js        # Google Gemini AI client
│   │   ├── ticketmasterService.js  # Ticketmaster API integration
│   │   └── eventfindaService.js    # Eventfinda API client
│   ├── db/                     # Database management
│   │   ├── connection.js           # PostgreSQL connection pooling
│   │   └── queries.js              # Database query functions
│   └── utils/                  # Helper functions and utilities
├── package.json               # Dependencies and npm scripts
└── .env.example              # Environment variable template
```

## Core Functionality

- **AI Schedule Analysis**: Google Gemini integration for intelligent time management and free time optimization
- **Event Discovery**: Multi-provider event aggregation (Ticketmaster + Eventfinda) with family-focused filtering  
- **Community Resources**: Government benefits lookup, childcare recommendations, and location-based services
- **Wellbeing Support**: Mental health resource integration and emotional tracking data processing

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis server (for caching and rate limiting)
- Google Gemini AI API key
- Ticketmaster API key
- Eventfinda API key

### Installation
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your environment variables to .env
# Start development server with auto-reload
npm run dev
```

The server will be available at http://localhost:5000

### Installation

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL, Redis, and API credentials

# Start development server
npm run dev
```

### Essential Environment Variables
```env
DATABASE_URL=postgresql://username:password@localhost:5432/oneparent_vic
GEMINI_API_KEY=your_gemini_key
TICKETMASTER_API_KEY=your_ticketmaster_key
REDIS_URL=redis://localhost:6379
PORT=5000
```

## Database & Redis Integration

**PostgreSQL**: Primary database for user data, schedule information, and analytics
**Redis**: Caching layer for API responses, session storage, and rate limiting

The server automatically connects to both services on startup and provides health monitoring endpoints.

## Development Commands

```bash
npm run dev     # Start with hot reload
npm start       # Production server  
npm test        # Run tests
npm run lint    # Code linting
```

## Production Deployment

The server is configured for deployment on Heroku, AWS EC2, or any Node.js hosting platform. See the `/aws` directory for infrastructure setup scripts and deployment configurations.
- Rate limiting compliance

### Eventfinda API
- Local event discovery
---

**For detailed infrastructure setup and deployment instructions, see the `/aws` directory documentation.**
