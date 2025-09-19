
# OneParent VIC

A comprehensive platform supporting single parents across Victoria, Australia. Built with modern technologies to provide tools, resources, and community features that make single parenting easier.

## Technology Stack

**Frontend**
- Next.js 14 with App Router
- Tailwind CSS with custom design system
- Framer Motion for animations
- TypeScript for type safety
- Deployed on Netlify

**Backend**
- Node.js with Express.js
- PostgreSQL database (Heroku)
- Security middleware (Helmet, Rate Limiting, CORS)
- External API integrations (Ticketmaster, Eventfinda)
- Deployed on Heroku (prod), Render (dev)

**Infrastructure**
- Domain: Namecheap with Cloudflare protection
- CDN: Cloudflare
- Database: Heroku Postgres

## Live Applications

**Production**
- Website: https://oneparentvic.me/

## Project Structure

```
oneparent-vic/
├── client/                    # Next.js Frontend Application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Reusable UI components
│   │   └── lib/             # Utilities and API clients
│   ├── public/              # Static assets
│   ├── next.config.ts       # Next.js configuration
│   └── tailwind.config.js   # Tailwind CSS config
├── server/                   # Express.js Backend API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Security and validation
│   │   ├── services/        # External API integrations
│   │   └── db/             # Database connection
│   └── .env.example
├── datasets/                # Data files
└── docs/                   # Documentation
```

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (or access to remote database)

### Backend Setup
```bash
cd server
npm install
cp .env.example .env.local
# Add your database URL and API keys to .env.local
npm run dev
```
Backend runs on http://localhost:5000

### Frontend Setup
```bash
cd client
npm install
npm run dev
```
Frontend runs on http://localhost:3000

## Deployment

**Frontend (Netlify)**
- Build Command: `cd client && npm run build`
- Publish Directory: `client/out`

**Backend (Heroku)**
- Buildpack: Node.js
- Start Command: `npm start`

## Available Scripts

**Frontend (client/)**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

**Backend (server/)**
```bash
npm run dev          # Start development with nodemon
npm start            # Start production server
npm test             # Run tests
```

## Key Features

### For Single Parents
- PlayDate Planner: AI-powered activity suggestions
- Find Events: Curated family-friendly events
- Community Match: Find culturally diverse neighborhoods
- Journey Map: Single parenting milestone tracking
- Resources Hub: Government support information

### Technical Features
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

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open Pull Request

## Support

For technical issues or feature requests, create an issue on GitHub or check the documentation in the `/docs` folder.

