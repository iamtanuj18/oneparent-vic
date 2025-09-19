# oneparent-vic client

this is the frontend web app for the oneparent-vic project. it is built with react and vite. the app helps single parents in victoria, australia by providing tools, resources, and community features.

## features
- modern react app with vite for fast builds and hot reload
- pages for events, playdates, benefits, childcare, wellbeing, transitions, about, and more
- reusable components for navigation, footer, images, and forms
- api calls to the backend server for dynamic data
- responsive design for desktop and mobile

## folder structure
- `src/` - main react code
  - `components/` - reusable ui components
  - `pages/` - main app pages
  - `lib/` - helper libraries and api calls
  - `assets/` - images and icons
  - `router/` - app routing
- `public/` - static assets

## requirements
- node.js 20 or newer
- npm

## install dependencies

open a terminal in the `client` folder and run:

npm install


## running the app

for development (with hot reload):

npm run dev


for production build:

npm run build

to preview the production build:

npm run preview


## environment variables

create a `.env` file in the `client` folder if you need to set api endpoints or secrets. example:

VITE_API_URL=https://oneparent-vic-prod-9a338acb8033.herokuapp.com/


## deployment

- deployed on netlify for production and development
- see netlify.toml for build and security settings

## api

- connects to the backend server for all dynamic data
- see `src/lib/api/` for api call details


