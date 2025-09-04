
# oneparent-vic project

this project helps single parents in victoria, australia by providing tools, resources, and community features. it includes a backend server, a frontend web app, and is deployed using modern cloud services.

## overview
- backend server: node.js + express, deployed on heroku and render
- database: postgresql, hosted on heroku
- frontend: react + vite, deployed on netlify
- domain: managed by namecheap, protected by cloudflare

## live links

**production server:**
- https://oneparent-vic-prod-9a338acb8033.herokuapp.com/

**development server:**
- https://oneparent-dev-api.onrender.com/

**production frontend:**
- https://oneparentvic.me/
- alternative: https://oneparentvic-prod.netlify.app/

**development frontend:**
- https://oneparentvic-dev.netlify.app/

## directory structure

- `client/` - frontend react app
  - `src/` - main react code
  - `public/` - static assets
  - `components/` - reusable ui components
  - `pages/` - main app pages
  - `lib/` - helper libraries and api calls
- `server/` - backend node.js server
  - `src/` - main server code
	 - `routes/` - api route handlers
	 - `middleware/` - security, error, rate limit
	 - `db/` - database connection
	 - `services/` - external api integrations
	 - `utils/` - helper functions
- `datasets/` - data files
- `docs/` - documentation

## how to run locally

1. clone the repo
2. install dependencies for both client and server:
	- open terminal in `client` and run `npm install`
	- open terminal in `server` and run `npm install`
3. set up environment variables:
	- create `.env` in `server` with your database url and secrets
4. start the backend:
	- in `server`, run `npm run dev` for development or `npm start` for production
5. start the frontend:
	- in `client`, run `npm run dev` for development or `npm run build` and `npm run preview` for production

## deployment

- server is deployed on heroku (prod) and render (dev)
- database is hosted on heroku postgres
- frontend is deployed on netlify
- domain is managed by namecheap and protected by cloudflare

## security
- backend uses helmet for security headers
- express-rate-limit for request limiting
- cors for origin control
- parameterized queries for database safety
- frontend uses netlify security headers and cloudflare protection

## Development setup

- Backend runs on port **5000** by default.
- Frontend (Vite) runs on port **5173** and **5174** by default.

Steps:
1. Copy env examples:
   ```bash
   cp server/.env.example server/.env.local
   cp client/.env.example client/.env

