# oneparent-vic server

this is the backend server for the oneparent-vic project. it is built with node.js and express. the server provides api endpoints for features like events, playdates, benefits, childcare, wellbeing, transitions, address lookup, and health checks.

## features
- serves api endpoints for family support, events, playdates, benefits, childcare, wellbeing, and more
- uses express for routing and middleware
- includes security headers, rate limiting, and error handling
- connects to a postgresql database
- supports deployment on heroku and render

## folder structure
- `src/` contains all server code
  - `server.js` is the main entry point
  - `routes/` has all route handlers
  - `middleware/` has security, error, and rate limit middleware
  - `db/` handles database connection
  - `services/` has external api integrations
  - `utils/` has helper functions

## requirements
- node.js 20 or newer
- npm
- postgresql database (for production)

## install dependencies

open a terminal in the `server` folder and run:

npm install


## running the server

for development (with auto-reload):

npm run dev


for production:

npm start


## environment variables

create a `.env` file in the `server` folder with your database url and any other secrets. example:

DATABASE_URL=your_postgres_url_here PORT=3001 NODE_ENV=development


## deployment

- heroku: uses `Procfile` to start the server
- render: uses start script in package.json

## security
- uses helmet for security headers
- uses express-rate-limit to prevent abuse
- uses cors to restrict origins
- uses parameterized queries for database safety

## api endpoints
- see `src/routes/` for all available endpoints
