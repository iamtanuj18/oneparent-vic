
# OneParent VIC

A comprehensive digital platform designed to support single parents across Victoria, Australia. OneParent VIC provides intelligent schedule management, community resources, event discovery, and wellbeing tools to make single parenting easier and more connected.

🌐 **Live Application**: https://www.oneparentvic.me

## Platform Overview

OneParent VIC combines AI-powered schedule analysis, community resource mapping, and social features into one unified platform. Built with modern web technologies and deployed on robust cloud infrastructure.

**Key Features:**
- AI-powered schedule analysis and free time optimization
- Family-friendly event discovery and recommendations  
- Government benefits and childcare facility lookup
- Mental health resources and emotional tracking
- Community matching and playdate planning
- Interactive journey mapping for single parent experiences

## Technology Architecture

**Frontend (Client)**
- Next.js 14 with App Router and TypeScript
- Tailwind CSS with custom design system
- Framer Motion animations and micro-interactions
- Deployed on Netlify with global CDN

**Backend (Server)**  
- Node.js with Express.js REST API
- PostgreSQL database for user data and analytics
- Redis for caching and rate limiting
- Google Gemini AI for schedule analysis
- External integrations: Ticketmaster, Eventfinda APIs

**Infrastructure (AWS)**
- EC2 instances for production server hosting
- RDS PostgreSQL for managed database services
- ElastiCache Redis for session and API caching
- S3 + CloudFront for asset delivery
- SSL certificates and security configurations

## Project Structure

```
oneparent-vic/
├── client/                   # Frontend Application (Next.js)
│   ├── src/app/             # App Router pages and layouts
│   ├── src/components/      # Reusable UI components and feature modules  
│   ├── src/lib/            # Utilities, API clients, and configuration
│   ├── public/             # Static assets and data files
│   └── README.md           # Frontend setup and development guide
│
├── server/                  # Backend API (Node.js + Express)
│   ├── src/routes/         # REST API endpoints and route handlers
│   ├── src/services/       # External API integrations (Gemini, Ticketmaster)
│   ├── src/middleware/     # Security, validation, and rate limiting
│   ├── src/db/            # PostgreSQL connection and queries
│   └── README.md          # Server setup and deployment guide
│
├── aws/                    # Cloud Infrastructure & Deployment
│   ├── client/            # Frontend deployment (Netlify/S3+CloudFront)
│   ├── server/            # Backend deployment (EC2, Docker, Nginx)
│   ├── database/          # PostgreSQL RDS setup and migrations
│   ├── redis/             # ElastiCache Redis configuration
│   ├── ec2/               # Server infrastructure and security
│   └── README.md          # Infrastructure overview and setup
│
├── datasets/               # Community Data & Research
│   ├── *.csv              # Victorian demographics, trends, and services data
│   └── README.md          # Data sources and usage documentation
│
├── docs/                   # Project Documentation
│   └── README.md          # Documentation index and guidelines
│
├── figma/                  # Design System & UI Kit  
│   ├── src/               # Interactive design system components
│   └── README.md          # Design principles and component usage
│
├── Test-cases/             # Testing Suite
│   ├── emotion-tracker/   # Feature-specific test cases
│   ├── timeandlearnhub/   # Schedule analysis testing
│   └── README.md          # Testing strategy and execution
│
├── netlify.toml           # Frontend deployment configuration
├── all.env               # Environment variables template
└── package.json          # Root project configuration
```

## How It Works

**Backend Infrastructure**: The server runs on AWS EC2 instances with auto-scaling, using PostgreSQL RDS for data persistence and Redis ElastiCache for performance optimization. The API handles AI-powered schedule analysis, external event data aggregation, and secure user data management.

**Frontend Experience**: The client application is deployed on Netlify with global CDN delivery, providing fast load times across Australia. Built with Next.js for optimal SEO and performance, featuring responsive design and accessibility-first components.

**Data & Security**: All user data is encrypted and stored securely on AWS RDS. The platform implements comprehensive security measures including rate limiting, CORS protection, and secure API authentication. Community data is sourced from Australian government datasets and research studies.

## Getting Started

Each project directory contains detailed setup and development instructions:

- **`/client`** - Frontend development, component library, and UI guidelines
- **`/server`** - Backend API, database setup, and service integrations  
- **`/aws`** - Infrastructure deployment, security configuration, and scaling
- **`/datasets`** - Community data sources and research methodology
- **`/docs`** - Comprehensive project documentation and API guides
- **`/figma`** - Design system, UI components, and accessibility standards
- **`/Test-cases`** - Testing strategy, feature tests, and quality assurance

## Quick Development Setup

```bash
# Backend setup
cd server && npm install && npm run dev

# Frontend setup (new terminal)
cd client && npm install && npm run dev
```

Visit http://localhost:3000 to see the application running locally.
- Responsive mobile-first design
- Performance optimized with image optimization and code splitting
- SEO friendly with proper meta tags
- Accessibility compliant (WCAG 2.1)
- Comprehensive error monitoring and logging

## Security

- Helmet.js for security headers
- Rate limiting for API protection
- CORS for origin control
- Parameter validation and input sanitization
- SQL injection prevention with parameterized queries
- Cloudflare DDoS protection

## Documentation Structure

The project includes comprehensive documentation across multiple areas:

### Component Documentation
- **[Client Application](client/README.md)** - Frontend React/Next.js application setup, features, and development
- **[Server Application](server/README.md)** - Backend Node.js/Express API documentation and deployment
- **[AWS Infrastructure](aws/README.md)** - Cloud infrastructure setup, deployment scripts, and management
- **[Design System](figma/README.md)** - UI component library, design tokens, and accessibility guidelines
- **[Test Suite](Test-cases/README.md)** - Testing strategy, test execution, and quality assurance
- **[Datasets](datasets/README.md)** - Community data, demographics, and dataset usage documentation
- **[Documentation Hub](docs/README.md)** - Technical specifications, user guides, and API references

### Feature Areas
Each major platform feature includes dedicated documentation covering:
## Contributing & Development

For detailed development setup, code standards, and contribution guidelines, see the README files in individual project directories. Each component has specific setup instructions and development workflows.

**Repository**: https://github.com/iamtanuj18/oneparent-vic  
**Issues & Support**: GitHub Issues  
**Documentation**: See `/docs` directory for comprehensive guides
- **Feature Requests**: Use GitHub Discussions for community input
- **Documentation**: Check component-specific README files in each directory
- **API Questions**: Refer to [Server API Documentation](server/README.md)
- **Design Guidelines**: Review [Design System Documentation](figma/README.md)

### Community Resources
- Project roadmap and milestone tracking via GitHub Projects
- Community discussions and feature planning in GitHub Discussions
- Regular contributor meetings and development updates
- Open source contribution guidelines and recognition program

